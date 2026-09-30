import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Công tắc "Đang bán / Tạm hết".
 * `label` là tên truy cập cố định (VD "Đang bán: Latte"); trạng thái đọc qua aria-checked.
 */
export function AvailabilitySwitch({
  checked,
  onChange,
  label,
  busy,
  disabled,
  showText = true,
  className,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  busy?: boolean;
  disabled?: boolean;
  showText?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-busy={busy || undefined}
      disabled={disabled}
      onClick={() => !busy && onChange(!checked)}
      className={cn(
        'inline-flex min-h-11 select-none items-center gap-2.5 rounded-full pr-1 text-sm font-semibold transition',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          'inline-flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200',
          checked ? 'bg-leaf' : 'bg-stone-light',
        )}
      >
        <span
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-[0_1px_3px_rgba(28,22,14,0.3)] transition-transform duration-200',
            checked ? 'translate-x-5' : 'translate-x-0',
          )}
        >
          {busy && <Loader2 className="h-3.5 w-3.5 animate-spin text-stone" />}
        </span>
      </span>
      {showText && (
        <span aria-hidden className={cn('whitespace-nowrap', checked ? 'text-leaf-dark' : 'text-rattan-dark')}>
          {checked ? 'Đang bán' : 'Tạm hết'}
        </span>
      )}
    </button>
  );
}
