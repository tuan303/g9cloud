import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useT } from '@/i18n';
import { cn } from '@/lib/cn';
import { STATUS_META } from '@/lib/order-status';
import { Card } from '@/components/ui';
import type { OrderStatus } from '@/types';

/** "Đơn đang xử lý": số đơn theo từng bước pha chế — chạm để mở danh sách đơn hàng */
export function ActiveOrdersCard({ counts, className }: { counts: Record<OrderStatus, number>; className?: string }) {
  const { t } = useT();
  const groups = [
    { key: 'received', label: STATUS_META.received.label, count: counts.received, dot: STATUS_META.received.dotClass },
    { key: 'preparing', label: STATUS_META.preparing.label, count: counts.preparing, dot: STATUS_META.preparing.dotClass },
    { key: 'ready', label: `${STATUS_META.ready.label} / ${STATUS_META.delivering.label}`, count: counts.ready + counts.delivering, dot: STATUS_META.ready.dotClass },
  ];
  const total = groups.reduce((s, g) => s + g.count, 0);

  return (
    <Card className={cn('p-4 md:p-5', className)}>
      <section aria-labelledby="active-orders-title">
        <header className="mb-3 flex items-center justify-between gap-3">
          <h2 id="active-orders-title" className="font-display text-[15px] font-bold tracking-tight text-espresso">
            {t('adminDashboard.active.title')}
          </h2>
          <Link
            to="/admin/orders"
            className="-mr-2 inline-flex h-11 items-center gap-0.5 rounded-xl px-2 text-xs font-semibold text-bronze-700 hover:text-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            {total ? t('adminDashboard.active.count', { count: total }) : t('nav.adminOrders')}
            <ChevronRight aria-hidden className="h-4 w-4" />
          </Link>
        </header>
        <ul className="grid grid-cols-3 gap-2 xl:grid-cols-1">
          {groups.map((g) => (
            <li key={g.key}>
              <Link
                to="/admin/orders"
                aria-label={t('adminDashboard.active.groupAria', { label: g.label, count: g.count })}
                className={cn(
                  'flex h-full min-h-[88px] flex-col justify-between gap-2 rounded-2xl p-3 ring-1 ring-inset transition active:scale-[.98]',
                  'xl:min-h-[52px] xl:flex-row xl:items-center xl:px-3.5 xl:py-2',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
                  g.count ? 'bg-cream ring-bronze-200 hover:ring-bronze-300' : 'bg-white ring-bronze-100',
                )}
              >
                <span className="flex items-start gap-1.5 text-[11px] font-semibold leading-tight text-bronze-700">
                  <span aria-hidden className={cn('mt-[3px] h-2 w-2 shrink-0 rounded-full', g.dot, !g.count && 'opacity-40')} />
                  {g.label}
                </span>
                <span className={cn('font-display text-2xl font-extrabold leading-none tabular-nums xl:text-xl', g.count ? 'text-espresso' : 'text-stone-light')}>
                  {g.count}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {!total && <p className="mt-3 text-xs text-stone">{t('adminDashboard.active.empty')}</p>}
      </section>
    </Card>
  );
}
