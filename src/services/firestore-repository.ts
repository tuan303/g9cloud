import { translate } from '@/i18n';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type Firestore,
  type Query,
} from 'firebase/firestore';
import { APP_CONFIG } from '@/config/app';
import { OPTION_PRESETS, SEED_MENU } from '@/data/menu';
import { generateDemoOrders } from '@/data/demo-orders';
import { startOfDay } from '@/lib/format';
import { parseOrderQrPayload } from '@/lib/qr';
import type { CreateOrderInput, LoyaltyAccount, MenuItem, OptionGroup, Order, OrderStatus } from '@/types';
import {
  currentCustomerUid,
  customerFirebase,
  ensureCustomerAuth,
  firebaseErrorMessage,
  onCustomerAuthChanged,
  staffFirebase,
} from './firebase';
import {
  applyCancel,
  applyConfirmPayment,
  applyStatus,
  assertOrderPricing,
  buildOrder,
  buildOrderLines,
  dayKey,
  formatOrderCode,
  isExpired,
  loyaltyTransition,
  applyLoyaltyOnPayment,
  reverseLoyalty,
  pickByShortCode,
} from './order-logic';
import { RepoError, type DataRepository, type RepoEvent, type Viewer } from './repository';

/**
 * Cấu trúc dữ liệu trên Firestore (project g9cloud-22931):
 *   menu/{itemId}         — món (đọc công khai; chỉ nhân viên ghi)
 *   orders/{orderId}      — đơn hàng (khách đọc đơn của mình; nhân viên đọc/ghi tất cả)
 *   counters/{yyyy-mm-dd} — { seq } đánh số đơn theo ngày (C9-001, C9-002…) bằng transaction
 *   staff/{uid}           — danh sách nhân viên (tạo trong Firebase Console)
 *   meta/menuSeed         — đánh dấu đã khởi tạo thực đơn mẫu (chỉ tạo một lần cho cả hệ thống)
 * Xem firestore.rules và docs/FIREBASE.md.
 */

/** Nhân viên thấy đơn của 8 ngày gần nhất (đủ cho thống kê 7 ngày + so sánh hôm qua) */
const STAFF_WINDOW_DAYS = 8;
const BATCH_LIMIT = 400;
/** Chờ tối đa khi tải lần đầu trước khi hiển thị những gì đang có */
const FIRST_LOAD_TIMEOUT = 8_000;

type Role = 'customer' | 'staff';

function toDoc<T extends { id: string }>(value: T): DocumentData {
  // id là khoá tài liệu — không lưu trùng trong nội dung; JSON bỏ các trường undefined
  const { id: _id, ...rest } = value;
  return JSON.parse(JSON.stringify(rest)) as DocumentData;
}

function toMenuItem(id: string, d: DocumentData): MenuItem {
  return {
    id,
    categoryId: d.categoryId ?? 'coffee',
    name: d.name ?? '',
    nameEn: d.nameEn,
    description: d.description ?? '',
    descriptionEn: d.descriptionEn,
    price: Number(d.price) || 0,
    image: d.image ?? '',
    available: d.available !== false,
    tags: d.tags,
    optionGroups: d.optionGroups,
    sortOrder: Number(d.sortOrder) || 0,
    updatedAt: d.updatedAt,
  };
}

function toOrder(id: string, d: DocumentData): Order {
  return {
    ...(d as Omit<Order, 'id'>),
    id,
    items: d.items ?? [],
    statusHistory: d.statusHistory ?? [],
  };
}

const backoff = (attempt: number) => Math.min(60_000, 2_000 * 2 ** attempt);

export class FirestoreRepository implements DataRepository {
  private menu: MenuItem[] = [];
  private menuFromServer = false;
  private orders = new Map<string, Order>();
  /** Thời điểm (theo đồng hồ máy này) lần đầu thấy mỗi đơn — để tính hết hạn không phụ thuộc đồng hồ máy khác */
  private firstSeen = new Map<string, number>();
  private listeners = new Set<(e: RepoEvent) => void>();
  private viewer: Viewer = { staff: false };
  private ordersKey = '';
  private ordersQuery: Query | null = null;
  private unsubOrders: (() => void) | null = null;
  private customerUid: string | null = null;
  /** Đã có kết quả đăng nhập ẩn danh lần đầu (thành công hay không) */
  private authResolved = false;
  /** Vừa đăng xuất, đang chờ phiên khách mới — tạm không truy vấn đơn */
  private authPending = false;
  private authReady: Promise<string | null>;
  private readonly menuReady: Promise<void>;
  private ordersReady: Promise<void>;
  private resolveOrdersReady: () => void = () => undefined;
  private failed = { menu: false, orders: false };
  private seedChecked = false;

