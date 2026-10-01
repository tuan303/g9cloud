import { Link } from 'react-router-dom';
import { Bike, ChevronRight, Gift, QrCode, RotateCcw, Store } from 'lucide-react';
import { StatusBadge } from '@/components/ui';
import { useT } from '@/i18n';
import { cn } from '@/lib/cn';
import { formatPrice, formatRelative, formatTime } from '@/lib/format';
import { lineName } from '@/lib/i18n-data';
import { isActiveOrder, STATUS_META } from '@/lib/order-status';
import type { Order } from '@/types';
import { OrderMiniProgress } from './OrderProgress';
import { STATUS_VISUAL } from './visuals';

/** Đường dẫn khi chạm vào đơn: chưa thanh toán → màn hình mã QR, còn lại → theo dõi đơn */
export const orderHref = (o: Pick<Order, 'id' | 'status'>) => (o.status === 'pending_payment' ? `/order/${o.id}/pay` : `/order/${o.id}`);

/**
 * Thẻ đơn hàng trong danh sách "Đơn hàng".
 * Cả thẻ bấm được (liên kết phủ toàn thẻ); nút "Đặt lại" nằm trên lớp liên kết.
 */
export function OrderCard({ order, now, onReorder }: { order: Order; now: number; onReorder?: (o: Order) => void }) {
  const { t } = useT();
  const v = STATUS_VISUAL[order.status];
  const Icon = v.icon;
  const active = isActiveOrder(order);
  const pending = order.status === 'pending_payment';
  const ready = order.status === 'ready';
  const cancelled = order.status === 'cancelled';
  const FIcon = order.fulfillment === 'delivery' ? Bike : Store;
  const fulfillmentText =
    order.fulfillment === 'delivery'
      ? t('orderStatus.info.deliverTo', { address: order.deliveryAddress || t('orderStatus.info.yourAddress') })
      : t('fulfillment.pickup');
  const names = order.items
    .slice(0, 2)
    .map((l) => (l.quantity > 1 ? `${l.quantity}× ${lineName(l)}` : lineName(l)))
    .join(', ');
  const more = order.items.length - 2;

  return (
    <article
      className={cn(
        'relative rounded-3xl p-4 transition active:scale-[.99]',
        'has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-gold',
        ready
          ? 'bg-white shadow-glow ring-2 ring-gold'
          : cancelled
            ? 'bg-white/70 ring-1 ring-bronze-200/50'
            : 'bg-white shadow-card ring-1 ring-bronze-200/50',
      )}
    >
      <div className="flex items-start gap-3">
        <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl', v.tile, cancelled && 'opacity-80')}>
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <Link
              to={orderHref(order)}
              aria-label={t('orders.card.aria', { code: order.code, status: STATUS_META[order.status].label, total: formatPrice(order.total) })}
              className="font-display text-base font-extrabold tracking-wide text-espresso outline-none after:absolute after:inset-0 after:rounded-3xl after:content-['']"
            >
              {order.code}
            </Link>
            <StatusBadge status={order.status} className="shrink-0" />
          </div>
          <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs tabular-nums text-stone">
            <span className="truncate">
              {formatRelative(order.createdAt, now)} · {formatTime(order.createdAt)}
            </span>
            {order.loyaltyRedeem && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gold-soft px-1.5 py-px text-[11px] font-semibold text-bronze-800">
                <Gift className="h-3 w-3" aria-hidden />
                {t('orders.card.freeCup')}
              </span>
            )}
          </p>
        </div>
      </div>

      <p className="mt-3 flex min-w-0 items-baseline gap-1.5 text-sm">
        <span className={cn('truncate font-medium', cancelled ? 'text-stone' : 'text-espresso')}>{names}</span>
        {more > 0 && <span className="shrink-0 text-stone">{t('orders.card.more', { count: more })}</span>}
      </p>

      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-1.5 text-xs text-stone">
          <FIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="truncate">{fulfillmentText}</span>
        </span>
        <div className="flex shrink-0 items-center gap-2">
          <span className={cn('font-display text-base font-bold tabular-nums', cancelled ? 'text-stone line-through decoration-stone-light' : 'text-espresso')}>
            {formatPrice(order.total)}
          </span>
          {!active && onReorder && (
            <button
              type="button"
              onClick={() => onReorder(order)}
              aria-label={t('orders.card.reorderAria', { code: order.code })}
              className="relative z-10 -my-2 -mr-1.5 inline-flex h-11 items-center gap-1.5 rounded-2xl px-3 text-sm font-semibold text-rattan transition hover:bg-rattan-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold active:scale-95"
            >
              <RotateCcw className="h-4 w-4" aria-hidden />
              {t('orders.card.reorder')}
            </button>
          )}
        </div>
      </div>

      {pending && (
        <div className="mt-3 flex items-center justify-between gap-2 rounded-2xl bg-leaf px-3.5 py-2.5 text-sm font-semibold text-white">
          <span className="flex items-center gap-2">
            <QrCode className="h-4 w-4" aria-hidden />
            {t('orders.card.openQr')}
          </span>
          <ChevronRight className="h-4 w-4" aria-hidden />
        </div>
      )}
      {ready && (
        <p className="mt-3 rounded-2xl bg-gold-soft px-3.5 py-2.5 text-sm font-semibold text-bronze-800">
          {t('orderStatus.hero.collect')} <span className="font-display font-extrabold text-espresso">{order.code}</span>
        </p>
      )}
      {active && !pending && <OrderMiniProgress order={order} className="mt-3.5" />}
    </article>
  );
}
