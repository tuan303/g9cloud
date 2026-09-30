/**
 * Tạo chuỗi VietQR (chuẩn EMVCo / NAPAS 247) có sẵn số tiền & nội dung chuyển khoản.
 * Chỉ dùng khi APP_CONFIG.payment.vietqr được cấu hình.
 */

function tlv(id: string, value: string): string {
  return `${id}${String(value.length).padStart(2, '0')}${value}`;
}

/** CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF) theo EMVCo */
export function crc16ccitt(input: string): string {
  let crc = 0xffff;
  for (let i = 0; i < input.length; i++) {
    crc ^= input.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/** Bỏ dấu tiếng Việt & ký tự đặc biệt — nội dung chuyển khoản nên là ASCII */
export function toTransferMemo(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 25);
}

export function buildVietQrPayload(opts: { bankBin: string; accountNo: string; amount?: number; memo?: string }): string {
  const beneficiary = tlv('00', opts.bankBin) + tlv('01', opts.accountNo);
  const merchantInfo = tlv('00', 'A000000727') + tlv('01', beneficiary) + tlv('02', 'QRIBFTTA');
  let payload =
    tlv('00', '01') +
    tlv('01', opts.amount ? '12' : '11') +
    tlv('38', merchantInfo) +
    tlv('53', '704') +
    (opts.amount ? tlv('54', String(Math.round(opts.amount))) : '') +
    tlv('58', 'VN');
  if (opts.memo) payload += tlv('62', tlv('08', toTransferMemo(opts.memo)));
  payload += '6304';
  return payload + crc16ccitt(payload);
}
