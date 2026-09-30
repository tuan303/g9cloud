import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistStorage } from './persist-storage';
import type { AppNotification } from '@/types';
import { uid } from '@/lib/id';

interface NotificationState {
  items: AppNotification[];
  push: (n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => AppNotification;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clear: () => void;
}

export const useNotifications = create<NotificationState>()(
  persist(
    (set) => ({
      items: [],
      push: (n) => {
        const item: AppNotification = { ...n, id: uid('ntf'), createdAt: Date.now(), read: false };
        set((s) => ({ items: [item, ...s.items].slice(0, 100) }));
        return item;
      },
      markRead: (id) => set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, read: true } : i)) })),
      markAllRead: () => set((s) => ({ items: s.items.map((i) => ({ ...i, read: true })) })),
      clear: () => set({ items: [] }),
    }),
    { name: 'c9.notifications.v1', storage: persistStorage },
  ),
);

export const selectUnreadCount = (s: NotificationState) => s.items.filter((i) => !i.read).length;
