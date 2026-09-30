import { APP_CONFIG } from '@/config/app';
import { normalizePhone } from '@/lib/format';

/** Tên hiển thị mặc định khi khách không nhập tên */
export const GUEST_NAME = 'Khách';

/** Phiên bản hiển thị ở chân trang Tài khoản (khớp package.json) */
export const APP_VERSION = APP_CONFIG.version;

/** "0912345678" → "0912 345 678" (giữ nguyên nếu không đúng dạng 10 số) */
export function formatPhoneDisplay(phone: string): string {
  const p = normalizePhone(phone);
  return /^0\d{9}$/.test(p) ? `${p.slice(0, 4)} ${p.slice(4, 7)} ${p.slice(7)}` : phone;
}

/** Tên gọi thân mật: "Nguyễn Minh An" → "An"; khách chưa có tên → "bạn" */
export function callName(name: string | undefined): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length || name?.trim() === GUEST_NAME) return 'bạn';
  return parts[parts.length - 1];
}

/** Lời chào theo giờ trong ngày */
export function greetingFor(hour: number): string {
  if (hour < 11) return 'Chào buổi sáng';
  if (hour < 13) return 'Chào buổi trưa';
  if (hour < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
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
