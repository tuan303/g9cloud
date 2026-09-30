import { memo } from 'react';
import { Plus } from 'lucide-react';
import { MenuImage, Skeleton, TagBadge } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatPrice } from '@/lib/format';
import type { MenuItem } from '@/types';

/**
 * Thẻ món dạng hàng: ảnh trái + tên, mô tả, nhãn, giá + nút "+" thêm nhanh.
 * Chạm vào thẻ → mở chi tiết (lớp nút phủ toàn thẻ); nút "+" nằm trên lớp phủ để thêm nhanh.
 */
export const MenuCard = memo(function MenuCard({
  item,
  inCart,
  onOpen,
  onQuickAdd,
}: {
  item: MenuItem;
  /** Tổng số phần của món này đang có trong giỏ */
  inCart: number;
  onOpen: (item: MenuItem) => void;
  onQuickAdd: (item: MenuItem) => void;
}) {
  const soldOut = !item.available;
  return (
    <li>
      <article
        className={cn(
          'relative flex items-stretch gap-3.5 rounded-3xl p-3 ring-1 transition',
          soldOut ? 'bg-white/60 ring-bronze-200/40' : 'bg-white shadow-card ring-bronze-200/50 hover:ring-bronze-300/70',
        )}
      >
        <MenuImage
          image={item.image}
          alt=""
          categoryId={item.categoryId}
          className={cn('h-[88px] w-[88px] shrink-0', soldOut && 'opacity-55 grayscale')}
        />
        <div className="flex min-w-0 flex-1 flex-col py-0.5">
          {!!item.tags?.length && (
            <div className={cn('mb-1 flex flex-wrap gap-1', soldOut && 'opacity-60')}>
              {item.tags.map((t) => (
                <TagBadge key={t} tag={t} />
              ))}
            </div>
          )}
          <h3 className={cn('line-clamp-2 font-display text-[15px] font-bold leading-snug', soldOut ? 'text-stone' : 'text-espresso')}>
            {item.name}
          </h3>
          {item.description && <p className="mt-0.5 line-clamp-1 text-xs leading-relaxed text-stone">{item.description}</p>}
          <p className={cn('mt-auto pr-12 pt-2 font-display text-base font-bold tabular-nums', soldOut ? 'text-stone' : 'text-espresso')}>
            {formatPrice(item.price)}
          </p>
        </div>

        {/* Lớp bấm phủ toàn thẻ → mở chi tiết (nút "+" nằm trên, không lồng nút) */}
        <button
          type="button"
          onClick={() => onOpen(item)}
          aria-haspopup="dialog"
          aria-label={`${item.name}, ${formatPrice(item.price)}${soldOut ? ', tạm hết' : ''}. Xem chi tiết`}
          className="absolute inset-0 rounded-3xl transition-colors active:bg-espresso/[.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        />

        {soldOut ? (
          <span className="pointer-events-none absolute bottom-4 right-3.5 rounded-full bg-bronze-100 px-2.5 py-1 text-[11px] font-semibold text-bronze-700">
            Tạm hết
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onQuickAdd(item)}
            aria-label={`Thêm nhanh ${item.name} vào giỏ${inCart ? ` (đang có ${inCart})` : ''}`}
            className={cn(
              'absolute bottom-3 right-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-espresso text-cream shadow-card transition',
              'hover:bg-espresso-700 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2',
            )}
          >
            <Plus className="h-5 w-5" strokeWidth={2.5} aria-hidden />
            {inCart > 0 && (
              <span
                key={inCart}
                aria-hidden
                className="absolute -right-1 -top-1 min-w-[20px] animate-pop-in rounded-full bg-gold px-1 text-center font-display text-[11px] font-bold leading-5 text-espresso ring-2 ring-white"
              >
                {inCart > 99 ? '99+' : inCart}
              </span>
            )}
          </button>
        )}
      </article>
    </li>
  );
});

export function MenuCardSkeleton() {
  return (
    <div className="flex gap-3.5 rounded-3xl bg-white/70 p-3 ring-1 ring-bronze-200/40" aria-hidden>
      <Skeleton className="h-[88px] w-[88px] shrink-0" />
      <div className="flex flex-1 flex-col gap-2 py-1">
        <Skeleton className="h-4 w-2/3 rounded-lg" />
        <Skeleton className="h-3 w-full rounded-lg" />
        <Skeleton className="mt-auto h-4 w-20 rounded-lg" />
      </div>
    </div>
  );
}
