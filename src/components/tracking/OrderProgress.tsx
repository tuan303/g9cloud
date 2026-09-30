import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatTime } from '@/lib/format';
import { statusSteps, stepLabel } from '@/lib/order-status';
import type { Order, OrderStatus } from '@/types';
import { STATUS_VISUAL } from './visuals';

export type StepState = 'done' | 'current' | 'todo';

/** Thời điểm đơn đạt trạng thái (lần gần nhất trong statusHistory) */
export function stepTime(order: Pick<Order, 'statusHistory' | 'paidAt'>, status: OrderStatus): number | undefined {
  for (let i = order.statusHistory.length - 1; i >= 0; i--) {
    if (order.statusHistory[i].status === status) return order.statusHistory[i].at;
  }
  return status === 'received' ? order.paidAt : undefined;
}

/**
 * Vị trí hiện tại trên thanh tiến trình: -1 khi chưa thanh toán; bằng số bước khi đã hoàn thành
 * (mọi bước đều "xong").
 */
export function progressIndex(order: Pick<Order, 'status' | 'fulfillment'>): number {
  const steps = statusSteps(order.fulfillment);
  if (order.status === 'completed') return steps.length;
  return steps.indexOf(order.status);
}

export function stepState(index: number, current: number): StepState {
  if (index < current) return 'done';
  return index === current ? 'current' : 'todo';
}

const SR_STATE: Record<StepState, string> = { done: 'đã xong', current: 'đang diễn ra', todo: 'chưa tới' };

/** Thanh tiến trình ngang (như mockup): nút tròn + đường nối + nhãn bước + giờ */
export function OrderProgress({
  order,
  tone = 'light',
  className,
}: {
  order: Pick<Order, 'status' | 'fulfillment' | 'statusHistory' | 'paidAt'>;
  tone?: 'light' | 'dark';
  className?: string;
}) {
  const steps = statusSteps(order.fulfillment);
  const n = steps.length;
  const current = progressIndex(order);
  const fill = Math.min(1, Math.max(0, current) / (n - 1));
  const dark = tone === 'dark';
  const edge = `${50 / n}%`;

  return (
    <div className={cn('relative', className)}>
      {/* Đường nối giữa các bước (từ tâm nút đầu đến tâm nút cuối) */}
      <div aria-hidden className="absolute top-[18px] h-1 -translate-y-1/2" style={{ left: edge, right: edge }}>
        <div className={cn('absolute inset-0 rounded-full', dark ? 'bg-white/15' : 'bg-bronze-100')} />
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-leaf to-leaf-light transition-[width] duration-700 ease-out"
          style={{ width: `${fill * 100}%` }}
        />
      </div>

      <ol aria-label="Tiến trình đơn hàng" className="relative grid" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
        {steps.map((s, i) => {
          const state = stepState(i, current);
          const Icon = STATUS_VISUAL[s].icon;
          const at = state !== 'todo' ? stepTime(order, s) : undefined;
          return (
            <li key={s} className="flex flex-col items-center text-center" aria-current={state === 'current' ? 'step' : undefined}>
              <span className="relative flex h-9 w-9 items-center justify-center">
                {state === 'current' && (
                  <span aria-hidden className="absolute inset-0 rounded-full bg-gold/60 motion-safe:animate-pulse-ring" />
                )}
                <span
                  className={cn(
                    'relative flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-500',
                    state === 'done' && 'bg-leaf text-white',
                    state === 'current' && 'bg-gold text-espresso shadow-glow',
                    state === 'todo' &&
                      (dark ? 'bg-espresso-700 text-cream/55 ring-1 ring-inset ring-white/10' : 'bg-bronze-50 text-bronze-400 ring-1 ring-inset ring-bronze-200'),
                  )}
                >
                  {state === 'done' ? <Check className="h-4 w-4" strokeWidth={3} aria-hidden /> : <Icon className="h-4 w-4" aria-hidden />}
                </span>
              </span>
              <span
                className={cn(
                  'mt-2 px-0.5 text-[11px] font-semibold leading-tight',
                  dark ? (state === 'todo' ? 'text-cream/55' : 'text-cream') : state === 'todo' ? 'text-stone' : 'text-espresso',
                )}
              >
                {stepLabel(s, order.fulfillment)}
                <span className="sr-only">: {SR_STATE[state]}</span>
              </span>
              <span className={cn('mt-0.5 h-4 text-[11px] tabular-nums', dark ? 'text-cream/60' : 'text-stone')}>{at ? formatTime(at) : ''}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** Thanh tiến trình thu gọn cho thẻ đơn hàng */
export function OrderMiniProgress({ order, className }: { order: Pick<Order, 'status' | 'fulfillment'>; className?: string }) {
  const steps = statusSteps(order.fulfillment);
  const current = progressIndex(order);
  return (
    <div aria-hidden className={cn('flex gap-1', className)}>
      {steps.map((s, i) => {
        const state = stepState(i, current);
        return (
          <span
            key={s}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors duration-500',
              state === 'done' && 'bg-leaf',
              state === 'current' && 'bg-gold motion-safe:animate-pulse',
              state === 'todo' && 'bg-bronze-100',
            )}
          />
        );
      })}
    </div>
  );
}
