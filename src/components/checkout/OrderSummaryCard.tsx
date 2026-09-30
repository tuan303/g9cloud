import { useId, useState } from 'react';
import { Bike, ChevronDown, MessageSquareText, ReceiptText, Store, User } from 'lucide-react';
import { APP_CONFIG } from '@/config/app';
import { cn } from '@/lib/cn';
import { formatPrice } from '@/lib/format';
import { Card } from '@/components/ui';
import { OrderItemsList, OrderTotals } from '@/components/order/OrderItemsList';
import type { Order } from '@/types';

/** Thẻ tóm tắt đơn (thu gọn được): món, tổng tiền, hình thức nhận, người nhận, ghi chú */
export function OrderSummaryCard({ order, defaultOpen = false, className }: { order: Order; defaultOpen?: boolean; className?: string }) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();
  const isDelivery = order.fulfillment === 'delivery';
  const FIcon = isDelivery ? Bike : Store;
  const preview = order.items.map((l) => `${l.quantity}× ${l.name}`).join(', ');

  return (
    <Card className={cn('overflow-hidden', className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-[64px] w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-bronze-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-bronze-100 text-bronze-700">
          <ReceiptText className="h-5 w-5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span className="font-display text-[15px] font-bold text-espresso">Chi tiết đơn hàng</span>
            <span className="shrink-0 font-display text-[15px] font-bold tabular-nums text-espresso">{formatPrice(order.total)}</span>
          </span>
          <span className="mt-0.5 block truncate text-xs text-stone">
            {order.itemCount} món · {open ? (isDelivery ? APP_CONFIG.fulfillment.delivery.label : APP_CONFIG.fulfillment.pickup.label) : preview}
          </span>
        </span>
        <ChevronDown className={cn('h-5 w-5 shrink-0 text-bronze-400 transition-transform', open && 'rotate-180')} aria-hidden />
      </button>

      {open && (
        <div id={panelId} className="animate-fade-in border-t border-bronze-100 px-4 pb-4 pt-1">
          <OrderItemsList lines={order.items} compact />
          <OrderTotals
            className="mt-2"
            subtotal={order.subtotal}
            deliveryFee={order.deliveryFee}
            discount={order.discount}
            total={order.total}
            showDelivery={isDelivery}
          />

          <div className="mt-4 space-y-2.5 rounded-2xl bg-cream/80 p-3.5 text-sm">
            <div className="flex items-start gap-2.5">
              <FIcon className="mt-0.5 h-4 w-4 shrink-0 text-bronze-500" aria-hidden />
              <div className="min-w-0">
                <p className="font-semibold text-espresso">
                  {isDelivery ? APP_CONFIG.fulfillment.delivery.label : APP_CONFIG.fulfillment.pickup.label}
                </p>
                <p className="text-stone">
                  {isDelivery ? order.deliveryAddress || 'Chưa có địa chỉ' : `Tại quầy Cloud 9 · ${APP_CONFIG.shop.location}`}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <User className="mt-0.5 h-4 w-4 shrink-0 text-bronze-500" aria-hidden />
              <div className="min-w-0">
                <p className="text-espresso">
                  <span className="sr-only">Người nhận: </span>
                  {order.customer.name}
                  {order.customer.phone && <span className="text-stone"> · {order.customer.phone}</span>}
                </p>
              </div>
            </div>
            {order.note && (
              <div className="flex items-start gap-2.5">
                <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-bronze-500" aria-hidden />
                <div className="min-w-0">
                  <p className="italic text-rattan">
                    <span className="sr-only">Ghi chú: </span>“{order.note}”
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
