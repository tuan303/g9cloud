import type { CustomerInfo, MenuItem, Order, OrderLine, OrderStatus } from '@/types';
import { defaultSelections, toSelectedOptions, unitPrice } from '@/lib/pricing';
import { startOfDay } from '@/lib/format';

/** PRNG có seed — dữ liệu demo ổn định giữa các lần tải */
function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NAMES = [
  'Minh Anh', 'Gia Huy', 'Bảo Ngọc', 'Khánh Linh', 'Đức Minh', 'Thu Trang', 'Hoàng Nam', 'Phương Thảo',
  'Quang Vinh', 'Hải Yến', 'Tuấn Kiệt', 'Mai Chi', 'Cô Hương', 'Thầy Long', 'Cô Lan', 'Thầy Dũng',
];
const ADDRESSES = ['Lớp 6A1', 'Lớp 7A2', 'Lớp 8B1', 'Lớp 9A3', 'Lớp 10A1', 'Lớp 11C2', 'Phòng Giáo vụ', 'Phòng Hành chính', 'Thư viện – Tầng 2', 'Phòng Hội đồng'];

/** Khung giờ đông khách trong trường (giờ thập phân, trọng số) */
const HOUR_WEIGHTS: [number, number][] = [
  [7.0, 5], [7.5, 7], [8.0, 3], [9.0, 2], [9.5, 8], [10.0, 4], [11.0, 3],
  [11.5, 6], [12.0, 7], [12.5, 5], [13.5, 2], [14.5, 4], [15.0, 5], [15.5, 3], [16.0, 3],
];

function pickWeighted<T>(rand: () => number, entries: [T, number][]): T {
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = rand() * total;
  for (const [v, w] of entries) {
    if ((r -= w) <= 0) return v;
  }
  return entries[entries.length - 1][0];
}

/**
 * Sinh đơn mẫu cho 7 ngày gần nhất (kể cả hôm nay, chỉ trước thời điểm hiện tại).
 * Chủ nhật nghỉ. Đơn đánh dấu isDemo = true để có thể xoá hàng loạt.
 */
export function generateDemoOrders(menu: MenuItem[], now = Date.now()): Order[] {
  const rand = mulberry32(20260930);
  const orders: Order[] = [];
  const available = menu.filter((m) => m.available);
  if (!available.length) return orders;
  const itemWeights: [MenuItem, number][] = available.map((m) => [m, m.tags?.includes('bestseller') ? 5 : m.tags?.length ? 3 : 2]);
  const today = startOfDay(now);

  for (let d = 6; d >= 0; d--) {
    const dayStart = today - d * 86400000;
    const weekday = new Date(dayStart).getDay();
    if (weekday === 0) continue; // Chủ nhật nghỉ
    const count = Math.round((weekday === 6 ? 12 : 22) + rand() * 14);
    const stamps: number[] = [];
    for (let i = 0; i < count; i++) {
      const hour = pickWeighted(rand, HOUR_WEIGHTS);
      const ts = dayStart + (hour * 60 + Math.floor(rand() * 30)) * 60000 + Math.floor(rand() * 60000);
      if (ts < now - 20 * 60000) stamps.push(ts);
    }
    stamps.sort((a, b) => a - b);

    stamps.forEach((createdAt, idx) => {
      const lineCount = 1 + Math.floor(rand() * rand() * 3.2);
      const lines: OrderLine[] = [];
      for (let l = 0; l < lineCount; l++) {
        const item = pickWeighted(rand, itemWeights);
        const sel = defaultSelections(item);
        const sizeGroup = item.optionGroups?.find((g) => g.id === 'size');
        if (sizeGroup && rand() < 0.3) sel.size = ['L'];
        const options = toSelectedOptions(item.optionGroups, sel);
        const price = unitPrice(item, options);
        const quantity = rand() < 0.8 ? 1 : 2;
        const existing = lines.find((x) => x.itemId === item.id && JSON.stringify(x.options) === JSON.stringify(options));
        if (existing) {
          existing.quantity += quantity;
          existing.lineTotal = existing.unitPrice * existing.quantity;
          continue;
        }
        lines.push({
          lineId: `demo_${d}_${idx}_${l}`,
          itemId: item.id,
          categoryId: item.categoryId,
          name: item.name,
          image: item.image,
          basePrice: item.price,
          unitPrice: price,
          quantity,
          options,
          lineTotal: price * quantity,
        });
      }
      const name = NAMES[Math.floor(rand() * NAMES.length)];
      const isGuest = rand() < 0.3;
      const customer: CustomerInfo = {
        id: `demo_customer_${name}`,
        name,
        isGuest,
        authProvider: isGuest ? 'guest' : 'school_email',
      };
      const delivery = rand() < 0.28;
      const cancelled = rand() < 0.04;
      const subtotal = lines.reduce((s, x) => s + x.lineTotal, 0);
      const paidAt = createdAt + (1 + Math.floor(rand() * 3)) * 60000;
      const prepAt = paidAt + 60000;
      const doneAt = prepAt + (4 + Math.floor(rand() * 6)) * 60000;
      const finalStatus: OrderStatus = cancelled ? 'cancelled' : 'completed';
      orders.push({
        id: `demo_${dayStart}_${idx}`,
        code: `C9-${String(idx + 1).padStart(3, '0')}`,
        customer,
        fulfillment: delivery ? 'delivery' : 'pickup',
        deliveryAddress: delivery ? ADDRESSES[Math.floor(rand() * ADDRESSES.length)] : undefined,
        items: lines,
        itemCount: lines.reduce((s, x) => s + x.quantity, 0),
        subtotal,
        deliveryFee: 0,
        discount: 0,
        total: subtotal,
        paymentMethod: 'qr_pos',
        paymentStatus: cancelled ? 'unpaid' : 'paid',
        status: finalStatus,
        createdAt,
        updatedAt: cancelled ? paidAt : doneAt + 120000,
        paidAt: cancelled ? undefined : paidAt,
        statusHistory: cancelled
          ? [
              { status: 'pending_payment', at: createdAt, by: 'customer' },
              { status: 'cancelled', at: paidAt, by: 'system', note: 'Hết hạn thanh toán' },
            ]
          : [
              { status: 'pending_payment', at: createdAt, by: 'customer' },
              { status: 'received', at: paidAt, by: 'staff' },
              { status: 'preparing', at: prepAt, by: 'staff' },
              { status: delivery ? 'delivering' : 'ready', at: doneAt, by: 'staff' },
              { status: 'completed', at: doneAt + 120000, by: 'staff' },
            ],
        cancelReason: cancelled ? 'Hết hạn thanh toán' : undefined,
        isDemo: true,
      });
    });
  }
  return orders;
}
