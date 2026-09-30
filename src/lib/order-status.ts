import type { FulfillmentType, NotificationKind, Order, OrderStatus } from '@/types';

export interface StatusMeta {
  label: string;
  /** Mô tả ngắn cho khách */
  description: string;
  /** Lớp Tailwind cho badge */
  badgeClass: string;
  /** Màu chấm / thanh tiến trình */
  dotClass: string;
}

export const STATUS_META: Record<OrderStatus, StatusMeta> = {
  pending_payment: {
    label: 'Chờ thanh toán',
    description: 'Đưa mã QR cho thu ngân quét tại quầy để thanh toán',
    badgeClass: 'bg-gold-soft text-bronze-800 ring-1 ring-gold/60',
    dotClass: 'bg-gold',
  },
  received: {
    label: 'Đã nhận đơn',
    description: 'Quán đã nhận đơn và thanh toán của bạn',
    badgeClass: 'bg-bronze-100 text-bronze-800 ring-1 ring-bronze-300',
    dotClass: 'bg-bronze-500',
  },
  preparing: {
    label: 'Đang chuẩn bị',
    description: 'Barista đang pha chế món của bạn',
    badgeClass: 'bg-rattan-soft text-rattan-dark ring-1 ring-rattan-light/50',
    dotClass: 'bg-rattan',
  },
  ready: {
    label: 'Sẵn sàng',
    description: 'Món đã xong — mời bạn đến quầy nhận',
    badgeClass: 'bg-leaf-soft text-leaf-dark ring-1 ring-leaf-light/60',
    dotClass: 'bg-leaf',
  },
  delivering: {
    label: 'Đang giao',
    description: 'Nhân viên đang mang món đến cho bạn',
    badgeClass: 'bg-leaf-soft text-leaf-dark ring-1 ring-leaf-light/60',
    dotClass: 'bg-leaf',
  },
  completed: {
    label: 'Hoàn thành',
    description: 'Chúc bạn ngon miệng!',
    badgeClass: 'bg-espresso text-cream',
    dotClass: 'bg-gold',
  },
  cancelled: {
    label: 'Đã huỷ',
    description: 'Đơn hàng đã bị huỷ',
    badgeClass: 'bg-stone-soft text-stone ring-1 ring-stone-light/40',
    dotClass: 'bg-stone-light',
  },
};

/** Các bước hiển thị trên thanh tiến trình (không gồm pending_payment / cancelled) */
export function statusSteps(fulfillment: FulfillmentType): OrderStatus[] {
  return fulfillment === 'delivery'
    ? ['received', 'preparing', 'delivering', 'completed']
    : ['received', 'preparing', 'ready', 'completed'];
}

/** Nhãn bước theo hình thức nhận (bước cuối khác nhau) */
export function stepLabel(status: OrderStatus, fulfillment: FulfillmentType): string {
  if (status === 'completed') return fulfillment === 'delivery' ? 'Đã giao' : 'Đã nhận món';
  return STATUS_META[status].label;
}

/** Trạng thái kế tiếp mà nhân viên có thể chuyển sang (null nếu đã kết thúc) */
export function nextStatus(order: Pick<Order, 'status' | 'fulfillment' | 'paymentStatus'>): OrderStatus | null {
  switch (order.status) {
    case 'pending_payment':
      return 'received'; // xác nhận thanh toán
    case 'received':
      return 'preparing';
    case 'preparing':
      return order.fulfillment === 'delivery' ? 'delivering' : 'ready';
    case 'ready':
    case 'delivering':
      return 'completed';
    default:
      return null;
  }
}

/** Nhãn nút hành động cho nhân viên để chuyển sang trạng thái kế tiếp */
export function nextActionLabel(order: Pick<Order, 'status' | 'fulfillment' | 'paymentStatus'>): string | null {
  switch (order.status) {
    case 'pending_payment':
      return 'Xác nhận đã thanh toán';
    case 'received':
      return 'Bắt đầu pha chế';
    case 'preparing':
      return order.fulfillment === 'delivery' ? 'Bắt đầu giao' : 'Báo món sẵn sàng';
    case 'ready':
      return 'Khách đã nhận';
    case 'delivering':
      return 'Đã giao xong';
    default:
      return null;
  }
}

export const ACTIVE_STATUSES: OrderStatus[] = ['pending_payment', 'received', 'preparing', 'ready', 'delivering'];
export const isActiveOrder = (o: Pick<Order, 'status'>) => ACTIVE_STATUSES.includes(o.status);

/** Nội dung thông báo gửi khách khi trạng thái đơn thay đổi */
export function notificationFor(order: Order): { kind: NotificationKind; title: string; body: string } | null {
  const code = order.code;
  switch (order.status) {
    case 'received':
      return { kind: 'order_received', title: 'Đơn hàng đã nhận ✅', body: `Đơn ${code} đã được thanh toán. Quán sẽ bắt đầu chuẩn bị ngay!` };
    case 'preparing':
      return { kind: 'order_preparing', title: 'Đang chuẩn bị ☕', body: `Barista đang pha chế đơn ${code} của bạn.` };
    case 'ready':
      return { kind: 'order_ready', title: 'Đơn hàng sẵn sàng 🛍️', body: `Đơn ${code} đã xong — mời bạn đến quầy nhận món.` };
    case 'delivering':
      return { kind: 'order_delivering', title: 'Đang giao hàng 🚚', body: `Đơn ${code} đang được mang đến ${order.deliveryAddress || 'cho bạn'}.` };
    case 'completed':
      return { kind: 'order_completed', title: 'Hoàn thành 🎉', body: `Cảm ơn bạn đã chọn Cloud 9! Chúc bạn ngon miệng.` };
    case 'cancelled':
      return { kind: 'order_cancelled', title: 'Đơn hàng đã huỷ', body: `Đơn ${code} đã bị huỷ${order.cancelReason ? `: ${order.cancelReason}` : '.'}` };
    default:
      return null;
  }
}
