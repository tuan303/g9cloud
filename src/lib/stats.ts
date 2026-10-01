import { CATEGORIES } from '@/data/menu';
import { translate } from '@/i18n';
import { formatDayMonth, formatWeekday, startOfDay } from '@/lib/format';
import type { CategoryId, Order, OrderStatus } from '@/types';

/**
 * Thống kê cho trang quản trị — hàm thuần trên danh sách đơn.
 * Doanh thu chỉ tính đơn ĐÃ THANH TOÁN và KHÔNG bị huỷ
 * (đơn huỷ sau khi thu tiền chuyển sang `refunded` nên cũng bị loại).
 */

export const isRevenueOrder = (o: Pick<Order, 'paymentStatus' | 'status'>) =>
  o.paymentStatus === 'paid' && o.status !== 'cancelled';

/** Thời điểm ghi nhận doanh thu: lúc thu tiền (nếu có), không thì lúc tạo đơn */
export const revenueTime = (o: Pick<Order, 'paidAt' | 'createdAt'>) => o.paidAt ?? o.createdAt;

/** Cộng/trừ n ngày theo lịch (an toàn với giờ mùa hè) */
export function addDays(ts: number, n: number): number {
  const d = new Date(ts);
  d.setDate(d.getDate() + n);
  return d.getTime();
}

/** % thay đổi so với kỳ trước. null khi kỳ trước = 0 mà kỳ này > 0 (không có mốc so sánh). */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

// ───────────────────────── KPI ─────────────────────────

export interface PeriodKpis {
  revenue: number;
  orderCount: number;
  avgOrderValue: number;
  itemsSold: number;
}

export interface TodayKpis extends PeriodKpis {
  /** Đơn đang chờ quét QR tại quầy (hiện tại) */
  pendingPaymentCount: number;
  /** Đơn đã thanh toán, đang xử lý: đã nhận → đang chuẩn bị → sẵn sàng / đang giao */
  activeCount: number;
  /** Cốc miễn phí (tích điểm) đã đổi hôm nay: đơn đã thanh toán, không huỷ, có loyaltyRedeem */
  freeCupsRedeemed: number;
  /** Hôm qua tính tới CÙNG GIỜ với hiện tại — so sánh công bằng khi ngày chưa kết thúc */
  yesterday: PeriodKpis;
  deltas: Record<keyof PeriodKpis, number | null>;
}

/** KPI của các đơn có doanh thu trong khoảng [from, to) */
export function periodKpis(orders: Order[], from: number, to: number): PeriodKpis {
  let revenue = 0;
  let orderCount = 0;
  let itemsSold = 0;
  for (const o of orders) {
    if (!isRevenueOrder(o)) continue;
    const ts = revenueTime(o);
    if (ts < from || ts >= to) continue;
    revenue += o.total;
    orderCount += 1;
    itemsSold += o.itemCount;
  }
  return { revenue, orderCount, itemsSold, avgOrderValue: orderCount ? Math.round(revenue / orderCount) : 0 };
}

/** Số cốc miễn phí (tích điểm) đã đổi trong khoảng [from, to) — mỗi đơn đổi thưởng = 1 cốc */
export function freeCupsRedeemed(orders: Order[], from: number, to: number): number {
  let count = 0;
  for (const o of orders) {
    if (!o.loyaltyRedeem || !isRevenueOrder(o)) continue;
    const ts = revenueTime(o);
    if (ts >= from && ts < to) count += 1;
  }
  return count;
}

const ACTIVE: OrderStatus[] = ['received', 'preparing', 'ready', 'delivering'];

export function todayKpis(orders: Order[], now = Date.now()): TodayKpis {
  const todayStart = startOfDay(now);
  const yesterdayStart = addDays(todayStart, -1);
  const elapsed = Math.max(0, now - todayStart);

  const today = periodKpis(orders, todayStart, addDays(todayStart, 1));
  const yesterday = periodKpis(orders, yesterdayStart, Math.min(yesterdayStart + elapsed + 1, todayStart));

  let pendingPaymentCount = 0;
  let activeCount = 0;
  for (const o of orders) {
    if (o.status === 'pending_payment') pendingPaymentCount += 1;
    else if (ACTIVE.includes(o.status)) activeCount += 1;
  }

  return {
    ...today,
    pendingPaymentCount,
    activeCount,
    freeCupsRedeemed: freeCupsRedeemed(orders, todayStart, addDays(todayStart, 1)),
    yesterday,
    deltas: {
      revenue: percentChange(today.revenue, yesterday.revenue),
      orderCount: percentChange(today.orderCount, yesterday.orderCount),
      avgOrderValue: percentChange(today.avgOrderValue, yesterday.avgOrderValue),
      itemsSold: percentChange(today.itemsSold, yesterday.itemsSold),
    },
  };
}

