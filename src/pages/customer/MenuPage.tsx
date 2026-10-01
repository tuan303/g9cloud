import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CircleAlert, Coffee, RefreshCw, Search, SearchX, X } from 'lucide-react';
import { APP_CONFIG } from '@/config/app';
import { CATEGORIES } from '@/data/menu';
import { Button, EmptyState, IconButton, Input, Logo, Skeleton } from '@/components/ui';
import { ActiveOrderCard, pickHighlightedOrder } from '@/components/menu/ActiveOrderCard';
import { CartBar } from '@/components/menu/CartBar';
import { CategoryTabs, categoryTabId, type CategoryTab } from '@/components/menu/CategoryTabs';
import { ItemDetailSheet } from '@/components/menu/ItemDetailSheet';
import { MenuCard, MenuCardSkeleton } from '@/components/menu/MenuCard';
import { MenuHero } from '@/components/menu/MenuHero';
import { matchesQuery, normalizeText, prefersReducedMotion, searchableText } from '@/components/menu/menu-utils';
import { useDataReady, useMenu, useMyActiveOrders } from '@/hooks/data';
import { pick, useT } from '@/i18n';
import { usePageTitle } from '@/hooks/usePageTitle';
import { cn } from '@/lib/cn';
import { itemName } from '@/lib/i18n-data';
import { defaultSelections, missingRequiredGroup, toSelectedOptions } from '@/lib/pricing';
import { platform } from '@/platform';
import { selectCartCount, useCart } from '@/store/cart';
import { toast } from '@/store/ui';
import type { CategoryId, MenuItem } from '@/types';

const DEFAULT_CATEGORY = CATEGORIES[0].id;
const parseCategory = (raw: string | null): CategoryId => CATEGORIES.find((c) => c.id === raw)?.id ?? DEFAULT_CATEGORY;
const groupDomId = (id: CategoryId) => `menu-group-${id}`;
const LIST_PANEL_ID = 'menu-list-panel';

// Thanh danh mục dính ngay dưới vùng tai thỏ (safe area)
const SAFE_TOP = 'env(safe-area-inset-top, 0px)';
const STICKY_STYLE: CSSProperties = { top: SAFE_TOP };
// Khi cuộn tới một nhóm kết quả: chừa chỗ cho thanh danh mục dính (~72px) + safe area
const GROUP_SCROLL_STYLE: CSSProperties = { scrollMarginTop: `calc(${SAFE_TOP} + 84px)` };

/** Quá thời gian này mà dữ liệu chưa sẵn sàng → hiện trạng thái lỗi kèm nút tải lại */
const SLOW_LOAD_MS = 10_000;

