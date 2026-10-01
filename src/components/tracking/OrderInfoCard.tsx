import type { ReactNode } from 'react';
import { Bike, Clock, Coffee, Gift, StickyNote, Store, UserRound, Wallet, type LucideIcon } from 'lucide-react';
import { APP_CONFIG } from '@/config/app';
import { Card } from '@/components/ui';
import { pick, useT, type MessageKey } from '@/i18n';
import { cn } from '@/lib/cn';
import { formatDateTime, formatTime } from '@/lib/format';
import type { Order, PaymentMethod, PaymentStatus } from '@/types';

const PAYMENT_STATUS: Record<PaymentStatus, { label: MessageKey; className: string }> = {
  paid: { label: 'orderStatus.info.paid', className: 'bg-leaf-soft text-leaf-dark ring-leaf-light/60' },
  unpaid: { label: 'orderStatus.info.unpaid', className: 'bg-gold-soft text-bronze-800 ring-gold/60' },
  refunded: { label: 'orderStatus.info.refunded', className: 'bg-stone-soft text-stone ring-stone-light/40' },
};

const PAYMENT_METHOD: Record<PaymentMethod, MessageKey> = {
  qr_pos: 'orderStatus.info.methodQrPos',
  vietqr: 'orderStatus.info.methodVietQr',
};

/** Nhãn tích điểm nhỏ (vàng) cạnh trạng thái thanh toán */
function LoyaltyBadge({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gold/20 px-2 py-0.5 text-xs font-semibold text-bronze-800 ring-1 ring-inset ring-gold/50">
      <Icon className="h-3.5 w-3.5 text-bronze-700" aria-hidden />
      {children}
    </span>
  );
}

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
  const { t } = useT();
  const { shop } = APP_CONFIG;
  const isDelivery = order.fulfillment === 'delivery';
  const pay = PAYMENT_STATUS[order.paymentStatus];
  const c = order.customer;
  const contact = [c.phone, c.studentId && t('orderStatus.info.studentId', { id: c.studentId })].filter(Boolean).join(' · ');

  let paySub = t(PAYMENT_METHOD[order.paymentMethod]);
  if (order.paymentStatus === 'paid' && order.paidAt) paySub = t('orderStatus.info.paidAt', { method: paySub, time: formatTime(order.paidAt) });
  if (order.paymentStatus === 'unpaid') {
    paySub = t(order.status === 'cancelled' ? 'orderStatus.info.cancelledUnpaid' : 'orderStatus.info.showQr');
  }

  // Tích điểm: số cốc được cộng (chỉ khi đã thanh toán) / đơn dùng cốc miễn phí (đơn huỷ đã được hoàn điểm → ẩn)
  const earned = order.paymentStatus === 'paid' ? (order.loyaltyEarned ?? 0) : 0;
  const redeemed = !!order.loyaltyRedeem && order.status !== 'cancelled';

  return (
    <Card className={cn('divide-y divide-bronze-100 px-4 py-1', className)}>
      <InfoRow
        icon={isDelivery ? Bike : Store}
        label={t('orderStatus.info.fulfillment')}
        sub={isDelivery ? t('fulfillment.delivery') : `${shop.name} · ${pick(shop.location, shop.locationEn)}`}
      >
        {isDelivery
          ? t('orderStatus.info.deliverTo', { address: order.deliveryAddress || t('orderStatus.info.yourAddress') })
          : t('fulfillment.pickup')}
      </InfoRow>
      <InfoRow icon={UserRound} label={t('orderStatus.info.customer')} sub={contact || undefined}>
        {c.name || t('orderStatus.info.guest')}
      </InfoRow>
      <InfoRow icon={Clock} label={t('orderStatus.info.orderedAt')}>
        <span className="tabular-nums">{formatDateTime(order.createdAt)}</span>
      </InfoRow>
      <InfoRow icon={Wallet} label={t('orderStatus.info.payment')} sub={paySub}>
        <span className="flex flex-wrap items-center gap-1.5">
          <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-[13px] font-semibold ring-1 ring-inset', pay.className)}>
            {t(pay.label)}
          </span>
          {earned > 0 && <LoyaltyBadge icon={Coffee}>{t('loyalty.earned', { count: earned })}</LoyaltyBadge>}
          {redeemed && <LoyaltyBadge icon={Gift}>{t('loyalty.redeemed')}</LoyaltyBadge>}
        </span>
      </InfoRow>
      {order.note && (
        <InfoRow icon={StickyNote} label={t('orderStatus.info.note')}>
          <span className="font-medium italic text-rattan-dark">“{order.note}”</span>
        </InfoRow>
      )}
    </Card>
  );
}
