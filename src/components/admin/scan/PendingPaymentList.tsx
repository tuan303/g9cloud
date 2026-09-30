import { Bike, ChevronRight, Store, Wallet } from 'lucide-react';
import { APP_CONFIG } from '@/config/app';
import { EmptyState, Skeleton } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatPrice } from '@/lib/format';
import type { Order } from '@/types';

/**
 * Danh sách đơn đang chờ thanh toán — thu ngân chạm vào đơn để xác nhận
 * mà không cần camera (khách đọc mã / tên).
 */
export function PendingPaymentList({
  orders,
  now,
  loading,
  onSelect,
  className,
}: {
  orders: Order[];
  now: number;
  loading?: boolean;
  onSelect: (order: Order) => void;
  className?: string;
}) {
  const expiryMs = APP_CONFIG.payment.qrExpiryMinutes * 60_000;

  return (
    <div className={className}>
      <div className="mb-1 flex items-center justify-between gap-3 px-1">
        <h2 id="pending-payment-title" className="flex items-center gap-2 font-display text-lg font-bold tracking-tight text-espresso">
          Đang chờ thanh toán
          {orders.length > 0 && (
            <span className="min-w-[22px] rounded-full bg-gold px-1.5 text-center text-xs font-bold leading-[22px] text-espresso">{orders.length}</span>
          )}
        </h2>
        <span className="flex shrink-0 items-center gap-1.5 text-xs text-stone">
          <span className="relative flex h-2 w-2" aria-hidden>
            <span className="absolute inset-0 animate-ping rounded-full bg-leaf/60" />
            <span className="relative h-2 w-2 rounded-full bg-leaf" />
          </span>
          Tự cập nhật
        </span>
      </div>
      <p className="mb-3 px-1 text-[13px] text-stone">Không quét được? Hỏi mã đơn hoặc tên khách rồi chạm vào đơn để thu tiền.</p>

      {loading ? (
        <div className="space-y-2.5" aria-busy="true" aria-label="Đang tải đơn">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-[76px] rounded-2xl" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-bronze-200 bg-white/40">
          <EmptyState
            icon={<Wallet className="h-9 w-9" />}
            title="Không có đơn chờ thanh toán"
            description="Đơn khách vừa đặt sẽ hiện ở đây ngay lập tức."
            className="py-10"
          />
        </div>
      ) : (
        <ul className="space-y-2.5" aria-labelledby="pending-payment-title">
          {orders.map((o) => {
            const left = expiryMs - (now - o.createdAt);
            const leftMin = Math.max(0, Math.ceil(left / 60_000));
            const urgent = left < 3 * 60_000;
            const FIcon = o.fulfillment === 'delivery' ? Bike : Store;
            return (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => onSelect(o)}
                  className={cn(
                    'group relative flex min-h-[76px] w-full items-center gap-3 overflow-hidden rounded-2xl bg-white py-3 pl-4 pr-3 text-left shadow-card',
                    'ring-1 ring-bronze-200/60 transition hover:ring-gold active:scale-[.99]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
                  )}
                >
                  <span className={cn('absolute inset-y-3 left-0 w-1 rounded-r-full', urgent ? 'bg-rattan' : 'bg-gold')} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-display text-lg font-extrabold tracking-tight tabular-nums text-espresso">{o.code}</span>
                      <span className="font-display text-base font-bold tabular-nums text-espresso">{formatPrice(o.total)}</span>
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-2 text-xs">
                      <span className="flex min-w-0 items-center gap-1 text-stone">
                        <FIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        <span className="sr-only">{o.fulfillment === 'delivery' ? 'Giao tận nơi,' : 'Tại quầy,'}</span>
                        <span className="truncate">
                          {o.customer.name} · {o.itemCount} món
                        </span>
                      </span>
                      <span className={cn('shrink-0 font-semibold tabular-nums', urgent ? 'text-rattan' : 'text-bronze-600')}>
                        {leftMin > 0 ? `Còn ${leftMin} phút` : 'Sắp hết hạn'}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-bronze-300 transition group-hover:translate-x-0.5 group-hover:text-bronze-500" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