/** Số đơn theo từng trạng thái (toàn bộ danh sách) */
export function countByStatus(orders: Order[]): Record<OrderStatus, number> {
  const counts: Record<OrderStatus, number> = {
    pending_payment: 0,
    received: 0,
    preparing: 0,
    ready: 0,
    delivering: 0,
    completed: 0,
    cancelled: 0,
  };
  for (const o of orders) counts[o.status] += 1;
  return counts;
}

// ───────────────────────── Theo ngày ─────────────────────────

export interface DayRevenue {
  dayStart: number;
  /** "T4 30/09" */
  label: string;
  /** "T4" */
  weekday: string;
  /** "30/09" */
  dayMonth: string;
  revenue: number;
  orders: number;
  isToday: boolean;
}

/** Doanh thu `days` ngày gần nhất (cũ → mới, ngày cuối là hôm nay) */
export function revenueByDay(orders: Order[], days = 7, now = Date.now()): DayRevenue[] {
  const today = startOfDay(now);
  const buckets: DayRevenue[] = [];
  const byStart = new Map<number, DayRevenue>();
  for (let i = days - 1; i >= 0; i--) {
    const dayStart = addDays(today, -i);
    const weekday = formatWeekday(dayStart);
    const dayMonth = formatDayMonth(dayStart);
    const bucket: DayRevenue = { dayStart, label: `${weekday} ${dayMonth}`, weekday, dayMonth, revenue: 0, orders: 0, isToday: i === 0 };
    buckets.push(bucket);
    byStart.set(dayStart, bucket);
  }
  for (const o of orders) {
    if (!isRevenueOrder(o)) continue;
    const bucket = byStart.get(startOfDay(revenueTime(o)));
    if (!bucket) continue;
    bucket.revenue += o.total;
    bucket.orders += 1;
  }
  return buckets;
}

// ───────────────────────── Theo danh mục ─────────────────────────

export interface CategoryShare {
  categoryId: CategoryId;
  name: string;
  revenue: number;
  quantity: number;
  /** Tỷ trọng % (số nguyên, tổng các danh mục = 100 khi có doanh thu) */
  share: number;
}

export interface CategoryBreakdown {
  total: number;
  quantity: number;
  slices: CategoryShare[];
}

/**
 * Cơ cấu doanh thu theo danh mục từ `since` (tính theo tiền món — không gồm phí giao / giảm giá).
 * Luôn trả đủ các danh mục theo thứ tự thực đơn, kể cả danh mục chưa có doanh thu.
 */
export function revenueByCategory(orders: Order[], since: number, until = Number.POSITIVE_INFINITY): CategoryBreakdown {
  const map = new Map<CategoryId, CategoryShare>(
    CATEGORIES.map((c) => [c.id, { categoryId: c.id, name: c.name, revenue: 0, quantity: 0, share: 0 }]),
  );
  for (const o of orders) {
    if (!isRevenueOrder(o)) continue;
    const ts = revenueTime(o);
    if (ts < since || ts >= until) continue;
    for (const line of o.items) {
      const slice = map.get(line.categoryId);
      if (!slice) continue;
      slice.revenue += line.lineTotal ?? line.unitPrice * line.quantity;
      slice.quantity += line.quantity;
    }
  }
  const slices = [...map.values()];
  const total = slices.reduce((s, x) => s + x.revenue, 0);
  const quantity = slices.reduce((s, x) => s + x.quantity, 0);
  roundShares(slices, total);
  return { total, quantity, slices };
}

