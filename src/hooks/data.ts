import { useMemo } from 'react';
import { useDataStore } from '@/store/data';
import { useSession } from '@/store/session';
import { isActiveOrder } from '@/lib/order-status';
import type { CategoryId } from '@/types';

export const useMenu = () => useDataStore((s) => s.menu);
export const useOrders = () => useDataStore((s) => s.orders);
export const useDataReady = () => useDataStore((s) => s.ready);

export function useMenuByCategory(categoryId: CategoryId) {
  const menu = useMenu();
  return useMemo(() => menu.filter((m) => m.categoryId === categoryId), [menu, categoryId]);
}

export function useOrder(id: string | undefined) {
  return useDataStore((s) => (id ? s.orders.find((o) => o.id === id) : undefined));
}

/** Đơn của khách đang đăng nhập (mới nhất trước) */
export function useMyOrders() {
  const orders = useOrders();
  const userId = useSession((s) => s.user?.id);
  return useMemo(() => (userId ? orders.filter((o) => o.customer.id === userId) : []), [orders, userId]);
}

export function useMyActiveOrders() {
  const mine = useMyOrders();
  return useMemo(() => mine.filter(isActiveOrder), [mine]);
}
