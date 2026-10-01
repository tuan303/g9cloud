import { useMemo, useState } from 'react';
import { ChartColumn, ChartPie, Clock, Trophy } from 'lucide-react';
import { useT } from '@/i18n';
import { cn } from '@/lib/cn';
import { formatCompactPrice, formatDayMonth, formatPrice, formatWeekdayLong } from '@/lib/format';
import { categoryName, lineName } from '@/lib/i18n-data';
import { addDays, ordersByHour, revenueByCategory, topItems, type DayRevenue } from '@/lib/stats';
import { MenuImage } from '@/components/ui';
import { BarChart, DonutChart, HorizontalBars, type DonutSlice } from '@/components/admin/charts';
import type { CategoryId, Order } from '@/types';
import { ChartCard } from './ChartCard';
import { Rich } from './Rich';

/** Màu danh mục trên biểu đồ tròn — theo bảng màu quán */
const CATEGORY_COLORS: Record<CategoryId, { stroke: string; dot: string }> = {
  coffee: { stroke: 'stroke-espresso-700', dot: 'bg-espresso-700' },
  drinks: { stroke: 'stroke-gold', dot: 'bg-gold' },
  desserts: { stroke: 'stroke-rattan', dot: 'bg-rattan' },
};

/** Phần "Thống kê": doanh thu 7 ngày, cơ cấu danh mục, món bán chạy, lượng đơn theo giờ */
export function StatsSection({ orders, week, now, className }: { orders: Order[]; week: DayRevenue[]; now: number; className?: string }) {
  const { t } = useT();
  const todayStart = week[week.length - 1]?.dayStart ?? now;
  const since = week[0]?.dayStart ?? addDays(todayStart, -6);

  const categories = useMemo(() => revenueByCategory(orders, since), [orders, since]);
  const top = useMemo(() => topItems(orders, since, 5), [orders, since]);
  const hours = useMemo(() => ordersByHour(orders, todayStart), [orders, todayStart]);

  const [picked, setPicked] = useState<number | null>(null);
  const selected = picked !== null && picked < week.length ? picked : week.length - 1;
  const selDay = week[selected];
  const weekTotal = week.reduce((s, d) => s + d.revenue, 0);
  const weekOrders = week.reduce((s, d) => s + d.orders, 0);

  const currentHour = new Date(now).getHours();
  const hourIdx = hours.findIndex((h) => h.hour === currentHour);
  const todayOrders = hours.reduce((s, h) => s + h.orders, 0);
  const peak = hours.reduce<(typeof hours)[number] | null>((m, h) => (h.orders > (m?.orders ?? 0) ? h : m), null);

  const slices: DonutSlice[] = categories.slices.map((c) => ({
    key: c.categoryId,
    label: categoryName(c.categoryId),
    value: c.revenue,
    share: c.share,
    note: t('adminDashboard.stats.categories.portions', { count: c.quantity }),
    strokeClass: CATEGORY_COLORS[c.categoryId].stroke,
    dotClass: CATEGORY_COLORS[c.categoryId].dot,
  }));

  return (
    <section aria-labelledby="stats-title" className={cn('space-y-3', className)}>
      <header className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-1">
        <h2 id="stats-title" className="font-display text-lg font-bold tracking-tight text-espresso">
          {t('adminDashboard.stats.title')}
        </h2>
        <p className="text-xs text-stone">
          {t('adminDashboard.stats.range', { from: formatDayMonth(since), to: formatDayMonth(todayStart) })}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {/* Doanh thu 7 ngày */}
        <ChartCard
          className="lg:col-span-2"
          icon={<ChartColumn className="h-[18px] w-[18px]" />}
          title={t('adminDashboard.stats.week.title')}
          subtitle={
            <Rich
              text={t('adminDashboard.stats.week.subtitle', { amount: formatPrice(weekTotal), count: weekOrders })}
              className="font-semibold text-bronze-800"
            />
          }
        >
          {selDay && (
            <div aria-live="polite" className="mb-3 flex items-center justify-between gap-3 rounded-2xl bg-cream px-3.5 py-2.5">
              <span className="min-w-0 text-xs font-semibold text-bronze-700">
                {selDay.isToday ? t('adminDashboard.stats.today') : formatWeekdayLong(selDay.dayStart)} · {selDay.dayMonth}
              </span>
              <span className="shrink-0 text-right">
                <span className="font-display text-base font-extrabold tabular-nums text-espresso">{formatPrice(selDay.revenue)}</span>
                <span className="ml-1.5 text-xs text-stone">{t('adminDashboard.stats.orders', { count: selDay.orders })}</span>
              </span>
            </div>
          )}
          <BarChart
            title={t('adminDashboard.stats.week.chartTitle')}
            height={200}
            data={week.map((d) => ({
              key: String(d.dayStart),
              label: d.isToday ? t('adminDashboard.stats.today') : d.weekday,
              sublabel: d.dayMonth,
              value: d.revenue,
              description: t('adminDashboard.stats.week.barDesc', {
                day: d.isToday ? t('adminDashboard.stats.today') : formatWeekdayLong(d.dayStart),
                date: d.dayMonth,
                amount: formatPrice(d.revenue),
                count: d.orders,
              }),
            }))}
            selectedIndex={selected}
            onSelect={setPicked}
            emptyLabel={t('adminDashboard.stats.week.empty')}
          />
          <p className="mt-2 text-center text-[11px] text-stone">{t('adminDashboard.stats.week.hint')}</p>
        </ChartCard>

        {/* Cơ cấu doanh thu */}
        <ChartCard
          icon={<ChartPie className="h-[18px] w-[18px]" />}
          title={t('adminDashboard.stats.categories.title')}
          subtitle={t('adminDashboard.stats.categories.subtitle')}
        >
          <DonutChart
            title={t('adminDashboard.stats.categories.chartTitle')}
            slices={slices}
            centerValue={formatCompactPrice(categories.total)}
            centerLabel={t('adminDashboard.stats.categories.center')}
          />
        </ChartCard>

        {/* Món bán chạy */}
        <ChartCard
          icon={<Trophy className="h-[18px] w-[18px]" />}
          title={t('adminDashboard.stats.top.title')}
          subtitle={t('adminDashboard.stats.top.subtitle')}
        >
          {top.length ? (
            <HorizontalBars
              title={t('adminDashboard.stats.top.chartTitle')}
              data={top.map((item) => ({
                key: item.itemId,
                label: lineName(item),
                value: item.quantity,
                valueLabel: String(item.quantity),
                unit: t('adminDashboard.stats.top.unit'),
                secondary: formatPrice(item.revenue),
                leading: <MenuImage image={item.image} alt="" categoryId={item.categoryId} className="h-10 w-10 shrink-0" rounded="rounded-xl" />,
              }))}
            />
          ) : (
            <div className="flex flex-col items-center py-6 text-center">
              <span aria-hidden className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-bronze-100 text-bronze-500">
                <Trophy className="h-6 w-6" />
              </span>
              <p className="text-sm font-semibold text-espresso">{t('adminDashboard.stats.top.emptyTitle')}</p>
              <p className="mt-0.5 text-xs text-stone">{t('adminDashboard.stats.top.emptyBody')}</p>
            </div>
          )}
        </ChartCard>

        {/* Lượng đơn theo giờ */}
        <ChartCard
          className="lg:col-span-2"
          icon={<Clock className="h-[18px] w-[18px]" />}
          title={t('adminDashboard.stats.hours.title')}
          subtitle={t('adminDashboard.stats.hours.subtitle', { count: todayOrders })}
        >
          {peak && (
            <p className="mb-3 flex flex-wrap items-center gap-2 text-xs text-stone">
              <span className="inline-flex items-center rounded-full bg-gold-soft px-2.5 py-1 font-semibold text-bronze-800 ring-1 ring-gold/50">
                {t('adminDashboard.stats.hours.peak', { label: peak.label, count: peak.orders })}
              </span>
              {hourIdx >= 0 && <span>{t('adminDashboard.stats.hours.currentHint')}</span>}
            </p>
          )}
          <BarChart
            title={t('adminDashboard.stats.hours.chartTitle')}
            height={150}
            data={hours.map((h) => ({
              key: String(h.hour),
              label: h.label,
              value: h.orders,
              description: t('adminDashboard.stats.hours.barDesc', {
                range: `${h.hour}:00–${h.hour}:59`,
                count: h.orders,
                amount: formatPrice(h.revenue),
              }),
            }))}
            formatValue={(v) => String(v)}
            showValues="nonzero"
            highlightIndex={hourIdx >= 0 ? hourIdx : null}
            emptyLabel={t('adminDashboard.stats.hours.empty')}
          />
        </ChartCard>
      </div>
    </section>
  );
}
