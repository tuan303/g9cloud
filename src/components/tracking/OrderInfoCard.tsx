import type { ReactNode } from 'react';
import { Bike, Clock, StickyNote, Store, UserRound, Wallet, type LucideIcon } from 'lucide-react';
import { APP_CONFIG } from '@/config/app';
import { Card } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatDateTime, formatTime } from '@/lib/format';
import type { Order, PaymentMethod, PaymentStatus } from '@/types';

const PAYMENT_STATUS: Record<PaymentStatus, { label: string; className: string }> = {
  paid: { label: 'Đã thanh toán', className: 'bg-leaf-soft text-leaf-dark ring-leaf-light/60' },
  unpaid: { label: 'Chưa thanh toán', className: 'bg-gold-soft text-bronze-800 ring-gold/60' },
  refunded: { label: 'Đã hoàn tiền', className: 'bg-stone-soft text-stone ring-stone-light/40' },
};

const PAYMENT_METHOD: Record<PaymentMethod, string> = {
  qr_pos: 'Quét mã QR tại quầy',
  vietqr: 'Chuyển khoản VietQR',
};

function InfoRow({ icon: Icon, label, children, sub }: { icon: LucideIcon; label: string; children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3.5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-bronze-50 text-bronze-600 ring-1 ring-inset ring-bronze-100">
        <Icon className="h-[18px] w-[18px]" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-stone">{label}</p>
        <div className="mt-0.5 break-words text-[15px] font-semibold leading-snug text-espresso">{children}</div>
        {sub && <p className="mt-0.5 text-[13px] leading-snug text-stone">{sub}</p>}
      </div>
    </div>
  );
}

/** Thông tin nhận món, người đặt, thời gian, thanh toán, ghi chú */
export function OrderInfoCard({ order, className }: { order: Order; className?: string }) {
  const { pickup, delivery } = APP_CONFIG.fulfillment;
  const isDelivery = order.fulfillment === 'delivery';
  const pay = PAYMENT_STATUS[order.paymentStatus];
  const c = order.customer;
  const contact = [c.phone, c.studentId && `Mã HS/NV: ${c.studentId}`].filter(Boolean).join(' · ');

  let paySub = PAYMENT_METHOD[order.paymentMethod];
  if (order.paymentStatus === 'paid' && order.paidAt) paySub = `${paySub} · lúc ${formatTime(order.paidAt)}`;
  if (order.paymentStatus === 'unpaid') {
    paySub = order.status === 'cancelled' ? 'Đơn đã huỷ trước khi thanh toán' : 'Đưa mã QR cho thu ngân để thanh toán';
  }

  return (
    <Card className={cn('divide-y divide-bronze-100 px-4 py-1', className)}>
      <InfoRow
        icon={isDelivery ? Bike : Store}
        label="Hình thức nhận"
        sub={isDelivery ? delivery.label : `${APP_CONFIG.shop.name} · ${APP_CONFIG.shop.location}`}
      >
        {isDelivery ? `Giao đến ${order.deliveryAddress || 'địa chỉ của bạn'}` : pickup.label}
      </InfoRow>
      <InfoRow icon={UserRound} label="Người đặt" sub={contact || undefined}>
        {c.name || 'Khách'}
      </InfoRow>
      <InfoRow icon={Clock} label="Thời gian đặt">
        <span className="tabular-nums">{formatDateTime(order.createdAt)}</span>
      </InfoRow>
      <InfoRow icon={Wallet} label="Thanh toán" sub={paySub}>
        <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-[13px] font-semibold ring-1 ring-inset', pay.className)}>{pay.label}</span>
      </InfoRow>
      {order.note && (
        <InfoRow icon={StickyNote} label="Ghi chú">
          <span className="font-medium italic text-rattan-dark">“{order.note}”</span>
        </InfoRow>
      )}
    </Card>
  );
}
