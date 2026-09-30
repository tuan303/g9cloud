import { Link } from 'react-router-dom';
import { Bike, ChefHat, ChevronRight, CircleCheck, QrCode, ShoppingBag, type LucideIcon } from 'lucide-react';
import { StatusBadge } from '@/components/ui';
import { cn } from '@/lib/cn';
import { STATUS_META, statusSteps } from '@/lib/order-status';
import type { Order, OrderStatus } from '@/types';

const ICON: Partial<Record<OrderStatus, { icon: LucideIcon; className: string }>> = {
  pending_payment: { icon: QrCode, className: 'bg-gold-soft text-bronze-800' },
  received: { icon: CircleCheck, className: 'bg-bronze-100 text-bronze-700' },
  preparing: { icon: ChefHat, className: 'bg-rattan-soft text-rattan-dark' },
  ready: { icon: ShoppingBag, className: 'bg-leaf-soft text-leaf-dark' },
  delivering: { icon: Bike, className: 'bg-leaf-soft text-leaf-dark' },
};

/** Thứ tự ưu tiên hiển thị: đơn cần khách hành động trước (thanh toán, ra quầy nhận) */
const PRIORITY: Partial<Record<OrderStatus, number>> = { pending_payment: 0, ready: 1, delivering: 2, preparing: 3, received: 4 };

export function pickHighlightedOrder(orders: Order[]): Order | undefined {
  return [...orders].sort((a, b) => (PRIORITY[a.status] ?? 9) - (PRIORITY[b.status] ?? 9) || b.createdAt - a.createdAt)[0];
}

/** Thẻ "đơn đang xử lý" gọn dưới hero: mã đơn, trạng thái, tiến trình, nút Xem */
export function ActiveOrderCard({ order, moreCount = 0, className }: { order: Order; moreCount?: number; className?: string }) {
  const pending = order.status === 'pending_payment';
  const href = pending ? `/order/${order.id}/pay` : `/order/${order.id}`;
  const meta = STATUS_META[order.status];
  const visual = ICON[order.status] ?? ICON.received!;
  const Icon = visual.icon;
  const steps = statusSteps(order.fulfillment);
  const stepIndex = steps.indexOf(order.status);

  return (
    <div className={className}>
      <Link
        to={href}
        className={cn(
          'flex items-center gap-3 rounded-3xl bg-white p-3 shadow-card ring-1 transition active:scale-[.99]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
          pending ? 'ring-gold/70' : 'ring-bronze-200/50',
        )}
      >
        <span className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl', visual.className)} aria-hidden>
          <Icon className="h-6 w-6" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-display text-[15px] font-bold tabular-nums text-espresso">
              <span className="sr-only">Đơn </span>
              {order.code}
            </span>
            <StatusBadge status={order.status} />
          </span>
          <span className="mt-1 block truncate text-xs text-stone">{meta.description}</span>
          <span className="mt-2 flex gap-1" aria-hidden>
            {steps.map((s, i) => (
              <span key={s} className={cn('h-1 flex-1 rounded-full', i <= stepIndex ? meta.dotClass : 'bg-bronze-100')} />
            ))}
          </span>
        </span>
        <span className="flex h-9 shrink-0 items-center gap-0.5 rounded-xl bg-espresso pl-3 pr-2 text-[13px] font-semibold text-cream">
          Xem
          <ChevronRight className="h-4 w-4" aria-hidden />
        </span>
      </Link>
      {moreCount > 0 && (
        <Link
          to="/orders"
          className="mt-1 flex min-h-[44px] items-center justify-center gap-1 text-[13px] font-semibold text-bronze-700 hover:text-espresso"
        >
          Còn {moreCount} đơn khác đang xử lý · Xem tất cả
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      )}
    </div>
  );
}