  constructor() {
    this.ordersReady = new Promise<void>((r) => (this.resolveOrdersReady = r));
    this.authReady = this.refreshAuth();
    // Khách đăng nhập / đăng xuất Microsoft 365 → uid đổi → tải lại đơn theo uid mới
    onCustomerAuthChanged((user) => {
      const uid = user?.uid ?? null;
      if (uid === this.customerUid) return;
      // null khi vừa đăng xuất — bỏ truy vấn cũ, chờ phiên ẩn danh mới (không rơi về truy vấn theo mã khách)
      this.authPending = uid === null && this.customerUid !== null;
      this.customerUid = uid;
      if (this.authResolved) this.resubscribeOrders();
    });

    let resolveMenu: () => void = () => undefined;
    this.menuReady = new Promise<void>((r) => (resolveMenu = r));
    this.listenMenu(0, resolveMenu);

    if (typeof window !== 'undefined') {
      window.setTimeout(resolveMenu, FIRST_LOAD_TIMEOUT);
      window.setInterval(() => void this.expireStaleOrders(), 60_000);
      // Mạng có lại: thử đăng nhập ẩn danh lại (nếu trước đó thất bại vì mất mạng)
      window.addEventListener('online', () => {
        if (!currentCustomerUid()) this.authReady = this.refreshAuth();
      });
    }
  }

  // ───────────── nội bộ ─────────────

  private refreshAuth() {
    return ensureCustomerAuth().then((uid) => {
      this.authResolved = true;
      this.authPending = false;
      if (uid) this.customerUid = uid;
      this.resubscribeOrders();
      return uid;
    });
  }

  private emit(e: RepoEvent) {
    this.listeners.forEach((l) => {
      try {
        l(e);
      } catch (err) {
        console.error(err);
      }
    });
  }

  private fail(source: 'menu' | 'orders', err: unknown) {
    console.error(`[Cloud9] Firestore (${source}):`, err);
    this.failed[source] = true;
    this.emit({ type: 'error', message: firebaseErrorMessage(err), code: (err as { code?: string })?.code });
  }

  private recovered(source: 'menu' | 'orders') {
    if (!this.failed[source]) return;
    this.failed[source] = false;
    if (!this.failed.menu && !this.failed.orders) this.emit({ type: 'recovered' });
  }

  private wrap(err: unknown): never {
    if (err instanceof RepoError) throw err;
    throw new RepoError(firebaseErrorMessage(err), 'unknown');
  }

  /** Nhân viên đăng nhập bằng Firebase Auth thì ghi bằng phiên nhân viên; còn lại dùng phiên khách */
  private db(role: Role): Firestore {
    if (role === 'staff' && APP_CONFIG.admin.auth === 'firebase') {
      const staff = staffFirebase();
      if (staff.auth.currentUser) return staff.db;
    }
    return customerFirebase().db;
  }

  /** Lắng nghe thực đơn; tự nối lại (tăng dần thời gian chờ) nếu bị ngắt do lỗi */
  private listenMenu(attempt: number, onFirst: () => void) {
    onSnapshot(
      collection(customerFirebase().db, 'menu'),
      (snap) => {
        this.menu = snap.docs.map((d) => toMenuItem(d.id, d.data())).sort((a, b) => a.sortOrder - b.sortOrder);
        if (!snap.metadata.fromCache) this.menuFromServer = true;
        this.recovered('menu');
        this.emit({ type: 'menu' });
        void this.seedMenuOnce();
        // Lần đầu: cache rỗng thì đợi máy chủ trả lời để tránh nháy "thực đơn trống"
        if (!snap.empty || !snap.metadata.fromCache) onFirst();
      },
      (err) => {
        this.fail('menu', err);
        onFirst();
        window.setTimeout(() => this.listenMenu(attempt + 1, onFirst), backoff(attempt));
      },
    );
  }

