import { forwardRef, useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bike, CircleCheck, QrCode, ScanLine, Timer } from 'lucide-react';
import { APP_CONFIG } from '@/config/app';
import { repo } from '@/services';
import { useAction } from '@/hooks/useAction';
import { useNow } from '@/hooks/useNow';
import { cn } from '@/lib/cn';
import { formatPrice, formatRelative, formatTime, isSameDay } from '@/lib/format';
import { Button, Card, ConfirmDialog } from '@/components/ui';
import { OrderItemsList } from '@/components/order/OrderItemsList';
import type { Order } from '@/types';
import { LiveDot } from './DashboardHeader';
import { formatCountdown } from './format';

const EXPIRY_MS = APP_CONFIG.payment.qrExpiryMinutes * 60_000;


/** Một đơn chờ thu tiền: mã, khách, tổng tiền, đồng hồ hết hạn QR, nút xác nhận */
function PendingRow({ order, onConfirm }: { order: Order; onConfirm: (o: Order) => void }) {
  const now = useNow(1000);
  const remaining = Math.max(0, EXPIRY_MS - (now - order.createdAt));
  const ratio = EXPIRY_MS > 0 ? remaining / EXPIRY_MS : 0;
  const expired = remaining <= 0;
  const urgent = ratio <= 0.2;
  const bar = ratio > 0.5 ? 'bg-leaf' : ratio > 0.2 ? 'bg-gold' : 'bg-rattan';

  return (
    <li className="animate-fade-in px-4 py-3.5 md:px-5">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="flex min-w-0 items-baseline gap-2">
            <span className="shrink-0 font-display text-base font-extrabold tracking-tight text-espresso">{order.code}</span>
            <span className="truncate text-sm font-medium text-bronze-800">{order.customer.name}</span>
          </p>
          <p className="mt-0.5 truncate text-xs text-stone">
            {order.itemCount} món · {order.fulfillment === 'delivery' ? 'Giao tận nơi' : 'Tại quầy'} · đặt {formatRelative(order.createdAt, now)}
          </p>
          {order.fulfillment === 'delivery' && order.deliveryAddress && (
            <p className="mt-0.5 flex min-w-0 items-center gap-1 text-xs font-medium text-bronze-700">
              <Bike aria-hidden className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{order.deliveryAddress}</span>
            </p>
          )}
        </div>
        <span className="shrink-0 font-display text-base font-extrabold tabular-nums text-espresso">{formatPrice(order.total)}</span>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div
            role="progressbar"
            aria-label={`Thời gian còn lại của mã QR đơn ${order.code}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(ratio * 100)}
            aria-valuetext={expired ? 'Đã hết hạn' : `Còn ${formatCountdown(remaining)}`}
            className="h-1.5 overflow-hidden rounded-full bg-bronze-100"
          >
            <div className={cn('h-full rounded-full transition-[width] duration-1000 ease-linear', bar)} style={{ width: `${ratio * 100}%` }} />
          </div>
          <p className={cn('mt-1.5 flex items-center gap-1 text-[11px] font-medium tabular-nums', urgent ? 'text-rattan-dark' : 'text-stone')}>
            <Timer aria-hidden className="h-3.5 w-3.5" />
            {expired ? 'Mã QR đã hết hạn — đơn sẽ tự huỷ' : `Mã QR còn ${formatCountdown(remaining)}`}
          </p>
        </div>
        <Button variant="leaf" className="shrink-0 px-3.5" leftIcon={<CircleCheck aria-hidden className="h-[18px] w-[18px]" />} onClick={() => onConfirm(order)}>
          Đã thu tiền
        </Button>
      </div>
    </li>
  );
}

/**
 * Thẻ "Thanh toán QR · Trực tiếp": đơn đang chờ thu tiền (cũ nhất lên đầu — gấp nhất)
 * và 5 đơn vừa thanh toán hôm nay. Tự cập nhật khi khách đặt ở thiết bị/tab khác.
 */
export const LivePaymentsCard = forwardRef<HTMLElement, { orders: Order[]; dayStart: number; className?: string }>(function LivePaymentsCard(
  { orders, dayStart, className },
  ref,
) {
  const pending = useMemo(
    () => orders.filter((o) => o.status === 'pending_payment').sort((a, b) => a.createdAt - b.createdAt),
    [orders],
  );
  const recentPaid = useMemo(
    () =>
      orders
        .filter((o): o is Order & { paidAt: number } => o.paymentStatus === 'paid' && !!o.paidAt && isSameDay(o.paidAt, dayStart))
        .sort((a, b) => b.paidAt - a.paidAt)
        .slice(0, 5),
    [orders, dayStart],
  );

  const [target, setTarget] = useState<Order | null>(null);
  const [confirmPayment, confirming] = useAction((id: string) => repo.confirmPayment(id), {
    success: target ? `Đã xác nhận thanh toán ${target.code}` : undefined,
  });
  const close = useCallback(() => {
    if (!confirming) setTarget(null);
  }, [confirming]);
  const confirm = async () => {
    if (!target) return;
    await confirmPayment(target.id);
    setTarget(null);
  };

  return (
    <section ref={ref} tabIndex={-1} aria-labelledby="live-payments-title" className={cn('scroll-mt-20 outline-none', className)}>
      <Card className="overflow-hidden">
        <header className="flex items-center justify-between gap-3 border-b border-bronze-100 px-4 py-3.5 md:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <span aria-hidden className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-leaf text-white shadow-card sm:flex">
              <QrCode className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 id="live-payments-title" className="font-display text-base font-bold leading-tight tracking-tight text-espresso">
                Thanh toán QR<span className="sr-only"> · Trực tiếp</span>
              </h2>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                <span aria-hidden className="inline-flex items-center gap-1.5 font-bold text-leaf-dark">
                  <LiveDot />
                  Trực tiếp
                </span>
                <span className="text-stone">
                  {pending.length ? (
                    <>
                      <b className="font-semibold text-bronze-800">{pending.length} đơn</b> chờ thu tiền
                    </>
                  ) : (
                    'chưa có đơn chờ'
                  )}
                </span>
              </p>
            </div>
          </div>
          <Link
            to="/admin/scan"
            className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-2xl bg-espresso px-3.5 text-sm font-semibold text-cream shadow-card transition hover:bg-espresso-700 active:scale-[.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
          >
            <ScanLine aria-hidden className="h-[18px] w-[18px]" />
            Quét mã
          </Link>
        </header>

        {/* Thông báo cho trình đọc màn hình khi số đơn chờ thay đổi */}
        <p className="sr-only" aria-live="polite">
          {pending.length ? `${pending.length} đơn chờ thanh toán` : 'Không có đơn chờ thanh toán'}
        </p>

        {pending.length ? (
          <ul className="divide-y divide-bronze-100">
            {pending.map((o) => (
              <PendingRow key={o.id} order={o} onConfirm={setTarget} />
            ))}
          </ul>
        ) : (
          <div className="flex items-center gap-4 px-4 py-6 md:px-5">
            <span aria-hidden className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-leaf-soft text-leaf-dark">
              <CircleCheck className="h-6 w-6" />
            </span>
            <div>
              <p className="font-semibold text-espresso">Không có đơn chờ thanh toán</p>
              <p className="mt-0.5 text-sm text-stone">Khi khách đặt món và mở mã QR, đơn sẽ hiện ở đây để bạn xác nhận thu tiền.</p>
            </div>
          </div>
        )}

        <div className="border-t border-bronze-100 bg-bronze-50/70 px-4 pb-3 pt-2 md:px-5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-bronze-700">Vừa thanh toán</h3>
            <Link
              to="/admin/orders"
              className="-mr-2 inline-flex h-11 items-center rounded-xl px-2 text-xs font-semibold text-bronze-700 hover:text-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              Xem tất cả đơn
            </Link>
          </div>
          {recentPaid.length ? (
            <ul className="space-y-0.5">
              {recentPaid.map((o) => (
                <li key={o.id} className="flex items-center gap-2.5 py-1.5 text-sm">
                  <CircleCheck aria-hidden className="h-4 w-4 shrink-0 text-leaf" />
                  <span className="shrink-0 font-display font-bold text-espresso">{o.code}</span>
                  <span className="min-w-0 flex-1 truncate text-stone">{o.customer.name}</span>
                  <time dateTime={new Date(o.paidAt).toISOString()} className="shrink-0 text-xs tabular-nums text-stone">
                    {formatTime(o.paidAt)}
                  </time>
                  <span className="w-[76px] shrink-0 text-right font-display font-bold tabular-nums text-espresso">{formatPrice(o.total)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="pb-2 text-sm text-stone">Hôm nay chưa có đơn nào được thanh toán.</p>
          )}
        </div>
      </Card>

      <ConfirmDialog
        open={!!target}
        tone="leaf"
        title={target ? `Xác nhận đã thu ${formatPrice(target.total)}?` : ''}
        description={
          target && (
            <>
              Đơn <b className="font-semibold text-espresso">{target.code}</b> · {target.customer.name} · {target.itemCount} món. Đơn sẽ chuyển sang “Đã nhận đơn” và
              khách được báo ngay.
            </>
          )
        }
        confirmText="Đã thu tiền"
        cancelText="Quay lại"
        loading={confirming}
        onConfirm={confirm}
        onCancel={close}
      >
        {target && (
          <div className="mt-4 max-h-48 overflow-y-auto rounded-2xl bg-white px-3 ring-1 ring-bronze-200/60">
            <OrderItemsList lines={target.items} compact />
          </div>
        )}
      </ConfirmDialog>
    </section>
  );
});