/** Làm tròn tỷ trọng theo phương pháp phần dư lớn nhất để tổng đúng 100% */
function roundShares(slices: CategoryShare[], total: number) {
  if (total <= 0) return;
  const raw = slices.map((s) => (s.revenue / total) * 100);
  slices.forEach((s, i) => (s.share = Math.floor(raw[i])));
  let rest = 100 - slices.reduce((sum, s) => sum + s.share, 0);
  const order = raw.map((v, i) => ({ i, frac: v - Math.floor(v) })).sort((a, b) => b.frac - a.frac);
  for (const { i } of order) {
    if (rest <= 0) break;
    slices[i].share += 1;
    rest -= 1;
  }
}

// ───────────────────────── Món bán chạy ─────────────────────────

export interface TopItem {
  itemId: string;
  name: string;
  /** Tên tiếng Anh (hiển thị bằng lineName) */
  nameEn?: string;
  categoryId: CategoryId;
  image: string;
  quantity: number;
  revenue: number;
}

/** Món bán chạy nhất từ `since` — xếp theo số lượng, hoà thì theo doanh thu */
export function topItems(orders: Order[], since: number, limit = 5): TopItem[] {
  const map = new Map<string, TopItem & { lastSeen: number }>();
  for (const o of orders) {
    if (!isRevenueOrder(o)) continue;
    const ts = revenueTime(o);
    if (ts < since) continue;
    for (const line of o.items) {
      const revenue = line.lineTotal ?? line.unitPrice * line.quantity;
      const cur = map.get(line.itemId);
      if (cur) {
        cur.quantity += line.quantity;
        cur.revenue += revenue;
        // Giữ tên / ảnh mới nhất (món có thể được đổi tên)
        // (đơn mới hơn thiếu tên tiếng Anh thì giữ tên tiếng Anh đã biết của cùng tên món)
        if (ts > cur.lastSeen)
          Object.assign(cur, { name: line.name, nameEn: line.nameEn ?? (line.name === cur.name ? cur.nameEn : undefined), image: line.image, lastSeen: ts });
      } else {
        map.set(line.itemId, {
          itemId: line.itemId,
          name: line.name,
          nameEn: line.nameEn,
          categoryId: line.categoryId,
          image: line.image,
          quantity: line.quantity,
          revenue,
          lastSeen: ts,
        });
      }
    }
  }
  return [...map.values()]
    .sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue)
    .slice(0, limit)
    .map(({ lastSeen: _lastSeen, ...rest }) => rest);
}

// ───────────────────────── Theo giờ ─────────────────────────

export interface HourBucket {
  hour: number;
  /** "7h" (tiếng Anh "7am") */
  label: string;
  orders: number;
  revenue: number;
}

/** Nhãn giờ trên trục biểu đồ: "7h" / "7am", "13h" / "1pm" (theo ngôn ngữ đang chọn) */
export function hourLabel(hour: number): string {
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return translate(hour < 12 ? 'adminDashboard.chart.hourAm' : 'adminDashboard.chart.hourPm', { h24: hour, h12 });
}

/**
 * Số đơn (đã thanh toán) theo giờ đặt trong ngày `dayStart`.
 * Mặc định 07h–17h theo giờ mở cửa; tự mở rộng nếu có đơn ngoài khung này.
 */
export function ordersByHour(orders: Order[], dayStart: number, openHour = 7, closeHour = 17): HourBucket[] {
  const start = startOfDay(dayStart);
  const end = addDays(start, 1);
  const counts = new Map<number, { orders: number; revenue: number }>();
  let first = openHour;
  let last = closeHour;
  for (const o of orders) {
    if (!isRevenueOrder(o) || o.createdAt < start || o.createdAt >= end) continue;
    const h = new Date(o.createdAt).getHours();
    first = Math.min(first, h);
    last = Math.max(last, h);
    const cur = counts.get(h) ?? { orders: 0, revenue: 0 };
    cur.orders += 1;
    cur.revenue += o.total;
    counts.set(h, cur);
  }
  const buckets: HourBucket[] = [];
  for (let h = first; h <= last; h++) {
    const c = counts.get(h);
    buckets.push({ hour: h, label: hourLabel(h), orders: c?.orders ?? 0, revenue: c?.revenue ?? 0 });
  }
  return buckets;
}
