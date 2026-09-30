import { useMemo, useState } from 'react';
import { ChartColumn, ChartPie, Clock, Trophy } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatCompactPrice, formatDayMonth, formatPrice } from '@/lib/format';
import { addDays, ordersByHour, revenueByCategory, topItems, type DayRevenue } from '@/lib/stats';
import { MenuImage } from '@/components/ui';
import { BarChart, DonutChart, HorizontalBars, type DonutSlice } from '@/components/admin/charts';
import type { CategoryId, Order } from '@/types';
import { ChartCard } from './ChartCard';
import { formatWeekdayLong } from './format';

/** Màu danh mục trên biểu đồ tròn — theo bảng màu quán */
const CATEGORY_COLORS: Record<CategoryId, { stroke: string; dot: string }> = {
  coffee: { stroke: 'stroke-espresso-700', dot: 'bg-espresso-700' },
  drinks: { stroke: 'stroke-gold', dot: 'bg-gold' },
  desserts: { stroke: 'stroke-rattan', dot: 'bg-rattan' },
};

/** Phần "Thống kê": doanh thu 7 ngày, cơ cấu danh mục, món bán chạy, lượng đơn theo giờ */
export function StatsSection({ orders, week, now, className }: { orders: Order[]; week: DayRevenue[]; now: number; className?: string }) {
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
    label: c.name,
    value: c.revenue,
    share: c.share,
    note: `${c.quantity} phần`,
    strokeClass: CATEGORY_COLORS[c.categoryId].stroke,
    dotClass: CATEGORY_COLORS[c.categoryId].dot,
  }));

  return (
    <section aria-labelledby="stats-title" className={cn('space-y-3', className)}>
      <header className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-1">
        <h2 id="stats-title" className="font-display text-lg font-bold tracking-tight text-espresso">
          Thống kê
        </h2>
        <p className="text-xs text-stone">
          7 ngày gần nhất · {formatDayMonth(since)} – {formatDayMonth(todayStart)}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {/* Doanh thu 7 ngày */}
        <ChartCard
          className="lg:col-span-2"
          icon={<ChartColumn className="h-[18px] w-[18px]" />}
          title="Doanh thu 7 ngày"
          subtitle={
            <>
              Tổng <b className="font-semibold text-bronze-800">{formatPrice(weekTotal)}</b> · {weekOrders} đơn
            </>
          }
        >
          {selDay && (
            <div aria-live="polite" className="mb-3 flex items-center justify-between gap-3 rounded-2xl bg-cream px-3.5 py-2.5">
              <span className="min-w-0 text-xs font-semibold text-bronze-700">
                {selDay.isToday ? 'Hôm nay' : formatWeekdayLong(selDay.dayStart)} · {selDay.dayMonth}
              </span>
              <span className="shrink-0 text-right">
                <span className="font-display text-base font-extrabold tabular-nums text-espresso">{formatPrice(selDay.revenue)}</span>
                <span className="ml-1.5 text-xs text-stone">{selDay.orders} đơn</span>
              </span>
            </div>
          )}
          <BarChart
            title="Doanh thu 7 ngày gần nhất"
            height={200}
            data={week.map((d) => ({
              key: String(d.dayStart),
              label: d.isToday ? 'Hôm nay' : d.weekday,
              sublabel: d.dayMonth,
              value: d.revenue,
              description: `${d.isToday ? 'Hôm nay' : formatWeekdayLong(d.dayStart)} ${d.dayMonth}: ${formatPrice(d.revenue)}, ${d.orders} đơn`,
            }))}
            selectedIndex={selected}
            onSelect={setPicked}
            emptyLabel="Chưa có doanh thu trong 7 ngày qua"
          />
          <p className="mt-2 text-center text-[11px] text-stone">Chạm vào cột để xem chi tiết từng ngày</p>
        </ChartCard>

        {/* Cơ cấu doanh thu */}
        <ChartCard icon={<ChartPie className="h-[18px] w-[18px]" />} title="Cơ cấu doanh thu" subtitle="Theo danh mục · 7 ngày">
          <DonutChart
            title="Cơ cấu doanh thu theo danh mục, 7 ngày gần nhất"
            slices={slices}
            centerValue={formatCompactPrice(categories.total)}
            centerLabel="7 ngày"
          />
        </ChartCard>

        {/* Món bán chạy */}
        <ChartCard icon={<Trophy className="h-[18px] w-[18px]" />} title="Món bán chạy" subtitle="Top 5 · 7 ngày">
          {top.length ? (
            <HorizontalBars
              title="5 món bán chạy nhất 7 ngày gần nhất"
              data={top.map((t) => ({
                key: t.itemId,
                label: t.name,
                value: t.quantity,
                valueLabel: String(t.quantity),
                unit: 'phần',
                secondary: formatPrice(t.revenue),
                leading: <MenuImage image={t.image} alt="" categoryId={t.categoryId} className="h-10 w-10 shrink-0" rounded="rounded-xl" />,
              }))}
            />
          ) : (
            <div className="flex flex-col items-center py-6 text-center">
              <span aria-hidden className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-bronze-100 text-bronze-500">
                <Trophy className="h-6 w-6" />
              </span>
              <p className="text-sm font-semibold text-espresso">Chưa có món nào được bán</p>
              <p className="mt-0.5 text-xs text-stone">Bảng xếp hạng sẽ hiện khi có đơn đã thanh toán.</p>
            </div>
          )}
        </ChartCard>

        {/* Lượng đơn theo giờ */}
        <ChartCard
          className="lg:col-span-2"
          icon={<Clock className="h-[18px] w-[18px]" />}
          title="Lượng đơn theo giờ"
          subtitle={`Hôm nay · ${todayOrders} đơn đã thanh toán`}
        >
          {peak && (
            <p className="mb-3 flex flex-wrap items-center gap-2 text-xs text-stone">
              <span className="inline-flex items-center rounded-full bg-gold-soft px-2.5 py-1 font-semibold text-bronze-800 ring-1 ring-gold/50">
                Cao điểm {peak.label} · {peak.orders} đơn
              </span>
              {hourIdx >= 0 && <span>Cột vàng là khung giờ hiện tại</span>}
            </p>
          )}
          <BarChart
            title="Số đơn theo giờ hôm nay"
            height={150}
            data={hours.map((h) => ({
              key: String(h.hour),
              label: h.label,
              value: h.orders,
              description: `${h.hour}:00–${h.hour}:59: ${h.orders} đơn, ${formatPrice(h.revenue)}`,
            }))}
            formatValue={(v) => String(v)}
            showValues="nonzero"
            highlightIndex={hourIdx >= 0 ? hourIdx : null}
            emptyLabel="Hôm nay chưa có đơn đã thanh toán"
          />
        </ChartCard>
      </div>
    </section>
  );
}