  /**
   * Khởi tạo thực đơn mẫu MỘT LẦN cho cả hệ thống (đánh dấu meta/menuSeed trong transaction).
   * Nhờ vậy khi quán xoá hết món mẫu để nhập thực đơn thật, app không tự thêm lại.
   */
  private async seedMenuOnce() {
    if (this.seedChecked || !this.viewer.staff || !this.menuFromServer) return;
    this.seedChecked = true;
    const db = this.db('staff');
    const empty = this.menu.length === 0;
    try {
      await runTransaction(db, async (tx) => {
        const marker = await tx.get(doc(db, 'meta', 'menuSeed'));
        if (marker.exists()) return;
        const now = Date.now();
        // Luôn đặt cờ (kể cả khi thực đơn đã có sẵn) để sau này xoá hết món cũng không bị thêm lại
        tx.set(doc(db, 'meta', 'menuSeed'), { at: now, seeded: empty });
        if (empty) for (const item of SEED_MENU) tx.set(doc(db, 'menu', item.id), toDoc({ ...item, updatedAt: now }));
      });
    } catch (err) {
      console.warn('[Cloud9] Không khởi tạo được thực đơn mẫu', err);
    }
    void this.addEnglishToMenu();
  }

  /**
   * Thực đơn đã tạo trước khi có song ngữ: bổ sung tên/mô tả/tuỳ chọn tiếng Anh cho các món mẫu
   * (chỉ điền trường còn thiếu — không đổi tên, giá, ảnh quán đã sửa).
   */
  private async addEnglishToMenu() {
    // Chỉ chạy một lần cho cả hệ thống (cờ meta/menuSeed.i18n) — quán xoá bản dịch thì không tự điền lại
    try {
      const marker = await getDoc(doc(this.db('staff'), 'meta', 'menuSeed'));
      if (marker.exists() && marker.data().i18n) return;
    } catch {
      return;
    }
    const presets = OPTION_PRESETS.map((p) => p.group);
    const enrichGroup = (g: OptionGroup): OptionGroup => {
      const ids = g.choices.map((c) => c.id).join(',');
      const preset = presets.find((p) => p.id === g.id && p.choices.map((c) => c.id).join(',') === ids) ?? presets.find((p) => p.id === g.id);
      if (!preset) return g;
      return {
        ...g,
        nameEn: g.nameEn ?? preset.nameEn,
        choices: g.choices.map((c) => {
          const pc = preset.choices.find((x) => x.id === c.id);
          return pc ? { ...c, nameEn: c.nameEn ?? pc.nameEn, ...(pc.summaryEn !== undefined ? { summaryEn: c.summaryEn ?? pc.summaryEn } : {}) } : c;
        }),
      };
    };
    const updates: { id: string; patch: Partial<MenuItem> }[] = [];
    for (const item of this.menu) {
      const seed = SEED_MENU.find((s) => s.id === item.id);
      const patch: Partial<MenuItem> = {};
      if (seed && !item.nameEn && seed.nameEn) patch.nameEn = seed.nameEn;
      if (seed && !item.descriptionEn && seed.descriptionEn) patch.descriptionEn = seed.descriptionEn;
      if (item.optionGroups?.some((g) => !g.nameEn || g.choices.some((c) => !c.nameEn))) {
        const groups = item.optionGroups.map(enrichGroup);
        if (JSON.stringify(groups) !== JSON.stringify(item.optionGroups)) patch.optionGroups = groups;
      }
      if (Object.keys(patch).length) updates.push({ id: item.id, patch });
    }
    try {
      const db = this.db('staff');
      const batch = writeBatch(db);
      for (const u of updates) batch.update(doc(db, 'menu', u.id), JSON.parse(JSON.stringify(u.patch)));
      batch.set(doc(db, 'meta', 'menuSeed'), { i18n: true }, { merge: true });
      await batch.commit();
      if (!updates.length) return;
      console.info(`[Cloud9] Đã bổ sung tiếng Anh cho ${updates.length} món`);
    } catch (err) {
      console.warn('[Cloud9] Không bổ sung được tiếng Anh cho thực đơn', err);
    }
  }

