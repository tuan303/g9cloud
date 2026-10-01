import { translate } from '@/i18n';
import { APP_CONFIG } from '@/config/app';
import { SEED_MENU, withSeedEnglish } from '@/data/menu';
import { generateDemoOrders } from '@/data/demo-orders';
import { isSameDay } from '@/lib/format';
import { uid } from '@/lib/id';
import { parseOrderQrPayload } from '@/lib/qr';
import { platform } from '@/platform';
import type { CreateOrderInput, LoyaltyAccount, MenuItem, Order, OrderStatus } from '@/types';
import {
  applyCancel,
  applyConfirmPayment,
  applyStatus,
  assertOrderPricing,
  buildOrder,
  buildOrderLines,
  codeSeq,
  formatOrderCode,
  isExpired,
  loyaltyTransition,
  applyLoyaltyOnPayment,
  reverseLoyalty,
  pickByShortCode,
} from './order-logic';
import { RepoError, type DataRepository, type RepoEvent } from './repository';

const KEYS = {
  menu: 'c9.menu.v3',
  orders: 'c9.orders.v1',
  loyalty: 'c9.loyalty.v1',
} as const;

const CHANNEL = 'c9-sync';

function read<T>(key: string): T | undefined {
  try {
    const raw = platform.storage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : undefined;
  } catch {
    return undefined;
  }
}

function write(key: string, value: unknown) {
  try {
    platform.storage.setItem(key, JSON.stringify(value));
  } catch (err) {
    // Có thể vượt dung lượng (ảnh tải lên dạng data URL quá lớn)
    console.warn('[Cloud9] Không lưu được dữ liệu', key, err);
    throw new RepoError(translate('errors.storageFull'), 'validation');
  }
}

/**
 * Kho dữ liệu cục bộ cho bản demo:
 *  - Lưu qua platform.storage (web: localStorage · Zalo: nativeStorage).
 *  - Đồng bộ "thời gian thực" giữa các tab/cửa sổ cùng trình duyệt qua BroadcastChannel + sự kiện storage
 *    (mở app khách ở một tab và trang quản trị ở tab khác để thử luồng quét QR → cập nhật trạng thái).
 */
export class LocalRepository implements DataRepository {
  private menu: MenuItem[] = [];
  private orders: Order[] = [];
  private loyalty: Record<string, LoyaltyAccount> = {};
  private loyaltyWatchers = new Set<{ id: string; cb: (a: LoyaltyAccount | null) => void }>();
  private listeners = new Set<(e: RepoEvent) => void>();
  private channel: BroadcastChannel | null = null;

