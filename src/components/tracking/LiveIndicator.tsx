import { useT } from '@/i18n';
import { cn } from '@/lib/cn';

/** Chấm "đang cập nhật trực tiếp" — dữ liệu tự làm mới từ store, không cần kéo để tải lại */
export function LiveIndicator({
  tone = 'light',
  label,
  className,
}: {
  tone?: 'light' | 'dark';
  label?: string;
  className?: string;
}) {
  const { t } = useT();
  const dark = tone === 'dark';
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold',
        dark ? 'bg-white/10 text-cream/90 ring-1 ring-inset ring-white/10 backdrop-blur' : 'bg-leaf-soft text-leaf-dark',
        className,
      )}
    >
      <span className="relative flex h-2 w-2" aria-hidden>
        <span className={cn('absolute inline-flex h-full w-full rounded-full opacity-75 motion-safe:animate-ping', dark ? 'bg-leaf-light' : 'bg-leaf')} />
        <span className={cn('relative inline-flex h-2 w-2 rounded-full', dark ? 'bg-leaf-light' : 'bg-leaf')} />
      </span>
      {label ?? t('orders.live')}
    </span>
  );
}
