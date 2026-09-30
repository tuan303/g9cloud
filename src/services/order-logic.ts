import { APP_CONFIG } from '@/config/app';
import { isSameDay } from '@/lib/format';
import { rebuildLine } from '@/lib/pricing';
import type { CreateOrderInput, MenuItem, Order, OrderLine, OrderStatus, StatusEvent } from '@/types';
import { RepoError } from './repository';

/**
 * Quy tắc nghiệp vụ của đơn hàng — dùng chung cho mọi backend (localStorage, Firestore, API sau này).
 * Các hàm đều thuần (không ghi dữ liệu): nhận trạng thái cũ, trả về đơn mới hoặc ném RepoError.
 */

/** Thứ tự hợp lệ của trạng thái — chỉ cho phép tiến lên (trừ huỷ) */
const RANK: Record<OrderStatus, number> = {
  pending_payment: 0,
  received: 1,
  preparing: 2,
  ready: 3,
  delivering: 3,
  completed: 4,
  cancelled: 99,
};

export const EXPIRED_REASON = 'Hết hạn thanh toán';

/** "2026-09-30" theo giờ máy — khoá đánh số đơn theo ngày */
export function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatOrderCode(seq: number): string {
  return `C9-${String(seq).padStart(3, '0')}`;
}

/** Số thứ tự trong mã "C9-027" → 27 */
export function codeSeq(code: string): number {
  return parseInt(code.match(/(\d+)$/)?.[1] ?? '0', 10);
}

/**
 * Kiểm tra giỏ hàng với thực đơn hiện tại và dựng các dòng đơn (giá tính lại từ thực đơn).
 * Ném lỗi nếu món hết, tuỳ chọn không còn hợp lệ hoặc giá đã đổi so với giỏ khách đang thấy.
 */
export function buildOrderLines(input: CreateOrderInput, menu: MenuItem[]): OrderLine[] {
  if (!input.lines.length) throw new RepoError('Giỏ hàng trống', 'validation');
  if (input.fulfillment === 'delivery' && !input.deliveryAddress?.trim())
    throw new RepoError('Vui lòng nhập địa chỉ giao hàng', 'validation');

  const unavailable = input.lines.filter((l) => {
    const m = menu.find((x) => x.id === l.itemId);
    return !m || !m.available;
  });
  if (unavailable.length) throw new RepoError(`Món đã hết: ${unavailable.map((l) => l.name).join(', ')}`, 'validation');

  const items: OrderLine[] = input.lines.map((l) => {
    const m = menu.find((x) => x.id === l.itemId)!;
    const line = rebuildLine(l, m);
    if (!line) throw new RepoError(`${m.name}: tuỳ chọn đã thay đổi, vui lòng chọn lại món`, 'validation');
    return { ...line, lineTotal: line.unitPrice * line.quantity };
  });
  if (items.some((l, i) => l.unitPrice !== input.lines[i].unitPrice))
    throw new RepoError('Giá món vừa thay đổi — vui lòng kiểm tra lại giỏ hàng', 'validation');
  return items;
}

/** Dựng đơn mới ở trạng thái chờ thanh toán */
export function buildOrder(
  input: CreateOrderInput,
  items: OrderLine[],
  opts: { id: string; code: string; now: number; customerUid?: string | null },
): Order {
  const { id, code, now } = opts;
  const subtotal = items.reduce((s, l) => s + l.lineTotal, 0);
  const deliveryFee = input.fulfillment === 'delivery' ? APP_CONFIG.fulfillment.delivery.fee : 0;
  return {
    id,
    code,
    customer: input.customer,
    customerUid: opts.customerUid ?? null,
    fulfillment: input.fulfillment,
    deliveryAddress: input.fulfillment === 'delivery' ? input.deliveryAddress?.trim() : undefined,
    note: input.note?.trim() || undefined,
    items,
    itemCount: items.reduce((s, l) => s + l.quantity, 0),
    subtotal,
    deliveryFee,
    discount: 0,
    total: subtotal + deliveryFee,
    paymentMethod: input.paymentMethod ?? APP_CONFIG.payment.defaultMethod,
    paymentStatus: 'unpaid',
    status: 'pending_payment',
    createdAt: now,
    updatedAt: now,
    statusHistory: [{ status: 'pending_payment', at: now, by: 'customer' }],
  };
}

function withEvent(prev: Order, patch: Partial<Order>, event: StatusEvent): Order {
  return { ...prev, ...patch, updatedAt: event.at, statusHistory: [...prev.statusHistory, event] };
}

/** Thu ngân xác nhận đã thu tiền. Trả về chính `prev` nếu đã thanh toán trước đó (quét lại). */
export function applyConfirmPayment(prev: Order, now: number): Order {
  if (prev.status === 'cancelled') throw new RepoError('Đơn đã bị huỷ', 'invalid_state');
  if (prev.paymentStatus === 'paid') return prev;
  return withEvent(
    prev,
    { paymentStatus: 'paid', paidAt: now, status: 'received' },
    { status: 'received', at: now, by: 'staff', note: 'Đã thanh toán tại POS' },
  );
}

