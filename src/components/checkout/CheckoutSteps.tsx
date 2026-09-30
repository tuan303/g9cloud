import { Fragment } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';

const STEPS = ['Giỏ hàng', 'Quét mã QR', 'Nhận món'];

/** Chỉ báo 3 bước đặt món: giúp khách hiểu ngay luồng "tạo mã QR → thu ngân quét → nhận món" */
export function CheckoutSteps({ current, className }: { current: 1 | 2 | 3; className?: string }) {
  return (
    <ol aria-label="Các bước đặt món" className={cn('flex items-center gap-2 px-1', className)}>
      {STEPS.map((label, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;
        return (
          <Fragment key={label}>
            {i > 0 && <li aria-hidden className={cn('h-px min-w-3 flex-1', done || active ? 'bg-gold' : 'bg-bronze-200')} />}
            <li aria-current={active ? 'step' : undefined} className="flex shrink-0 items-center gap-1.5">
              <span
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full font-display text-[11px] font-bold',
                  done && 'bg-gold text-espresso',
                  active && 'bg-espresso text-gold ring-4 ring-gold/25',
                  !done && !active && 'bg-bronze-100 text-bronze-500',
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden /> : step}
              </span>
              {/* Màn hình rất hẹp (< 360px): chỉ hiện nhãn bước hiện tại, các nhãn khác vẫn đọc được bằng trình đọc màn hình */}
              <span className={cn('text-xs font-semibold', active ? 'text-espresso' : 'sr-only text-stone min-[360px]:not-sr-only')}>{label}</span>
            </li>
          </Fragment>
        );
      })}
    </ol>
  );
}
