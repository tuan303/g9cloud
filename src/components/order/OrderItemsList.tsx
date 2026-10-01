import { useT } from '@/i18n';
import { lineName } from '@/lib/i18n-data';
import { cn } from '@/lib/cn';
import { formatPrice } from '@/lib/format';
import { optionsSummary } from '@/lib/pricing';
import { MenuImage } from '@/components/ui';
import type { CartLine } from '@/types';

/** Danh sách món trong đơn/giỏ (chỉ đọc) — dùng ở trang thanh toán, trạng thái đơn, quản trị */
export function OrderItemsList({
  lines,
  compact,
  className,
}: {
  lines: Pick<CartLine, 'lineId' | 'itemId' | 'name' | 'nameEn' | 'image' | 'categoryId' | 'quantity' | 'unitPrice' | 'options' | 'note'>[];
  compact?: boolean;
  className?: string;
}) {
  return (
    <ul className={cn('divide-y divide-bronze-100', className)}>
      {lines.map((l) => {
        const opts = optionsSummary(l.options, l.itemId);
        return (
          <li key={l.lineId} className={cn('flex items-start gap-3', compact ? 'py-2' : 'py-3')}>
            {!compact && <MenuImage image={l.image} alt={lineName(l)} categoryId={l.categoryId} className="h-12 w-12 shrink-0" rounded="rounded-xl" />}
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold leading-snug text-espresso">
                <span className="mr-1.5 font-display text-bronze-500">{l.quantity}×</span>
                {lineName(l)}
              </p>
              {opts && <p className="mt-0.5 text-xs leading-snug text-stone">{opts}</p>}
              {l.note && <p className="mt-0.5 text-xs italic text-rattan">“{l.note}”</p>}
            </div>
            <span className="shrink-0 text-sm font-semibold tabular-nums text-espresso">{formatPrice(l.unitPrice * l.quantity)}</span>
          </li>
        );
      })}
    </ul>
  );
}

/** Các dòng tổng tiền: Tạm tính / Phí giao / Tổng cộng */
export function OrderTotals({
  subtotal,
  deliveryFee = 0,
  discount = 0,
  total,
  showDelivery,
  loyaltyRedeem,
  className,
}: {
  subtotal: number;
  deliveryFee?: number;
  discount?: number;
  total: number;
  showDelivery?: boolean;
  /** Giảm giá là cốc miễn phí từ thẻ tích điểm */
  loyaltyRedeem?: boolean;
  className?: string;
}) {
  const { t } = useT();
  return (
    <dl className={cn('space-y-1.5 text-sm', className)}>
      <div className="flex justify-between text-stone">
        <dt>{t('totals.subtotal')}</dt>
        <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
      </div>
      {showDelivery && (
        <div className="flex justify-between text-stone">
          <dt>{t('totals.deliveryFee')}</dt>
          <dd className="tabular-nums">{deliveryFee ? formatPrice(deliveryFee) : t('common.free')}</dd>
        </div>
      )}
      {!!discount && (
        <div className="flex justify-between text-leaf-dark">
          <dt>{t(loyaltyRedeem ? 'totals.loyaltyReward' : 'totals.discount')}</dt>
          <dd className="tabular-nums">−{formatPrice(discount)}</dd>
        </div>
      )}
      <div className="flex items-baseline justify-between border-t border-dashed border-bronze-200 pt-2.5">
        <dt className="font-semibold text-espresso">{t('totals.total')}</dt>
        <dd className="font-display text-xl font-extrabold tabular-nums text-espresso">{formatPrice(total)}</dd>
      </div>
    </dl>
  );
}
