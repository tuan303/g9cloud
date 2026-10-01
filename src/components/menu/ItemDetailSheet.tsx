import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, CircleAlert, Coffee, X } from 'lucide-react';
import { BottomSheet, Button, IconButton, MenuImage, QuantityStepper, TagBadge, TextArea } from '@/components/ui';
import { APP_CONFIG } from '@/config/app';
import { useLoyalty } from '@/hooks/loyalty';
import { useT } from '@/i18n';
import { cn } from '@/lib/cn';
import { formatPrice } from '@/lib/format';
import { choiceName, groupName, itemDescription, itemName } from '@/lib/i18n-data';
import { defaultSelections, missingRequiredGroup, toSelectedOptions, unitPrice } from '@/lib/pricing';
import { platform } from '@/platform';
import { useCart } from '@/store/cart';
import { toast } from '@/store/ui';
import type { CartLine, MenuItem, OptionGroup } from '@/types';
import { prefersReducedMotion, useStableCallback } from './menu-utils';

export interface ItemDetailSheetProps {
  /** Món đang xem; null khi đóng */
  item: MenuItem | null;
  open: boolean;
  onClose: () => void;
  /** Khi sửa một dòng trong giỏ: điền sẵn tuỳ chọn/số lượng/ghi chú và lưu bằng cart.replace */
  editLine?: CartLine;
}

const NOTE_MAX = 120;

/**
 * Bảng chi tiết món: ảnh lớn, tuỳ chọn (size, đường, đá, topping...), ghi chú, số lượng → thêm/cập nhật giỏ.
 * Trạng thái được dựng lại mỗi lần mở, đổi món hoặc đổi dòng giỏ đang sửa.
 */
export function ItemDetailSheet({ item, open, onClose, editLine }: ItemDetailSheetProps) {
  if (!item || !open) return null;
  return <DetailSheet key={`${item.id}|${editLine?.lineId ?? 'new'}`} item={item} onClose={onClose} editLine={editLine} />;
}

/** Lựa chọn ban đầu: mặc định của món, hoặc lấy từ dòng giỏ đang sửa (bỏ lựa chọn không còn tồn tại) */
function initialSelections(item: MenuItem, editLine?: CartLine): Record<string, string[]> {
  const sel = defaultSelections(item);
  if (!editLine) return sel;
  for (const g of item.optionGroups ?? []) {
    const picked = editLine.options.find((o) => o.groupId === g.id);
    const valid = picked?.choiceIds.filter((id) => g.choices.some((c) => c.id === id)) ?? [];
    if (valid.length) sel[g.id] = g.type === 'single' ? valid.slice(0, 1) : valid.slice(0, g.max ?? valid.length);
    else if (!g.required) sel[g.id] = [];
  }
  return sel;
}

