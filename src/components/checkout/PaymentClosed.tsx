import { CircleX, RotateCcw, TimerOff } from 'lucide-react';
import { useT } from '@/i18n';
import { customerCancelReason } from '@/lib/cancel-reason';
import { formatTime } from '@/lib/format';
import { Button, Card } from '@/components/ui';
import { OrderItemsList } from '@/components/order/OrderItemsList';
import type { Order } from '@/types';

/** Mã QR hết hạn hoặc đơn đã huỷ → mời khách đặt lại nhanh với cùng các món */
export function PaymentClosed({
  order,
  expired,
  reordering,
  onReorder,
  onHome,
}: {
  order: Order;
  /** true = hết hạn thanh toán; false = đơn bị huỷ vì lý do khác */
  expired: boolean;
  reordering?: boolean;
  onReorder: () => void;
  onHome: () => void;
}) {
  const { t } = useT();
  const Icon = expired ? TimerOff : CircleX;
  const cancelEvent = [...order.statusHistory].reverse().find((e) => e.status === 'cancelled');
  const at = cancelEvent ? t('payment.closed.at', { time: formatTime(cancelEvent.at) }) : '';
  // Lý do lưu theo ngôn ngữ của người huỷ → dịch lại; lý do mặc định "Quán huỷ đơn" không cần nhắc lại
  const reasonText = customerCancelReason(order);
  const staffReason = reasonText ? `: ${reasonText}` : '';
  const description = expired
    ? t('payment.closed.expiredBody')
    : cancelEvent?.by === 'customer'
      ? t('payment.closed.customerBody', { at })
      : order.paymentStatus === 'refunded'
        ? t('payment.closed.refundedBody', { at, reason: staffReason })
        : t('payment.closed.staffBody', { at, reason: staffReason });

  return (
    <div className="px-4 pb-10 pt-8">
      <div className="flex flex-col items-center text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-bronze-100 text-bronze-500 ring-8 ring-bronze-50">
          <Icon className="h-9 w-9" aria-hidden />
        </span>
        <h2 className="mt-5 font-display text-xl font-extrabold tracking-tight text-espresso">
          {expired ? t('payment.closed.expiredTitle') : t('payment.closed.cancelledTitle')}
        </h2>
        <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-stone">{description}</p>
        <p className="mt-3 rounded-full bg-bronze-100 px-3 py-1 font-display text-sm font-bold text-bronze-700">{order.code}</p>
      </div>

      <Card className="mt-6 px-4 py-2">
        <OrderItemsList lines={order.items} compact />
      </Card>

      <div className="mt-6 space-y-2">
        <Button size="lg" block loading={reordering} onClick={onReorder} leftIcon={<RotateCcw className="h-5 w-5" aria-hidden />}>
          {t('payment.closed.reorder')}
        </Button>
        <Button variant="ghost" block onClick={onHome}>
          {t('common.backToMenu')}
        </Button>
      </div>
    </div>
  );
}
