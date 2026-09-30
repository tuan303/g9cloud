import { CircleX, Hourglass, Receipt, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatPrice, formatTime } from '@/lib/format';
import { STATUS_META, statusSteps, stepLabel } from '@/lib/order-status';
import type { Order } from '@/types';
import { progressIndex, stepState, stepTime, type StepState } from './OrderProgress';
import { STATUS_VISUAL } from './visuals';

type EntryState = StepState | 'cancelled';

interface TimelineEntry {
  key: string;
  label: string;
  icon: LucideIcon;
  state: EntryState;
  at?: number;
  note?: string;
}

const CANCELLED_BY: Record<'customer' | 'staff' | 'system', string> = {
  customer: 'Bạn đã huỷ đơn',
  staff: 'Quán đã huỷ đơn',
  system: 'Tự huỷ do quá hạn thanh toán',
};

/**
 * Mô tả việc huỷ đơn: ai huỷ + lý do. Lý do chỉ hiện khi quán huỷ
 * (khách tự huỷ / hệ thống tự huỷ thì tiêu đề đã đủ nghĩa).
 */
export function cancellationInfo(order: Pick<Order, 'statusHistory' | 'cancelReason'>): { title: string; reason?: string } {
  const by = [...order.statusHistory].reverse().find((e) => e.status === 'cancelled')?.by ?? 'staff';
  return { title: CANCELLED_BY[by], reason: by === 'staff' ? order.cancelReason : undefined };
}

function buildEntries(order: Order): TimelineEntry[] {
  const entries: TimelineEntry[] = [
    {
      key: 'created',
      label: 'Đặt đơn',
      icon: Receipt,
      state: 'done',
      at: order.createdAt,
      note: `${order.itemCount} món · ${formatPrice(order.total)}`,
    },
  ];
  const steps = statusSteps(order.fulfillment);

  if (order.status === 'cancelled') {
    const info = cancellationInfo(order);
    // Chỉ liệt kê các bước đơn đã thực sự đi qua trước khi bị huỷ
    for (const s of steps) {
      const at = stepTime(order, s);
      if (at) entries.push({ key: s, label: stepLabel(s, order.fulfillment), icon: STATUS_VISUAL[s].icon, state: 'done', at });
    }
    entries.push({
      key: 'cancelled',
      label: info.title,
      icon: CircleX,
      state: 'cancelled',
      at: stepTime(order, 'cancelled') ?? order.updatedAt,
      note: info.reason ? `Lý do: ${info.reason}` : undefined,
    });
    return entries;
  }

  if (order.status === 'pending_payment') {
    entries.push({ key: 'pending', label: STATUS_META.pending_payment.label, icon: Hourglass, state: 'current', note: STATUS_META.pending_payment.description });
  }

  const current = progressIndex(order);
  steps.forEach((s, i) => {
    const state = stepState(i, current);
    let note: string | undefined;
    if (state === 'current') note = STATUS_META[s].description;
    else if (s === 'received' && state === 'done') note = 'Đã thanh toán tại quầy';
    else if (s === 'received' && state === 'todo') note = 'Sau khi thu ngân xác nhận thanh toán';
    else if (s === 'completed' && state === 'done') note = order.fulfillment === 'delivery' ? 'Đơn đã giao đến bạn. Chúc ngon miệng!' : 'Chúc bạn ngon miệng!';
    entries.push({
      key: s,
      label: stepLabel(s, order.fulfillment),
      icon: STATUS_VISUAL[s].icon,
      state,
      at: state === 'todo' ? undefined : stepTime(order, s),
      note,
    });
  });
  return entries;
}

const DOT: Record<EntryState, string> = {
  done: 'bg-leaf-soft text-leaf-dark',
  current: 'bg-gold text-espresso shadow-glow',
  todo: 'border border-dashed border-bronze-300 bg-bronze-50 text-bronze-400',
  cancelled: 'bg-stone-soft text-stone',
};

/** Dòng thời gian dọc — chi tiết từng mốc trạng thái của đơn */
export function OrderTimeline({ order, className }: { order: Order; className?: string }) {
  const entries = buildEntries(order);
  return (
    <ol className={cn('relative', className)}>
      {entries.map((e, i) => {
        const next = entries[i + 1];
        const Icon = e.icon;
        return (
          <li key={e.key} className="relative flex gap-3.5 pb-5 last:pb-0" aria-current={e.state === 'current' ? 'step' : undefined}>
            {next && (
              <span
                aria-hidden
                className={cn(
                  'absolute bottom-0 left-[17px] top-9 w-0.5 rounded-full',
                  next.state === 'todo' ? 'bg-bronze-100' : next.state === 'cancelled' ? 'bg-stone-soft' : 'bg-leaf/40',
                )}
              />
            )}
            <span className="relative flex h-9 w-9 shrink-0 items-center justify-center">
              {e.state === 'current' && <span aria-hidden className="absolute inset-0 rounded-full bg-gold/50 motion-safe:animate-pulse-ring" />}
              <span className={cn('relative flex h-9 w-9 items-center justify-center rounded-full', DOT[e.state])}>
                <Icon className="h-4 w-4" aria-hidden />
              </span>
            </span>
            <div className="min-w-0 flex-1 pt-1.5">
              <div className="flex items-baseline justify-between gap-3">
                <p
                  className={cn(
                    'text-[15px] font-semibold leading-snug',
                    e.state === 'todo' || e.state === 'cancelled' ? 'text-stone' : 'text-espresso',
                  )}
                >
                  {e.label}
                  {e.state === 'current' && <span className="sr-only"> (đang diễn ra)</span>}
                </p>
                {e.at && (
                  <time dateTime={new Date(e.at).toISOString()} className="shrink-0 font-display text-xs font-semibold tabular-nums text-bronze-500">
                    {formatTime(e.at)}
                  </time>
                )}
              </div>
              {e.note && <p className="mt-0.5 text-[13px] leading-snug text-stone">{e.note}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
