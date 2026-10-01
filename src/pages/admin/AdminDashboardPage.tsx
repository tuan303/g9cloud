import { useEffect, useMemo, useRef, useState } from 'react';
import { useDataReady, useOrders } from '@/hooks/data';
import { useNow } from '@/hooks/useNow';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useT } from '@/i18n';
import { startOfDay } from '@/lib/format';
import { countByStatus, revenueByDay, todayKpis } from '@/lib/stats';
import {
  ActiveOrdersCard,
  DashboardHeader,
  DashboardSkeleton,
  DemoDataTools,
  KpiGrid,
  LivePaymentsCard,
  QuickActions,
  StatsSection,
} from '@/components/admin/dashboard';

const PAGE = 'space-y-6 px-4 pb-4 pt-5 md:space-y-8 md:px-8';

/** Tổng quan quản trị: KPI hôm nay, thanh toán QR trực tiếp, đơn đang xử lý, thống kê 7 ngày */
export default function AdminDashboardPage() {
  const { t } = useT();
  usePageTitle(t('nav.dashboard'));
  const ready = useDataReady();
  const orders = useOrders();
  // Làm mới số liệu theo thời gian (so sánh "cùng giờ hôm qua", sang ngày mới) mỗi 30 giây
  const now = useNow(30_000);
  const dayStart = startOfDay(now);

  const kpis = useMemo(() => todayKpis(orders, now), [orders, now]);
  const week = useMemo(() => revenueByDay(orders, 7, dayStart), [orders, dayStart]);
  const counts = useMemo(() => countByStatus(orders), [orders]);
  const demoCount = useMemo(() => orders.filter((o) => o.isDemo).length, [orders]);

  // Thời điểm dữ liệu đơn thay đổi gần nhất (cho chỉ báo "Trực tiếp")
  const [updatedAt, setUpdatedAt] = useState(() => Date.now());
  useEffect(() => setUpdatedAt(Date.now()), [orders]);

  const liveRef = useRef<HTMLElement>(null);
  const scrollToLive = () => {
    const el = liveRef.current;
    if (!el) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    el.focus({ preventScroll: true });
  };

  if (!ready) {
    return (
      <div className={PAGE}>
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <div className={PAGE}>
      <DashboardHeader now={now} updatedAt={updatedAt} />

      <KpiGrid kpis={kpis} week={week} onPendingClick={scrollToLive} />

      {/* grid-cols-1 = minmax(0,1fr): tránh nội dung dài (truncate) đẩy cột rộng hơn màn hình */}
      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-3">
        <LivePaymentsCard ref={liveRef} orders={orders} dayStart={dayStart} className="min-w-0 xl:col-span-2" />
        <div className="grid min-w-0 grid-cols-1 items-start gap-4 lg:grid-cols-2 xl:grid-cols-1">
          <ActiveOrdersCard counts={counts} />
          <QuickActions activeCount={kpis.activeCount} />
        </div>
      </div>

      <StatsSection orders={orders} week={week} now={now} />

      <DemoDataTools demoCount={demoCount} />
    </div>
  );
}
