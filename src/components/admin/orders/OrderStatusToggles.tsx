import type { LucideIcon } from 'lucide-react';
import { Bike, Check, CircleCheckBig, ClipboardCheck, Coffee, ShoppingBag } from 'lucide-react';
import { translate, useT } from '@/i18n';
import { cn } from '@/lib/cn';
import { statusSteps } from '@/lib/order-status';
import type { Order, OrderStatus } from '@/types';

type StepStatus = Extract<OrderStatus, 'received' | 'preparing' | 'ready' | 'delivering' | 'completed'>;

const STEP_ICON: Record<StepStatus, LucideIcon> = {
  received: ClipboardCheck,
  preparing: Coffee,
  ready: ShoppingBag,
  delivering: Bike,
  completed: CircleCheckBig,
};

const isStep = (status: OrderStatus): status is StepStatus => status in STEP_ICON;

/** Nhãn ngắn của bước (dùng cho nút chuyển trạng thái / hộp thoại) — theo ngôn ngữ đang chọn */
export function shortStepLabel(status: OrderStatus): string {
  return isStep(status) ? translate(`adminOrders.steps.${status}`) : status;
}

/**
 * Hàng nút chuyển trạng thái (theo mockup “Update order status — toggle buttons”):
 * bước đã qua được đánh dấu ✓, bước hiện tại tô đậm, bước sau có thể chạm để chuyển tới.
 */
export function OrderStatusToggles({
  order,
  onSelect,
  disabled,
  className,
}: {
  order: Pick<Order, 'status' | 'fulfillment' | 'code'>;
  onSelect: (status: OrderStatus) => void;
  disabled?: boolean;
  className?: string;
}) {
  const { t } = useT();
  const steps = statusSteps(order.fulfillment) as StepStatus[];
  const currentIdx = steps.indexOf(order.status as StepStatus);

  return (
    <div
      role="group"
      aria-label={t('adminOrders.stepsAria', { code: order.code })}
      className={cn('grid grid-cols-4 gap-1 rounded-2xl bg-bronze-100/80 p-1', className)}
    >
      {steps.map((s, i) => {
        const past = currentIdx >= 0 && i < currentIdx;
        const current = i === currentIdx;
        const future = currentIdx >= 0 && i > currentIdx;
        const label = t(`adminOrders.steps.${s}`);
        const Icon = past ? Check : STEP_ICON[s];
        return (
          <button
            key={s}
            type="button"
            disabled={!future || disabled}
            aria-current={current ? 'step' : undefined}
            aria-label={t(past ? 'adminOrders.stepPast' : current ? 'adminOrders.stepCurrent' : 'adminOrders.stepFuture', { label })}
            onClick={() => onSelect(s)}
            className={cn(
              'flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-center text-[11px] font-semibold leading-tight transition',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:cursor-default',
              current && 'bg-espresso text-cream shadow-card',
              past && 'text-leaf-dark',
              future && 'bg-white text-bronze-700 ring-1 ring-inset ring-bronze-200 hover:text-espresso hover:ring-gold active:scale-[.96]',
              future && disabled && 'opacity-60',
            )}
          >
            <Icon className={cn('h-4 w-4', current && 'text-gold', past && 'text-leaf')} strokeWidth={past ? 3 : 2} aria-hidden />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
