import type { KeyboardEvent } from 'react';
import { CakeSlice, Coffee, CupSoda, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { CategoryId } from '@/types';

export const CATEGORY_ICONS: Record<CategoryId, LucideIcon> = {
  coffee: Coffee,
  drinks: CupSoda,
  desserts: CakeSlice,
};

export interface CategoryTab {
  id: CategoryId;
  label: string;
  count: number;
}

export const categoryTabId = (id: CategoryId) => `menu-tab-${id}`;

/**
 * Tab danh mục thực đơn: icon + tên + số món. Bố cục dọc để vừa màn hình 375px với vùng chạm ≥ 44px.
 * `value = null` khi đang tìm kiếm (không tab nào được chọn, số đếm là số kết quả).
 */
export function CategoryTabs({
  tabs,
  value,
  onChange,
  panelId,
  className,
}: {
  tabs: CategoryTab[];
  value: CategoryId | null;
  onChange: (id: CategoryId) => void;
  panelId?: string;
  className?: string;
}) {
  // Điều hướng bàn phím ← → theo mẫu ARIA tablist
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const buttons = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
    const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (current < 0) return;
    e.preventDefault();
    const next = (current + (e.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
    buttons[next].focus();
    onChange(tabs[next].id);
  };

  return (
    <div
      role="tablist"
      aria-label="Danh mục thực đơn"
      onKeyDown={onKeyDown}
      className={cn('grid grid-cols-3 gap-1 rounded-[22px] bg-bronze-100/80 p-1', className)}
    >
      {tabs.map((t) => {
        const active = t.id === value;
        const empty = value === null && t.count === 0;
        const Icon = CATEGORY_ICONS[t.id];
        return (
          <button
            key={t.id}
            id={categoryTabId(t.id)}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls={active ? panelId : undefined}
            aria-disabled={empty || undefined}
            tabIndex={active || (value === null && t === tabs[0]) ? 0 : -1}
            onClick={() => !empty && onChange(t.id)}
            className={cn(
              'flex min-h-[56px] min-w-0 flex-col items-center justify-center gap-1 rounded-[18px] px-1.5 py-2 transition active:scale-[.97]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
              active ? 'bg-espresso text-cream shadow-card' : 'text-bronze-700 hover:bg-white/60 hover:text-espresso',
              empty && 'opacity-45',
            )}
          >
            <Icon className={cn('h-[18px] w-[18px]', active ? 'text-gold' : 'text-bronze-500')} strokeWidth={2.1} aria-hidden />
            <span className="flex items-center gap-1 whitespace-nowrap text-[13px] font-semibold leading-none">
              {t.label}
              <span
                className={cn(
                  'rounded-full px-1.5 py-[3px] font-display text-[10px] font-bold leading-none tabular-nums max-[359px]:hidden',
                  active ? 'bg-gold text-espresso' : 'bg-white/85 text-bronze-700',
                )}
              >
                {t.count}
                <span className="sr-only"> món</span>
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