export default function MenuPage() {
  const { t, locale } = useT();
  usePageTitle(t('nav.menu'));
  const ready = useDataReady();
  const menu = useMenu();
  const activeOrders = useMyActiveOrders();
  const cartLines = useCart((s) => s.lines);
  const cartCount = useCart(selectCartCount);
  const addToCart = useCart((s) => s.add);

  // Danh mục lưu trên URL (?cat=) để quay lại từ giỏ hàng vẫn đúng tab
  const [searchParams, setSearchParams] = useSearchParams();
  const category = parseCategory(searchParams.get('cat'));

  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = normalizeText(deferredQuery);
  const searching = normalizedQuery.length > 0;
  const searchRef = useRef<HTMLInputElement>(null);

  const [detailId, setDetailId] = useState<string | null>(null);
  // Đọc món trực tiếp từ store → cập nhật tức thì nếu quán đổi giá / báo hết món khi đang xem
  const detailItem = useMemo(() => (detailId ? (menu.find((m) => m.id === detailId) ?? null) : null), [menu, detailId]);

  // ── Thanh danh mục dính: phát hiện trạng thái "đã dính" để thêm nền + bóng
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => setStuck(!entry.isIntersecting && entry.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // ── Tải chậm / lỗi
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (ready) return;
    const timer = window.setTimeout(() => setSlow(true), SLOW_LOAD_MS);
    return () => window.clearTimeout(timer);
  }, [ready]);

  // ── Dữ liệu dẫn xuất
  const sorted = useMemo(
    // Món tạm hết xuống cuối, còn lại theo thứ tự quán sắp xếp
    () => [...menu].sort((a, b) => Number(b.available) - Number(a.available) || a.sortOrder - b.sortOrder),
    [menu],
  );
  const haystacks = useMemo(() => new Map(menu.map((m) => [m.id, searchableText(m)])), [menu]);
  const results = useMemo(
    () => (searching ? sorted.filter((m) => matchesQuery(haystacks.get(m.id) ?? '', normalizedQuery)) : sorted),
    [searching, sorted, haystacks, normalizedQuery],
  );
  const tabs: CategoryTab[] = useMemo(
    // c.name tự đổi theo ngôn ngữ (getter) → tính lại khi đổi ngôn ngữ
    () => CATEGORIES.map((c) => ({ id: c.id, label: c.name, count: results.filter((m) => m.categoryId === c.id).length })),
    [results, locale],
  );
  const categoryItems = useMemo(() => sorted.filter((m) => m.categoryId === category), [sorted, category]);
  const inCart = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of cartLines) map.set(l.itemId, (map.get(l.itemId) ?? 0) + l.quantity);
    return map;
  }, [cartLines]);

  const highlighted = pickHighlightedOrder(activeOrders);
  const currentCategory = CATEGORIES.find((c) => c.id === category) ?? CATEGORIES[0];

  // ── Hành động
  const openDetail = useCallback((item: MenuItem) => setDetailId(item.id), []);
  const closeDetail = useCallback(() => setDetailId(null), []);

  const quickAdd = useCallback(
    (item: MenuItem) => {
      if (!item.available) return;
      const selections = defaultSelections(item);
      // Món có nhóm bắt buộc chưa có lựa chọn mặc định → mở chi tiết để khách tự chọn
      if (missingRequiredGroup(item.optionGroups, selections)) {
        setDetailId(item.id);
        return;
      }
      addToCart(item, toSelectedOptions(item.optionGroups, selections), 1);
      platform.vibrate(12);
      toast(t('menu.added', { name: itemName(item) }), 'success');
    },
    [addToCart, t],
  );

  const selectCategory = (id: CategoryId) => {
    if (searching) {
      // Đang tìm: tab đóng vai trò mục lục → cuộn tới nhóm kết quả tương ứng
      document.getElementById(groupDomId(id))?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
      return;
    }
    if (id !== category) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('cat', id);
          return next;
        },
        { replace: true, preventScrollReset: true },
      );
    }
    // Đang cuộn sâu trong danh sách → đưa về đầu danh mục mới (thanh tab vẫn dính)
    if (stuck) sentinelRef.current?.scrollIntoView({ block: 'start' });
  };

  const clearSearch = () => {
    setQuery('');
    searchRef.current?.focus();
  };

  const renderCards = (items: MenuItem[]) => (
    <ul className="space-y-3">
      {items.map((m) => (
        <MenuCard key={m.id} item={m} inCart={inCart.get(m.id) ?? 0} onOpen={openDetail} onQuickAdd={quickAdd} />
      ))}
    </ul>
  );

  let list: ReactNode;
  if (!ready) {
    list = slow ? (
      <EmptyState
        icon={<CircleAlert className="h-9 w-9" />}
        title={t('menu.page.loadFailedTitle')}
        description={t('menu.page.loadFailedBody')}
        action={
          <Button variant="outline" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={() => window.location.reload()}>
            {t('menu.page.reload')}
          </Button>
        }
      />
    ) : (
      <div className="space-y-3" role="status" aria-label={t('menu.page.loadingAria')}>
        {Array.from({ length: 5 }, (_, i) => (
          <MenuCardSkeleton key={i} />
        ))}
      </div>
    );
  } else if (menu.length === 0) {
    list = (
      <EmptyState
        icon={<Coffee className="h-9 w-9" />}
        title={t('menu.page.emptyTitle')}
        description={t('menu.page.emptyBody')}
      />
    );
  } else if (searching) {
    list = results.length ? (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3 px-1">
          <p className="min-w-0 truncate text-sm text-stone" aria-live="polite">
            <span className="font-semibold text-espresso">{t('menu.itemCount', { count: results.length })}</span>{' '}
            {t('menu.search.resultFor', { query: deferredQuery.trim() })}
          </p>
          <button type="button" onClick={clearSearch} className="-mr-2 min-h-[44px] shrink-0 px-2 text-sm font-semibold text-bronze-700 hover:text-espresso">
            {t('menu.search.clear')}
          </button>
        </div>
        {CATEGORIES.map((c) => {
          const items = results.filter((m) => m.categoryId === c.id);
          if (!items.length) return null;
          return (
            <section key={c.id} id={groupDomId(c.id)} style={GROUP_SCROLL_STYLE} aria-label={c.name}>
              <h2 className="mb-2.5 flex items-baseline gap-2 px-1 font-display text-[15px] font-bold text-espresso">
                {c.name}
                <span className="font-sans text-xs font-medium text-stone">{t('menu.itemCount', { count: items.length })}</span>
              </h2>
              {renderCards(items)}
            </section>
          );
        })}
      </div>
    ) : (
      <EmptyState
        icon={<SearchX className="h-9 w-9" />}
        title={t('menu.search.noResultsTitle')}
        description={t('menu.search.noResultsBody')}
        action={
          <Button variant="outline" onClick={clearSearch}>
            {t('menu.search.clear')}
          </Button>
        }
      />
    );
  } else {
    list = (
      <div id={LIST_PANEL_ID} role="tabpanel" aria-labelledby={categoryTabId(category)}>
        <div className="mb-3 flex items-baseline justify-between gap-3 px-1">
          <h2 className="font-display text-lg font-bold tracking-tight text-espresso">{currentCategory.name}</h2>
          {/* Nhãn phụ tiếng Anh (chỉ khi đang xem tiếng Việt — tiếng Anh thì trùng tên chính) */}
          {currentCategory.nameEn !== currentCategory.name && (
            <span lang="en" className="text-[11px] font-semibold uppercase tracking-[.18em] text-bronze-500">
              {currentCategory.nameEn}
            </span>
          )}
        </div>
        {categoryItems.length ? (
          renderCards(categoryItems)
        ) : (
          <EmptyState
            icon={<Coffee className="h-9 w-9" />}
            title={t('menu.page.categoryEmptyTitle')}
            description={t('menu.page.categoryEmptyBody')}
          />
        )}
      </div>
    );
  }

  return (
    <div className="relative min-h-full">
      <MenuHero />

      {/* Tấm nền kem bo góc phủ lên mép dưới hero */}
      <div className="relative -mt-6 rounded-t-[28px] bg-cream px-4 pt-5">
        {ready && highlighted && (
          <ActiveOrderCard order={highlighted} moreCount={activeOrders.length - 1} className="mb-4 animate-fade-in" />
        )}

        <div className="relative">
          <Input
            ref={searchRef}
            type="search"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            aria-label={t('menu.search.aria')}
            placeholder={t('menu.search.placeholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur();
              if (e.key === 'Escape') setQuery('');
            }}
            icon={<Search className="h-5 w-5" />}
            className="pr-12 shadow-card [&::-webkit-search-cancel-button]:appearance-none"
          />
          {query && (
            <IconButton
              label={t('menu.search.clear')}
              onClick={clearSearch}
              className="absolute right-0.5 top-1/2 -translate-y-1/2"
            >
              <X className="h-[18px] w-[18px]" />
            </IconButton>
          )}
        </div>
      </div>

      {/* Mốc để biết thanh danh mục đã dính lên đỉnh chưa */}
      <div ref={sentinelRef} aria-hidden className="h-px" style={{ scrollMarginTop: SAFE_TOP }} />

      {/* Nền che vùng tai thỏ khi thanh danh mục đang dính */}
      <div
        aria-hidden
        className={cn(
          'pointer-events-none fixed inset-x-0 top-0 z-30 mx-auto max-w-md bg-cream/95 backdrop-blur-md transition-opacity',
          stuck ? 'opacity-100' : 'opacity-0',
        )}
        style={{ height: SAFE_TOP }}
      />

      <div
        style={STICKY_STYLE}
        className={cn(
          'sticky z-20 px-4 pb-2.5 pt-2 transition-shadow duration-200',
          stuck ? 'bg-cream/95 shadow-[0_10px_24px_-14px_rgba(42,34,24,0.35)] backdrop-blur-md' : 'bg-cream',
        )}
      >
        {ready ? (
          <CategoryTabs tabs={tabs} value={searching ? null : category} onChange={selectCategory} panelId={LIST_PANEL_ID} />
        ) : (
          <Skeleton className="h-[64px] rounded-[22px]" />
        )}
      </div>

      <div className={cn('px-4 pt-3', cartCount > 0 ? 'pb-24' : 'pb-4')}>
        {list}

        {ready && menu.length > 0 && (
          <footer className="mt-10 flex flex-col items-center gap-1.5 pb-2 text-center">
            <Logo className="h-[20px] text-bronze-300" title="Cloud 9" />
            <p className="text-xs text-stone">
              {pick(APP_CONFIG.shop.location, APP_CONFIG.shop.locationEn, locale)} ·{' '}
              {pick(APP_CONFIG.shop.openingHours, APP_CONFIG.shop.openingHoursEn, locale)}
            </p>
          </footer>
        )}
      </div>

      <CartBar />
      <ItemDetailSheet item={detailItem} open={!!detailItem} onClose={closeDetail} />
    </div>
  );
}
