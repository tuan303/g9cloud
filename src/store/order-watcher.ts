import { repo } from '@/services';
import { notificationFor } from '@/lib/order-status';
import { platform } from '@/platform';
import { useNotifications } from './notifications';
import { useSession } from './session';
import { useUi } from './ui';

let started = false;

/**
 * Theo dõi thay đổi trạng thái đơn của khách đang đăng nhập → tạo thông báo trong app,
 * hiện banner trượt xuống và (nếu được phép) gửi thông báo hệ thống / rung.
 * Trên Zalo Mini App production, thông báo khi app đóng cần gửi qua ZNS/OA từ máy chủ.
 */
export function startOrderWatcher() {
  if (started) return;
  started = true;
  repo.subscribe((e) => {
    if (e.type !== 'order') return;
    const { order, previous } = e;
    // Màn hình quản trị không hiện thông báo của khách (khi demo trên cùng trình duyệt, 2 tab dùng chung phiên)
    if (window.location.hash.startsWith('#/admin')) return;
    const user = useSession.getState().user;
    if (!user || order.customer.id !== user.id) return;
    if (!previous || previous.status === order.status) return;
    // Thay đổi do chính khách thực hiện (tự huỷ đơn) → không cần báo lại
    if (order.statusHistory[order.statusHistory.length - 1]?.by === 'customer') return;
    const n = notificationFor(order);
    if (!n) return;
    useNotifications.getState().push({ kind: n.kind, title: n.title, body: n.body, orderId: order.id });
    const iconMap = {
      order_received: 'received',
      order_preparing: 'preparing',
      order_ready: 'ready',
      order_delivering: 'delivering',
      order_completed: 'completed',
      order_cancelled: 'cancelled',
      info: 'info',
    } as const;
    useUi.getState().showBanner({ title: n.title, body: n.body, href: `/order/${order.id}`, icon: iconMap[n.kind] });
    platform.vibrate([60, 40, 60]);
    if (n.kind === 'order_ready' || n.kind === 'order_delivering' || n.kind === 'order_received') {
      void platform.systemNotify(n.title, n.body);
    }
  });
}
