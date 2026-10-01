import { translate, translateIn } from '@/i18n';
import { APP_CONFIG } from '@/config/app';
import { isSameDay } from '@/lib/format';
import { itemName, lineName } from '@/lib/i18n-data';
import { rebuildLine } from '@/lib/pricing';
import type { CartLine, CreateOrderInput, LoyaltyAccount, MenuItem, Order, OrderLine, OrderStatus, StatusEvent } from '@/types';
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

/** Đơn bị huỷ vì hết hạn thanh toán (do hệ thống, hoặc máy khách tự huỷ khi hết giờ) */
export function isExpiryCancel(o: Pick<Order, 'status' | 'statusHistory' | 'cancelReason'>): boolean {
  if (o.status !== 'cancelled') return false;
  if (o.statusHistory[o.statusHistory.length - 1]?.by === 'system') return true;
  return [translateIn('vi', 'errors.reasonExpired'), translateIn('en', 'errors.reasonExpired')].includes(o.cancelReason ?? '');
}

/** Lý do "hết hạn thanh toán" theo ngôn ngữ hiện tại */
export const expiredReason = () => translate('errors.reasonExpired');

// ───────────── Tích điểm: mua N cốc tặng 1 cốc ─────────────

const LOYALTY = APP_CONFIG.loyalty;
const isCup = (categoryId: string) => (LOYALTY.eligibleCategories as readonly string[]).includes(categoryId);

/** Số "cốc" (món thuộc danh mục nước) trong các dòng */
export function eligibleCups(lines: Pick<CartLine, 'categoryId' | 'quantity'>[]): number {
  return lines.reduce((n, l) => n + (isCup(l.categoryId) ? l.quantity : 0), 0);
}

/** Dòng được miễn phí khi đổi thưởng: cốc nước đắt nhất (có lợi nhất cho khách) */
export function rewardLine<L extends Pick<CartLine, 'categoryId' | 'unitPrice'>>(lines: L[]): L | undefined {
  return lines
    .filter((l) => isCup(l.categoryId))
    .sort((a, b) => b.unitPrice - a.unitPrice)[0];
}

export const rewardDiscount = (lines: Pick<CartLine, 'categoryId' | 'unitPrice'>[]) => rewardLine(lines)?.unitPrice ?? 0;

/** Đơn này có được tích điểm không (khách có tài khoản, không phải khách vãng lai) */
export const canEarn = (order: Pick<Order, 'customer'>) => LOYALTY.enabled && !order.customer.isGuest;

export function emptyLoyalty(customerId: string): LoyaltyAccount {
  return { customerId, stamps: 0, totalCups: 0, rewardsRedeemed: 0, updatedAt: 0 };
}

/**
 * Thu ngân xác nhận thanh toán → cộng cốc (cốc miễn phí không được tính) và trừ N cốc nếu đơn đổi thưởng.
 * Ném lỗi nếu khách chưa đủ điểm để đổi.
 */
export function applyLoyaltyOnPayment(account: LoyaltyAccount | null, order: Order, now: number): { account: LoyaltyAccount | null; order: Order } {
  if (!canEarn(order)) {
    if (order.loyaltyRedeem) throw new RepoError(translate('errors.loyaltyGuest'), 'invalid_state');
    return { account, order };
  }
  const acc = account ?? emptyLoyalty(order.customer.id);
  const per = LOYALTY.cupsPerReward;
  if (order.loyaltyRedeem && acc.stamps < per)
    throw new RepoError(translate('errors.loyaltyNotEnough', { cups: per }), 'invalid_state');
  const cups = eligibleCups(order.items);
  const earned = Math.max(0, cups - (order.loyaltyRedeem ? 1 : 0));
  return {
    account: {
      ...acc,
      stamps: acc.stamps + earned - (order.loyaltyRedeem ? per : 0),
      totalCups: acc.totalCups + cups,
      rewardsRedeemed: acc.rewardsRedeemed + (order.loyaltyRedeem ? 1 : 0),
      updatedAt: now,
    },
    order: { ...order, loyaltyEarned: earned },
  };
}

/** Huỷ đơn ĐÃ thanh toán → hoàn lại điểm (trừ cốc đã cộng, trả lại cốc miễn phí đã dùng) */
export function reverseLoyalty(account: LoyaltyAccount | null, order: Order, now: number): LoyaltyAccount | null {
  if (!account || !canEarn(order)) return account;
  const per = LOYALTY.cupsPerReward;
  const cups = eligibleCups(order.items);
  return {
    ...account,
    // Không chặn ở 0: nếu số cốc của đơn này đã được dùng để đổi thưởng thì khách "nợ" lại (hiển thị là 0)
    stamps: account.stamps - (order.loyaltyEarned ?? 0) + (order.loyaltyRedeem ? per : 0),
    totalCups: Math.max(0, account.totalCups - cups),
    rewardsRedeemed: Math.max(0, account.rewardsRedeemed - (order.loyaltyRedeem ? 1 : 0)),
    updatedAt: now,
  };
}

