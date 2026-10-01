import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Ban, Bike, CircleCheckBig, Clock, Coffee, HandCoins, QrCode, ShoppingBag, StickyNote, TriangleAlert } from 'lucide-react';
import { APP_CONFIG } from '@/config/app';
import { Button, ConfirmDialog, StatusBadge } from '@/components/ui';
import { OrderTotals } from '@/components/order/OrderItemsList';
import { useAction } from '@/hooks/useAction';
import { useT } from '@/i18n';
import { cn } from '@/lib/cn';
import { formatPrice, formatTime } from '@/lib/format';
import { lineName } from '@/lib/i18n-data';
import { isActiveOrder, nextActionLabel, nextStatus, statusSteps, stepLabel } from '@/lib/order-status';
import { optionsSummary } from '@/lib/pricing';
import { repo } from '@/services';
import { toast } from '@/store/ui';
import type { Order, OrderLine, OrderStatus } from '@/types';
import { CancelOrderDialog } from './CancelOrderDialog';
import { CustomerContact, FulfillmentInfo, LoyaltyRedeemBadge, OrderNote, PaymentBadge } from './OrderMeta';
import { OrderStatusToggles, shortStepLabel } from './OrderStatusToggles';
import { OverflowMenu } from './OverflowMenu';
import { cancelReasonText, formatElapsed, LONG_WAIT_MS, waitingSince } from './order-filters';
import { suppressOrderAlert } from './useNewOrderAlert';

/** Icon + màu cho nút hành động chính theo trạng thái hiện tại */
function primaryStyle(order: Order): { icon: LucideIcon; variant: 'primary' | 'leaf' } {
  switch (order.status) {
    case 'pending_payment':
      return { icon: HandCoins, variant: 'leaf' };
    case 'received':
      return { icon: Coffee, variant: 'primary' };
    case 'preparing':
      return { icon: order.fulfillment === 'delivery' ? Bike : ShoppingBag, variant: 'primary' };
    default:
      return { icon: CircleCheckBig, variant: 'leaf' };
  }
}

