import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Tiêu đề lớn cho các trang có thanh tab (Đơn hàng, Thông báo): dính trên cùng, có safe-area,
 * hành động bên phải và vùng phụ bên dưới (VD thanh Segmented).
 */
export function TabPageHeader({
  title,
  subtitle,
  right,
  children,
  className,
}: {
  title: string;
  subtitle?: ReactNode;
  right?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn('safe-top sticky top-0 z-30 border-b border-bronze-200/60 bg-cream/90 backdrop-blur-md', className)}>
      <div className="px-4 pb-3 pt-3">
        <p className="truncate text-[11px] font-semibold uppercase tracking-[0.2em] text-bronze-600">Cloud 9 · Bakery Cafe</p>
        <div className="mt-0.5 flex items-end justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-[26px] font-extrabold leading-tight tracking-tight text-espresso">{title}</h1>
            {subtitle && <p className="mt-0.5 truncate text-[13px] text-stone">{subtitle}</p>}
          </div>
          {right && <div className="-mr-2 shrink-0">{right}</div>}
        </div>
        {children && <div className="mt-3">{children}</div>}
      </div>
    </header>
  );
}