  /** Chọn truy vấn đơn hàng theo người xem (khách: đơn của mình · nhân viên: đơn gần đây) */
  private resubscribeOrders() {
    const v = this.viewer;
    let key = 'none';
    let q: Query | null = null;
    if (v.staff) {
      const db = this.db('staff');
      const since = startOfDay(Date.now()) - STAFF_WINDOW_DAYS * 86_400_000;
      key = `staff:${db === customerFirebase().db ? 'c' : 's'}:${since}`;
      q = query(collection(db, 'orders'), where('createdAt', '>=', since));
    } else if (!this.authResolved || this.authPending) {
      key = 'waiting-auth'; // khách: đợi đăng nhập ẩn danh xong mới biết truy vấn theo uid hay mã khách
    } else if (this.customerUid) {
      key = `uid:${this.customerUid}`;
      q = query(collection(customerFirebase().db, 'orders'), where('customerUid', '==', this.customerUid));
    } else if (v.customerId) {
      // Chưa bật Firebase Auth: lọc theo mã khách (chỉ dùng được khi Rules còn ở chế độ thử nghiệm)
      key = `cid:${v.customerId}`;
      q = query(collection(customerFirebase().db, 'orders'), where('customer.id', '==', v.customerId));
    }
    if (key === this.ordersKey && (this.unsubOrders || !q)) return;
    this.ordersKey = key;
    this.ordersQuery = q;
    this.unsubOrders?.();
    this.unsubOrders = null;
    this.orders.clear();
    this.emit({ type: 'orders' });
    if (!q) {
      if (key !== 'waiting-auth') this.resolveOrdersReady();
      return;
    }
    this.listenOrders(q, key, 0);
  }