/** Danh sách món gọn cho barista: số lượng nổi bật, tuỳ chọn rõ, ghi chú màu mây đan */
function BaristaItems({ items }: { items: OrderLine[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((l) => {
        const opts = optionsSummary(l.options, l.itemId);
        return (
          <li key={l.lineId} className="flex items-start gap-2.5">
            <span className="mt-px inline-flex h-6 min-w-[30px] shrink-0 items-center justify-center rounded-lg bg-espresso px-1.5 font-display text-[13px] font-bold tabular-nums text-gold-light">
              {l.quantity}×
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold leading-snug text-espresso">{lineName(l)}</p>
              {opts && <p className="mt-0.5 text-[13px] leading-snug text-bronze-700">{opts}</p>}
              {l.note && (
                <p className="mt-1 flex items-start gap-1 text-[13px] font-medium italic leading-snug text-rattan">
                  <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span>“{l.note}”</span>
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Thẻ đơn cho màn hình quản trị: mã đơn lớn, thời gian chờ, khách + gọi nhanh,
 * hình thức nhận, món (kèm tuỳ chọn/ghi chú), tổng tiền, nút chuyển trạng thái.
 */
export function AdminOrderCard({ order, now, highlight }: { order: Order; now: number; highlight?: boolean }) {
  const { t } = useT();
  const [payOpen, setPayOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [skipTo, setSkipTo] = useState<OrderStatus | null>(null);

  const [update, updating] = useAction(async (status: OrderStatus) => {
    const o = await repo.updateOrderStatus(order.id, status, 'staff');
    toast(`${o.code} · ${stepLabel(o.status, o.fulfillment)}`, 'success');
    return o;
  });
  const [confirmPay, paying] = useAction(
    () => {
      suppressOrderAlert(order.id);
      return repo.confirmPayment(order.id);
    },
    { success: t('adminOrders.card.paidToast', { amount: formatPrice(order.total), code: order.code }) },
  );

  const active = isActiveOrder(order);
  const pending = order.status === 'pending_payment';
  const elapsed = now - waitingSince(order);
  const longWait = active && elapsed > LONG_WAIT_MS;
  const next = nextStatus(order);
  const nextLabel = nextActionLabel(order);
  const busy = updating || paying;
  const steps = statusSteps(order.fulfillment);
  const currentIdx = steps.indexOf(order.status);
  const primary = primaryStyle(order);
  const PrimaryIcon = primary.icon;

  const timeInfo = pending
    ? t('adminOrders.card.orderedAt', { time: formatTime(order.createdAt) })
    : order.status === 'completed'
      ? t('adminOrders.card.doneAt', { time: formatTime(order.updatedAt) })
      : order.status === 'cancelled'
        ? t('adminOrders.card.cancelledAt', { time: formatTime(order.updatedAt) })
        : t('adminOrders.card.paidAt', { time: formatTime(waitingSince(order)) });
  const elapsedText = formatElapsed(elapsed);
  const discounted = order.discount > 0;

  const expiresInMin = Math.max(1, Math.ceil((APP_CONFIG.payment.qrExpiryMinutes * 60_000 - (now - order.createdAt)) / 60_000));

  const jumpTo = (status: OrderStatus) => {
    if (busy) return;
    if (steps.indexOf(status) - currentIdx > 1) setSkipTo(status);
    else void update(status);
  };

  const runPrimary = () => {
    if (!next || busy) return;
    if (pending) setPayOpen(true);
    else void update(next);
  };

  const titleId = `order-${order.id}-code`;

  return (
    <article
      aria-labelledby={titleId}
      className={cn(
        'relative flex flex-col rounded-3xl transition-shadow duration-700',
        active ? 'bg-white' : 'bg-white/75',
        highlight
          ? 'shadow-glow ring-2 ring-gold'
          : longWait
            ? 'shadow-card ring-1 ring-rattan-light/60'
            : 'shadow-card ring-1 ring-bronze-200/60',
      )}
    >
      {/* Đầu thẻ: mã đơn + thời gian chờ */}
      <header className="flex flex-wrap items-start justify-between gap-2 px-4 pt-4">
        <div className="min-w-0">
          <h3 id={titleId} className="font-display text-[26px] font-extrabold leading-none tracking-tight tabular-nums text-espresso">
            {order.code}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
            <StatusBadge status={order.status} />
            {highlight && (
              <span className="rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-espresso">
                {t('adminOrders.card.justPaid')}
              </span>
            )}
            <span className="text-xs text-stone">{timeInfo}</span>
          </div>
          {order.loyaltyRedeem && <LoyaltyRedeemBadge amount={order.discount} className="mt-2" />}
        </div>
        {active && (
          <span
            className={cn(
              'inline-flex h-8 shrink-0 items-center gap-1 rounded-full px-2.5 font-display text-[13px] font-bold tabular-nums',
              longWait ? 'bg-rattan text-white' : 'bg-bronze-100 text-bronze-800',
            )}
            aria-label={t(longWait ? 'adminOrders.card.longWaitAria' : 'adminOrders.card.waitingAria', { time: elapsedText })}
          >
            {longWait ? <TriangleAlert className="h-3.5 w-3.5" aria-hidden /> : <Clock className="h-3.5 w-3.5" aria-hidden />}
            {longWait ? t('adminOrders.card.longWait', { time: elapsedText }) : elapsedText}
          </span>
        )}
      </header>

      {/* Khách + hình thức nhận */}
      <div className="mt-3 space-y-2.5 px-4">
        <CustomerContact customer={order.customer} compactPhone />
        <FulfillmentInfo order={order} />
      </div>

      {/* Món */}
      <div className={cn('mx-4 mt-3 rounded-2xl bg-cream/70 p-3 ring-1 ring-inset ring-bronze-100', order.status === 'cancelled' && 'opacity-70')}>
        <BaristaItems items={order.items} />
      </div>
      {order.note && <OrderNote note={order.note} className="mx-4 mt-2" />}

      {/* Chân thẻ: tổng tiền + hành động */}
      <div className="mt-auto px-4 pb-4 pt-3">
        <div className="border-t border-dashed border-bronze-200 pt-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-stone">
                {t('adminOrders.card.items', { count: order.itemCount })}
              </p>
              {!discounted && <p className="font-display text-xl font-extrabold tabular-nums text-espresso">{formatPrice(order.total)}</p>}
            </div>
            <PaymentBadge status={order.paymentStatus} />
          </div>
          {/* Đơn có giảm giá (cốc miễn phí): ghi rõ tạm tính / giảm / tổng để thu ngân thu đúng */}
          {discounted && (
            <OrderTotals
              subtotal={order.subtotal}
              deliveryFee={order.deliveryFee}
              discount={order.discount}
              total={order.total}
              showDelivery={order.deliveryFee > 0}
              loyaltyRedeem={order.loyaltyRedeem}
              className="mt-2"
            />
          )}
        </div>

        {pending && (
          <p className="mt-3 flex items-center gap-2 rounded-2xl bg-gold-soft/70 px-3 py-2 text-[13px] font-medium text-bronze-800 ring-1 ring-inset ring-gold/40">
            <QrCode className="h-4 w-4 shrink-0 text-gold-dark" aria-hidden />
            {t('adminOrders.card.awaitingScan', { count: expiresInMin })}
          </p>
        )}

        {active && !pending && (
          <OrderStatusToggles order={order} onSelect={jumpTo} disabled={busy} className="mt-3" />
        )}

        {active && nextLabel && (
          <div className="mt-2 flex items-stretch gap-2">
            <Button
              variant={primary.variant}
              size="lg"
              block
              loading={busy}
              leftIcon={<PrimaryIcon className="h-5 w-5" aria-hidden />}
              onClick={runPrimary}
              className="min-w-0"
            >
              <span className="truncate">{nextLabel}</span>
            </Button>
            <OverflowMenu
              label={t('adminOrders.card.moreActions', { code: order.code })}
              items={[{ label: t('adminOrders.card.cancelThis'), icon: Ban, tone: 'danger', onSelect: () => setCancelOpen(true) }]}
            />
          </div>
        )}

        {order.status === 'cancelled' && (
          <p className="mt-3 rounded-2xl bg-stone-soft/50 px-3 py-2 text-[13px] text-stone">
            <span className="font-semibold text-espresso">{t('adminOrders.card.reason')} </span>
            {cancelReasonText(order) ?? t('adminOrders.card.noReason')}
          </p>
        )}
      </div>

      {/* Hộp thoại */}
      <ConfirmDialog
        open={payOpen}
        title={t('adminOrders.card.payTitle', { amount: formatPrice(order.total) })}
        description={t('adminOrders.card.payBody', { code: order.code, name: order.customer.name })}
        tone="leaf"
        confirmText={t('adminOrders.card.payConfirm')}
        cancelText={t('adminOrders.card.payCancel')}
        loading={paying}
        onCancel={() => setPayOpen(false)}
        onConfirm={() => {
          void confirmPay().then((r) => r && setPayOpen(false));
        }}
      />
      <ConfirmDialog
        open={skipTo !== null}
        title={t('adminOrders.card.skipTitle', { step: skipTo ? shortStepLabel(skipTo) : '' })}
        description={t('adminOrders.card.skipBody')}
        confirmText={t('adminOrders.card.skipConfirm')}
        cancelText={t('adminOrders.card.skipCancel')}
        loading={updating}
        onCancel={() => setSkipTo(null)}
        onConfirm={() => {
          if (!skipTo) return;
          void update(skipTo).then(() => setSkipTo(null));
        }}
      />
      <CancelOrderDialog order={order} open={cancelOpen} onClose={() => setCancelOpen(false)} />
    </article>
  );
}
