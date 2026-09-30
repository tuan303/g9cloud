import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  browserLocalPersistence,
  browserPopupRedirectResolver,
  getAdditionalUserInfo,
  getRedirectResult,
  indexedDBLocalPersistence,
  inMemoryPersistence,
  initializeAuth,
  OAuthProvider,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type Auth,
  type User,
  type UserCredential,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  initializeFirestore,
  memoryLocalCache,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';
import { APP_CONFIG } from '@/config/app';
import { platform } from '@/platform';
import { FIREBASE_CONFIG } from '@/config/firebase';

/**
 * Hai "phiên" Firebase độc lập trong cùng trình duyệt:
 *  - customer: khách — ẩn danh (mỗi thiết bị một uid) hoặc SSO Microsoft 365 của trường (một uid cho mọi thiết bị).
 *  - staff:    nhân viên — email/mật khẩu hoặc Microsoft 365 — dùng cho trang quản trị.
 * Tách riêng để đăng nhập nhân viên không làm mất phiên của khách (và ngược lại) khi dùng chung máy.
 */
interface FirebaseHandles {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

let customerHandles: FirebaseHandles | null = null;
let staffHandles: FirebaseHandles | null = null;

/** Lưu phiên (IndexedDB → localStorage → RAM) + hỗ trợ đăng nhập popup/redirect (SSO Microsoft 365) */
function makeAuth(app: FirebaseApp): Auth {
  return initializeAuth(app, {
    persistence: [indexedDBLocalPersistence, browserLocalPersistence, inMemoryPersistence],
    popupRedirectResolver: browserPopupRedirectResolver,
  });
}

function makeDb(app: FirebaseApp): Firestore {
  try {
    // Bộ nhớ đệm IndexedDB dùng chung nhiều tab: app mở nhanh và vẫn xem được khi Wi-Fi chập chờn
    return initializeFirestore(app, {
      ignoreUndefinedProperties: true,
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  } catch {
    return initializeFirestore(app, { ignoreUndefinedProperties: true, localCache: memoryLocalCache() });
  }
}

export function customerFirebase(): FirebaseHandles {
  if (!customerHandles) {
    const app = initializeApp(FIREBASE_CONFIG);
    customerHandles = { app, auth: makeAuth(app), db: makeDb(app) };
  }
  return customerHandles;
}

export function staffFirebase(): FirebaseHandles {
  if (!staffHandles) {
    const app = initializeApp(FIREBASE_CONFIG, 'staff');
    staffHandles = { app, auth: makeAuth(app), db: makeDb(app) };
  }
  return staffHandles;
}

// ───────────── Khách: đăng nhập ẩn danh ─────────────

let customerAuthPromise: Promise<string | null> | null = null;

/**
 * Đăng nhập ẩn danh cho khách (một lần mỗi thiết bị). Trả về uid, hoặc null nếu project
 * chưa bật Firebase Authentication / Anonymous — khi đó app vẫn chạy được nếu Security Rules cho phép.
 */
export function ensureCustomerAuth(): Promise<string | null> {
  if (!customerAuthPromise) {
    customerAuthPromise = (async () => {
      const { auth } = customerFirebase();
      try {
        await auth.authStateReady();
        if (auth.currentUser) return auth.currentUser.uid;
        const cred = await signInAnonymously(auth);
        return cred.user.uid;
      } catch (err) {
        const code = (err as { code?: string })?.code;
        console.warn('[Cloud9] Chưa đăng nhập ẩn danh được (bật Authentication › Anonymous trong Firebase Console):', code ?? err);
        // Lỗi tạm thời (mất mạng...) → cho phép thử lại lần sau; lỗi cấu hình thì giữ kết quả
        if (code === 'auth/network-request-failed' || code === 'auth/internal-error' || code === 'auth/too-many-requests')
          customerAuthPromise = null;
        return null;
      }
    })();
  }
  return customerAuthPromise;
}

// ───────────── Nhân viên: email / mật khẩu ─────────────

export type StaffCheck = { user: User; isStaff: boolean } | null;

/** Kiểm tra quyền nhân viên của tài khoản đang đăng nhập (có tài liệu staff/{uid}) */
export async function checkStaff(user: User): Promise<boolean> {
  const snap = await getDoc(doc(staffFirebase().db, 'staff', user.uid));
  return snap.exists();
}

/**
 * Theo dõi phiên nhân viên. Gọi cb('checking') ngay khi có tài khoản (đang kiểm tra quyền),
 * sau đó cb(kết quả) hoặc cb(kết quả, lỗi) nếu không kiểm tra được (mất mạng, Rules...).
 */
export function onStaffAuthChanged(cb: (result: StaffCheck | 'checking', error?: unknown) => void): () => void {
  const { auth } = staffFirebase();
  return onAuthStateChanged(auth, async (user) => {
    if (!user) return cb(null);
    cb('checking');
    // Bỏ kết quả kiểm tra đã cũ (tài khoản đã đăng xuất / đổi tài khoản trong lúc chờ mạng)
    const stillCurrent = () => auth.currentUser?.uid === user.uid;
    try {
      const isStaff = await checkStaff(user);
      if (stillCurrent()) cb({ user, isStaff });
    } catch (err) {
      if (stillCurrent()) cb({ user, isStaff: false }, err);
    }
  });
}

export function currentStaffUser(): User | null {
  return staffFirebase().auth.currentUser;
}

export async function staffSignIn(email: string, password: string) {
  const { auth } = staffFirebase();
  await signInWithEmailAndPassword(auth, email.trim(), password);
}

export async function staffSignOut() {
  const { auth } = staffFirebase();
  const wasMicrosoft = !!auth.currentUser?.providerData.some((p) => p.providerId === 'microsoft.com');
  await signOut(auth);
  if (wasMicrosoft) setForceLogin(true); // máy quầy dùng chung: lần sau phải nhập lại mật khẩu Microsoft
}

// ───────────── SSO Microsoft 365 ─────────────

/**
 * Firebase Authentication đã được bật cho project chưa? Kiểm tra sớm (khi mở màn hình đăng nhập)
 * để lúc bấm nút có sẵn kết quả — không phải chờ mạng trước khi mở cửa sổ đăng nhập (trình duyệt
 * chỉ cho mở popup ngay sau thao tác bấm) và không mở cửa sổ vô ích khi quán chưa cấu hình.
 */
let authConfigured: boolean | undefined;
let authConfigPromise: Promise<boolean> | null = null;

export function checkAuthConfigured(): Promise<boolean> {
  authConfigPromise ??= fetch(`https://identitytoolkit.googleapis.com/v1/projects?key=${encodeURIComponent(FIREBASE_CONFIG.apiKey)}`)
    .then((r) => r.json())
    .then((j: { error?: { message?: string } }) => j?.error?.message !== 'CONFIGURATION_NOT_FOUND')
    .catch(() => true) // lỗi mạng: không chặn, để SDK tự báo lỗi
    .then((ok) => (authConfigured = ok));
  return authConfigPromise;
}

function assertAuthConfigured() {
  if (authConfigured === false)
    throw Object.assign(new Error('Firebase Authentication chưa được bật'), { code: 'auth/configuration-not-found' });
}

export interface MicrosoftProfile {
  uid: string;
  name: string;
  email: string;
}

/**
 * Máy dùng chung (máy tính lớp học, máy tính bảng ở quầy): Firebase đăng xuất không thoát được
 * phiên Microsoft trên trình duyệt. Vì vậy sau khi có người đăng xuất, lần đăng nhập Microsoft kế tiếp
 * trên máy đó bắt buộc nhập lại mật khẩu (prompt=login) — người sau không thể chọn tài khoản người trước.
 */
const FORCE_LOGIN_KEY = 'c9.ms.forceLogin';

function readForceLogin(): boolean {
  try {
    return platform.storage.getItem(FORCE_LOGIN_KEY) === '1';
  } catch {
    return false;
  }
}

function setForceLogin(on: boolean) {
  try {
    if (on) platform.storage.setItem(FORCE_LOGIN_KEY, '1');
    else platform.storage.removeItem(FORCE_LOGIN_KEY);
  } catch {
    /* bộ nhớ bị chặn — bỏ qua */
  }
}

/** Nhà cung cấp Microsoft (Entra ID) — giới hạn theo tenant của trường */
function microsoftProvider(): OAuthProvider {
  const provider = new OAuthProvider('microsoft.com');
  const tenant = APP_CONFIG.auth.microsoft.tenant.trim();
  provider.setCustomParameters({
    tenant: tenant || 'organizations', // 'organizations' = mọi tài khoản cơ quan/trường học, không nhận tài khoản cá nhân
    prompt: readForceLogin() ? 'login' : 'select_account',
    ...(tenant.includes('.') ? { domain_hint: tenant } : {}),
  });
  return provider;
}

const DOMAINS = APP_CONFIG.auth.schoolEmailDomains.map((d) => d.trim().toLowerCase().replace(/^@/, '')).filter(Boolean);

function isSchoolEmail(email: string): boolean {
  if (!DOMAINS.length) return true;
  const domain = email.slice(email.lastIndexOf('@') + 1).toLowerCase();
  return DOMAINS.some((d) => domain === d || domain.endsWith(`.${d}`));
}

/** Lấy tên + email từ kết quả đăng nhập Microsoft (email có thể nằm ở providerData hoặc hồ sơ Entra) */
function toMicrosoftProfile(result: UserCredential): MicrosoftProfile {
  const profile = (getAdditionalUserInfo(result)?.profile ?? {}) as Record<string, unknown>;
  const ms = result.user.providerData.find((p) => p.providerId === 'microsoft.com');
  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
  const email = (
    str(ms?.email) ||
    str(result.user.email) ||
    str(profile.mail) ||
    str(profile.userPrincipalName) ||
    str(profile.preferred_username)
  ).toLowerCase();
  const name =
    str(ms?.displayName) ||
    str(result.user.displayName) ||
    str(profile.displayName) ||
    [str(profile.givenName), str(profile.surname)].filter(Boolean).join(' ') ||
    email.split('@')[0];
  return { uid: result.user.uid, name, email };
}

/**
 * Đăng nhập Microsoft bằng cửa sổ bật lên (không gắn vào tài khoản khách ẩn danh — tránh việc đơn của
 * người dùng trước trên máy dùng chung rơi vào tài khoản người sau). Popup bị chặn → chuyển trang.
 */
async function microsoftPopup(auth: Auth): Promise<UserCredential> {
  const provider = microsoftProvider();
  try {
    return await signInWithPopup(auth, provider);
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
      await signInWithRedirect(auth, provider); // trang sẽ chuyển đi; kết quả xử lý bởi complete…Redirect()
    }
    throw err;
  }
}

function notSchoolError(email: string) {
  return Object.assign(new Error(`Tài khoản ${email || 'này'} không thuộc trường. Vui lòng dùng email trường.`), {
    code: 'app/not-school-account',
  });
}

/**
 * Khách: kiểm tra tài khoản thuộc trường. Không thuộc trường → quay lại phiên khách trước đó (giữ đơn
 * đang có) nếu biết, nếu không thì tạo phiên khách mới.
 */
async function finishCustomerMicrosoft(result: UserCredential, previous?: User | null): Promise<MicrosoftProfile> {
  const { auth } = customerFirebase();
  const profile = toMicrosoftProfile(result);
  if (!profile.email || !isSchoolEmail(profile.email)) {
    if (previous?.isAnonymous) {
      await auth.updateCurrentUser(previous);
      setForceLogin(true); // lần thử sau buộc nhập mật khẩu để chọn đúng tài khoản trường
    } else {
      await resetCustomerSession();
    }
    throw notSchoolError(profile.email);
  }
  // Nếu lượt tạo phiên khách (sau đăng xuất) còn đang chạy, đợi xong rồi đặt lại tài khoản Microsoft
  await resetInFlight;
  if (auth.currentUser?.uid !== result.user.uid) await auth.updateCurrentUser(result.user);
  setForceLogin(false);
  customerAuthPromise = Promise.resolve(result.user.uid);
  return profile;
}

/** Khách: đăng nhập SSO Microsoft 365 của trường */
export async function signInCustomerWithMicrosoft(): Promise<MicrosoftProfile> {
  assertAuthConfigured();
  const { auth } = customerFirebase();
  const previous = auth.currentUser; // lấy trước khi mở popup (không có await nào trước popup)
  return finishCustomerMicrosoft(await microsoftPopup(auth), previous);
}

/**
 * Sau khi đăng nhập bằng cách chuyển trang (popup bị chặn): lấy kết quả khi quay về app.
 * Dùng chung một promise — kết quả chỉ đọc được một lần, nhiều nơi (màn hình chào, trang tài khoản,
 * bước đồng bộ lúc mở app) cùng chờ được.
 */
let redirectPromise: Promise<MicrosoftProfile | null> | null = null;
export function completeMicrosoftRedirect(): Promise<MicrosoftProfile | null> {
  redirectPromise ??= (async () => {
    const result = await getRedirectResult(customerFirebase().auth);
    return result ? finishCustomerMicrosoft(result) : null;
  })();
  return redirectPromise;
}

/** Thoát phiên Firebase của khách và tạo phiên khách ẩn danh MỚI (mỗi người dùng máy chung một uid riêng) */
let resetInFlight: Promise<void> | null = null;
function resetCustomerSession(): Promise<void> {
  resetInFlight = (async () => {
    const { auth } = customerFirebase();
    const wasMicrosoft = !!auth.currentUser?.providerData.some((p) => p.providerId === 'microsoft.com');
    customerAuthPromise = null; // xoá trước khi đăng xuất để không ai đọc được uid cũ
    if (auth.currentUser) await signOut(auth);
    if (wasMicrosoft) setForceLogin(true);
    await ensureCustomerAuth();
  })();
  return resetInFlight;
}

/**
 * Khách đăng xuất khỏi app: luôn đổi sang phiên ẩn danh mới — người sau trên cùng máy không đọc được
 * đơn của người trước. Nếu vừa dùng Microsoft 365, lần đăng nhập Microsoft sau phải nhập lại mật khẩu.
 */
export async function signOutCustomer(): Promise<void> {
  await customerFirebase().auth.authStateReady();
  await resetCustomerSession();
}

/**
 * Đồng bộ phiên Firebase với phiên app lúc mở app: nếu Firebase còn đăng nhập Microsoft nhưng app không
 * có người dùng Microsoft tương ứng (VD bỏ dở giữa chừng bước đăng nhập, đóng tab) → quay về phiên khách mới.
 */
export async function reconcileCustomerAuth(
  sessionUser: { id: string; authProvider: string } | null,
): Promise<'ok' | 'reset' | 'stale-app-session'> {
  const { auth } = customerFirebase();
  await auth.authStateReady();
  const user = auth.currentUser;
  const isMicrosoft = !!user?.providerData.some((p) => p.providerId === 'microsoft.com');
  if (sessionUser?.authProvider === 'microsoft') {
    // App nhớ người dùng Microsoft nhưng phiên Firebase đã mất / khác người → cần đăng nhập lại
    return isMicrosoft && sessionUser.id === `ms_${user!.uid}` ? 'ok' : 'stale-app-session';
  }
  if (isMicrosoft) {
    // Vừa quay về từ trang đăng nhập Microsoft → không phải bỏ dở, để màn hình hoàn tất đăng nhập
    const pending = await completeMicrosoftRedirect().catch(() => null);
    if (pending && pending.uid === auth.currentUser?.uid) return 'ok';
    await resetCustomerSession();
    return 'reset';
  }
  return 'ok';
}

/** Theo dõi phiên khách (ẩn danh ⇄ Microsoft) — repo dùng để đổi truy vấn đơn theo uid mới */
export function onCustomerAuthChanged(cb: (user: User | null) => void): () => void {
  return onAuthStateChanged(customerFirebase().auth, cb);
}

/** uid Firebase hiện tại của khách (null nếu chưa đăng nhập) */
export function currentCustomerUid(): string | null {
  return customerFirebase().auth.currentUser?.uid ?? null;
}

/** Nhân viên: đăng nhập bằng Microsoft 365 (quyền vẫn kiểm tra bằng staff/{uid}) */
export async function staffSignInWithMicrosoft(): Promise<void> {
  assertAuthConfigured();
  const { auth } = staffFirebase();
  await finishStaffMicrosoft(await microsoftPopup(auth));
}

/** Nhân viên quay lại sau khi đăng nhập Microsoft bằng cách chuyển trang */
export async function completeStaffMicrosoftRedirect(): Promise<void> {
  const { auth } = staffFirebase();
  const result = await getRedirectResult(auth);
  if (result) await finishStaffMicrosoft(result);
}

async function finishStaffMicrosoft(result: UserCredential) {
  const profile = toMicrosoftProfile(result);
  if (!profile.email || !isSchoolEmail(profile.email)) {
    await signOut(staffFirebase().auth);
    throw notSchoolError(profile.email);
  }
}

/** Thông báo lỗi Firebase dễ hiểu cho người dùng */
export function firebaseErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  switch (code) {
    case 'permission-denied':
    case 'firestore/permission-denied':
      return 'Không có quyền truy cập dữ liệu — kiểm tra đăng nhập nhân viên hoặc Firestore Security Rules.';
    case 'unavailable':
    case 'firestore/unavailable':
      return 'Mất kết nối máy chủ — kiểm tra mạng rồi thử lại.';
    case 'failed-precondition':
      return 'Firestore chưa sẵn sàng (có thể thiếu chỉ mục hoặc chưa tạo cơ sở dữ liệu).';
    case 'auth/invalid-credential':
      if ((err as Error)?.message?.includes('AADSTS'))
        return `Microsoft 365 từ chối đăng nhập: ${(err as Error).message.match(/AADSTS\d+[^.]*/)?.[0] ?? ''}`;
      return 'Email hoặc mật khẩu không đúng.';
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-email':
      return 'Email hoặc mật khẩu không đúng.';
    case 'auth/too-many-requests':
      return 'Thử sai quá nhiều lần — vui lòng đợi một lát.';
    case 'auth/network-request-failed':
      return 'Không có kết nối mạng.';
    case 'auth/configuration-not-found':
    case 'auth/operation-not-allowed':
      return 'Phương thức đăng nhập này chưa được bật trong Firebase Authentication (xem docs/M365_SSO.md).';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
    case 'auth/user-cancelled':
      return 'Bạn đã đóng cửa sổ đăng nhập.';
    case 'auth/popup-blocked':
      return 'Trình duyệt chặn cửa sổ đăng nhập — đang chuyển sang trang đăng nhập Microsoft…';
    case 'auth/unauthorized-domain':
      return 'Tên miền của app chưa được thêm vào Firebase › Authentication › Authorized domains.';
    case 'auth/account-exists-with-different-credential':
      return 'Email này đã được đăng ký bằng cách khác — liên hệ quản trị quán.';
    case 'auth/internal-error':
      return (err as Error)?.message?.includes('AADSTS')
        ? `Microsoft 365 từ chối đăng nhập: ${(err as Error).message.match(/AADSTS\d+[^.]*/)?.[0] ?? ''}`
        : 'Đăng nhập không thành công — vui lòng thử lại.';
    case 'app/not-school-account':
      return (err as Error).message;
    default:
      return (err as Error)?.message || 'Đã có lỗi xảy ra';
  }
}
