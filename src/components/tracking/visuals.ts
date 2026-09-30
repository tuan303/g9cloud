import { Bell, Bike, ChefHat, CircleCheck, CircleX, Coffee, PartyPopper, QrCode, ShoppingBag, type LucideIcon } from 'lucide-react';
import type { NotificationKind, OrderStatus } from '@/types';

export interface StatusVisual {
  icon: LucideIcon;
  /** Vòng icon lớn trên nền tối (hero trạng thái) */
  hero: string;
  /** Vòng lan toả — chỉ các trạng thái đang diễn ra */
  pulse?: string;
  /** Ô icon nhỏ trên nền sáng (thẻ đơn hàng) */
  tile: string;
}

/** Icon + màu theo trạng thái đơn (theo bảng màu Golden hour) */
export const STATUS_VISUAL: Record<OrderStatus, StatusVisual> = {
  pending_payment: { icon: QrCode, hero: 'bg-gold text-espresso', pulse: 'bg-gold/60', tile: 'bg-gold-soft text-bronze-800' },
  received: { icon: CircleCheck, hero: 'bg-leaf text-white', pulse: 'bg-leaf-light/60', tile: 'bg-leaf-soft text-leaf-dark' },
  preparing: { icon: Coffee, hero: 'bg-rattan-light text-white', pulse: 'bg-rattan-light/60', tile: 'bg-rattan-soft text-rattan-dark' },
  ready: { icon: ShoppingBag, hero: 'bg-gold text-espresso', pulse: 'bg-gold/60', tile: 'bg-gold text-espresso' },
  delivering: { icon: Bike, hero: 'bg-leaf text-white', pulse: 'bg-leaf-light/60', tile: 'bg-leaf-soft text-leaf-dark' },
  completed: { icon: PartyPopper, hero: 'bg-gradient-to-br from-gold-light to-gold text-espresso', tile: 'bg-espresso text-gold' },
  cancelled: { icon: CircleX, hero: 'bg-espresso-700 text-cream/80 ring-1 ring-inset ring-white/15', tile: 'bg-stone-soft text-stone' },
};

/** Icon thông báo — khớp với banner trượt xuống (Toaster) để khách nhận ra ngay */
export const NOTIFICATION_VISUAL: Record<NotificationKind, { icon: LucideIcon; className: string }> = {
  order_received: { icon: CircleCheck, className: 'bg-leaf text-white' },
  order_preparing: { icon: ChefHat, className: 'bg-rattan text-white' },
  order_ready: { icon: ShoppingBag, className: 'bg-gold text-espresso' },
  order_delivering: { icon: Bike, className: 'bg-leaf text-white' },
  order_completed: { icon: PartyPopper, className: 'bg-espresso text-gold' },
  order_cancelled: { icon: CircleX, className: 'bg-stone text-white' },
  info: { icon: Bell, className: 'bg-bronze-600 text-cream' },
};
