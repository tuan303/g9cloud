import { useEffect, useRef, useState } from 'react';
import { Ban, Bike, Check, CircleCheckBig, CircleX, Coffee, Gift, HandCoins, ScanLine, SearchX, ShoppingBag, TriangleAlert } from 'lucide-react';
import { BottomSheet, Button, Card, EmptyState, StatusBadge } from '@/components/ui';
import { OrderItemsList, OrderTotals } from '@/components/order/OrderItemsList';
import { CancelOrderDialog } from '@/components/admin/orders/CancelOrderDialog';
import { CustomerContact, FulfillmentInfo, LoyaltyRedeemBadge, OrderNote } from '@/components/admin/orders/OrderMeta';
import { cancelReasonText } from '@/components/admin/orders/order-filters';
import { APP_CONFIG } from '@/config/app';
import { useAction } from '@/hooks/useAction';
import { useT } from '@/i18n';
import { formatDateTime, formatPrice, formatTime, isSameDay } from '@/lib/format';
import { nextActionLabel, nextStatus, STATUS_META, stepLabel } from '@/lib/order-status';
import { platform } from '@/platform';
import { repo } from '@/services';
import { toast } from '@/store/ui';
import type { Order, OrderStatus } from '@/types';

const AUTO_CLOSE_MS = 1_500;

/** "14:05" nếu trong hôm nay, ngược lại "14:05 · 29/09/2026" */
const timeOf = (ts: number) => (isSameDay(ts, Date.now()) ? formatTime(ts) : formatDateTime(ts));

function nextIcon(order: Order) {
  if (order.status === 'received') return Coffee;
  if (order.status === 'preparing') return order.fulfillment === 'delivery' ? Bike : ShoppingBag;
  return CircleCheckBig;
}

/**
 * Số cốc tích điểm hiện tại của khách (thu ngân xem trước khi thu tiền).
 * null = khách vãng lai / tắt tích điểm / chưa tải xong / lỗi (bỏ qua lặng lẽ).
 * Tải lại khi tình trạng thanh toán đổi (sau khi thu, điểm đã được cộng/trừ).
 */
function useCustomerStamps(order: Order | undefined, open: boolean): number | null {
  const customerId = order && !order.customer.isGuest && APP_CONFIG.loyalty.enabled ? order.customer.id : null;
  const paymentStatus = order?.paymentStatus;
  const [state, setState] = useState<{ id: string; stamps: number } | null>(null);

  useEffect(() => {
    if (!open || !customerId) return;
    let alive = true;
    Promise.resolve()
      .then(() => repo.getLoyalty(customerId))
      .then((acc) => {
        if (alive) setState({ id: customerId, stamps: acc?.stamps ?? 0 });
      })
      .catch(() => {
        if (alive) setState(null);
      });
    return () => {
      alive = false;
    };
  }, [open, customerId, paymentStatus]);

  return state && state.id === customerId ? state.stamps : null;
}