/** Giao dịch nào cần cập nhật thẻ tích điểm: vừa thanh toán / huỷ đơn đã thanh toán */
export function loyaltyTransition(prev: Order, next: Order): 'pay' | 'reverse' | null {
  if (!canEarn(next)) return next.loyaltyRedeem && prev.paymentStatus !== 'paid' && next.paymentStatus === 'paid' ? 'pay' : null;
  if (prev.paymentStatus !== 'paid' && next.paymentStatus === 'paid') return 'pay';
  if (prev.paymentStatus === 'paid' && next.status === 'cancelled') return 'reverse';
  return null;
}

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
  if (!input.lines.length) throw new RepoError(translate('errors.cartEmpty'), 'validation');
  if (input.fulfillment === 'delivery' && !input.deliveryAddress?.trim())
    throw new RepoError(translate('errors.addressRequired'), 'validation');

  const unavailable = input.lines.filter((l) => {
    const m = menu.find((x) => x.id === l.itemId);
    return !m || !m.available;
  });
  if (unavailable.length) throw new RepoError(translate('errors.soldOut', { items: unavailable.map((l) => lineName(l)).join(', ') }), 'validation');

  const items: OrderLine[] = input.lines.map((l) => {
    const m = menu.find((x) => x.id === l.itemId)!;
    const line = rebuildLine(l, m);
    if (!line) throw new RepoError(translate('errors.optionsChanged', { name: itemName(m) }), 'validation');
    return { ...line, lineTotal: line.unitPrice * line.quantity };
  });
  if (items.some((l, i) => l.unitPrice !== input.lines[i].unitPrice))
    throw new RepoError(translate('errors.priceChanged'), 'validation');
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
  // Đổi 1 cốc miễn phí: giảm đúng giá 1 cốc nước đắt nhất trong đơn (thu ngân kiểm tra điểm khi thu tiền)
  const discount = input.redeemReward && APP_CONFIG.loyalty.enabled && !input.customer.isGuest ? rewardDiscount(items) : 0;
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
    discount,
    total: subtotal + deliveryFee - discount,
    loyaltyRedeem: discount > 0 ? true : undefined,
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
  if (prev.status === 'cancelled') throw new RepoError(translate('errors.orderCancelled'), 'invalid_state');
  if (prev.paymentStatus === 'paid') return prev;
  return withEvent(
    prev,
    { paymentStatus: 'paid', paidAt: now, status: 'received' },
    { status: 'received', at: now, by: 'staff', note: translate('status.paidAtPos') },
  );
}

/** Huỷ đơn. Khách chỉ được huỷ khi chưa thanh toán. */
export function applyCancel(prev: Order, reason: string | undefined, by: 'customer' | 'staff' | 'system', now: number): Order {
  if (prev.status === 'cancelled') return prev;
  if (prev.status === 'completed') throw new RepoError(translate('errors.orderCompleted'), 'invalid_state');
  if (by === 'customer' && prev.status !== 'pending_payment')
    throw new RepoError(translate('errors.paidContactCounter'), 'invalid_state');
  const cancelReason =
    reason?.trim() ||
    translate(by === 'customer' ? 'errors.reasonCustomer' : by === 'system' ? 'errors.reasonExpired' : 'errors.reasonStaff');
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
    throw new RepoError(translate('errors.orderFinished'), 'invalid_state');
  if (status === 'received' && prev.paymentStatus !== 'paid') return applyConfirmPayment(prev, now);
  if (prev.paymentStatus !== 'paid') throw new RepoError(translate('errors.notPaid'), 'invalid_state');
  if (RANK[status] < RANK[prev.status]) throw new RepoError(translate('errors.noGoingBack'), 'invalid_state');
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
    const priceOk = Number.isInteger(line.unitPrice) && line.unitPrice >= 0;
    if (!qtyOk || !priceOk || line.lineTotal !== line.unitPrice * line.quantity)
      issues.push(translate('errors.priceDetail.quantity', { name: lineName(line) }));
    subtotal += line.lineTotal;
    count += line.quantity;
    const m = menu.find((x) => x.id === line.itemId);
    // Danh mục quyết định tích điểm / cốc miễn phí → luôn đối chiếu (kể cả khi món vừa được sửa, VD bật/tắt "còn món")
    if (!m) {
      if (isCup(line.categoryId)) issues.push(translate('errors.priceDetail.price', { name: lineName(line) }));
      continue; // món đã bị xoá khỏi thực đơn — không so được giá
    }
    if (isCup(m.categoryId) !== isCup(line.categoryId)) issues.push(translate('errors.priceDetail.price', { name: lineName(line) }));
    if ((m.updatedAt ?? 0) > order.createdAt) continue; // món đã đổi sau khi đặt — giá mới hợp lệ
    const expected = rebuildLine(line, m);
    if (!expected || expected.unitPrice !== line.unitPrice) issues.push(translate('errors.priceDetail.price', { name: lineName(line) }));
  }
  if (order.subtotal !== subtotal || order.itemCount !== count) issues.push(translate('errors.priceDetail.subtotal'));
  const expectedDiscount = order.loyaltyRedeem ? rewardDiscount(order.items) : 0;
  if (order.discount !== expectedDiscount || order.total !== order.subtotal + order.deliveryFee - order.discount)
    issues.push(translate('errors.priceDetail.total'));
  const fee = order.fulfillment === 'delivery' ? APP_CONFIG.fulfillment.delivery.fee : 0;
  if (order.deliveryFee !== fee) issues.push(translate('errors.priceDetail.fee'));
  if (issues.length)
    throw new RepoError(translate('errors.priceMismatch', { code: order.code, detail: issues[0] }), 'invalid_state');
}

/** Đơn chờ thanh toán đã quá hạn QR? */
export function isExpired(order: Order, now: number, since = order.createdAt): boolean {
  return order.status === 'pending_payment' && now - since > APP_CONFIG.payment.qrExpiryMinutes * 60_000;
}

/** Tìm đơn hôm nay theo mã ngắn. Nhiều đơn trùng mã → yêu cầu quét QR (không đoán). */
export function pickByShortCode(orders: Iterable<Order>, code: string, now: number): Order | undefined {
  const matches = [...orders].filter((o) => o.code === code && !o.isDemo && isSameDay(o.createdAt, now));
  if (matches.length > 1) throw new RepoError(translate('errors.duplicateCode', { count: matches.length, code }), 'validation');
  return matches[0];
}
