import { Minus, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/cn';

/** Bộ tăng/giảm số lượng. Khi value = min và `onRemove` có, nút trừ thành nút xoá. */
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  size = 'md',
  onRemove,
  itemLabel,
  className,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md';
  onRemove?: () => void;
  /** Tên món — để trình đọc màn hình đọc rõ "Tăng số lượng Latte" */
  itemLabel?: string;
  className?: string;
}) {
  const btn = cn(
    'relative inline-flex items-center justify-center rounded-full transition active:scale-90 disabled:opacity-40',
    // size sm: nút 32px nhưng vùng chạm mở rộng ~44px
    size === 'md' ? 'h-10 w-10' : "h-8 w-8 after:absolute after:-inset-1.5 after:content-['']",
  );
  const suffix = itemLabel ? ` ${itemLabel}` : '';
  const showRemove = !!onRemove && value <= min;
  return (
    <div className={cn('inline-flex items-center gap-1 rounded-full bg-bronze-100 p-1', className)}>
      <button
        type="button"
        aria-label={showRemove ? `Xoá${suffix || ' món'} khỏi giỏ` : `Giảm số lượng${suffix}`}
        className={cn(btn, 'bg-white text-espresso shadow-sm', showRemove && 'text-rattan-dark')}
        disabled={!showRemove && value <= min}
        onClick={() => (showRemove ? onRemove!() : onChange(Math.max(min, value - 1)))}
      >
        {showRemove ? <Trash2 className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
      </button>
      <span
        aria-live="polite"
        className={cn('min-w-[2ch] text-center font-display font-bold tabular-nums text-espresso', size === 'md' ? 'text-base' : 'text-sm')}
      >
        {value}
      </span>
      <button
        type="button"
        aria-label={`Tăng số lượng${suffix}`}
        className={cn(btn, 'bg-espresso text-cream')}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
