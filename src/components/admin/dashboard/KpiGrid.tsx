import type { ReactNode } from 'react';
import { Banknote, CupSoda, Gift, QrCode, Receipt, Wallet } from 'lucide-react';
import barPhoto from '@/assets/photos/espresso-bar-sm.webp';
import { APP_CONFIG } from '@/config/app';
import { useT } from '@/i18n';
import { cn } from '@/lib/cn';
import { formatPrice } from '@/lib/format';
import { STATUS_META } from '@/lib/order-status';
import type { DayRevenue, TodayKpis } from '@/lib/stats';
import { formatPercentAbs } from './format';

/** Mức thay đổi so với hôm qua: ▲ tăng / ▼ giảm / — không có mốc */
function Delta({ value, tone = 'light', suffix }: { value: number | null; tone?: 'light' | 'dark'; suffix?: string }) {
  const { t } = useT();
  const dark = tone === 'dark';
  if (value === null)
    return <span className={cn('text-[11px] leading-tight', dark ? 'text-cream/70' : 'text-stone')}>{t('adminDashboard.kpi.noYesterday')}</span>;

  const rounded = Math.round(value * 10) / 10;
  const dir = rounded > 0 ? 'up' : rounded < 0 ? 'down' : 'flat';
  const pill = dark
    ? dir === 'up'
      ? 'bg-leaf/40 text-leaf-soft'
      : dir === 'down'
        ? 'bg-rattan/45 text-rattan-soft'
        : 'bg-white/10 text-cream/80'
    : dir === 'up'
      ? 'text-leaf-dark'
      : dir === 'down'
        ? 'text-rattan-dark'
        : 'text-stone';
  const srText = t(dir === 'up' ? 'adminDashboard.kpi.up' : dir === 'down' ? 'adminDashboard.kpi.down' : 'adminDashboard.kpi.flat');

  return (
    <span className={cn('inline-flex flex-wrap items-baseline gap-x-1 text-[11px] leading-tight', dark ? 'text-cream/70' : 'text-stone')}>
      <span className={cn('inline-flex items-center gap-0.5 font-bold tabular-nums', pill, dark && 'rounded-full px-2 py-0.5')}>
        <span aria-hidden>{dir === 'up' ? '▲' : dir === 'down' ? '▼' : '='}</span>
        <span className="sr-only">{srText} </span>
        {formatPercentAbs(rounded)}
      </span>
      <span>{suffix ?? t('adminDashboard.kpi.vsYesterday')}</span>
    </span>
  );
}

function KpiTile({ icon, label, value, delta }: { icon: ReactNode; label: string; value: string; delta: number | null }) {
  const { t } = useT();
  return (
    <div className="flex min-w-0 flex-col rounded-3xl bg-white p-3.5 shadow-card ring-1 ring-bronze-200/50 lg:p-4" title={t('adminDashboard.kpi.compareHint')}>
      <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-xl bg-bronze-100 text-bronze-700">
        {icon}
      </span>
      <p className="mt-3 text-xs font-medium leading-tight text-stone">{label}</p>
      <p className="mt-1 font-display text-[22px] font-extrabold leading-none tracking-tight tabular-nums text-espresso">
        {value}
      </p>
      <div className="mt-auto pt-2">
        <Delta value={delta} />
      </div>
    </div>
  );
}

/** Ô "Chờ thanh toán" — nổi màu vàng khi có đơn, chạm để cuộn tới danh sách */
function PendingTile({ count, onClick }: { count: number; onClick: () => void }) {
  const { t } = useT();
  const active = count > 0;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={active ? t('adminDashboard.kpi.pendingAria', { count }) : t('adminDashboard.kpi.pendingNoneAria')}
      className={cn(
        'flex min-w-0 flex-col rounded-3xl p-3.5 text-left ring-1 transition active:scale-[.98] lg:p-4',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-cream',
        active ? 'bg-gold-soft shadow-glow ring-gold' : 'bg-white shadow-card ring-bronze-200/50',
      )}
    >
      <span aria-hidden className="relative flex h-9 w-9">
        {active && <span className="absolute inset-0 rounded-xl bg-gold motion-safe:animate-pulse-ring" />}
        <span className={cn('relative flex h-9 w-9 items-center justify-center rounded-xl', active ? 'bg-gold text-espresso' : 'bg-bronze-100 text-bronze-700')}>
          <QrCode className="h-[18px] w-[18px]" />
        </span>
      </span>
      <span className={cn('mt-3 text-xs font-medium leading-tight', active ? 'text-bronze-800' : 'text-stone')}>{STATUS_META.pending_payment.label}</span>
      <span className="mt-1 font-display text-[22px] font-extrabold leading-none tabular-nums text-espresso">{count}</span>
      <span className={cn('mt-auto pt-2 text-[11px] font-semibold leading-tight', active ? 'text-bronze-800' : 'text-stone')}>
        {active ? t('adminDashboard.kpi.pendingCta') : t('adminDashboard.kpi.pendingNone')}
      </span>
    </button>
  );
}

