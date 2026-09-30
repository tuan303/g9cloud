const WEEKDAY_FULL = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const pad = (n: number) => String(n).padStart(2, '0');

/** "Thứ Tư" */
export function formatWeekdayLong(ts: number): string {
  return WEEKDAY_FULL[new Date(ts).getDay()];
}

/** "Thứ Tư, 30/09/2026" */
export function formatLongDate(ts: number): string {
  const d = new Date(ts);
  return `${formatWeekdayLong(ts)}, ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** "2026-09-30" theo giờ địa phương (cho thuộc tính dateTime) */
export function isoLocalDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const pct = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 });

/** 12.34 → "12%", 4.56 → "4,6%" (không dấu) */
export function formatPercentAbs(value: number): string {
  const a = Math.abs(value);
  return `${a >= 10 ? pct.format(Math.round(a)) : pct.format(a)}%`;
}

/** 754_000 ms → "12:34" */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}
