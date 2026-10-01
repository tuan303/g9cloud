import { create } from 'zustand';
import { repo } from '@/services';
import type { LoyaltyAccount, MenuItem, NotificationMsg, Order } from '@/types';
import { APP_CONFIG } from '@/config/app';
import { translate } from '@/i18n';
import { platform } from '@/platform';
import { useNotifications } from './notifications';
import { useUi } from './ui';
import { useCart } from './cart';
import { toast } from './ui';
import { useSession } from './session';
import { BACKEND } from '@/config/firebase';
import { isStaffActive, startStaffAuth, useStaffAuth } from './staff-auth';

interface DataState {
  menu: MenuItem[];
  orders: Order[];
  ready: boolean;
  /** Lỗi kết nối máy chủ gần nhất (null khi bình thường) */
  error: { message: string; code?: string } | null;
  /** Thẻ tích điểm của khách đang đăng nhập (null: khách vãng lai / chưa có) */
  loyalty: LoyaltyAccount | null;
  refreshMenu: () => Promise<void>;
  refreshOrders: () => Promise<void>;
}

/**
 * Bộ nhớ đệm dữ liệu dùng chung cho toàn app (menu + đơn hàng), tự cập nhật khi repo phát sự kiện.
 * Component đọc qua hook: useDataStore((s) => s.menu) hoặc các hook tiện ích trong src/hooks/.
 */
export const useDataStore = create<DataState>((set) => ({
  menu: [],
  orders: [],
  ready: false,
  error: null,
  loyalty: null,
  refreshMenu: async () => {
    const menu = await repo.listMenu();
    set({ menu });
    // Giỏ hàng luôn theo giá/tuỳ chọn mới nhất của quán
    const cart = useCart.getState();
    if (cart.lines.length && cart.reprice(menu)) toast(translate('errors.pricesUpdated'), 'info');
  },
  refreshOrders: async () => set({ orders: await repo.listOrders() }),
}));

let started = false;
/** Gọi một lần khi khởi động app (main.tsx) */
export async function startDataSync() {
  if (started) return;
  started = true;
  const { refreshMenu, refreshOrders } = useDataStore.getState();
  // Đăng ký trước khi tải lần đầu để không lỡ thay đổi xảy ra trong lúc tải
  repo.subscribe((e) => {
    if (e.type === 'error') {
      useDataStore.setState({ error: { message: e.message, code: e.code } });
      return;
    }
    if (e.type === 'recovered') {
      useDataStore.setState({ error: null });
      return;
    }
    if (e.type === 'menu') void refreshMenu();
    else void refreshOrders();
  });

  // Báo cho repo biết ai đang xem (khách nào / có phải nhân viên) để tải đúng phần dữ liệu
  const applyViewer = () => repo.setViewer?.({ customerId: useSession.getState().user?.id, staff: isStaffActive() });
  applyViewer();
  useSession.subscribe(applyViewer);
  useStaffAuth.subscribe(applyViewer);
  void startStaffAuth();
  if (BACKEND === 'firebase') {
    // Bỏ dở đăng nhập Microsoft (đóng tab giữa chừng...) → quay về phiên khách mới
    void import('@/services/firebase')
      .then((m) => m.reconcileCustomerAuth(useSession.getState().user))
      .then((r) => {
        if (r !== 'stale-app-session') return;
        useSession.getState().logout();
        toast(translate('errors.sessionExpired'), 'info');
      })
      .catch(() => undefined);
  }

  startLoyaltySync();

  await repo.whenReady?.();
  await Promise.all([refreshMenu(), refreshOrders()]);
  useDataStore.setState({ ready: true });
}

/**
 * Theo dõi thẻ tích điểm của khách đang đăng nhập (không phải khách vãng lai).
 * Khi vừa đủ cốc miễn phí → thông báo trong app + banner.
 */
function startLoyaltySync() {
  if (!APP_CONFIG.loyalty.enabled) return;
  let unwatch: (() => void) | null = null;
  let watchingId: string | null = null;
  const per = APP_CONFIG.loyalty.cupsPerReward;
  const apply = () => {
    const user = useSession.getState().user;
    const id = user && !user.isGuest ? user.id : null;
    if (id === watchingId) return;
    unwatch?.();
    unwatch = null;
    watchingId = id;
    useDataStore.setState({ loyalty: null });
    if (!id) return;
    let first = true;
    unwatch = repo.watchLoyalty(id, (account) => {
      const prev = useDataStore.getState().loyalty;
      useDataStore.setState({ loyalty: account });
      // Số cốc có thể âm (hoàn đơn đã dùng để đổi thưởng) → so theo giá trị hiển thị, tránh báo thưởng sai khi -3 → 0
      const before = Math.floor(Math.max(0, prev?.stamps ?? 0) / per);
      const after = Math.floor(Math.max(0, account?.stamps ?? 0) / per);
      // Không báo trên trang quản trị (bản demo dùng chung phiên với khách trên cùng máy)
      if (!first && after > before && !window.location.hash.startsWith('#/admin')) {
        const msg: NotificationMsg = { title: 'notify.reward.title', body: 'notify.reward.body', vars: { cups: per } };
        const title = translate(msg.title);
        const body = translate(msg.body, msg.vars);
        useNotifications.getState().push({ kind: 'info', title, body, msg });
        useUi.getState().showBanner({ title, body, msg, href: '/account', icon: 'completed' });
        platform.vibrate([60, 40, 60]);
      }
      first = false;
    });
  };
  apply();
  useSession.subscribe(apply);
}
