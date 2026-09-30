import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistStorage } from './persist-storage';
import type { CustomerInfo, FulfillmentType } from '@/types';
import { uid } from '@/lib/id';
import { useNotifications } from './notifications';
import { BACKEND } from '@/config/firebase';

interface SessionState {
  user: CustomerInfo | null;
  fulfillment: FulfillmentType;
  deliveryAddress: string;
  /** Mở khoá trang quản trị bằng PIN (chỉ trong phiên demo) */
  adminUnlocked: boolean;
  /** Người dùng gần nhất trên thiết bị — để biết khi nào cần xoá thông báo cũ */
  lastUserId?: string;

  login: (info: Omit<CustomerInfo, 'id'> & { id?: string }) => CustomerInfo;
  updateProfile: (patch: Partial<Omit<CustomerInfo, 'id' | 'authProvider'>>) => void;
  logout: () => void;
  setFulfillment: (f: FulfillmentType, address?: string) => void;
  setDeliveryAddress: (address: string) => void;
  unlockAdmin: () => void;
  lockAdmin: () => void;
}

export const useSession = create<SessionState>()(
  persist(
    (set, get) => ({
      user: null,
      fulfillment: 'pickup',
      deliveryAddress: '',
      adminUnlocked: false,

      login: (info) => {
        const user: CustomerInfo = { ...info, id: info.id ?? uid(info.isGuest ? 'guest' : 'user') };
        // Thiết bị dùng chung: người khác đăng nhập thì không thấy thông báo của người trước
        const lastUserId = get().lastUserId;
        if (lastUserId && lastUserId !== user.id) useNotifications.getState().clear();
        set({ user, lastUserId: user.id });
        return user;
      },
      updateProfile: (patch) => {
        const u = get().user;
        if (u) set({ user: { ...u, ...patch } });
      },
      logout: () => {
        set({ user: null });
        // Máy dùng chung: đổi sang phiên Firebase khách mới (thoát Microsoft 365 nếu có) —
        // người sau không xem được đơn của người trước
        if (BACKEND === 'firebase') void import('@/services/firebase').then((m) => m.signOutCustomer()).catch(() => undefined);
      },
      setFulfillment: (fulfillment, address) =>
        set((s) => ({ fulfillment, deliveryAddress: address ?? s.deliveryAddress })),
      setDeliveryAddress: (deliveryAddress) => set({ deliveryAddress }),
      unlockAdmin: () => set({ adminUnlocked: true }),
      lockAdmin: () => set({ adminUnlocked: false }),
    }),
    { name: 'c9.session.v1', storage: persistStorage },
  ),
);
