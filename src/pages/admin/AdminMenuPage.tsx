import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CircleCheck, Plus, SearchX, UtensilsCrossed } from 'lucide-react';
import heroPhoto from '@/assets/photos/espresso-bar-sm.webp';
import { CATEGORIES } from '@/data/menu';
import { useDataReady, useMenu } from '@/hooks/data';
import { useAction } from '@/hooks/useAction';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useT } from '@/i18n';
import { cn } from '@/lib/cn';
import { categoryName, itemName } from '@/lib/i18n-data';
import { repo } from '@/services';
import { toast } from '@/store/ui';
import { Button, ConfirmDialog, EmptyState, IconButton, Segmented, type SegmentedOption } from '@/components/ui';
import { MenuItemEditor } from '@/components/admin/menu/MenuItemEditor';
import { menuRowId, MenuItemRow, MenuItemRowSkeleton } from '@/components/admin/menu/MenuItemRow';
import { SearchField } from '@/components/admin/menu/SearchField';
import { queryTokens, searchableText } from '@/components/admin/menu/menu-form';
import type { CategoryId, MenuItem } from '@/types';

type CategoryFilter = 'all' | CategoryId;
type StockFilter = 'all' | 'available' | 'soldout';

// Nhãn gọn hơn một chút trên điện thoại để 4 tab vừa khung 375px (vẫn cuộn ngang được nếu màn hẹp hơn)
const tabLabel = (text: string) => <span className="-mx-1 text-[13px] sm:mx-0 sm:text-sm">{text}</span>;

/** Chuỗi đã dịch có con số (VD "5 món phù hợp") — in đậm con số */
function CountText({ text, count }: { text: string; count: number }) {
  const n = String(count);
  const at = text.indexOf(n);
  if (at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <span className="font-display font-bold text-espresso">{n}</span>
      {text.slice(at + n.length)}
    </>
  );
}

