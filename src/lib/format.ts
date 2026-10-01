import { getLocale, translate } from '@/i18n';

const vnd = { vi: new Intl.NumberFormat('vi-VN'), en: new Intl.NumberFormat('en-US') };

/** 35000 → "35.000đ" (tiếng Anh: "35,000đ") */
export function formatPrice(value: number): string {
  return `${vnd[getLocale()].format(Math.round(value))}đ`;
}

/** 1250000 → "1,25tr" (tiếng Anh "1.25M") — dùng cho trục biểu đồ / KPI gọn */
export function formatCompactPrice(value: number): string {
  const en = getLocale() === 'en';
  if (value >= 999_500) {
    const m = value / 1_000_000;
    // ≥ 10tr: số nguyên; < 10tr: tối đa 2 chữ số thập phân, bỏ số 0 thừa SAU dấu phẩy
    const text = m >= 10 ? String(Math.round(m)) : m.toFixed(2).replace(/\.?0+$/, '');
    return en ? `${text}M` : `${text.replace('.', ',')}tr`;
  }
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return `${value}`;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** "14:05" */
export function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** "30/09" */
export function formatDayMonth(ts: number): string {
  const d = new Date(ts);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
}

/** "14:05 · 30/09/2026" */
export function formatDateTime(ts: number): string {
  const d = new Date(ts);
  return `${formatTime(ts)} · ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** "T2" / "Mon" */
export function formatWeekday(ts: number): string {
  return translate('time.weekdaysShort').split(',')[new Date(ts).getDay()];
}

/** "Thứ Hai" / "Monday" */
export function formatWeekdayLong(ts: number): string {
  return translate('time.weekdaysLong').split(',')[new Date(ts).getDay()];
}

/** "vừa xong", "5 phút trước", "2 giờ trước", "hôm qua", "30/09" (theo ngôn ngữ đang chọn) */
export function formatRelative(ts: number, now = Date.now()): string {
  const diff = Math.max(0, now - ts);
  const min = Math.floor(diff / 60000);
  if (min < 1) return translate('time.justNow');
  if (min < 60) return translate('time.minutesAgo', { count: min });
  const h = Math.floor(min / 60);
  if (h < 24 && isSameDay(ts, now)) return translate('time.hoursAgo', { count: h });
  if (isSameDay(ts, now - 86400000)) return translate('time.yesterday');
  return formatDayMonth(ts);
}

export function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function isSameDay(a: number, b: number): boolean {
  return startOfDay(a) === startOfDay(b);
}

/** Chuẩn hoá số điện thoại VN: bỏ khoảng trắng, +84 → 0 */
export function normalizePhone(input: string): string {
  let s = input.replace(/[\s.-]/g, '');
  if (s.startsWith('+84')) s = '0' + s.slice(3);
  else if (s.startsWith('84') && s.length === 11) s = '0' + s.slice(2);
  return s;
}

export function isValidVnPhone(input: string): boolean {
  return /^0(3|5|7|8|9)\d{8}$/.test(normalizePhone(input));
}

export function isValidEmail(input: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.trim());
}

/** "Nguyễn Văn An" → "NA" */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
