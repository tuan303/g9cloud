import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface SegmentedOption<T extends string> {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
  badge?: number;
}

/** Thanh tab dạng viên thuốc (danh mục thực đơn, bộ lọc đơn hàng...) */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
  size = 'md',
  tone = 'light',
  ariaLabel,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
  size?: 'sm' | 'md';
  tone?: 'light' | 'dark';
  ariaLabel?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        'flex gap-1 rounded-2xl p-1',
        tone === 'light' ? 'bg-bronze-100/80' : 'bg-white/10 backdrop-blur',
        className,
      )}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'relative flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl font-semibold transition',
              size === 'md' ? 'h-10 px-3 text-sm' : 'h-8 px-2.5 text-xs',
              tone === 'light'
                ? active
                  ? 'bg-espresso text-cream shadow-card'
                  : 'text-bronze-700 hover:text-espresso'
                : active
                  ? 'bg-cream text-espresso shadow-card'
                  : 'text-cream/80 hover:text-cream',
            )}
          >
            {o.icon}
            {o.label}
            {!!o.badge && (
              <span
                className={cn(
                  'min-w-[18px] rounded-full px-1 text-[11px] leading-[18px]',
                  active ? 'bg-gold text-espresso' : 'bg-rattan text-white',
                )}
              >
                {o.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
