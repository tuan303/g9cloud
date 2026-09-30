import { create } from 'zustand';
import { repo } from '@/services';
import type { MenuItem, Order } from '@/types';
import { useCart } from './cart';
import { toast } from './ui';
import { useSession } from './session';
import { isStaffActive, startStaffAuth, useStaffAuth } from './staff-auth';

interface DataState {
  menu: MenuItem[];
  orders: Order[];
  ready: boolean;
  /** Lỗi kết nối máy chủ gần nhất (null khi bình thường) */
  error: { message: string; code?: string } | null;
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
  refreshMenu: async () => {
    const menu = await repo.listMenu();
    set({ menu });
    // Giỏ hàng luôn theo giá/tuỳ chọn mới nhất của quán
    const cart = useCart.getState();
    if (cart.lines.length && cart.reprice(menu)) toast('Giá một số món trong giỏ vừa được quán cập nhật', 'info');
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

  await repo.whenReady?.();
  await Promise.all([refreshMenu(), refreshOrders()]);
  useDataStore.setState({ ready: true });
}
