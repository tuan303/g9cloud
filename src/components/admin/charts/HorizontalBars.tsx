import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface HBarDatum {
  key: string;
  label: string;
  value: number;
  /** Nhãn giá trị chính, VD "42" */
  valueLabel: string;
  /** Đơn vị nhỏ sau giá trị, VD "phần" */
  unit?: string;
  /** Thông tin phụ bên phải thanh, VD doanh thu */
  secondary?: string;
  /** Phần tử đầu dòng (ảnh món...) */
  leading?: ReactNode;
}

/**
 * Xếp hạng dạng thanh ngang (món bán chạy). Dùng danh sách HTML có thứ tự thay vì <text> SVG
 * để tên món dài tự cắt gọn và trình đọc màn hình đọc tự nhiên; thanh chỉ để minh hoạ.
 */
export function HorizontalBars({ data, title, className }: { data: HBarDatum[]; title: string; className?: string }) {
  const max = Math.max(0, ...data.map((d) => d.value));
  return (
    <ol aria-label={title} className={cn('space-y-3.5', className)}>
      {data.map((d, i) => {
        const pct = max > 0 ? Math.max(4, (d.value / max) * 100) : 0;
        const first = i === 0;
        return (
          <li key={d.key} className="flex items-center gap-3">
            <span
              aria-hidden
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-display text-xs font-bold',
                first ? 'bg-gold text-espresso shadow-glow' : 'bg-bronze-100 text-bronze-700',
              )}
            >
              {i + 1}
            </span>
            {d.leading}
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-sm font-semibold text-espresso">
                  <span className="sr-only">Hạng {i + 1}: </span>
                  {d.label}
                </span>
                <span className="shrink-0 font-display text-sm font-bold tabular-nums text-espresso">
                  {d.valueLabel}
                  {d.unit && <span className="ml-1 font-sans text-xs font-medium text-stone">{d.unit}</span>}
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-2.5">
                <div aria-hidden className="h-1.5 flex-1 overflow-hidden rounded-full bg-bronze-100">
                  <div
                    className={cn('h-full rounded-full transition-[width] duration-500', first ? 'bg-gold' : 'bg-bronze-400')}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {d.secondary && <span className="shrink-0 text-xs tabular-nums text-stone">{d.secondary}</span>}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
