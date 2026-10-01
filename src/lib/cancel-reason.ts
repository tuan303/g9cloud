import { translate, translateIn, type MessageKey } from '@/i18n';
import { expiredReason, isExpiryCancel } from '@/services/order-logic';
import type { Order } from '@/types';

/**
 * Lý do huỷ được lưu trong đơn bằng ngôn ngữ của NGƯỜI huỷ (thu ngân / khách).
 * Các hàm dưới đây nhận ra lý do có sẵn và dịch lại theo ngôn ngữ người XEM đang chọn.
 */

/** Lý do chọn nhanh khi quán huỷ đơn */
export const QUICK_CANCEL_REASONS: MessageKey[] = [
  'adminOrders.cancel.reasons.soldOut',
  'adminOrders.cancel.reasons.customerRequest',
  'adminOrders.cancel.reasons.unreachable',
];

const KNOWN_CANCEL_REASONS: MessageKey[] = [
  ...QUICK_CANCEL_REASONS,
  'errors.reasonCustomer',
  'errors.reasonStaff',
  'errors.reasonExpired',
];

/** Lý do mặc định ("Quán huỷ đơn" / "Khách huỷ đơn") — tiêu đề đã đủ nghĩa, không cần nhắc lại */
const DEFAULT_REASONS: MessageKey[] = ['errors.reasonStaff', 'errors.reasonCustomer'];

const matches = (key: MessageKey, reason: string) => translateIn('vi', key) === reason || translateIn('en', key) === reason;

/** Dịch một lý do đã lưu (giữ nguyên nếu là lý do tự nhập) */
export function translateCancelReason(raw: string): string {
  const reason = raw.trim();
  const key = KNOWN_CANCEL_REASONS.find((k) => matches(k, reason));
  return key ? translate(key) : reason;
}

export const isDefaultCancelReason = (raw: string | undefined) => !!raw && DEFAULT_REASONS.some((k) => matches(k, raw.trim()));

/** Lý do huỷ để hiển thị (dịch nếu là lý do có sẵn, giữ nguyên nếu tự nhập); undefined nếu không ghi */
export function cancelReasonText(order: Pick<Order, 'status' | 'statusHistory' | 'cancelReason'>): string | undefined {
  if (isExpiryCancel(order)) return expiredReason();
  const reason = order.cancelReason?.trim();
  return reason ? translateCancelReason(reason) : undefined;
}

/** Như cancelReasonText nhưng bỏ lý do mặc định — dùng cho màn hình của khách */
export function customerCancelReason(order: Pick<Order, 'status' | 'statusHistory' | 'cancelReason'>): string | undefined {
  if (isExpiryCancel(order) || isDefaultCancelReason(order.cancelReason)) return undefined;
  return cancelReasonText(order);
}