  private listenOrders(q: Query, key: string, attempt: number) {
    // Chỉ phát sự kiện từng đơn SAU khi đã đồng bộ với máy chủ lần đầu — tránh bắn lại các thay đổi
    // xảy ra lúc app đang đóng (ảnh chụp đầu tiên thường lấy từ cache IndexedDB).
    let synced = false;
    this.unsubOrders = onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snap) => {
        const live = synced;
        const now = Date.now();
        for (const change of snap.docChanges()) {
          const id = change.doc.id;
          const previous = this.orders.get(id);
          if (change.type === 'removed') {
            this.orders.delete(id);
            continue;
          }
          const order = toOrder(id, change.doc.data());
          this.orders.set(id, order);
          if (!this.firstSeen.has(id)) this.firstSeen.set(id, now);
          if (live && (!previous || previous.updatedAt !== order.updatedAt)) this.emit({ type: 'order', order, previous });
        }
        if (!snap.metadata.fromCache) {
          synced = true;
          this.resolveOrdersReady();
        }
        this.recovered('orders');
        this.emit({ type: 'orders' });
      },
      (err) => {
        this.fail('orders', err);
        this.resolveOrdersReady();
        this.unsubOrders = null;
        window.setTimeout(() => {
          if (this.ordersKey === key && !this.unsubOrders && this.ordersQuery === q) this.listenOrders(q, key, attempt + 1);
        }, backoff(attempt));
      },
    );
  }

  /**
   * Đọc - kiểm tra - ghi một đơn trong transaction (an toàn khi nhiều máy thao tác cùng lúc).
   * Khi đơn vừa thanh toán / huỷ sau thanh toán: cập nhật thẻ tích điểm loyalty/{mã khách} trong CÙNG transaction.
   */
  private async mutateOrder(id: string, role: Role, fn: (prev: Order) => Order): Promise<Order> {
    const db = this.db(role);
    const ref = doc(db, 'orders', id);
    try {
      const { prev, next } = await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists()) throw new RepoError(translate('errors.orderNotFound'), 'not_found');
        const prev = toOrder(id, snap.data());
        let next = fn(prev);
        if (next === prev) return { prev, next };
        const kind = loyaltyTransition(prev, next);
        if (kind) {
          // Mọi lệnh đọc phải trước lệnh ghi trong transaction
          const lref = doc(db, 'loyalty', prev.customer.id);
          const lsnap = await tx.get(lref);
          const current = lsnap.exists() ? (lsnap.data() as LoyaltyAccount) : null;
          const now = Date.now();
          let account: LoyaltyAccount | null;
          if (kind === 'pay') ({ account, order: next } = applyLoyaltyOnPayment(current, next, now));
          else account = reverseLoyalty(current, next, now);
          if (account && account !== current) tx.set(lref, { ...account });
        }
        tx.set(ref, toDoc(next));
        return { prev, next };
      });
      if (next !== prev) {
        this.orders.set(id, next);
        this.emit({ type: 'order', order: next, previous: prev });
        this.emit({ type: 'orders' });
      }
      return next;
    } catch (err) {
      this.wrap(err);
    }
  }

  /**
   * Huỷ đơn quá hạn thanh toán. Với đơn của máy khác, tính từ lúc MÁY NÀY thấy đơn
   * (không so đồng hồ của 2 thiết bị khác nhau — tránh huỷ nhầm khi một máy bị lệch giờ).
   */
  private async expireStaleOrders() {
    const now = Date.now();
    for (const o of this.orders.values()) {
      const mine = (!!this.customerUid && o.customerUid === this.customerUid) || o.customer.id === this.viewer.customerId;
      if (!this.viewer.staff && !mine) continue;
      const since = mine ? o.createdAt : Math.max(o.createdAt, this.firstSeen.get(o.id) ?? now);
      if (!isExpired(o, now, since)) continue;
      try {
        await this.mutateOrder(o.id, this.viewer.staff ? 'staff' : 'customer', (prev) =>
          isExpired(prev, Date.now(), Math.max(prev.createdAt, since)) ? applyCancel(prev, undefined, 'system', Date.now()) : prev,
        );
      } catch (err) {
        console.warn('[Cloud9] Không huỷ được đơn hết hạn', o.code, err);
      }
    }
  }

  // ───────────── Vòng đời / người xem ─────────────

  /** Chờ thực đơn + danh sách đơn tải lần đầu (tối đa ~8 giây) */
  whenReady() {
    const orders = Promise.race([this.ordersReady, new Promise<void>((r) => window.setTimeout(r, FIRST_LOAD_TIMEOUT))]);
    return Promise.all([this.menuReady, orders]).then(() => undefined);
  }

  setViewer(viewer: Viewer) {
    const changed = viewer.staff !== this.viewer.staff || viewer.customerId !== this.viewer.customerId;
    this.viewer = viewer;
    if (!changed) return;
    // Nhân viên không cần chờ đăng nhập ẩn danh; khách thì resubscribe lại khi có uid (refreshAuth)
    this.resubscribeOrders();
    if (viewer.staff) void this.seedMenuOnce();
  }

  subscribe(listener: (e: RepoEvent) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // ───────────── Thực đơn ─────────────

  async listMenu() {
    return this.menu.map((m) => ({ ...m }));
  }

  async saveMenuItem(item: MenuItem) {
    if (!item.name.trim()) throw new RepoError(translate('errors.nameRequired'), 'validation');
    if (!(item.price >= 0)) throw new RepoError(translate('errors.invalidPrice'), 'validation');
    const db = this.db('staff');
    const isNew = !item.id;
    const ref = isNew ? doc(collection(db, 'menu')) : doc(db, 'menu', item.id);
    const saved: MenuItem = {
      ...item,
      id: ref.id,
      sortOrder: isNew ? Math.max(-1, ...this.menu.map((m) => m.sortOrder)) + 1 : item.sortOrder,
      updatedAt: Date.now(),
    };
    try {
      await setDoc(ref, toDoc(saved));
    } catch (err) {
      this.wrap(err);
    }
    return saved;
  }

  async deleteMenuItem(id: string) {
    try {
      await deleteDoc(doc(this.db('staff'), 'menu', id));
    } catch (err) {
      this.wrap(err);
    }
  }

  async setItemAvailability(id: string, available: boolean) {
    try {
      await updateDoc(doc(this.db('staff'), 'menu', id), { available, updatedAt: Date.now() });
    } catch (err) {
      this.wrap(err);
    }
  }

  // ───────────── Đơn hàng ─────────────

  async listOrders() {
    return [...this.orders.values()].sort((a, b) => b.createdAt - a.createdAt);
  }

  async getOrder(id: string) {
    const cached = this.orders.get(id);
    if (cached) return cached;
    try {
      const snap = await getDoc(doc(this.db(this.viewer.staff ? 'staff' : 'customer'), 'orders', id));
      return snap.exists() ? toOrder(snap.id, snap.data()) : undefined;
    } catch (err) {
      this.wrap(err); // mất mạng / không có quyền — báo đúng lỗi, không nói "không tìm thấy"
    }
  }

  async findOrderByScan(raw: string) {
    const { orderId, code } = parseOrderQrPayload(raw);
    // Mã QR đầy đủ: chỉ tin vào id — không rơi về mã ngắn (tránh mở nhầm đơn khác trùng số)
    if (orderId) return this.getOrder(orderId);
    if (code) return pickByShortCode(this.orders.values(), code, Date.now());
    return undefined;
  }

  async createOrder(input: CreateOrderInput) {
    await this.menuReady;
    await this.authReady;
    let customerUid = currentCustomerUid();
    if (!customerUid) {
      // Thử đăng nhập ẩn danh lại (lần trước có thể mất mạng)
      this.authReady = this.refreshAuth();
      customerUid = await this.authReady;
    }
    const items = buildOrderLines(input, this.menu);
    const db = this.db('customer');
    const now = Date.now();
    const orderRef = doc(collection(db, 'orders'));
    const counterRef = doc(db, 'counters', dayKey(now));
    try {
      const order = await runTransaction(db, async (tx) => {
        const counter = await tx.get(counterRef);
        const seq = (counter.exists() ? Number(counter.data().seq) || 0 : 0) + 1;
        const o = buildOrder(input, items, { id: orderRef.id, code: formatOrderCode(seq), now, customerUid });
        tx.set(counterRef, { seq, updatedAt: now });
        tx.set(orderRef, toDoc(o));
        return o;
      });
      this.orders.set(order.id, order);
      this.firstSeen.set(order.id, now);
      this.emit({ type: 'order', order });
      this.emit({ type: 'orders' });
      return order;
    } catch (err) {
      this.wrap(err);
    }
  }

  async confirmPayment(orderId: string) {
    const menu = this.menu;
    return this.mutateOrder(orderId, 'staff', (prev) => {
      if (prev.paymentStatus !== 'paid') assertOrderPricing(prev, menu);
      return applyConfirmPayment(prev, Date.now());
    });
  }

  async updateOrderStatus(orderId: string, status: OrderStatus, by: 'customer' | 'staff' | 'system' = 'staff') {
    const menu = this.menu;
    return this.mutateOrder(orderId, by === 'customer' ? 'customer' : 'staff', (prev) => {
      if (status === 'received' && prev.paymentStatus !== 'paid') assertOrderPricing(prev, menu);
      return applyStatus(prev, status, by, Date.now());
    });
  }

  async cancelOrder(orderId: string, reason?: string, by: 'customer' | 'staff' = 'staff') {
    return this.mutateOrder(orderId, by === 'customer' ? 'customer' : 'staff', (prev) => applyCancel(prev, reason, by, Date.now()));
  }

  // ───────────── Tích điểm ─────────────

  async getLoyalty(customerId: string) {
    try {
      const snap = await getDoc(doc(this.db(this.viewer.staff ? 'staff' : 'customer'), 'loyalty', customerId));
      return snap.exists() ? (snap.data() as LoyaltyAccount) : null;
    } catch (err) {
      this.wrap(err);
    }
  }

  watchLoyalty(customerId: string, cb: (a: LoyaltyAccount | null) => void) {
    return onSnapshot(
      doc(customerFirebase().db, 'loyalty', customerId),
      (snap) => cb(snap.exists() ? (snap.data() as LoyaltyAccount) : null),
      (err) => {
        console.warn('[Cloud9] Không đọc được thẻ tích điểm', err);
        cb(null);
      },
    );
  }

  // ───────────── Dữ liệu demo (chỉ nhân viên) ─────────────

  async clearDemoOrders() {
    const db = this.db('staff');
    try {
      const snap = await getDocs(query(collection(db, 'orders'), where('isDemo', '==', true)));
      for (let i = 0; i < snap.docs.length; i += BATCH_LIMIT) {
        const batch = writeBatch(db);
        snap.docs.slice(i, i + BATCH_LIMIT).forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
    } catch (err) {
      this.wrap(err);
    }
  }

  /**
   * Trên Firestore KHÔNG xoá dữ liệu thật: tạo lại 7 ngày đơn mẫu (thay đơn mẫu cũ).
   * Đơn mẫu mang mã "DEMO-…" để không trùng mã đơn thật khi thu ngân tìm theo số.
   */
  async resetAll() {
    await this.clearDemoOrders();
    const db = this.db('staff');
    try {
      const menu = this.menu.length ? this.menu : SEED_MENU;
      const demo = generateDemoOrders(menu).map((o) => ({ ...o, code: o.code.replace('C9-', 'DEMO-'), customerUid: 'demo' }));
      for (let i = 0; i < demo.length; i += BATCH_LIMIT) {
        const batch = writeBatch(db);
        demo.slice(i, i + BATCH_LIMIT).forEach((o) => batch.set(doc(db, 'orders', o.id), toDoc(o)));
        await batch.commit();
      }
    } catch (err) {
      this.wrap(err);
    }
  }
}
