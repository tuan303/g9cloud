import { CircleX, RotateCcw, TimerOff } from 'lucide-react';
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
  const Icon = expired ? TimerOff : CircleX;
  const cancelEvent = [...order.statusHistory].reverse().find((e) => e.status === 'cancelled');
  const at = cancelEvent ? ` lúc ${formatTime(cancelEvent.at)}` : '';
  const staffReason = order.cancelReason && order.cancelReason !== 'Quán huỷ đơn' ? `: ${order.cancelReason}` : '';
  const description = expired
    ? 'Đơn chưa được thanh toán kịp nên mã không còn dùng được. Bạn có thể đặt lại ngay với các món cũ.'
    : cancelEvent?.by === 'customer'
      ? `Bạn đã huỷ đơn này${at}. Muốn gọi lại các món cũ? Chỉ một chạm thôi.`
      : order.paymentStatus === 'refunded'
        ? `Quán đã huỷ đơn${at}${staffReason}. Khoản đã thanh toán sẽ được hoàn lại tại quầy.`
        : `Quán đã huỷ đơn${at}${staffReason}. Nếu cần hỗ trợ, bạn hỏi thu ngân nhé.`;

  return (
    <div className="px-4 pb-10 pt-8">
      <div className="flex flex-col items-center text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-bronze-100 text-bronze-500 ring-8 ring-bronze-50">
          <Icon className="h-9 w-9" aria-hidden />
        </span>
        <h2 className="mt-5 font-display text-xl font-extrabold tracking-tight text-espresso">
          {expired ? 'Mã QR đã hết hạn' : 'Đơn hàng đã huỷ'}
        </h2>
        <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-stone">{description}</p>
        <p className="mt-3 rounded-full bg-bronze-100 px-3 py-1 font-display text-sm font-bold text-bronze-700">{order.code}</p>
      </div>

      <Card className="mt-6 px-4 py-2">
        <OrderItemsList lines={order.items} compact />
      </Card>

      <div className="mt-6 space-y-2">
        <Button size="lg" block loading={reordering} onClick={onReorder} leftIcon={<RotateCcw className="h-5 w-5" aria-hidden />}>
          Đặt lại đơn này
        </Button>
        <Button variant="ghost" block onClick={onHome}>
          Về thực đơn
        </Button>
      </div>
    </div>
  );
}