function DetailSheet({ item, onClose: onCloseProp, editLine }: { item: MenuItem; onClose: () => void; editLine?: CartLine }) {
  const onClose = useStableCallback(onCloseProp);
  const { t, locale } = useT();
  const loyalty = useLoyalty();
  const add = useCart((s) => s.add);
  const replace = useCart((s) => s.replace);

  const [selections, setSelections] = useState(() => initialSelections(item, editLine));
  const [quantity, setQuantity] = useState(() => editLine?.quantity ?? 1);
  const [note, setNote] = useState(() => (editLine?.note ?? '').slice(0, NOTE_MAX));
  const [invalidGroup, setInvalidGroup] = useState<string | null>(null);

  const uid = useId();
  const titleId = `${uid}-title`;
  const groupDomId = (groupId: string) => `${uid}-group-${groupId}`;
  const contentRef = useRef<HTMLDivElement>(null);

  // BottomSheet chỉ gắn aria-label khi `title` là chuỗi; sheet này không dùng thanh tiêu đề
  // (ảnh món nằm trên cùng) nên liên kết nhãn hộp thoại với tên món.
  useEffect(() => {
    const dialog = contentRef.current?.closest('[role="dialog"]');
    if (!dialog) return;
    dialog.setAttribute('aria-labelledby', titleId);
    return () => dialog.removeAttribute('aria-labelledby');
  }, [titleId]);

  const groups = item.optionGroups ?? [];
  const soldOut = !item.available;
  const options = useMemo(() => toSelectedOptions(item.optionGroups, selections), [item.optionGroups, selections]);
  const price = unitPrice(item, options);
  const total = price * quantity;

  const name = itemName(item);
  const description = itemDescription(item);
  // Tên phụ tiếng Anh chỉ hiện ở giao diện tiếng Việt; giao diện tiếng Anh hiển thị hoàn toàn bằng tiếng Anh
  const altName = locale === 'en' ? undefined : item.nameEn;
  // Món nước được tích điểm (chỉ gợi ý cho khách có thẻ tích điểm)
  const countsForLoyalty = loyalty.member && APP_CONFIG.loyalty.eligibleCategories.includes(item.categoryId);

  const pick = (group: OptionGroup, choiceId: string) => {
    const current = selections[group.id] ?? [];
    let next: string[];
    if (group.type === 'single') {
      // Nhóm không bắt buộc: chạm lại lựa chọn đang chọn để bỏ chọn
      next = current[0] === choiceId && !group.required ? [] : [choiceId];
    } else if (current.includes(choiceId)) {
      next = current.filter((id) => id !== choiceId);
    } else if (group.max === 1) {
      next = [choiceId];
    } else if (group.max && current.length >= group.max) {
      toast(t('menu.detail.maxChoices', { group: groupName(group), count: group.max }), 'info');
      return;
    } else {
      next = [...current, choiceId];
    }
    setSelections({ ...selections, [group.id]: next });
    if (invalidGroup === group.id) setInvalidGroup(null);
  };

  const submit = () => {
    if (soldOut) return;
    const missing = missingRequiredGroup(item.optionGroups, selections);
    if (missing) {
      // missingRequiredGroup trả về tên nhóm gốc (tiếng Việt) → tìm nhóm để lấy tên theo ngôn ngữ đang chọn
      const group = groups.find((g) => g.name === missing);
      if (group) {
        setInvalidGroup(group.id);
        document
          .getElementById(groupDomId(group.id))
          ?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'center' });
      }
      toast(t('menu.detail.chooseRequired', { group: group ? groupName(group) : missing }), 'error');
      return;
    }
    const trimmed = note.trim();
    if (editLine) {
      replace(editLine.lineId, item, options, quantity, trimmed);
      toast(t('menu.detail.updated', { name }), 'success');
    } else {
      add(item, options, quantity, trimmed);
      platform.vibrate(12);
      toast(quantity > 1 ? t('menu.addedQty', { count: quantity, name }) : t('menu.added', { name }), 'success');
    }
    onClose();
  };

  const footer = (
    <Button block size="lg" disabled={soldOut} onClick={submit} className="mb-0.5">
      {soldOut ? (
        t('menu.detail.soldOutButton')
      ) : (
        <>
          <span>{editLine ? t('menu.detail.update') : t('menu.detail.addToCart')}</span>
          <span aria-hidden className="text-cream/40">
            ·
          </span>
          <span className="font-display tabular-nums">{formatPrice(total)}</span>
        </>
      )}
    </Button>
  );

  return (
    <BottomSheet open onClose={onClose} footer={footer}>
      <div ref={contentRef}>
        {/* Ảnh lớn + nút đóng + nhãn */}
        <div className="relative">
          <MenuImage
            image={item.image}
            alt={name}
            categoryId={item.categoryId}
            rounded="rounded-3xl"
            className={cn('h-[220px] w-full ring-1 ring-bronze-200/50', soldOut && 'grayscale-[.6]')}
          />
          <IconButton label={t('common.close')} tone="glass" onClick={onClose} className="absolute right-3 top-3">
            <X className="h-5 w-5" />
          </IconButton>
          {!!item.tags?.length && (
            <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
              {item.tags.map((t) => (
                <TagBadge key={t} tag={t} className="shadow-card" />
              ))}
            </div>
          )}
          {soldOut && (
            <span className="absolute bottom-3 left-3 rounded-full bg-espresso/85 px-3 py-1 text-xs font-bold text-cream backdrop-blur">
              {t('menu.soldOut')}
            </span>
          )}
        </div>

        {/* Tên, giá, mô tả */}
        <div className="mt-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 id={titleId} className="font-display text-[22px] font-extrabold leading-tight tracking-tight text-espresso">
              {name}
            </h2>
            {altName && altName !== name && (
              <p lang="en" className="mt-0.5 text-sm font-medium text-stone">
                {altName}
              </p>
            )}
          </div>
          <p className="shrink-0 pt-0.5 font-display text-xl font-bold tabular-nums text-espresso">{formatPrice(item.price)}</p>
        </div>
        {description && <p className="mt-2.5 text-[15px] leading-relaxed text-bronze-800">{description}</p>}

        {soldOut ? (
          <div role="status" className="mt-5 flex items-start gap-2.5 rounded-2xl bg-rattan-soft p-4 text-sm text-rattan-dark">
            <CircleAlert className="mt-px h-[18px] w-[18px] shrink-0" aria-hidden />
            <p>{t('menu.detail.soldOutNotice')}</p>
          </div>
        ) : (
          <>
            {groups.map((g) => (
              <OptionGroupField
                key={g.id}
                domId={groupDomId(g.id)}
                group={g}
                selected={selections[g.id] ?? []}
                invalid={invalidGroup === g.id}
                onPick={(choiceId) => pick(g, choiceId)}
              />
            ))}

            <div className="mt-6">
              <TextArea
                label={t('menu.detail.noteLabel')}
                placeholder={t('menu.detail.notePlaceholder')}
                rows={2}
                maxLength={NOTE_MAX}
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, NOTE_MAX))}
                hint={t('menu.detail.noteHint', { used: note.length, max: NOTE_MAX })}
              />
            </div>

            <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-white p-2.5 pl-4 ring-1 ring-bronze-200/60">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-espresso">{t('menu.detail.quantity')}</p>
                <p className="text-xs tabular-nums text-stone">{t('menu.detail.perServing', { price: formatPrice(price) })}</p>
              </div>
              <QuantityStepper value={quantity} onChange={setQuantity} min={1} max={99} />
            </div>
            {countsForLoyalty && (
              <p className="mt-2.5 flex items-center gap-1.5 px-1 text-xs font-medium text-bronze-700">
                <Coffee className="h-3.5 w-3.5 shrink-0 text-gold-dark" aria-hidden />
                {t('menu.detail.loyaltyHint', { count: quantity })}
              </p>
            )}
          </>
        )}
      </div>
    </BottomSheet>
  );
}

