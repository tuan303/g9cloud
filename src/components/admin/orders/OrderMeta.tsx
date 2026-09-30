import type { LucideIcon } from 'lucide-react';
import { Bike, CircleCheckBig, MessageSquareText, Phone, RotateCcw, Store, Wallet } from 'lucide-react';
import { cn } from '@/lib/cn';
import { initials, normalizePhone } from '@/lib/format';
import { platform } from '@/platform';
import type { CustomerInfo, Order, PaymentStatus } from '@/types';
import { formatPhoneDisplay } from './order-filters';

const PAYMENT_META: Record<PaymentStatus, { label: string; icon: LucideIcon; className: string }> = {
  paid: { label: 'Đã thanh toán', icon: CircleCheckBig, className: 'bg-leaf-soft text-leaf-dark ring-leaf-light/60' },
  unpaid: { label: 'Chưa thanh toán', icon: Wallet, className: 'bg-gold-soft text-bronze-800 ring-gold/60' },
  refunded: { label: 'Đã hoàn tiền', icon: RotateCcw, className: 'bg-stone-soft/60 text-stone ring-stone-light/40' },
};

/** Nhãn tình trạng thanh toán của đơn */
export function PaymentBadge({ status, className }: { status: PaymentStatus; className?: string }) {
  const m = PAYMENT_META[status];
  const Icon = m.icon;
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset', m.className, className)}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {m.label}
    </span>
  );
}

/**
 * Tên khách + nút gọi nhanh. `compactPhone`: ẩn số (chỉ còn icon) ở khoảng md–lg,
 * khi thẻ đơn hẹp nhất trong lưới 2 cột cạnh thanh bên.
 */
export function CustomerContact({
  customer,
  compactPhone,
  className,
}: {
  customer: CustomerInfo;
  compactPhone?: boolean;
  className?: string;
}) {
  const phone = customer.phone?.trim();
  const dial = phone ? normalizePhone(phone) : '';
  const sub = customer.isGuest
    ? 'Khách vãng lai'
    : customer.studentId
      ? `Mã HS/NV: ${customer.studentId}`
      : customer.email || 'Tài khoản trường';
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span
        aria-hidden
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-bronze-100 font-display text-[13px] font-bold text-bronze-700"
      >
        {initials(customer.name)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold leading-tight text-espresso">{customer.name}</p>
        <p className="mt-0.5 truncate text-xs text-stone">{sub}</p>
      </div>
      {phone && (
        <a
          href={`tel:${dial}`}
          onClick={(e) => {
            e.preventDefault();
            platform.call(dial);
          }}
          aria-label={`Gọi ${customer.name}: ${formatPhoneDisplay(phone)}`}
          className={cn(
            'inline-flex h-11 min-w-[44px] shrink-0 items-center justify-center gap-1.5 rounded-full bg-leaf-soft px-3.5 text-sm font-semibold tabular-nums text-leaf-dark',
            'ring-1 ring-inset ring-leaf-light/50 transition hover:bg-leaf hover:text-white active:scale-95',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
            compactPhone && 'md:px-0 lg:px-3.5',
          )}
        >
          <Phone className="h-4 w-4" aria-hidden />
          <span className={cn(compactPhone && 'md:hidden lg:inline')}>{formatPhoneDisplay(phone)}</span>
        </a>
      )}
    </div>
  );
}

/** Hình thức nhận: chip “Tại quầy”, hoặc khối địa chỉ giao nổi bật */
export function FulfillmentInfo({
  order,
  className,
}: {
  order: Pick<Order, 'fulfillment' | 'deliveryAddress'>;
  className?: string;
}) {
  if (order.fulfillment === 'delivery') {
    return (
      <div className={cn('flex items-start gap-3 rounded-2xl bg-gold-soft/70 px-3 py-2.5 ring-1 ring-inset ring-gold/50', className)}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold text-espresso" aria-hidden>
          <Bike className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-bronze-700">Giao đến</p>
          <p className="break-words font-display text-base font-bold leading-snug text-espresso">
            {order.deliveryAddress || 'Chưa có địa chỉ — gọi khách để hỏi'}
          </p>
        </div>
      </div>
    );
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-bronze-50 px-3 py-1.5 text-xs font-semibold text-bronze-700 ring-1 ring-inset ring-bronze-200',
        className,
      )}
    >
      <Store className="h-3.5 w-3.5" aria-hidden />
      Tại quầy
    </span>
  );
}

/** Ghi chú chung của cả đơn */
export function OrderNote({ note, className }: { note: string; className?: string }) {
  return (
    <p className={cn('flex items-start gap-2 rounded-2xl bg-rattan-soft/60 px-3 py-2 text-[13px] leading-snug text-rattan-dark', className)}>
      <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span>
        <span className="font-semibold">Ghi chú đơn: </span>
        <span className="italic">“{note}”</span>
      </span>
    </p>
  );
}
