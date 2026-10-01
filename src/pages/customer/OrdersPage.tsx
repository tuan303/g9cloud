import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Coffee, ReceiptText } from 'lucide-react';
import { Button, EmptyState, Segmented, Skeleton } from '@/components/ui';
import { LiveIndicator, OrderCard, TabPageHeader, useReorder } from '@/components/tracking';
import { useDataReady, useMyActiveOrders, useMyOrders } from '@/hooks/data';
import { useNow } from '@/hooks/useNow';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useT } from '@/i18n';
import { formatDayMonth, formatWeekdayLong, isSameDay, startOfDay } from '@/lib/format';
import { isActiveOrder } from '@/lib/order-status';
import type { Order } from '@/types';

type Tab = 'active' | 'history';
type T = ReturnType<typeof useT>['t'];

function dayLabel(ts: number, now: number, t: T): string {
  if (isSameDay(ts, now)) return t('orders.today');
  if (isSameDay(ts, now - 86_400_000)) return t('orders.yesterday');
  return t('orders.dayLabel', { weekday: formatWeekdayLong(ts), date: formatDayMonth(ts) });
}

/** Gom đơn theo ngày (danh sách đã sắp mới nhất trước) */
function groupByDay(orders: Order[], now: number, t: T) {
  const groups: { key: number; label: string; orders: Order[] }[] = [];
  for (const o of orders) {
    const key = startOfDay(o.createdAt);
    let g = groups[groups.length - 1];
    if (!g || g.key !== key) {
      g = { key, label: dayLabel(o.createdAt, now, t), orders: [] };
      groups.push(g);
    }
    g.orders.push(o);
  }
  return groups;
}

function ListSkeleton() {
  const { t } = useT();
  return (
    <div className="space-y-3" aria-busy="true" aria-label={t('orders.loading')}>
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-3xl bg-white p-4 shadow-card ring-1 ring-bronze-200/50">
          <div className="flex items-center gap-3">
            <Skeleton className="h-11 w-11" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24 rounded-lg" />
              <Skeleton className="h-3 w-32 rounded-lg" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="mt-4 h-4 w-3/4 rounded-lg" />
          <Skeleton className="mt-3 h-1.5 w-full rounded-full" />
        </div>
      ))}
    </div>
  );
}

export default function OrdersPage() {
  const { t } = useT();
  usePageTitle(t('nav.orders'));
  const navigate = useNavigate();
  const ready = useDataReady();
  const mine = useMyOrders();
  const active = useMyActiveOrders();
  const history = useMemo(() => mine.filter((o) => !isActiveOrder(o)), [mine]);
  const reorder = useReorder();
  const now = useNow(30_000);

  // Tab lưu trên URL để quay lại từ chi tiết đơn vẫn giữ đúng tab
  const [params, setParams] = useSearchParams();
  const param = params.get('tab');
  const tab: Tab = param === 'active' || param === 'history' ? param : active.length || !history.length ? 'active' : 'history';
  const setTab = (t: Tab) => setParams({ tab: t }, { replace: true });

  const groups = useMemo(() => groupByDay(history, now, t), [history, now, t]);
  const goMenu = () => navigate('/');

  return (
    <div className="min-h-full">
      <TabPageHeader
        title={t('nav.orders')}
        subtitle={active.length ? t('orders.subtitleActive', { count: active.length }) : t('orders.subtitle')}
      >
        <Segmented<Tab>
          ariaLabel={t('orders.filterAria')}
          value={tab}
          onChange={setTab}
          options={[
            { value: 'active', label: t('orders.tabActive'), badge: active.length },
            {
              value: 'history',
              label: (
                <>
                  {t('orders.tabHistory')}
                  {history.length > 0 && <span className="font-display tabular-nums opacity-70">{history.length}</span>}
                </>
              ),
            },
          ]}
        />
      </TabPageHeader>

      <div role="tabpanel" aria-label={t(tab === 'active' ? 'orders.panelActive' : 'orders.panelHistory')} className="px-4 pt-4">
        {!ready ? (
          <ListSkeleton />
        ) : tab === 'active' ? (
          active.length ? (
            <div className="space-y-3">
              {active.map((o) => (
                <OrderCard key={o.id} order={o} now={now} />
              ))}
              <div className="flex flex-col items-center gap-2 pt-3 text-center">
                <LiveIndicator />
                <p className="max-w-[17rem] text-xs leading-relaxed text-stone">{t('orders.liveHint')}</p>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={<Coffee className="h-9 w-9" />}
              title={t('orders.emptyActive.title')}
              description={t('orders.emptyActive.description')}
              action={<Button onClick={goMenu}>{t('orders.emptyActive.cta')}</Button>}
            />
          )
        ) : history.length ? (
          <div className="space-y-5">
            {groups.map((g) => (
              <section key={g.key} aria-label={g.label}>
                <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-[0.14em] text-bronze-600">{g.label}</h2>
                <div className="space-y-3">
                  {g.orders.map((o) => (
                    <OrderCard key={o.id} order={o} now={now} onReorder={reorder} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<ReceiptText className="h-9 w-9" />}
            title={t('orders.emptyHistory.title')}
            description={t('orders.emptyHistory.description')}
            action={<Button onClick={goMenu}>{t('orders.emptyHistory.cta')}</Button>}
          />
        )}
      </div>
    </div>
  );
}
