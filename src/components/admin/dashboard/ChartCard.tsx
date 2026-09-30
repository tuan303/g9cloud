import { useId, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Card } from '@/components/ui';

/** Khung thẻ cho một biểu đồ: icon + tiêu đề + phụ đề + vùng bên phải */
export function ChartCard({
  title,
  subtitle,
  icon,
  aside,
  children,
  className,
}: {
  title: string;
  subtitle?: ReactNode;
  icon?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <Card className={cn('flex flex-col p-4 md:p-5', className)}>
      <section aria-labelledby={id} className="flex flex-1 flex-col">
        <header className="mb-4 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            {icon && (
              <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-bronze-100 text-bronze-700">
                {icon}
              </span>
            )}
            <div className="min-w-0">
              <h3 id={id} className="font-display text-[15px] font-bold leading-tight tracking-tight text-espresso">
                {title}
              </h3>
              {subtitle && <p className="mt-0.5 text-xs text-stone">{subtitle}</p>}
            </div>
          </div>
          {aside && <div className="shrink-0">{aside}</div>}
        </header>
        <div className="flex flex-1 flex-col">{children}</div>
      </section>
    </Card>
  );
}