export default function AdminMenuPage() {
  const { t } = useT();
  usePageTitle(t('adminMenu.pageTitle'));
  const ready = useDataReady();
  const menu = useMenu();

  // Tên danh mục đổi theo ngôn ngữ (CATEGORIES[i].name) → dựng tab trong component
  const categoryOptions = useMemo<SegmentedOption<CategoryFilter>[]>(
    () => [
      { value: 'all', label: tabLabel(t('adminMenu.filters.all')) },
      ...CATEGORIES.map((c) => ({ value: c.id, label: tabLabel(c.name) })),
    ],
    [t],
  );

  const [category, setCategory] = useState<CategoryFilter>('all');
  const [stock, setStock] = useState<StockFilter>('all');
  const [query, setQuery] = useState('');
  const [editor, setEditor] = useState<{ key: number; item: MenuItem | null } | null>(null);
  const [deleting, setDeleting] = useState<MenuItem | null>(null);
  const editorSeq = useRef(0);

  // ── Số liệu & lọc ──
  const counts = useMemo(() => {
    const available = menu.filter((m) => m.available).length;
    return { total: menu.length, available, soldout: menu.length - available };
  }, [menu]);

  const searchIndex = useMemo(() => new Map(menu.map((m) => [m.id, searchableText(m)])), [menu]);
  const tokens = useMemo(() => queryTokens(query), [query]);

  const filtered = useMemo(
    () =>
      menu.filter(
        (m) =>
          (category === 'all' || m.categoryId === category) &&
          (stock === 'all' || (stock === 'available') === m.available) &&
          tokens.every((t) => (searchIndex.get(m.id) ?? '').includes(t)),
      ),
    [menu, category, stock, tokens, searchIndex],
  );

  // "Tất cả" → chia nhóm theo danh mục; chọn một danh mục → danh sách phẳng
  const sections = useMemo(() => {
    if (category !== 'all') return [{ category: null, items: filtered }];
    return CATEGORIES.map((c) => ({ category: c, items: filtered.filter((m) => m.categoryId === c.id) })).filter((s) => s.items.length > 0);
  }, [category, filtered]);

  const filtersActive = tokens.length > 0 || stock !== 'all';
  const resetFilters = () => {
    setQuery('');
    setStock('all');
  };

  // ── Thêm / sửa ──
  const openEditor = useCallback((item: MenuItem | null) => setEditor({ key: ++editorSeq.current, item }), []);
  const closeEditor = useCallback(() => setEditor(null), []);
  const editingMissing = !!editor?.item && !menu.some((m) => m.id === editor.item?.id);

  // Sau khi lưu: làm nổi bật món và cuộn tới. Món mới bị bộ lọc che → mở bộ lọc để thấy món.
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const scrolledFor = useRef<string | null>(null);
  const handleSaved = useCallback((saved: MenuItem, isNew: boolean) => {
    scrolledFor.current = null;
    setHighlightId(saved.id);
    if (!isNew) return;
    setQuery('');
    setStock('all');
    setCategory((c) => (c === 'all' || c === saved.categoryId ? c : saved.categoryId));
  }, []);
  useEffect(() => {
    if (!highlightId || scrolledFor.current === highlightId) return;
    const el = document.getElementById(menuRowId(highlightId));
    if (!el) return; // chờ store cập nhật
    scrolledFor.current = highlightId;
    const rect = el.getBoundingClientRect();
    if (rect.top >= 180 && rect.bottom <= window.innerHeight - 80) return; // đã nằm trong tầm nhìn
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [highlightId, filtered]);
  useEffect(() => {
    if (!highlightId) return;
    const t = window.setTimeout(() => setHighlightId(null), 2400);
    return () => window.clearTimeout(t);
  }, [highlightId]);

  // ── Xoá ──
  const removeItem = useCallback(async (item: MenuItem) => {
    await repo.deleteMenuItem(item.id);
    return item;
  }, []);
  const [runDelete, removing] = useAction(removeItem);
  const cancelDelete = useCallback(() => setDeleting(null), []);
  const confirmDelete = async () => {
    if (!deleting) return;
    const removed = await runDelete(deleting);
    if (removed) {
      toast(t('adminMenu.remove.done', { name: itemName(removed) }), 'success');
      setDeleting(null);
    }
  };

  // Nút "+" gọn trên thanh công cụ khi nút "Thêm món" lớn đã cuộn khuất
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const [addButtonVisible, setAddButtonVisible] = useState(true);
  useEffect(() => {
    const el = addButtonRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => setAddButtonVisible(entry.isIntersecting), {
      rootMargin: '-176px 0px 0px 0px',
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const stockTiles: { value: StockFilter; label: string; count: number; dot: string }[] = [
    { value: 'all', label: t('adminMenu.stock.total'), count: counts.total, dot: 'bg-gold' },
    { value: 'available', label: t('adminMenu.available'), count: counts.available, dot: 'bg-leaf-light' },
    { value: 'soldout', label: t('adminMenu.soldOut'), count: counts.soldout, dot: 'bg-rattan-light' },
  ];

  const activeCategoryName = category === 'all' ? undefined : categoryName(category);

  return (
    <div className="px-4 pt-4 md:px-8 md:pt-8">
      {/* ── Đầu trang: ảnh quầy espresso + số liệu ── */}
      <section className="relative isolate overflow-hidden rounded-3xl bg-espresso-900 text-cream shadow-lift">
        <img src={heroPhoto} alt="" aria-hidden className="absolute inset-0 -z-10 h-full w-full object-cover object-[70%_35%]" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-espresso-900/95 via-espresso-900/80 to-espresso-900/40" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-2/3 bg-gradient-to-t from-espresso-900/90 to-transparent" />

        <div className="p-5 md:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">{t('adminMenu.eyebrow')}</p>
              <h1 className="mt-1 font-display text-[26px] font-extrabold leading-tight tracking-tight md:text-3xl">{t('nav.adminMenu')}</h1>
            </div>
            <Button ref={addButtonRef} variant="gold" leftIcon={<Plus className="h-5 w-5" aria-hidden />} onClick={() => openEditor(null)}>
              {t('adminMenu.addItem')}
            </Button>
          </div>
          <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-cream/75">
            {t('adminMenu.intro')}
          </p>

          <div role="group" aria-label={t('adminMenu.stock.aria')} className="mt-4 grid grid-cols-3 gap-2 md:max-w-md">
            {stockTiles.map((t) => {
              const on = stock === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  aria-pressed={on}
                  disabled={!ready}
                  onClick={() => setStock(on && t.value !== 'all' ? 'all' : t.value)}
                  className={cn(
                    'flex min-h-[68px] flex-col justify-between rounded-2xl px-3 py-2.5 text-left ring-1 ring-inset transition active:scale-[.97]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
                    on ? 'bg-cream text-espresso shadow-card ring-cream' : 'bg-white/[.08] text-cream ring-white/15 backdrop-blur-sm hover:bg-white/15',
                  )}
                >
                  {ready ? (
                    <span className="font-display text-2xl font-extrabold leading-none tabular-nums">{t.count}</span>
                  ) : (
                    <span className="block h-6 w-8 animate-pulse rounded-lg bg-white/15" aria-hidden />
                  )}
                  <span className={cn('mt-2 flex items-center gap-1.5 text-[11px] font-semibold', on ? 'text-bronze-700' : 'text-cream/80')}>
                    <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', t.dot)} aria-hidden />
                    {t.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Thanh công cụ dính: tìm kiếm + danh mục ── */}
      <div className="sticky top-[calc(env(safe-area-inset-top,0px)+3.5rem)] z-20 -mx-4 mt-3 bg-cream/90 px-4 py-2 backdrop-blur-md md:top-0 md:-mx-8 md:px-8">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="flex items-center gap-2 lg:w-80 lg:shrink-0">
            <SearchField value={query} onChange={setQuery} placeholder={t('adminMenu.search.placeholder')} className="flex-1" />
            {!addButtonVisible && (
              <IconButton label={t('adminMenu.addItem')} tone="dark" onClick={() => openEditor(null)} className="animate-pop-in shadow-card">
                <Plus className="h-5 w-5" />
              </IconButton>
            )}
          </div>
          <div className="no-scrollbar -mx-4 overflow-x-auto px-4 lg:mx-0 lg:flex-1 lg:px-0">
            <Segmented options={categoryOptions} value={category} onChange={setCategory} ariaLabel={t('adminMenu.filters.categoriesAria')} className="w-max min-w-full" />
          </div>
        </div>
      </div>

      {/* ── Danh sách ── */}
      {!ready ? (
        <div aria-busy="true" className="mt-3 grid gap-3 lg:grid-cols-2">
          <span className="sr-only">{t('adminMenu.list.loading')}</span>
          {Array.from({ length: 6 }, (_, i) => (
            <MenuItemRowSkeleton key={i} />
          ))}
        </div>
      ) : menu.length === 0 ? (
        <EmptyState
          icon={<UtensilsCrossed className="h-9 w-9" />}
          title={t('adminMenu.list.emptyTitle')}
          description={t('adminMenu.list.emptyBody')}
          action={
            <Button leftIcon={<Plus className="h-5 w-5" aria-hidden />} onClick={() => openEditor(null)}>
              {t('adminMenu.addItem')}
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        tokens.length > 0 ? (
          <EmptyState
            icon={<SearchX className="h-9 w-9" />}
            title={t('adminMenu.list.noMatchTitle')}
            description={
              activeCategoryName
                ? t('adminMenu.list.noMatchBodyIn', { query: query.trim(), category: activeCategoryName })
                : t('adminMenu.list.noMatchBody', { query: query.trim() })
            }
            action={
              <Button variant="outline" onClick={resetFilters}>
                {t('adminMenu.filters.clear')}
              </Button>
            }
          />
        ) : stock === 'soldout' ? (
          <EmptyState
            icon={<CircleCheck className="h-9 w-9" />}
            title={t('adminMenu.list.noSoldOutTitle')}
            description={
              activeCategoryName
                ? t('adminMenu.list.noSoldOutBodyIn', { category: activeCategoryName })
                : t('adminMenu.list.noSoldOutBody')
            }
            action={
              <Button variant="outline" onClick={resetFilters}>
                {t('adminMenu.filters.viewAll')}
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={<UtensilsCrossed className="h-9 w-9" />}
            title={
              activeCategoryName ? t('adminMenu.list.noItemsInTitle', { category: activeCategoryName }) : t('adminMenu.list.noItemsTitle')
            }
            description={stock === 'available' ? t('adminMenu.list.allSoldOutBody') : t('adminMenu.list.addHereBody')}
            action={
              stock === 'available' ? (
                <Button variant="outline" onClick={resetFilters}>
                  {t('adminMenu.filters.viewAll')}
                </Button>
              ) : (
                <Button leftIcon={<Plus className="h-5 w-5" aria-hidden />} onClick={() => openEditor(null)}>
                  {t('adminMenu.addItem')}
                </Button>
              )
            }
          />
        )
      ) : (
        <div className="mt-1">
          {filtersActive && (
            <div className="flex items-center justify-between gap-3 px-1 pt-2">
              <p className="text-sm text-stone" aria-live="polite">
                <CountText text={t('adminMenu.filters.matchCount', { count: filtered.length })} count={filtered.length} />
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="-mr-2 h-11 rounded-xl px-2 text-sm font-semibold text-bronze-700 transition hover:text-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                {t('adminMenu.filters.clear')}
              </button>
            </div>
          )}
          {sections.map(({ category: c, items }) => {
            const soldOut = items.filter((m) => !m.available).length;
            return (
              <section key={c?.id ?? 'flat'} aria-label={c?.name ?? activeCategoryName} className="mt-3">
                {!c && <h2 className="sr-only">{activeCategoryName}</h2>}
                {c && (
                  <div className="mb-2.5 mt-4 flex items-baseline justify-between px-1">
                    <h2 className="font-display text-[15px] font-bold tracking-tight text-espresso">
                      <span aria-hidden>{c.emoji} </span>
                      {c.name}
                    </h2>
                    <span className="text-xs text-stone">
                      {t('adminMenu.list.itemCount', { count: items.length })}
                      {soldOut > 0 && <span className="text-rattan-dark"> · {t('adminMenu.list.soldOutCount', { count: soldOut })}</span>}
                    </span>
                  </div>
                )}
                <div className="grid gap-3 lg:grid-cols-2">
                  {items.map((m) => (
                    <MenuItemRow key={m.id} item={m} highlighted={m.id === highlightId} onEdit={openEditor} onDelete={setDeleting} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {editor && (
        <MenuItemEditor
          key={editor.key}
          item={editor.item}
          defaultCategory={category === 'all' ? 'coffee' : category}
          missing={editingMissing}
          onSaved={handleSaved}
          onClose={closeEditor}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        title={t('adminMenu.remove.title')}
        description={
          <>
            <span className="font-semibold text-espresso">“{deleting ? itemName(deleting) : ''}”</span> {t('adminMenu.remove.body')}
            <span className="mt-2 block text-xs">{t('adminMenu.remove.tip')}</span>
          </>
        }
        confirmText={t('adminMenu.remove.confirm')}
        cancelText={t('adminMenu.remove.keep')}
        tone="danger"
        loading={removing}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
}
