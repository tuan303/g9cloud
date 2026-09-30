import { forwardRef } from 'react';
import { Pencil, Trash, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatPrice } from '@/lib/format';
import { optionsSummary } from '@/lib/pricing';
import { MenuImage, QuantityStepper } from '@/components/ui';
import type { CartLine } from '@/types';

/**
 * Một dòng trong giỏ hàng. Chạm vào dòng để sửa tuỳ chọn (nút trong suốt phủ toàn dòng,
 * bộ đếm số lượng nằm trên). Món đã hết / không còn trên thực đơn: làm mờ, cảnh báo, chỉ cho xoá.
 */
export const CartLineItem = forwardRef<
  HTMLLIElement,
  {
    line: CartLine;
    unavailable?: boolean;
    onEdit?: () => void;
    onQuantityChange: (qty: number) => void;
    onRemove: () => void;
  }
>(function CartLineItem({ line, unavailable, onEdit, onQuantityChange, onRemove }, ref) {
  const opts = optionsSummary(line.options);
  const editable = !unavailable && !!onEdit;

  return (
    <li ref={ref} className={cn('relative transition', editable && 'active:bg-bronze-50', unavailable && 'bg-rattan-soft/40')}>
      {editable && (
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Sửa ${line.name}`}
          className="absolute inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold"
        />
      )}

      {/* Nội dung không bắt chạm → chạm vào đâu cũng rơi xuống nút sửa phía dưới */}
      <div className="pointer-events-none relative flex gap-3 px-4 py-3.5">
        <MenuImage
          image={line.image}
          alt=""
          categoryId={line.categoryId}
          className={cn('h-[72px] w-[72px] shrink-0', unavailable && 'opacity-50 grayscale')}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-2">
            <p className={cn('text-[15px] font-semibold leading-snug', unavailable ? 'text-stone line-through decoration-stone/50' : 'text-espresso')}>
              {line.name}
            </p>
            {editable && <Pencil className="mt-1 h-3.5 w-3.5 shrink-0 text-bronze-400" aria-hidden />}
          </div>
          {opts && <p className="mt-0.5 text-xs leading-snug text-stone">{opts}</p>}
          {line.note && <p className="mt-0.5 truncate text-xs italic text-rattan">“{line.note}”</p>}

          {unavailable ? (
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-rattan-dark">
                <TriangleAlert className="h-3.5 w-3.5" aria-hidden />
                Món tạm hết
              </span>
              <button
                type="button"
                onClick={onRemove}
                aria-label={`Xoá ${line.name} khỏi giỏ`}
                className="pointer-events-auto -my-2 inline-flex h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-rattan-dark transition hover:bg-rattan-soft active:scale-95"
              >
                <Trash className="h-4 w-4" aria-hidden />
                Xoá
              </button>
            </div>
          ) : (
            <div className="mt-auto flex items-end justify-between gap-2 pt-2">
              <div className="leading-tight">
                <span className="block font-display text-[15px] font-bold tabular-nums text-espresso">{formatPrice(line.unitPrice * line.quantity)}</span>
                {line.quantity > 1 && <span className="whitespace-nowrap text-[11px] tabular-nums text-stone">{formatPrice(line.unitPrice)} / món</span>}
              </div>
              <QuantityStepper
                size="sm"
                value={line.quantity}
                onChange={onQuantityChange}
                onRemove={onRemove}
                itemLabel={line.name}
                className="pointer-events-auto"
              />
            </div>
          )}
        </div>
      </div>
    </li>
  );
});
