import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { Ban, BellRing, CircleCheckBig, Coffee, Inbox, ScanLine, Search, SearchX, ShoppingBag, Volume2, VolumeX, Wallet } from 'lucide-react';
import { Button, EmptyState, IconButton, Input, Segmented, Skeleton, type SegmentedOption } from '@/components/ui';
import { AdminOrderCard } from '@/components/admin/orders/AdminOrderCard';
import { bucketOrders, ORDER_TABS, pickDefaultTab, QUEUE_TABS, type OrderTab } from '@/components/admin/orders/order-filters';
import { useNewOrderAlert } from '@/components/admin/orders/useNewOrderAlert';
import { useDataReady, useOrders } from '@/hooks/data';
import { useNow } from '@/hooks/useNow';
import { usePageTitle } from '@/hooks/usePageTitle';
import { cn } from '@/lib/cn';
import { formatDayMonth, formatPrice, formatWeekday, startOfDay } from '@/lib/format';

const TAB_ICON: Record<OrderTab, LucideIcon> = {
  pending: Wallet,
  new: Inbox,
  preparing: Coffee,
  handoff: ShoppingBag,
  done: CircleCheckBig,
  cancelled: Ban,
};

export default function AdminOrdersPage() {
  usePageTitle('Đơn hàng');
  const navigate = useNavigate();
  const ready = useDataReady();
  const orders = useOrders();
  const now = useNow(15_000);
  const today = startOfDay(now);
  const { freshIds, muted, audioReady, toggleMuted, enableSound } = useNewOrderAlert();

  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<OrderTab | null>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  const buckets = useMemo(() => bucketOrders(orders, today, query), [orders, today, query]);

  // Chọn tab mặc định một lần khi dữ liệu sẵn sàng
  useEffect(() => {
    if (ready && tab === null) setTab(pickDefaultTab(buckets));
  }, [ready, tab, buckets]);

  const current: OrderTab = tab ?? 'new';
  const meta = ORDER_TABS.find((t) => t.value === current) ?? ORDER_TABS[1];
  const list = buckets[current];
  const searching = query.trim().length > 0;
  const elsewhere = searching ? ORDER_TABS.filter((t) => t.value !== current && buckets[t.value].length > 0) : [];

  // Giữ tab đang chọn trong vùng nhìn thấy khi thanh tab cuộn ngang
  useEffect(() => {
    tabsRef.current
      ?.querySelector<HTMLElement>('[aria-selected="true"]')
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }, [current]);

  const options: SegmentedOption<OrderTab>[] = ORDER_TABS.map((t) => ({
    value: t.value,
    label: t.label,
    badge: buckets[t.value].length,
  }));

  const doneRevenue = current === 'done' ? list.reduce((s, o) => s + o.total, 0) : 0;
  const EmptyIcon = searching ? SearchX : TAB_ICON[current];

  return (
    <div className="pb-6">
      {/* Tiêu đề */}
      <div className="px-4 pt-5 md:px-6 md:pt-8 lg:px-8">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-bronze-600">
              <span className="relative flex h-2 w-2" aria-hidden>
                <span className="absolute inset-0 animate-ping rounded-full bg-leaf/60" />
                <span className="relative h-2 w-2 rounded-full bg-leaf" />
              </span>
              Trực tiếp · {formatWeekday(now)}, {formatDayMonth(now)}
            </p>
            <h1 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-espresso md:text-3xl">Đơn hàng</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <IconButton
              label="Âm báo đơn mới"
              aria-pressed={!muted}
              onClick={toggleMuted}
              className={cn('ring-1 ring-inset', muted ? 'bg-white text-stone ring-bronze-200' : 'bg-gold-soft text-bronze-800 ring-gold/50')}
            >
              {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </IconButton>
            <Button variant="leaf" className="hidden md:inline-flex" leftIcon={<ScanLine className="h-5 w-5" />} onClick={() => navigate('/admin/scan')}>
              Quét QR
            </Button>
          </div>
        </div>
        {!muted && !audioReady && (
          <button
            type="button"
            onClick={enableSound}
            className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-gold-soft/80 px-4 text-[13px] font-semibold text-bronze-800 ring-1 ring-inset ring-gold/50 transition hover:bg-gold-soft active:scale-[.98]"
          >
            <BellRing className="h-4 w-4 text-gold-dark" aria-hidden />
            Chạm để bật âm báo khi có đơn mới
          </button>
        )}
      </div>

      {/* Tìm kiếm + tab lọc (dính dưới thanh tiêu đề) */}
      <div className="sticky top-[calc(3.5rem_+_env(safe-area-inset-top,0px))] z-20 mt-3 border-b border-bronze-200/60 bg-cream/95 px-4 pb-3 pt-2 backdrop-blur-md md:top-0 md:px-6 lg:px-8">
        <Input
          type="search"
          aria-label="Tìm đơn hàng"
          placeholder="Tìm mã đơn, tên khách, số điện thoại…"
          icon={<Search className="h-5 w-5" />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="search"
        />
        <div ref={tabsRef} className="no-scrollbar -mx-4 mt-2.5 overflow-x-auto px-4 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
          <Segmented
            ariaLabel="Lọc đơn theo trạng thái"
            options={options}
            value={current}
            onChange={setTab}
            className="w-max min-w-full"
          />
        </div>
      </div>

      {/* Danh sách */}
      <section aria-label={meta.label} className="px-4 pt-4 md:px-6 lg:px-8">
        {!ready ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Đang tải đơn hàng">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-80 rounded-3xl" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-bronze-200 bg-white/40">
            <EmptyState
              icon={<EmptyIcon className="h-9 w-9" />}
              title={searching ? 'Không tìm thấy đơn phù hợp' : meta.emptyTitle}
              description={searching ? `Không có đơn khớp “${query.trim()}” trong mục “${meta.label}”.` : meta.emptyDescription}
              action={
                searching ? (
                  <div className="flex flex-wrap justify-center gap-2">
                    {elsewhere.map((t) => (
                      <Button key={t.value} variant="outline" size="md" onClick={() => setTab(t.value)}>
                        Xem ở “{t.label}” · {buckets[t.value].length}
                      </Button>
                    ))}
                    <Button variant="ghost" size="md" onClick={() => setQuery('')}>
                      Xoá tìm kiếm
                    </Button>
                  </div>
                ) : undefined
              }
            />
          </div>
        ) : (
          <>
            <p className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-1 text-xs text-stone" aria-live="polite">
              <span>
                <strong className="font-display text-sm font-bold text-espresso">{list.length}</strong> đơn
                {current === 'done' && (
                  <>
                    {' · '}doanh thu <strong className="font-display text-sm font-bold text-espresso">{formatPrice(doneRevenue)}</strong>
                  </>
                )}
              </span>
              <span>{QUEUE_TABS.includes(current) ? 'Đơn chờ lâu nhất ở trên cùng' : 'Mới nhất ở trên cùng'}</span>
            </p>
            <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
              {list.map((o) => (
                <AdminOrderCard key={o.id} order={o} now={now} highlight={freshIds.has(o.id)} />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
