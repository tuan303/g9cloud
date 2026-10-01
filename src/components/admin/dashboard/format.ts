import { getLocale } from '@/i18n';
import { formatWeekdayLong } from '@/lib/format';

const pad = (n: number) => String(n).padStart(2, '0');

/** "Thứ Tư" / "Wednesday" — dùng chung bản theo ngôn ngữ trong lib/format */
export { formatWeekdayLong };

/** "Thứ Tư, 30/09/2026" / "Wednesday, 30/09/2026" */
export function formatLongDate(ts: number): string {
  const d = new Date(ts);
  return `${formatWeekdayLong(ts)}, ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** "2026-09-30" theo giờ địa phương (cho thuộc tính dateTime) */
export function isoLocalDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const pct = {
  vi: new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }),
  en: new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }),
};

/** 12.34 → "12%", 4.56 → "4,6%" (tiếng Anh "4.6%") — không dấu */
export function formatPercentAbs(value: number): string {
  const a = Math.abs(value);
  const f = pct[getLocale()];
  return `${a >= 10 ? f.format(Math.round(a)) : f.format(a)}%`;
}

/** 754_000 ms → "12:34" */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}