/** Ô doanh thu nổi bật: nền tối ảnh quầy espresso + dải cột nhỏ 7 ngày */
function RevenueHero({ kpis, week, className }: { kpis: TodayKpis; week: DayRevenue[]; className?: string }) {
  const { t } = useT();
  const max = Math.max(0, ...week.map((d) => d.revenue));
  return (
    <div className={cn('relative isolate flex min-h-[176px] flex-col overflow-hidden rounded-3xl bg-espresso p-5 text-cream shadow-lift', className)}>
      <div aria-hidden className="absolute inset-0 -z-10 bg-cover bg-center opacity-50" style={{ backgroundImage: `url(${barPhoto})` }} />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-br from-espresso-900/95 via-espresso-900/85 to-espresso-800/55" />
      <div aria-hidden className="absolute -right-12 -top-16 -z-10 h-44 w-44 rounded-full bg-gold/25 blur-3xl" />

      <div className="flex items-center gap-2 text-sm font-medium text-cream/80">
        <Banknote aria-hidden className="h-4 w-4 text-gold" />
        {t('adminDashboard.kpi.revenueToday')}
      </div>
      <p className="mt-2.5 font-display text-[32px] font-extrabold leading-none tracking-tight tabular-nums md:text-[34px] lg:text-3xl xl:text-[34px]">
        {formatPrice(kpis.revenue)}
      </p>
      <div className="mt-2.5">
        <Delta value={kpis.deltas.revenue} tone="dark" suffix={t('adminDashboard.kpi.vsSameTime')} />
      </div>
      <p className="mt-1.5 text-xs text-cream/70">
        {t('adminDashboard.kpi.yesterdaySameTime')} <span className="tabular-nums text-cream/90">{formatPrice(kpis.yesterday.revenue)}</span>
      </p>
      {/* Tích điểm: số cốc miễn phí khách đã đổi hôm nay (đơn đã thanh toán, không huỷ) */}
      {APP_CONFIG.loyalty.enabled && (
        <p className="mt-1 flex items-center gap-1.5 text-xs text-cream/70">
          <Gift aria-hidden className="h-3.5 w-3.5 shrink-0 text-gold" />
          <span>
            {t('adminDashboard.kpi.freeCups')} <span className="font-semibold tabular-nums text-cream/90">{kpis.freeCupsRedeemed}</span>
          </span>
        </p>
      )}

      {/* Dải cột mini 7 ngày — trang trí, biểu đồ đầy đủ ở phần Thống kê */}
      <div aria-hidden className="mt-auto flex h-14 items-end gap-1.5 pt-4">
        {week.map((d) => (
          <span
            key={d.dayStart}
            className={cn('flex-1 rounded-t-md', d.isToday ? 'bg-gold' : 'bg-cream/25')}
            style={{ height: `${max > 0 ? Math.max(8, (d.revenue / max) * 100) : 8}%` }}
          />
        ))}
      </div>
    </div>
  );
}

/** Lưới KPI: 2 cột trên điện thoại/tablet (vùng nội dung hẹp do sidebar), 4 cột từ lg — ô doanh thu chiếm 2×2 */
export function KpiGrid({ kpis, week, onPendingClick }: { kpis: TodayKpis; week: DayRevenue[]; onPendingClick: () => void }) {
  const { t } = useT();
  return (
    <section aria-label={t('adminDashboard.kpi.aria')} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <RevenueHero kpis={kpis} week={week} className="col-span-2 lg:row-span-2" />
      <KpiTile icon={<Receipt className="h-[18px] w-[18px]" />} label={t('adminDashboard.kpi.orders')} value={String(kpis.orderCount)} delta={kpis.deltas.orderCount} />
      <KpiTile
        icon={<Wallet className="h-[18px] w-[18px]" />}
        label={t('adminDashboard.kpi.avgOrder')}
        value={formatPrice(kpis.avgOrderValue)}
        delta={kpis.deltas.avgOrderValue}
      />
      <KpiTile icon={<CupSoda className="h-[18px] w-[18px]" />} label={t('adminDashboard.kpi.itemsSold')} value={String(kpis.itemsSold)} delta={kpis.deltas.itemsSold} />
      <PendingTile count={kpis.pendingPaymentCount} onClick={onPendingClick} />
    </section>
  );
}
