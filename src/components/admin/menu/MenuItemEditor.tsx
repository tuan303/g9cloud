import { useCallback, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { Check, CircleAlert, TriangleAlert } from 'lucide-react';
import { CATEGORIES } from '@/data/menu';
import { useAction } from '@/hooks/useAction';
import { pick, useT, type MessageKey } from '@/i18n';
import { cn } from '@/lib/cn';
import { formatDateTime, formatPrice } from '@/lib/format';
import { itemName } from '@/lib/i18n-data';
import { repo } from '@/services';
import { toast } from '@/store/ui';
import { BottomSheet, Button, ConfirmDialog, Input, TagBadge, TextArea } from '@/components/ui';
import type { CategoryId, MenuItem, MenuTag } from '@/types';
import { AvailabilitySwitch } from './AvailabilitySwitch';
import { ImagePicker } from './ImagePicker';
import { OptionPicker } from './OptionPicker';
import { PriceField } from './PriceField';
import {
  buildOptionEntries,
  createInitialForm,
  defaultPresetKeys,
  DESCRIPTION_EN_MAX,
  DESCRIPTION_MAX,
  isSameForm,
  NAME_EN_MAX,
  NAME_MAX,
  PRICE_MAX,
  TAG_ORDER,
  toggleOptionKey,
  toMenuItem,
  validateMenuForm,
  type MenuForm,
  type MenuFormErrors,
} from './menu-form';

const FIELD_LABEL: Record<'name' | 'price', MessageKey> = { name: 'adminMenu.editor.name', price: 'adminMenu.editor.price' };

function Section({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="space-y-2.5">
      <div className="flex items-baseline justify-between gap-3 px-1">
        <h3 id={id} className="text-sm font-medium text-bronze-800">
          {title}
        </h3>
        {aside && <span className="text-xs text-stone">{aside}</span>}
      </div>
      {children}
    </section>
  );
}

/**
 * Bảng thêm / sửa món. Mỗi lần mở nên gắn `key` mới để biểu mẫu khởi tạo lại từ `item`.
 * `onClose` cần ổn định (useCallback) vì BottomSheet dùng nó trong effect quản lý focus.
 */
export function MenuItemEditor({
  item,
  defaultCategory = 'coffee',
  missing,
  onSaved,
  onClose,
}: {
  /** null = thêm món mới */
  item: MenuItem | null;
  defaultCategory?: CategoryId;
  /** Món đang sửa vừa bị xoá ở thiết bị/tab khác */
  missing?: boolean;
  /** Gọi sau khi lưu thành công (trước khi đóng) */
  onSaved?: (saved: MenuItem, isNew: boolean) => void;
  onClose: () => void;
}) {
  const { t } = useT();
  const isNew = !item;
  const [initial] = useState(() => createInitialForm(item, defaultCategory));
  const entries = useMemo(() => buildOptionEntries(initial.customGroups), [initial]);
  const [form, setForm] = useState<MenuForm>(initial.form);
  const [submitted, setSubmitted] = useState(false);
  const [optionsTouched, setOptionsTouched] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);

  // Lỗi hiện sau lần bấm "Lưu" đầu tiên; riêng giá vượt trần thì báo ngay khi gõ
  const allErrors = validateMenuForm(form);
  const errors: MenuFormErrors = submitted ? allErrors : { price: Number(form.price) > PRICE_MAX ? allErrors.price : undefined };
  const errorKeys = (Object.keys(errors) as (keyof MenuFormErrors)[]).filter((k) => !!errors[k]);

  const update = <K extends keyof MenuForm>(key: K, value: MenuForm[K]) => setForm((f) => ({ ...f, [key]: value }));

  const setCategory = (categoryId: CategoryId) =>
    setForm((f) => ({
      ...f,
      categoryId,
      // Món mới & chưa tự chỉnh tuỳ chọn → gợi ý nhóm tuỳ chọn hợp với danh mục
      options: isNew && !optionsTouched ? defaultPresetKeys(categoryId) : f.options,
    }));

  const toggleTag = (tag: MenuTag) =>
    setForm((f) => ({ ...f, tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag] }));

  const toggleOption = (key: string) => {
    setOptionsTouched(true);
    setForm((f) => ({ ...f, options: toggleOptionKey(f.options, key, entries) }));
  };

  // Hỏi lại trước khi đóng nếu đã sửa — dùng ref để requestClose giữ nguyên danh tính
  const dirtyRef = useRef(false);
  dirtyRef.current = !isSameForm(form, initial.form);
  const savingRef = useRef(false);
  const requestClose = useCallback(() => {
    if (savingRef.current) return;
    if (dirtyRef.current) setConfirmDiscard(true);
    else onClose();
  }, [onClose]);
  const cancelDiscard = useCallback(() => setConfirmDiscard(false), []);

  const saveItem = useCallback((next: MenuItem) => repo.saveMenuItem(next), []);
  const [runSave, saving] = useAction(saveItem);
  savingRef.current = saving;

  const handleSave = async () => {
    setSubmitted(true);
    const errs = validateMenuForm(form);
    if (errs.name || errs.price) {
      (errs.name ? nameRef : priceRef).current?.focus();
      return;
    }
    if (imageBusy) {
      toast(t('adminMenu.editor.imageBusy'), 'info');
      return;
    }
    const saved = await runSave(toMenuItem(form, item, entries));
    if (saved) {
      toast(t('adminMenu.editor.saved', { name: itemName(saved) }), 'success');
      onSaved?.(saved, isNew);
      onClose();
    }
  };

  const footer = (
    <div className="space-y-2.5">
      {errorKeys.length > 0 && (
        <p role="alert" className="flex items-center gap-1.5 px-1 text-sm font-medium text-rattan-dark">
          <CircleAlert className="h-4 w-4 shrink-0" aria-hidden />
          {t('adminMenu.editor.checkFields', { fields: errorKeys.map((k) => t(FIELD_LABEL[k])).join(', ') })}
        </p>
      )}
      <Button block size="lg" loading={saving} disabled={imageBusy} leftIcon={<Check className="h-5 w-5" aria-hidden />} onClick={handleSave}>
        {t('adminMenu.editor.save')}
      </Button>
    </div>
  );

  return (
    <>
      <BottomSheet open onClose={requestClose} title={isNew ? t('adminMenu.editor.addTitle') : t('adminMenu.editor.editTitle')} footer={footer} bodyClassName="space-y-6">
        {missing && (
          <p role="status" className="flex items-start gap-2 rounded-2xl bg-rattan-soft px-3.5 py-3 text-sm leading-snug text-rattan-dark">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {t('adminMenu.editor.missing')}
          </p>
        )}

        <div className="space-y-4">
          <Input
            ref={nameRef}
            label={t('adminMenu.editor.name')}
            required
            value={form.name}
            maxLength={NAME_MAX}
            placeholder={t('adminMenu.editor.namePlaceholder')}
            autoComplete="off"
            enterKeyHint="next"
            error={errors.name}
            onChange={(e) => update('name', e.target.value)}
          />
          <Input
            label={t('adminMenu.editor.nameEn')}
            lang="en"
            value={form.nameEn}
            maxLength={NAME_EN_MAX}
            placeholder={t('adminMenu.editor.nameEnPlaceholder')}
            autoComplete="off"
            enterKeyHint="next"
            hint={t('common.optional')}
            onChange={(e) => update('nameEn', e.target.value)}
          />
        </div>

        <Section title={t('adminMenu.editor.category')}>
          <div role="radiogroup" aria-label={t('adminMenu.editor.category')} className="grid grid-cols-3 gap-2">
            {CATEGORIES.map((c) => {
              const on = form.categoryId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setCategory(c.id)}
                  className={cn(
                    'flex h-[68px] flex-col items-center justify-center gap-1 rounded-2xl px-1.5 text-[13px] font-semibold ring-1 ring-inset transition active:scale-[.97]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
                    on ? 'bg-espresso text-cream shadow-card ring-espresso' : 'bg-white text-espresso ring-bronze-200 hover:ring-bronze-300',
                  )}
                >
                  <span aria-hidden className="text-xl leading-none">
                    {c.emoji}
                  </span>
                  <span className="max-w-full truncate">{c.name}</span>
                </button>
              );
            })}
          </div>
        </Section>

        <div className="space-y-4">
          <PriceField
            ref={priceRef}
            label={t('adminMenu.editor.price')}
            required
            value={form.price}
            onChange={(v) => update('price', v)}
            error={errors.price}
            placeholder={t('adminMenu.editor.pricePlaceholder')}
            hint={
              form.price && Number(form.price) <= PRICE_MAX
                ? t('adminMenu.editor.pricePreview', { price: formatPrice(Number(form.price)) })
                : t('adminMenu.editor.priceHint')
            }
          />
          <TextArea
            label={t('adminMenu.editor.description')}
            value={form.description}
            maxLength={DESCRIPTION_MAX}
            placeholder={t('adminMenu.editor.descriptionPlaceholder')}
            hint={t('adminMenu.editor.charCount', { count: form.description.length, max: DESCRIPTION_MAX })}
            onChange={(e) => update('description', e.target.value)}
          />
          <TextArea
            label={t('adminMenu.editor.descriptionEn')}
            lang="en"
            value={form.descriptionEn}
            maxLength={DESCRIPTION_EN_MAX}
            placeholder={t('adminMenu.editor.descriptionEnPlaceholder')}
            hint={`${t('common.optional')} · ${t('adminMenu.editor.charCount', { count: form.descriptionEn.length, max: DESCRIPTION_EN_MAX })}`}
            onChange={(e) => update('descriptionEn', e.target.value)}
          />
        </div>

        <Section title={t('adminMenu.editor.tags')} aside={t('adminMenu.editor.tagsHint')}>
          <div className="flex flex-wrap gap-2">
            {TAG_ORDER.map((tag) => {
              const on = form.tags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    'inline-flex h-11 items-center gap-2 rounded-full pl-2 pr-3.5 ring-1 ring-inset transition active:scale-[.97]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
                    on ? 'bg-gold-soft/60 ring-gold' : 'bg-white ring-bronze-200 hover:ring-bronze-300',
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-full transition',
                      on ? 'bg-espresso text-cream' : 'bg-bronze-100 text-transparent',
                    )}
                  >
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                  <TagBadge tag={tag} className={cn('transition', !on && 'opacity-60')} />
                </button>
              );
            })}
          </div>
        </Section>

        <Section title={t('adminMenu.editor.image')}>
          <ImagePicker
            value={form.image}
            onChange={(img) => update('image', img)}
            categoryId={form.categoryId}
            itemName={pick(form.name, form.nameEn.trim())}
            busy={imageBusy}
            onBusyChange={setImageBusy}
          />
        </Section>

        <Section title={t('adminMenu.editor.options')} aside={t('adminMenu.editor.optionCount', { count: form.options.length })}>
          <OptionPicker entries={entries} selected={form.options} onToggle={toggleOption} />
        </Section>

        <Section title={t('adminMenu.editor.status')}>
          <div className="flex items-center gap-3 rounded-2xl bg-white p-3.5 ring-1 ring-inset ring-bronze-200/70">
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold text-espresso">{form.available ? t('adminMenu.available') : t('adminMenu.soldOut')}</p>
              <p className="mt-0.5 text-xs leading-snug text-stone">
                {form.available ? t('adminMenu.editor.availableBody') : t('adminMenu.editor.soldOutBody')}
              </p>
            </div>
            <AvailabilitySwitch checked={form.available} onChange={(v) => update('available', v)} label={t('adminMenu.available')} showText={false} />
          </div>
        </Section>

        {!!item?.updatedAt && !missing && (
          <p className="px-1 text-center text-xs text-stone-light">{t('adminMenu.editor.updatedAt', { time: formatDateTime(item.updatedAt) })}</p>
        )}
      </BottomSheet>

      <ConfirmDialog
        open={confirmDiscard}
        title={t('adminMenu.editor.discardTitle')}
        description={t('adminMenu.editor.discardBody')}
        confirmText={t('adminMenu.editor.discardConfirm')}
        cancelText={t('adminMenu.editor.discardCancel')}
        tone="danger"
        onConfirm={onClose}
        onCancel={cancelDiscard}
      />
    </>
  );
}
