import { translate } from '@/i18n';
import { isSameDay, normalizePhone } from '@/lib/format';
import type { Order } from '@/types';

/** Các tab lọc đơn ở trang quản trị */
export type OrderTab = 'pending' | 'new' | 'preparing' | 'handoff' | 'done' | 'cancelled';

export interface OrderTabMeta {
  value: OrderTab;
  label: string;
  emptyTitle: string;
  emptyDescription: string;
}

/** Nhãn + nội dung trạng thái rỗng tự dịch theo ngôn ngữ đang chọn (getter) */
function tabMeta(value: OrderTab): OrderTabMeta {
  return {
    value,
    get label() {
      return translate(`adminOrders.tabs.${value}.label`);
    },
    get emptyTitle() {
      return translate(`adminOrders.tabs.${value}.emptyTitle`);
    },
    get emptyDescription() {
      return translate(`adminOrders.tabs.${value}.emptyDescription`);
    },
  };
}

export const ORDER_TABS: OrderTabMeta[] = (['pending', 'new', 'preparing', 'handoff', 'done', 'cancelled'] as const).map(tabMeta);

/** Tab hàng đợi: đơn chờ lâu nhất xếp trên cùng */
export const QUEUE_TABS: OrderTab[] = ['new', 'preparing', 'handoff'];

/** Đơn thuộc tab nào (null = đơn cũ đã kết thúc từ ngày trước, không hiển thị) */
export function tabOf(order: Order, now: number): OrderTab | null {
  switch (order.status) {
    case 'pending_payment':
      return 'pending';
    case 'received':
      return 'new';
    case 'preparing':
      return 'preparing';
    case 'ready':
    case 'delivering':
      return 'handoff';
    case 'completed':
      return isSameDay(order.updatedAt, now) ? 'done' : null;
    case 'cancelled':
      return isSameDay(order.updatedAt, now) ? 'cancelled' : null;
    default:
      return null;
  }
}

/** Mốc bắt đầu tính thời gian chờ: lúc thanh toán (hoặc lúc đặt nếu chưa trả) */
export const waitingSince = (order: Pick<Order, 'paidAt' | 'createdAt'>) => order.paidAt ?? order.createdAt;

/** Quá mốc này đơn đang xử lý bị đánh dấu “Chờ lâu” */
export const LONG_WAIT_MS = 10 * 60_000;

export function sortForTab(list: Order[], tab: OrderTab): Order[] {
  const copy = [...list];
  if (QUEUE_TABS.includes(tab)) return copy.sort((a, b) => waitingSince(a) - waitingSince(b));
  if (tab === 'pending') return copy.sort((a, b) => b.createdAt - a.createdAt);
  return copy.sort((a, b) => b.updatedAt - a.updatedAt);
}

/** Bỏ dấu tiếng Việt + chữ thường để tìm kiếm không phân biệt dấu */
export function foldText(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

/** Tìm theo mã đơn ("C9-027", "027", "27"), tên khách, số điện thoại hoặc địa chỉ giao */
export function matchesQuery(order: Order, rawQuery: string): boolean {
  const q = foldText(rawQuery);
  if (!q) return true;

  // Chỉ gõ số: khớp đúng số thứ tự đơn ("27" = C9-027) hoặc một phần số điện thoại
  if (/^[+\d\s.-]+$/.test(q)) {
    const seq = order.code.split('-').pop() ?? '';
    if (/^\d{1,4}$/.test(q) && Number(q) === Number(seq)) return true;
    const digits = normalizePhone(q).replace(/\D/g, '');
    return digits.length >= 3 && !!order.customer.phone && normalizePhone(order.customer.phone).includes(digits);
  }

  const code = foldText(order.code);
  if (code.includes(q) || code.replace(/-/g, '').includes(q.replace(/[-\s]/g, ''))) return true;
  if (foldText(order.customer.name).includes(q)) return true;
  return !!order.deliveryAddress && foldText(order.deliveryAddress).includes(q);
}

export type OrderBuckets = Record<OrderTab, Order[]>;

/** Chia đơn vào các tab (đã lọc theo từ khoá và sắp xếp sẵn) */
export function bucketOrders(orders: Order[], now: number, query: string): OrderBuckets {
  const out: OrderBuckets = { pending: [], new: [], preparing: [], handoff: [], done: [], cancelled: [] };
  for (const o of orders) {
    const tab = tabOf(o, now);
    if (tab && matchesQuery(o, query)) out[tab].push(o);
  }
  for (const t of ORDER_TABS) out[t.value] = sortForTab(out[t.value], t.value);
  return out;
}

/** Tab mặc định: “Mới” nếu có đơn, nếu không thì tab đang xử lý đầu tiên có đơn */
export function pickDefaultTab(buckets: OrderBuckets): OrderTab {
  if (buckets.new.length) return 'new';
  return (['pending', 'preparing', 'handoff'] as const).find((t) => buckets[t].length > 0) ?? 'new';
}

/** 45 giây → "Vừa xong", 12 phút → "12 phút", 65 phút → "1h05" (theo ngôn ngữ đang chọn) */
export function formatElapsed(ms: number): string {
  const min = Math.floor(Math.max(0, ms) / 60_000);
  if (min < 1) return translate('adminOrders.elapsed.justNow');
  if (min < 60) return translate('adminOrders.elapsed.minutes', { count: min });
  const h = Math.floor(min / 60);
  return `${h}h${String(min % 60).padStart(2, '0')}`;
}

// ───────────── Lý do huỷ (dùng chung với màn hình khách) ─────────────

export { cancelReasonText, QUICK_CANCEL_REASONS } from '@/lib/cancel-reason';

/** "0901234567" → "0901 234 567" (giữ nguyên nếu không đúng 10 số) */
export function formatPhoneDisplay(phone: string): string {
  const p = normalizePhone(phone);
  return /^\d{10}$/.test(p) ? `${p.slice(0, 4)} ${p.slice(4, 7)} ${p.slice(7)}` : phone.trim();
}