/** Một nhóm tuỳ chọn: chọn một (radio) hoặc chọn nhiều (checkbox, giới hạn `max`) */
function OptionGroupField({
  domId,
  group,
  selected,
  invalid,
  onPick,
}: {
  domId: string;
  group: OptionGroup;
  selected: string[];
  invalid: boolean;
  onPick: (choiceId: string) => void;
}) {
  const { t } = useT();
  const single = group.type === 'single';
  const label = groupName(group);
  const atMax = !single && !!group.max && group.max > 1 && selected.length >= group.max;
  // Nhóm ngắn (size, % đường, đá) → lưới chip; nhóm dài (topping) → danh sách có ô chọn
  const compact = single && group.choices.length <= 4 && group.choices.every((c) => choiceName(c).length <= 12);
  const headingId = `${domId}-label`;

  return (
    <section id={domId} className="mt-6 scroll-mt-4" aria-labelledby={headingId}>
      <div className="mb-2.5 flex items-center justify-between gap-2 px-0.5">
        <h3 id={headingId} className="font-display text-[15px] font-bold text-espresso">
          {label}
        </h3>
        {group.required ? (
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-[11px] font-semibold',
              invalid ? 'bg-rattan text-white' : 'bg-rattan-soft text-rattan-dark',
            )}
          >
            {t('common.required')}
          </span>
        ) : (
          <span className="text-xs text-stone">
            {group.max && !single ? t('menu.detail.optionalMax', { max: group.max }) : t('menu.detail.optional')}
          </span>
        )}
      </div>

      <div
        role={single ? 'radiogroup' : 'group'}
        aria-labelledby={headingId}
        aria-required={single && group.required ? true : undefined}
        aria-invalid={invalid || undefined}
        className={compact ? 'grid gap-2' : 'flex flex-col gap-2'}
        style={compact ? { gridTemplateColumns: `repeat(${group.choices.length}, minmax(0, 1fr))` } : undefined}
      >
        {group.choices.map((c) => {
          const checked = selected.includes(c.id);
          const blocked = atMax && !checked;
          const delta = c.priceDelta > 0 ? `+${formatPrice(c.priceDelta)}` : null;
          const base = cn(
            'rounded-2xl ring-inset transition active:scale-[.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-espresso',
            checked
              ? 'bg-gold-soft text-espresso ring-2 ring-gold'
              : cn('bg-white text-espresso ring-1 hover:ring-bronze-300', invalid ? 'ring-rattan/60' : 'ring-bronze-200'),
            blocked && 'opacity-45',
          );

          if (compact) {
            return (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={checked}
                onClick={() => onPick(c.id)}
                className={cn(base, 'flex min-h-[48px] flex-col items-center justify-center px-2 py-2 text-center')}
              >
                <span className="text-sm font-semibold leading-tight">{choiceName(c)}</span>
                {delta && <span className={cn('mt-0.5 text-[11px] font-semibold tabular-nums', checked ? 'text-bronze-700' : 'text-stone')}>{delta}</span>}
              </button>
            );
          }

          return (
            <button
              key={c.id}
              type="button"
              role={single ? 'radio' : 'checkbox'}
              aria-checked={checked}
              aria-disabled={blocked || undefined}
              onClick={() => onPick(c.id)}
              className={cn(base, 'flex min-h-[52px] w-full items-center gap-3 px-4 py-2.5 text-left')}
            >
              <span
                aria-hidden
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center',
                  single ? 'rounded-full' : 'rounded-md',
                  checked ? 'bg-espresso' : 'ring-2 ring-inset ring-bronze-300',
                )}
              >
                {checked && (single ? <span className="h-2 w-2 rounded-full bg-gold" /> : <Check className="h-3.5 w-3.5 text-gold-light" strokeWidth={3} />)}
              </span>
              <span className="min-w-0 flex-1 text-[15px] font-medium leading-snug">{choiceName(c)}</span>
              {delta && <span className={cn('shrink-0 font-display text-sm font-semibold tabular-nums', checked ? 'text-bronze-700' : 'text-stone')}>{delta}</span>}
            </button>
          );
        })}
      </div>

      {invalid && (
        <p role="alert" className="mt-2 px-1 text-xs font-medium text-rattan-dark">
          {t('menu.detail.pleaseChoose', { group: label, groupLower: label.toLowerCase() })}
        </p>
      )}
    </section>
  );
}
