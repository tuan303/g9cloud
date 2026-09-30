import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  browserLocalPersistence,
  indexedDBLocalPersistence,
  inMemoryPersistence,
  initializeAuth,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
  type Auth,
  type User,
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
import { FIREBASE_CONFIG } from '@/config/firebase';

/**
 * Hai "phiên" Firebase độc lập trong cùng trình duyệt:
 *  - customer: tài khoản ẩn danh cho khách (mỗi thiết bị một uid) — dùng để đặt / xem đơn của mình.
 *  - staff:    tài khoản email/mật khẩu của nhân viên — dùng cho trang quản trị.
 * Tách riêng để đăng nhập nhân viên không làm mất phiên của khách (và ngược lại) khi dùng chung máy.
 */
interface FirebaseHandles {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

let customerHandles: FirebaseHandles | null = null;
let staffHandles: FirebaseHandles | null = null;

/** Auth gọn nhẹ: chỉ lưu phiên (IndexedDB → localStorage → RAM), không kèm mã đăng nhập popup/redirect */
function makeAuth(app: FirebaseApp): Auth {
  return initializeAuth(app, { persistence: [indexedDBLocalPersistence, browserLocalPersistence, inMemoryPersistence] });
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
    try {
      cb({ user, isStaff: await checkStaff(user) });
    } catch (err) {
      cb({ user, isStaff: false }, err);
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
  await signOut(auth);
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
      return 'Firebase Authentication chưa được bật cho phương thức này (xem docs/FIREBASE.md).';
    default:
      return (err as Error)?.message || 'Đã có lỗi xảy ra';
  }
}
