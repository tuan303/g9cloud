/**
 * Nội dung mã QR đơn hàng mà thu ngân quét tại POS.
 * Định dạng: "C9ORDER:<orderId>:<code>" — đủ để POS/ứng dụng quản trị tra cứu đơn.
 */
const PREFIX = 'C9ORDER';

export function buildOrderQrPayload(order: { id: string; code: string }): string {
  return `${PREFIX}:${order.id}:${order.code}`;
}

/** Đọc payload quét được. Chấp nhận cả payload đầy đủ lẫn mã ngắn gõ tay ("C9-027", "027", "27"). */
export function parseOrderQrPayload(raw: string): { orderId?: string; code?: string } {
  const text = raw.trim();
  if (text.startsWith(`${PREFIX}:`)) {
    const [, orderId, code] = text.split(':');
    return { orderId, code };
  }
  const m = text.toUpperCase().match(/^(?:C9-?)?(\d{1,4})$/);
  if (m) return { code: `C9-${m[1].padStart(3, '0')}` };
  return {};
}