/** Huỷ đơn. Khách chỉ được huỷ khi chưa thanh toán. */
export function applyCancel(prev: Order, reason: string | undefined, by: 'customer' | 'staff' | 'system', now: number): Order {
  if (prev.status === 'cancelled') return prev;
  if (prev.status === 'completed') throw new RepoError('Đơn đã hoàn thành', 'invalid_state');
  if (by === 'customer' && prev.status !== 'pending_payment')
    throw new RepoError('Đơn đã thanh toán — vui lòng liên hệ quầy để huỷ', 'invalid_state');
  const cancelReason = reason?.trim() || (by === 'customer' ? 'Khách huỷ đơn' : by === 'system' ? EXPIRED_REASON : 'Quán huỷ đơn');
  return withEvent(
    prev,
    { status: 'cancelled', cancelReason, paymentStatus: prev.paymentStatus === 'paid' ? 'refunded' : prev.paymentStatus },
    { status: 'cancelled', at: now, by, note: cancelReason },
  );
}

/** Chuyển trạng thái (chỉ tiến lên). Trả về `prev` nếu không đổi. */
export function applyStatus(prev: Order, status: OrderStatus, by: 'customer' | 'staff' | 'system', now: number): Order {
  if (status === 'cancelled') return applyCancel(prev, undefined, by, now);
  if (prev.status === 'cancelled' || prev.status === 'completed')
    throw new RepoError('Đơn đã kết thúc, không thể cập nhật', 'invalid_state');
  if (status === 'received' && prev.paymentStatus !== 'paid') return applyConfirmPayment(prev, now);
  if (prev.paymentStatus !== 'paid') throw new RepoError('Đơn chưa thanh toán', 'invalid_state');
  if (RANK[status] < RANK[prev.status]) throw new RepoError('Không thể lùi trạng thái đơn', 'invalid_state');
  if (status === prev.status) return prev;
  let next = status;
  if (next === 'ready' && prev.fulfillment === 'delivery') next = 'delivering';
  if (next === 'delivering' && prev.fulfillment === 'pickup') next = 'ready';
  return withEvent(prev, { status: next }, { status: next, at: now, by });
}

/**
 * Kiểm tra giá đơn với thực đơn TRƯỚC khi thu ngân xác nhận thu tiền.
 * Giá được tính ở máy khách nên cần đối chiếu lại tại quầy (chống sửa giá). Bỏ qua món đã bị sửa
 * sau thời điểm đặt (giá thay đổi hợp lệ) hoặc đã bị xoá khỏi thực đơn. Ném RepoError nếu có sai lệch.
 */
export function assertOrderPricing(order: Order, menu: MenuItem[]): void {
  const issues: string[] = [];
  let subtotal = 0;
  let count = 0;
  for (const line of order.items) {
    const qtyOk = Number.isInteger(line.quantity) && line.quantity >= 1 && line.quantity <= 99;
    if (!qtyOk || line.lineTotal !== line.unitPrice * line.quantity) issues.push(`${line.name}: số lượng / thành tiền không hợp lệ`);
    subtotal += line.lineTotal;
    count += line.quantity;
    const m = menu.find((x) => x.id === line.itemId);
    if (!m || (m.updatedAt ?? 0) > order.createdAt) continue; // món đã đổi/xoá sau khi đặt — không so được
    const expected = rebuildLine(line, m);
    if (!expected || expected.unitPrice !== line.unitPrice) issues.push(`${line.name}: giá ${line.unitPrice} khác thực đơn`);
  }
  if (order.subtotal !== subtotal || order.itemCount !== count) issues.push('tạm tính không khớp các món');
  if (order.discount !== 0 || order.total !== order.subtotal + order.deliveryFee - order.discount) issues.push('tổng tiền không khớp');
  const fee = order.fulfillment === 'delivery' ? APP_CONFIG.fulfillment.delivery.fee : 0;
  if (order.deliveryFee !== fee) issues.push('phí giao không đúng');
  if (issues.length)
    throw new RepoError(`Đơn ${order.code} có giá không khớp thực đơn (${issues[0]}). Không thu tiền — hãy huỷ và đặt lại.`, 'invalid_state');
}

/** Đơn chờ thanh toán đã quá hạn QR? */
export function isExpired(order: Order, now: number, since = order.createdAt): boolean {
  return order.status === 'pending_payment' && now - since > APP_CONFIG.payment.qrExpiryMinutes * 60_000;
}

/** Tìm đơn hôm nay theo mã ngắn. Nhiều đơn trùng mã → yêu cầu quét QR (không đoán). */
export function pickByShortCode(orders: Iterable<Order>, code: string, now: number): Order | undefined {
  const matches = [...orders].filter((o) => o.code === code && !o.isDemo && isSameDay(o.createdAt, now));
  if (matches.length > 1) throw new RepoError(`Có ${matches.length} đơn trùng mã ${code} — vui lòng quét mã QR trên máy khách`, 'validation');
  return matches[0];
}
