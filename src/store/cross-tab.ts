import { useCart } from './cart';
import { useNotifications } from './notifications';
import { useSession } from './session';

/**
 * Khi mở app ở nhiều tab (VD tab khách + tab quản trị), mỗi tab giữ trạng thái riêng trong RAM.
 * Nạp lại từ bộ nhớ khi tab khác ghi — tránh tab này ghi đè phiên / giỏ hàng của tab kia.
 */
export function startCrossTabSync() {
  if (typeof window === 'undefined') return;
  const stores = {
    'c9.session.v1': useSession,
    'c9.cart.v1': useCart,
    'c9.notifications.v1': useNotifications,
  } as const;
  window.addEventListener('storage', (e) => {
    if (e.key && e.key in stores) void stores[e.key as keyof typeof stores].persist.rehydrate();
  });
}
