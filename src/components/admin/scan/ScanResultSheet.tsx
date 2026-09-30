import { useEffect, useRef, useState } from 'react';
import { Ban, Bike, Check, CircleCheckBig, CircleX, Coffee, HandCoins, ScanLine, SearchX, ShoppingBag } from 'lucide-react';
import { BottomSheet, Button, Card, EmptyState, StatusBadge } from '@/components/ui';
import { OrderItemsList } from '@/components/order/OrderItemsList';
import { CancelOrderDialog } from '@/components/admin/orders/CancelOrderDialog';
import { CustomerContact, FulfillmentInfo, OrderNote } from '@/components/admin/orders/OrderMeta';
import { useAction } from '@/hooks/useAction';
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

/** Hiệu ứng “đã nhận thanh toán” trước khi bảng tự đóng */
function PaidSuccess({ order }: { order: Order }) {
  return (
    <div role="status" aria-live="assertive" className="flex flex-col items-center px-2 py-10 text-center">
      <div className="relative flex h-24 w-24 items-center justify-center">
        <span className="absolute inset-0 animate-pulse-ring rounded-full bg-leaf/40" aria-hidden />
        <span className="relative flex h-24 w-24 animate-pop-in items-center justify-center rounded-full bg-leaf text-white shadow-lift" aria-hidden>
          <Check className="h-12 w-12" strokeWidth={3} />
        </span>
      </div>
      <p className="mt-6 font-display text-2xl font-extrabold tracking-tight text-espresso">Đã nhận thanh toán!</p>
      <p className="mt-1.5 max-w-xs text-sm text-stone">
        Đơn <strong className="font-semibold text-espresso">{order.code}</strong> · {formatPrice(order.total)} đã được chuyển sang quầy pha
        chế.
      </p>
    </div>
  );
}

/**
 * Bảng kết quả sau khi quét / nhập mã: thông tin đơn, món, tổng tiền lớn
 * và hành động phù hợp trạng thái (xác nhận thu tiền, chuyển bước kế tiếp...).
 * Trên màn hình md+ hiển thị như bảng nổi ở giữa.
 */
export function ScanResultSheet({ order, open, onClose }: { order: Order | undefined; open: boolean; onClose: () => void }) {
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

  const scanNextButton = (
    <Button variant="outline" block leftIcon={<ScanLine className="h-5 w-5" />} onClick={onClose}>
      Quét đơn khác
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
            Xác nhận đã thu {formatPrice(order.total)}
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="danger" leftIcon={<Ban className="h-4 w-4" aria-hidden />} onClick={() => setCancelOpen(true)} disabled={confirming}>
              Huỷ đơn
            </Button>
            <Button variant="outline" leftIcon={<ScanLine className="h-4 w-4" aria-hidden />} onClick={onClose} disabled={confirming}>
              Quét đơn khác
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
      title={paidNow ? undefined : pending ? 'Thu tiền tại quầy' : 'Thông tin đơn'}
      dismissible={!paidNow && !confirming}
      footer={footer}
      className="md:bottom-6 md:max-w-lg md:rounded-[28px]"
    >
      {!order ? (
        <EmptyState
          icon={<SearchX className="h-9 w-9" />}
          title="Không tìm thấy đơn"
          description="Đơn có thể đã bị xoá. Hãy quét lại hoặc nhập mã đơn."
          className="py-8"
        />
      ) : paidNow ? (
        <PaidSuccess order={order} />
      ) : (
        <div className="space-y-4 pb-1">
          {/* Mã đơn + trạng thái */}
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-bronze-600">Mã đơn</p>
              <p className="font-display text-4xl font-extrabold leading-tight tracking-tight tabular-nums text-espresso">{order.code}</p>
              <p className="text-xs text-stone">Đặt lúc {timeOf(order.createdAt)}</p>
            </div>
            <StatusBadge status={order.status} className="mb-1 shrink-0" />
          </div>

          {/* Tình trạng thanh toán */}
          {order.status === 'cancelled' ? (
            <div className="flex items-start gap-3 rounded-2xl bg-stone-soft/50 px-4 py-3 ring-1 ring-inset ring-stone-light/30">
              <CircleX className="mt-0.5 h-5 w-5 shrink-0 text-stone" aria-hidden />
              <div className="text-sm">
                <p className="font-semibold text-espresso">Đơn đã bị huỷ lúc {timeOf(order.updatedAt)}</p>
                <p className="mt-0.5 text-stone">Lý do: {order.cancelReason || 'Không ghi lý do'}</p>
                {order.paymentStatus === 'refunded' && (
                  <p className="mt-1 font-semibold text-rattan-dark">Đơn đã thu tiền trước khi huỷ — hoàn {formatPrice(order.total)} cho khách.</p>
                )}
              </div>
            </div>
          ) : !pending && order.paidAt ? (
            <div className="flex items-start gap-3 rounded-2xl bg-leaf-soft px-4 py-3 ring-1 ring-inset ring-leaf-light/50">
              <CircleCheckBig className="mt-0.5 h-5 w-5 shrink-0 text-leaf-dark" aria-hidden />
              <div className="text-sm text-leaf-dark">
                <p className="font-semibold">Đơn này đã được thanh toán lúc {timeOf(order.paidAt)}</p>
                <p className="mt-0.5">
                  {order.status === 'completed'
                    ? `Đã hoàn thành lúc ${timeOf(order.updatedAt)}.`
                    : `Hiện tại: ${STATUS_META[order.status].label}. Không cần thu thêm.`}
                </p>
              </div>
            </div>
          ) : null}

          {/* Khách + hình thức nhận */}
          <Card className="space-y-3 p-4">
            <CustomerContact customer={order.customer} />
            <FulfillmentInfo order={order} />
          </Card>

          {/* Món */}
          <Card className="px-4 py-1">
            <OrderItemsList lines={order.items} />
          </Card>
          {order.note && <OrderNote note={order.note} />}

          {/* Tổng tiền */}
          <div className="flex items-center justify-between gap-4 rounded-3xl bg-espresso px-5 py-4 text-cream shadow-card">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold">
                {pending ? 'Cần thu' : order.status === 'cancelled' ? 'Tổng đơn' : 'Đã thu'}
              </p>
              <p className="mt-0.5 text-xs text-cream/70">
                {order.itemCount} món{order.deliveryFee ? ` · phí giao ${formatPrice(order.deliveryFee)}` : ''}
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