  constructor() {
    this.loadFromStorage();
    if (!read(KEYS.menu)) {
      this.menu = SEED_MENU.map((m) => ({ ...m, updatedAt: Date.now() }));
      write(KEYS.menu, this.menu);
    }
    if (!read(KEYS.orders)) {
      this.orders = APP_CONFIG.demo.seedOrders ? generateDemoOrders(this.menu) : [];
      write(KEYS.orders, this.orders);
    }
    this.expireStaleOrders();

    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel(CHANNEL);
      this.channel.onmessage = () => this.syncFromStorage();
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === KEYS.menu || e.key === KEYS.orders || e.key === KEYS.loyalty || e.key === null) this.syncFromStorage();
      });
      // Tự huỷ đơn quá hạn thanh toán mỗi phút
      window.setInterval(() => this.expireStaleOrders(), 60_000);
    }
  }

  // ───────────── nội bộ ─────────────

  private loadFromStorage() {
    this.menu = (read<MenuItem[]>(KEYS.menu) ?? []).map(withSeedEnglish);
    this.orders = read<Order[]>(KEYS.orders) ?? [];
    this.loyalty = read<Record<string, LoyaltyAccount>>(KEYS.loyalty) ?? {};
  }

  private notifyLoyalty() {
    this.loyaltyWatchers.forEach((w) => w.cb(this.loyalty[w.id] ?? null));
  }

  /** Ghi đơn + thẻ tích điểm khi đơn vừa thanh toán / huỷ sau thanh toán */
  private saveOrderWithLoyalty(next: Order, prev: Order) {
    const kind = loyaltyTransition(prev, next);
    let order = next;
    if (kind) {
      const now = Date.now();
      const id = next.customer.id;
      const current = this.loyalty[id] ?? null;
      let account: LoyaltyAccount | null = current;
      if (kind === 'pay') ({ account, order } = applyLoyaltyOnPayment(current, next, now));
      else account = reverseLoyalty(current, next, now);
      if (account && account !== current) {
        const loyalty = { ...this.loyalty, [id]: account };
        write(KEYS.loyalty, loyalty);
        this.loyalty = loyalty;
      }
    }
    this.saveOrder(order, prev);
    if (kind) this.notifyLoyalty();
    return order;
  }

  /** Nạp lại dữ liệu do tab khác ghi, phát sự kiện cho các thay đổi */
  private syncFromStorage() {
    const prevMenu = JSON.stringify(this.menu);
    const prevOrders = new Map(this.orders.map((o) => [o.id, o]));
    const prevLoyalty = JSON.stringify(this.loyalty);
    this.loadFromStorage();
    if (JSON.stringify(this.loyalty) !== prevLoyalty) this.notifyLoyalty();
    if (JSON.stringify(this.menu) !== prevMenu) this.emit({ type: 'menu' });
    let changed = false;
    for (const o of this.orders) {
      const prev = prevOrders.get(o.id);
      if (!prev || prev.updatedAt !== o.updatedAt) {
        changed = true;
        this.emit({ type: 'order', order: o, previous: prev });
      }
    }
    if (changed || prevOrders.size !== this.orders.length) this.emit({ type: 'orders' });
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

  private broadcast() {
    this.channel?.postMessage({ at: Date.now() });
  }

  /** Ghi vào bộ nhớ trước; chỉ cập nhật bản trong RAM khi ghi thành công (tránh lệch khi bộ nhớ đầy) */
  private commitMenu(next: MenuItem[]) {
    write(KEYS.menu, next);
    this.menu = next;
    this.broadcast();
    this.emit({ type: 'menu' });
  }

  private saveOrder(order: Order, previous?: Order) {
    const idx = this.orders.findIndex((o) => o.id === order.id);
    const next = idx >= 0 ? this.orders.map((o, i) => (i === idx ? order : o)) : [...this.orders, order];
    write(KEYS.orders, next);
    this.orders = next;
    this.broadcast();
    this.emit({ type: 'order', order, previous });
    this.emit({ type: 'orders' });
  }

  private requireOrder(id: string): Order {
    const o = this.orders.find((x) => x.id === id);
    if (!o) throw new RepoError(translate('errors.orderNotFound'), 'not_found');
    return o;
  }

  private nextCode(now: number): string {
    const todays = this.orders.filter((o) => isSameDay(o.createdAt, now));
    const maxSeq = todays.reduce((m, o) => Math.max(m, codeSeq(o.code)), 0);
    return formatOrderCode(maxSeq + 1);
  }

  private expireStaleOrders() {
    const now = Date.now();
    for (const o of [...this.orders]) {
      if (isExpired(o, now)) {
        try {
          this.saveOrder(applyCancel(o, undefined, 'system', now), o);
        } catch (err) {
          console.warn('[Cloud9] Không cập nhật được đơn hết hạn', err);
        }
      }
    }
  }

  // ───────────── Thực đơn ─────────────

  async listMenu() {
    return this.menu.map((m) => ({ ...m })).sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async saveMenuItem(item: MenuItem) {
    if (!item.name.trim()) throw new RepoError(translate('errors.nameRequired'), 'validation');
    if (!(item.price >= 0)) throw new RepoError(translate('errors.invalidPrice'), 'validation');
    const saved: MenuItem = { ...item, id: item.id || uid('item'), updatedAt: Date.now() };
    const exists = this.menu.some((m) => m.id === saved.id);
    if (!exists) saved.sortOrder = Math.max(-1, ...this.menu.map((m) => m.sortOrder)) + 1;
    this.commitMenu(exists ? this.menu.map((m) => (m.id === saved.id ? saved : m)) : [...this.menu, saved]);
    return { ...saved };
  }

  async deleteMenuItem(id: string) {
    this.commitMenu(this.menu.filter((m) => m.id !== id));
  }

  async setItemAvailability(id: string, available: boolean) {
    if (!this.menu.some((x) => x.id === id)) throw new RepoError(translate('errors.itemNotFound'), 'not_found');
    this.commitMenu(this.menu.map((x) => (x.id === id ? { ...x, available, updatedAt: Date.now() } : x)));
  }

  // ───────────── Đơn hàng ─────────────

  async listOrders() {
    return [...this.orders].sort((a, b) => b.createdAt - a.createdAt);
  }

  async getOrder(id: string) {
    return this.orders.find((o) => o.id === id);
  }

  async findOrderByScan(raw: string) {
    const { orderId, code } = parseOrderQrPayload(raw);
    // Mã QR đầy đủ: chỉ tin vào id — không rơi về mã ngắn (tránh mở nhầm đơn của khách khác trùng số)
    if (orderId) return this.orders.find((o) => o.id === orderId);
    if (code) return pickByShortCode(this.orders, code, Date.now());
    return undefined;
  }

  async createOrder(input: CreateOrderInput) {
    const items = buildOrderLines(input, this.menu);
    const now = Date.now();
    const order = buildOrder(input, items, { id: uid('ord'), code: this.nextCode(now), now });
    this.saveOrder(order);
    return order;
  }

  async confirmPayment(orderId: string) {
    const prev = this.requireOrder(orderId);
    if (prev.paymentStatus !== 'paid') assertOrderPricing(prev, this.menu);
    const order = applyConfirmPayment(prev, Date.now());
    return order !== prev ? this.saveOrderWithLoyalty(order, prev) : order;
  }

  async updateOrderStatus(orderId: string, status: OrderStatus, by: 'customer' | 'staff' | 'system' = 'staff') {
    const prev = this.requireOrder(orderId);
    if (status === 'received' && prev.paymentStatus !== 'paid') assertOrderPricing(prev, this.menu);
    const order = applyStatus(prev, status, by, Date.now());
    return order !== prev ? this.saveOrderWithLoyalty(order, prev) : order;
  }

  async cancelOrder(orderId: string, reason?: string, by: 'customer' | 'staff' = 'staff') {
    const prev = this.requireOrder(orderId);
    const order = applyCancel(prev, reason, by, Date.now());
    return order !== prev ? this.saveOrderWithLoyalty(order, prev) : order;
  }

  // ───────────── Tích điểm ─────────────

  async getLoyalty(customerId: string) {
    return this.loyalty[customerId] ?? null;
  }

  watchLoyalty(customerId: string, cb: (a: LoyaltyAccount | null) => void) {
    const w = { id: customerId, cb };
    this.loyaltyWatchers.add(w);
    cb(this.loyalty[customerId] ?? null);
    return () => {
      this.loyaltyWatchers.delete(w);
    };
  }

  // ───────────── Thời gian thực ─────────────

  subscribe(listener: (e: RepoEvent) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // ───────────── Demo ─────────────

  async clearDemoOrders() {
    this.orders = this.orders.filter((o) => !o.isDemo);
    write(KEYS.orders, this.orders);
    this.broadcast();
    this.emit({ type: 'orders' });
  }

  async resetAll() {
    this.menu = SEED_MENU.map((m) => ({ ...m, updatedAt: Date.now() }));
    this.orders = APP_CONFIG.demo.seedOrders ? generateDemoOrders(this.menu) : [];
    this.loyalty = {};
    write(KEYS.menu, this.menu);
    write(KEYS.orders, this.orders);
    write(KEYS.loyalty, this.loyalty);
    this.broadcast();
    this.emit({ type: 'menu' });
    this.emit({ type: 'orders' });
    this.notifyLoyalty();
  }
}