/** Hiệu ứng “đã nhận thanh toán” trước khi bảng tự đóng */
function PaidSuccess({ order }: { order: Order }) {
  const { t } = useT();
  // Mã đơn được tô đậm giữa câu: tách chuỗi dịch tại {code}
  const [before, after = ''] = t('adminScan.sheet.paidBody', { amount: formatPrice(order.total) }).split('{code}');
  const earned = order.loyaltyEarned ?? 0;
  return (
    <div role="status" aria-live="assertive" className="flex flex-col items-center px-2 py-10 text-center">
      <div className="relative flex h-24 w-24 items-center justify-center">
        <span className="absolute inset-0 animate-pulse-ring rounded-full bg-leaf/40" aria-hidden />
        <span className="relative flex h-24 w-24 animate-pop-in items-center justify-center rounded-full bg-leaf text-white shadow-lift" aria-hidden>
          <Check className="h-12 w-12" strokeWidth={3} />
        </span>
      </div>
      <p className="mt-6 font-display text-2xl font-extrabold tracking-tight text-espresso">{t('adminScan.sheet.paidTitle')}</p>
      <p className="mt-1.5 max-w-xs text-sm text-stone">
        {before}
        <strong className="font-semibold text-espresso">{order.code}</strong>
        {after}
      </p>
      {(earned > 0 || order.loyaltyRedeem) && (
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {order.loyaltyRedeem && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gold px-3 py-1 text-xs font-bold text-espresso">
              <Gift className="h-3.5 w-3.5" aria-hidden />
              {t('loyalty.redeemed')}
            </span>
          )}
          {earned > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-soft px-3 py-1 text-xs font-bold text-bronze-800 ring-1 ring-inset ring-gold/50">
              <Coffee className="h-3.5 w-3.5" aria-hidden />
              {t('loyalty.earned', { count: earned })}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Bảng kết quả sau khi quét / nhập mã: thông tin đơn, món, tổng tiền lớn
 * và hành động phù hợp trạng thái (xác nhận thu tiền, chuyển bước kế tiếp...).
 * Trên màn hình md+ hiển thị như bảng nổi ở giữa.
 */
export function ScanResultSheet({ order, open, onClose }: { order: Order | undefined; open: boolean; onClose: () => void }) {
  const { t } = useT();
  const [paidNow, setPaidNow] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) {
      setPaidNow(false);
      setCancelOpen(false);
    }
  }, [open]);

  const [confirm, confirming] = useAction((id: string) => repo.confirmPayment(id));
  const [advance, advancing] = useAction(async (id: string, status: OrderStatus) => {
    const o = await repo.updateOrderStatus(id, status, 'staff');
    toast(`${o.code} · ${stepLabel(o.status, o.fulfillment)}`, 'success');
    return o;
  });

  // Thành công → rung, tự đóng sau ~1,5 giây và quét tiếp
  useEffect(() => {
    if (!paidNow) return;
    platform.vibrate([60, 40, 120]);
    const t = window.setTimeout(() => onCloseRef.current(), AUTO_CLOSE_MS);
    return () => window.clearTimeout(t);
  }, [paidNow]);

  const handleConfirm = async () => {
    if (!order || confirming) return;
    const res = await confirm(order.id);
    if (res) setPaidNow(true);
  };

  const pending = order?.status === 'pending_payment';
  const next = order ? nextStatus(order) : null;
  const nextLabel = order ? nextActionLabel(order) : null;
  const NextIcon = order ? nextIcon(order) : CircleCheckBig;

  // Tích điểm: số cốc hiện có của khách + cảnh báo nếu đơn đổi cốc miễn phí mà khách chưa đủ điểm
  const per = APP_CONFIG.loyalty.cupsPerReward;
  const stamps = useCustomerStamps(order, open);
  const redeemShort = !!order?.loyaltyRedeem && pending && (order.customer.isGuest || (stamps !== null && stamps < per));

  const scanNextButton = (
    <Button variant="outline" block leftIcon={<ScanLine className="h-5 w-5" />} onClick={onClose}>
      {t('adminScan.sheet.scanAnother')}
    </Button>
  );

  let footer: JSX.Element | undefined;
  if (!paidNow) {
    if (!order) footer = scanNextButton;
    else if (pending)
      footer = (
        <div className="space-y-2">
          <Button
            variant="leaf"
            size="lg"
            block
            loading={confirming}
            leftIcon={<HandCoins className="h-6 w-6" aria-hidden />}
            onClick={() => void handleConfirm()}
            className="h-16 text-[17px]"
          >
            {t('adminScan.sheet.confirm', { amount: formatPrice(order.total) })}
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="danger" leftIcon={<Ban className="h-4 w-4" aria-hidden />} onClick={() => setCancelOpen(true)} disabled={confirming}>
              {t('adminScan.sheet.cancel')}
            </Button>
            <Button variant="outline" leftIcon={<ScanLine className="h-4 w-4" aria-hidden />} onClick={onClose} disabled={confirming}>
              {t('adminScan.sheet.scanAnother')}
            </Button>
          </div>
        </div>
      );
    else
      footer = (
        <div className="space-y-2">
          {next && nextLabel && (
            <Button
              size="lg"
              block
              variant={order.status === 'ready' || order.status === 'delivering' ? 'leaf' : 'primary'}
              loading={advancing}
              leftIcon={<NextIcon className="h-5 w-5" aria-hidden />}
              onClick={() => void advance(order.id, next)}
            >
              {nextLabel}
            </Button>
          )}
          {scanNextButton}
        </div>
      );
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={paidNow ? undefined : t(pending ? 'adminScan.sheet.titlePay' : 'adminScan.sheet.titleInfo')}
      dismissible={!paidNow && !confirming}
      footer={footer}
      className="md:bottom-6 md:max-w-lg md:rounded-[28px]"
    >
      {!order ? (
        <EmptyState
          icon={<SearchX className="h-9 w-9" />}
          title={t('adminScan.sheet.notFoundTitle')}
          description={t('adminScan.sheet.notFoundBody')}
          className="py-8"
        />
      ) : paidNow ? (
        <PaidSuccess order={order} />
      ) : (
        <div className="space-y-4 pb-1">
          {/* Mã đơn + trạng thái */}
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-bronze-600">{t('adminScan.sheet.code')}</p>
              <p className="font-display text-4xl font-extrabold leading-tight tracking-tight tabular-nums text-espresso">{order.code}</p>
              <p className="text-xs text-stone">{t('adminScan.sheet.orderedAt', { time: timeOf(order.createdAt) })}</p>
            </div>
            <StatusBadge status={order.status} className="mb-1 shrink-0" />
          </div>
          {order.loyaltyRedeem && <LoyaltyRedeemBadge amount={order.discount} className="text-[13px]" />}

          {/* Đơn đổi cốc miễn phí nhưng khách chưa đủ điểm — xác nhận thu sẽ bị từ chối */}
          {redeemShort && (
            <div role="alert" className="flex items-start gap-3 rounded-2xl bg-rattan-soft px-4 py-3 text-sm ring-1 ring-inset ring-rattan-light/60">
              <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-rattan" aria-hidden />
              <p className="font-semibold text-rattan-dark">
                {order.customer.isGuest ? t('errors.loyaltyGuest') : t('errors.loyaltyNotEnough', { cups: per })}
              </p>
            </div>
          )}

          {/* Tình trạng thanh toán */}
          {order.status === 'cancelled' ? (
            <div className="flex items-start gap-3 rounded-2xl bg-stone-soft/50 px-4 py-3 ring-1 ring-inset ring-stone-light/30">
              <CircleX className="mt-0.5 h-5 w-5 shrink-0 text-stone" aria-hidden />
              <div className="text-sm">
                <p className="font-semibold text-espresso">{t('adminScan.sheet.cancelledAt', { time: timeOf(order.updatedAt) })}</p>
                <p className="mt-0.5 text-stone">
                  {t('adminScan.sheet.reason', { reason: cancelReasonText(order) ?? t('adminOrders.card.noReason') })}
                </p>
                {order.paymentStatus === 'refunded' && (
                  <p className="mt-1 font-semibold text-rattan-dark">{t('adminScan.sheet.refund', { amount: formatPrice(order.total) })}</p>
                )}
              </div>
            </div>
          ) : !pending && order.paidAt ? (
            <div className="flex items-start gap-3 rounded-2xl bg-leaf-soft px-4 py-3 ring-1 ring-inset ring-leaf-light/50">
              <CircleCheckBig className="mt-0.5 h-5 w-5 shrink-0 text-leaf-dark" aria-hidden />
              <div className="text-sm text-leaf-dark">
                <p className="font-semibold">{t('adminScan.sheet.paidAt', { time: timeOf(order.paidAt) })}</p>
                <p className="mt-0.5">
                  {order.status === 'completed'
                    ? t('adminScan.sheet.completedAt', { time: timeOf(order.updatedAt) })
                    : t('adminScan.sheet.current', { status: STATUS_META[order.status].label })}
                </p>
              </div>
            </div>
          ) : null}

          {/* Khách + hình thức nhận */}
          <Card className="space-y-3 p-4">
            <CustomerContact customer={order.customer} />
            {stamps !== null && (
              <p className="flex items-center gap-2 rounded-2xl bg-gold-soft/60 px-3 py-2 text-[13px] font-medium text-bronze-800 ring-1 ring-inset ring-gold/40">
                <Coffee className="h-4 w-4 shrink-0 text-gold-dark" aria-hidden />
                {t('loyalty.customerStamps', { count: Math.max(0, stamps), rewards: Math.floor(Math.max(0, stamps) / per) })}
              </p>
            )}
            <FulfillmentInfo order={order} />
          </Card>

          {/* Món (+ chi tiết giảm giá khi đơn dùng cốc miễn phí) */}
          <Card className="px-4 py-1">
            <OrderItemsList lines={order.items} />
            {order.discount > 0 && (
              <OrderTotals
                subtotal={order.subtotal}
                deliveryFee={order.deliveryFee}
                discount={order.discount}
                total={order.total}
                showDelivery={order.deliveryFee > 0}
                loyaltyRedeem={order.loyaltyRedeem}
                className="border-t border-bronze-100 pb-3 pt-3"
              />
            )}
          </Card>
          {order.note && <OrderNote note={order.note} />}

          {/* Tổng tiền */}
          <div className="flex items-center justify-between gap-4 rounded-3xl bg-espresso px-5 py-4 text-cream shadow-card">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold">
                {t(pending ? 'adminScan.sheet.toCollect' : order.status === 'cancelled' ? 'adminScan.sheet.orderTotal' : 'adminScan.sheet.collected')}
              </p>
              <p className="mt-0.5 text-xs text-cream/70">
                {t('adminScan.sheet.items', { count: order.itemCount })}
                {order.deliveryFee ? ` · ${t('adminScan.sheet.deliveryFee', { fee: formatPrice(order.deliveryFee) })}` : ''}
              </p>
            </div>
            <p className="font-display text-3xl font-extrabold tabular-nums text-gold-light">{formatPrice(order.total)}</p>
          </div>
        </div>
      )}

      {order && <CancelOrderDialog order={order} open={cancelOpen} onClose={() => setCancelOpen(false)} />}
    </BottomSheet>
  );
}
