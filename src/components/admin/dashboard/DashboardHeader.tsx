import { useT } from '@/i18n';
import { cn } from '@/lib/cn';
import { formatTime } from '@/lib/format';
import { formatLongDate, isoLocalDate } from './format';

/** Chấm xanh nhấp nháy — báo dữ liệu đang cập nhật trực tiếp */
export function LiveDot({ className = 'bg-leaf' }: { className?: string }) {
  return (
    <span aria-hidden className="relative flex h-2.5 w-2.5 shrink-0">
      <span className={cn('absolute inset-0 rounded-full motion-safe:animate-pulse-ring', className)} />
      <span className={cn('relative h-2.5 w-2.5 rounded-full', className)} />
    </span>
  );
}

/** Tiêu đề trang tổng quan: ngày hôm nay + chỉ báo trực tiếp */
export function DashboardHeader({ now, updatedAt }: { now: number; updatedAt: number }) {
  const { t } = useT();
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-bronze-600">
          <time dateTime={isoLocalDate(now)}>{formatLongDate(now)}</time>
        </p>
        <h1 className="mt-1 font-display text-[26px] font-extrabold leading-tight tracking-tight text-espresso md:text-3xl">
          {t('adminDashboard.header.title')}
        </h1>
      </div>
      <p className="inline-flex h-9 items-center gap-2 rounded-full bg-white px-3.5 text-xs shadow-card ring-1 ring-bronze-200/60">
        <LiveDot />
        <span className="font-bold text-leaf-dark">{t('adminDashboard.header.live')}</span>
        <span className="text-stone">{t('adminDashboard.header.updated', { time: formatTime(updatedAt) })}</span>
      </p>
    </header>
  );
}
