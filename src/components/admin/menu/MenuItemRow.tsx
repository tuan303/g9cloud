import { useCallback, useState } from 'react';
import { Pencil, SlidersHorizontal, Trash2 } from 'lucide-react';
import { CATEGORIES } from '@/data/menu';
import { useAction } from '@/hooks/useAction';
import { useT } from '@/i18n';
import { cn } from '@/lib/cn';
import { formatPrice } from '@/lib/format';
import { itemName } from '@/lib/i18n-data';
import { repo } from '@/services';
import { toast } from '@/store/ui';
import { MenuImage, Skeleton, TagBadge } from '@/components/ui';
import type { MenuItem } from '@/types';
import { AvailabilitySwitch } from './AvailabilitySwitch';

const actionBtn =
  'inline-flex h-11 items-center gap-1.5 rounded-2xl text-sm font-semibold transition active:scale-[.97] ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold';

export const menuRowId = (id: string) => `menu-item-${id}`;

/** Một món trong danh sách quản trị: ảnh, tên, giá, nhãn + công tắc bán / sửa / xoá */
export function MenuItemRow({
  item,
  highlighted,
  onEdit,
  onDelete,
}: {
  item: MenuItem;
  /** Vừa được thêm / lưu → viền vàng trong giây lát */
  highlighted?: boolean;
  onEdit: (item: MenuItem) => void;
  onDelete: (item: MenuItem) => void;
}) {
  const { t, locale } = useT();
  // Hiển thị lạc quan trong lúc chờ repo; lỗi → quay về giá trị thật từ store
  const [pending, setPending] = useState<boolean | null>(null);
  const setAvailability = useCallback(
    async (next: boolean) => {
      await repo.setItemAvailability(item.id, next);
      return true as const;
    },
    [item.id],
  );
  const [runToggle, toggling] = useAction(setAvailability);

  const available = pending ?? item.available;
  const category = CATEGORIES.find((c) => c.id === item.categoryId);
  const groupCount = item.optionGroups?.length ?? 0;
  const tags = item.tags ?? [];
  const name = itemName(item);
  // Dòng phụ cho quản trị: tên còn lại (tiếng Việt → hiện tên Anh; tiếng Anh → hiện tên Việt nếu khác)
  const otherName = locale === 'en' ? (item.nameEn && item.nameEn !== item.name ? item.name : undefined) : item.nameEn;

  const toggle = async (next: boolean) => {
    setPending(next);
    const ok = await runToggle(next);
    setPending(null);
    if (ok) toast(t(next ? 'adminMenu.row.reopened' : 'adminMenu.row.markedSoldOut', { name }), next ? 'success' : 'default');
  };

  return (
    <article
      id={menuRowId(item.id)}
      className={cn(
        'flex min-w-0 flex-col rounded-3xl p-3 transition duration-500',
        available ? 'bg-white' : 'bg-white/60',
        highlighted ? 'shadow-glow ring-2 ring-gold' : 'shadow-card ring-1 ring-bronze-200/50',
      )}
    >
      {/* Chạm vào thông tin món để sửa nhanh (nút "Sửa" bên dưới là lối vào chính cho bàn phím / trình đọc màn hình) */}
      <div className="flex cursor-pointer items-start gap-3" onClick={() => onEdit(item)}>
        <MenuImage
          image={item.image}
          alt={name}
          categoryId={item.categoryId}
          className={cn('h-16 w-16 shrink-0 transition', !available && 'opacity-60 grayscale')}
        />
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex items-start gap-2">
            <h3 className={cn('line-clamp-2 min-w-0 flex-1 font-semibold leading-snug', available ? 'text-espresso' : 'text-bronze-700')}>
              {name}
            </h3>
            <p className="shrink-0 font-display text-[15px] font-bold tabular-nums text-espresso">{formatPrice(item.price)}</p>
          </div>
          <p className="mt-0.5 truncate text-xs text-stone">
            {category && (
              <>
                <span aria-hidden>{category.emoji} </span>
                {category.name}
              </>
            )}
            {otherName && <span className="text-stone-light"> · {otherName}</span>}
          </p>
          {(tags.length > 0 || groupCount > 0) && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {tags.map((t) => (
                <TagBadge key={t} tag={t} />
              ))}
              {groupCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-bronze-50 px-2 py-[1px] text-[11px] font-medium text-bronze-700 ring-1 ring-inset ring-bronze-200">
                  <SlidersHorizontal className="h-3 w-3" aria-hidden />
                  {t('adminMenu.row.optionGroups', { count: groupCount })}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-2.5 flex items-center gap-1 border-t border-bronze-100 pt-2">
        <AvailabilitySwitch checked={available} busy={toggling} onChange={toggle} label={t('adminMenu.row.availableAria', { name })} />
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            aria-label={t('adminMenu.row.editAria', { name })}
            onClick={() => onEdit(item)}
            className={cn(actionBtn, 'bg-bronze-50 px-3.5 text-espresso ring-1 ring-inset ring-bronze-200 hover:bg-bronze-100')}
          >
            <Pencil className="h-4 w-4" aria-hidden />
            {t('common.edit')}
          </button>
          <button
            type="button"
            aria-label={t('adminMenu.row.deleteAria', { name })}
            onClick={() => onDelete(item)}
            className={cn(actionBtn, 'px-3 text-rattan-dark hover:bg-rattan-soft')}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            {t('common.delete')}
          </button>
        </div>
      </div>
    </article>
  );
}

export function MenuItemRowSkeleton() {
  return (
    <div aria-hidden className="rounded-3xl bg-white p-3 shadow-card ring-1 ring-bronze-200/50">
      <div className="flex items-start gap-3">
        <Skeleton className="h-16 w-16 shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="flex justify-between gap-3">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-14" />
          </div>
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-4 w-2/5" />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-bronze-100 pt-3">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-9 w-36" />
      </div>
    </div>
  );
}
