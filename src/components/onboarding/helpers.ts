import { APP_CONFIG } from '@/config/app';
import { translate, type MessageKey } from '@/i18n';
import { normalizePhone } from '@/lib/format';

/**
 * Tên lưu trong phiên khi khách không nhập tên — là GIÁ TRỊ DỮ LIỆU (so sánh với phiên đã lưu, CartPage…),
 * không đổi theo ngôn ngữ. Hiển thị thì dùng guestDisplayName().
 */
export const GUEST_NAME = 'Khách';

/** Tên hiển thị: khách chưa có tên → "Khách" / "Guest" theo ngôn ngữ đang chọn */
export function guestDisplayName(name: string | undefined): string {
  const n = (name ?? '').trim();
  return !n || n === GUEST_NAME ? translate('onboarding.guestName') : n;
}

/** Phiên bản hiển thị ở chân trang Tài khoản (khớp package.json) */
export const APP_VERSION = APP_CONFIG.version;

/** "0912345678" → "0912 345 678" (giữ nguyên nếu không đúng dạng 10 số) */
export function formatPhoneDisplay(phone: string): string {
  const p = normalizePhone(phone);
  return /^0\d{9}$/.test(p) ? `${p.slice(0, 4)} ${p.slice(4, 7)} ${p.slice(7)}` : phone;
}

/** Tên gọi thân mật: "Nguyễn Minh An" → "An"; khách chưa có tên → "bạn" / "friend" */
export function callName(name: string | undefined): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length || name?.trim() === GUEST_NAME) return translate('onboarding.callNameFallback');
  return parts[parts.length - 1];
}

/** Khoá lời chào theo giờ trong ngày */
export function greetingKey(hour: number): MessageKey {
  if (hour < 11) return 'onboarding.hero.morning';
  if (hour < 13) return 'onboarding.hero.noon';
  if (hour < 18) return 'onboarding.hero.afternoon';
  return 'onboarding.hero.evening';
}

/** Lời chào theo giờ trong ngày (theo ngôn ngữ đang chọn) */
export function greetingFor(hour: number): string {
  return translate(greetingKey(hour));
}

/** Đưa con trỏ tới ô đầu tiên đang báo lỗi (sau khi React vẽ lại) */
export function focusFirstInvalid(root: HTMLElement | null) {
  requestAnimationFrame(() => root?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
}

/** Đường dẫn quay lại sau đăng nhập — chỉ nhận đường dẫn nội bộ, tránh vòng lặp về /welcome */
export function redirectTarget(state: unknown): string {
  const from = (state as { from?: unknown } | null)?.from;
  if (typeof from !== 'string' || !from.startsWith('/') || from.startsWith('//') || from.startsWith('/welcome')) return '/';
  return from;
}
