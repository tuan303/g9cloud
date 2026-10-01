import { create } from 'zustand';
import { useLocale } from '@/i18n';
import { uid } from '@/lib/id';
import type { NotificationMsg } from '@/types';

export type ToastTone = 'default' | 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  tone: ToastTone;
}

/** Banner thông báo đẩy trong app (trượt xuống từ trên — dùng cho cập nhật trạng thái đơn) */
export interface Banner {
  id: string;
  title: string;
  body: string;
  /** Đường dẫn khi chạm vào banner */
  href?: string;
  icon?: 'received' | 'preparing' | 'ready' | 'delivering' | 'completed' | 'cancelled' | 'info';
  /** Khoá dịch — banner hiện theo ngôn ngữ đang chọn kể cả khi vừa đổi ngôn ngữ */
  msg?: NotificationMsg;
}

interface UiState {
  toasts: Toast[];
  banner: Banner | null;
  toast: (message: string, tone?: ToastTone) => void;
  dismissToast: (id: string) => void;
  showBanner: (b: Omit<Banner, 'id'>) => void;
  hideBanner: () => void;
}

export const useUi = create<UiState>((set, get) => ({
  toasts: [],
  banner: null,
  toast: (message, tone = 'default') => {
    const id = uid('t');
    set((s) => ({ toasts: [...s.toasts.slice(-2), { id, message, tone }] }));
    setTimeout(() => get().dismissToast(id), 2600);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  showBanner: (b) => {
    const id = uid('b');
    set({ banner: { ...b, id } });
    setTimeout(() => {
      if (get().banner?.id === id) set({ banner: null });
    }, 6000);
  },
  hideBanner: () => set({ banner: null }),
}));

// Toast là chữ đã dịch sẵn (sống 2,6 giây) → đổi ngôn ngữ thì bỏ các toast đang hiện thay vì để lẫn ngôn ngữ cũ
useLocale.subscribe((s, p) => {
  if (s.locale !== p.locale && useUi.getState().toasts.length) useUi.setState({ toasts: [] });
});

/** Gọi nhanh ngoài React: toast('Đã thêm vào giỏ', 'success') */
export const toast = (message: string, tone?: ToastTone) => useUi.getState().toast(message, tone);
