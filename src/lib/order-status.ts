import { translate, translateIn, type MessageKey } from '@/i18n';
import { isDefaultCancelReason, translateCancelReason } from '@/lib/cancel-reason';
import { isExpiryCancel } from '@/services/order-logic';
import type { AppNotification, FulfillmentType, NotificationKind, NotificationMsg, Order, OrderStatus } from '@/types';

export interface StatusMeta {
  label: string;
  /** Mô tả ngắn cho khách */
  description: string;
  /** Lớp Tailwind cho badge */
  badgeClass: string;
  /** Màu chấm / thanh tiến trình */
  dotClass: string;
}

/** Nhãn + mô tả tự dịch theo ngôn ngữ đang chọn (getter), màu cố định */
function meta(status: OrderStatus, badgeClass: string, dotClass: string): StatusMeta {
  return {
    get label() {
      return translate(`status.${status}.label`);
    },
    get description() {
      return translate(`status.${status}.description`);
    },
    badgeClass,
    dotClass,
  };
}

export const STATUS_META: Record<OrderStatus, StatusMeta> = {
  pending_payment: meta('pending_payment', 'bg-gold-soft text-bronze-800 ring-1 ring-gold/60', 'bg-gold'),
  received: meta('received', 'bg-bronze-100 text-bronze-800 ring-1 ring-bronze-300', 'bg-bronze-500'),
  preparing: meta('preparing', 'bg-rattan-soft text-rattan-dark ring-1 ring-rattan-light/50', 'bg-rattan'),
  ready: meta('ready', 'bg-leaf-soft text-leaf-dark ring-1 ring-leaf-light/60', 'bg-leaf'),
  delivering: meta('delivering', 'bg-leaf-soft text-leaf-dark ring-1 ring-leaf-light/60', 'bg-leaf'),
  completed: meta('completed', 'bg-espresso text-cream', 'bg-gold'),
  cancelled: meta('cancelled', 'bg-stone-soft text-stone ring-1 ring-stone-light/40', 'bg-stone-light'),
};

/** Các bước hiển thị trên thanh tiến trình (không gồm pending_payment / cancelled) */
export function statusSteps(fulfillment: FulfillmentType): OrderStatus[] {
  return fulfillment === 'delivery'
    ? ['received', 'preparing', 'delivering', 'completed']
    : ['received', 'preparing', 'ready', 'completed'];
}

/** Nhãn bước theo hình thức nhận (bước cuối khác nhau) */
export function stepLabel(status: OrderStatus, fulfillment: FulfillmentType): string {
  if (status === 'completed') return translate(fulfillment === 'delivery' ? 'status.stepDelivered' : 'status.stepPickedUp');
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
      return translate('status.action.confirmPayment');
    case 'received':
      return translate('status.action.startPreparing');
    case 'preparing':
      return translate(order.fulfillment === 'delivery' ? 'status.action.startDelivery' : 'status.action.markReady');
    case 'ready':
      return translate('status.action.pickedUp');
    case 'delivering':
      return translate('status.action.delivered');
    default:
      return null;
  }
}

export const ACTIVE_STATUSES: OrderStatus[] = ['pending_payment', 'received', 'preparing', 'ready', 'delivering'];
export const isActiveOrder = (o: Pick<Order, 'status'>) => ACTIVE_STATUSES.includes(o.status);

/** Văn bản thông báo theo ngôn ngữ đang chọn (lý do huỷ / địa chỉ mặc định cũng được dịch lại) */
export function notificationText(msg: NotificationMsg): { title: string; body: string } {
  const vars = { ...msg.vars };
  if (typeof vars.reason === 'string') vars.reason = translateCancelReason(vars.reason);
  if (msg.body === 'notify.delivering.body' && !vars.address) vars.address = translate('notify.deliveringDefault');
  return { title: translate(msg.title), body: translate(msg.body, vars) };
}

/** Mẫu câu có thể có của từng loại thông báo (tiêu đề, nội dung) */
const LEGACY_KEYS: Partial<Record<NotificationKind, [MessageKey, MessageKey][]>> = {
  order_received: [['notify.received.title', 'notify.received.body']],
  order_preparing: [['notify.preparing.title', 'notify.preparing.body']],
  order_ready: [['notify.ready.title', 'notify.ready.body']],
  order_delivering: [['notify.delivering.title', 'notify.delivering.body']],
  order_completed: [['notify.completed.title', 'notify.completed.body']],
  order_cancelled: [
    ['notify.cancelled.title', 'notify.cancelled.bodyReason'],
    ['notify.cancelled.title', 'notify.cancelled.body'],
  ],
  info: [['notify.reward.title', 'notify.reward.body']],
};

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Khớp câu đã lưu với mẫu câu tiếng Việt hoặc tiếng Anh → lấy lại tham số ({code}, {reason}…); null nếu không khớp */
function matchTemplate(text: string, key: MessageKey): Record<string, string> | null {
  for (const locale of ['vi', 'en'] as const) {
    const names: string[] = [];
    const pattern = escapeRe(translateIn(locale, key)).replace(/\\\{(\w+)\\\}/g, (_, name: string) => {
      names.push(name);
      return '(.+?)';
    });
    const m = text.trim().match(new RegExp(`^${pattern}$`));
    if (m) return Object.fromEntries(names.map((n, i) => [n, m[i + 1]]));
  }
  return null;
}

/**
 * Thông báo lưu từ bản trước (chỉ có chữ, chưa có khoá dịch): nhận lại mẫu câu để hiện theo ngôn ngữ
 * đang chọn. Không nhận ra thì trả undefined (giữ nguyên chữ đã lưu).
 */
export function legacyNotificationMsg(n: Pick<AppNotification, 'kind' | 'title' | 'body'>): NotificationMsg | undefined {
  for (const [title, body] of LEGACY_KEYS[n.kind] ?? []) {
    if (!matchTemplate(n.title, title)) continue;
    const vars = matchTemplate(n.body, body);
    if (!vars) continue;
    // "đang được mang đến cho bạn" (không có địa chỉ) → để notificationText dịch lại phần mặc định
    const defaults = [translateIn('vi', 'notify.deliveringDefault'), translateIn('en', 'notify.deliveringDefault')];
    if (vars.address && defaults.includes(vars.address)) delete vars.address;
    return { title, body, vars };
  }
  return undefined;
}

/** Nội dung thông báo gửi khách khi trạng thái đơn thay đổi (kèm khoá dịch để đổi ngôn ngữ sau này) */
export function notificationFor(order: Order): { kind: NotificationKind; title: string; body: string; msg: NotificationMsg } | null {
  const code = order.code;
  const make = (kind: NotificationKind, msg: NotificationMsg) => ({ kind, msg, ...notificationText(msg) });
  switch (order.status) {
    case 'received':
      return make('order_received', { title: 'notify.received.title', body: 'notify.received.body', vars: { code } });
    case 'preparing':
      return make('order_preparing', { title: 'notify.preparing.title', body: 'notify.preparing.body', vars: { code } });
    case 'ready':
      return make('order_ready', { title: 'notify.ready.title', body: 'notify.ready.body', vars: { code } });
    case 'delivering':
      return make('order_delivering', {
        title: 'notify.delivering.title',
        body: 'notify.delivering.body',
        vars: order.deliveryAddress ? { code, address: order.deliveryAddress } : { code },
      });
    case 'completed':
      return make('order_completed', { title: 'notify.completed.title', body: 'notify.completed.body' });
    case 'cancelled': {
      // Lý do gốc (theo ngôn ngữ người huỷ) — dịch lại khi hiển thị; lý do mặc định "Quán huỷ đơn" thì bỏ
      const reason = isExpiryCancel(order)
        ? translateIn('vi', 'errors.reasonExpired')
        : isDefaultCancelReason(order.cancelReason)
          ? undefined
          : order.cancelReason?.trim();
      return make(
        'order_cancelled',
        reason
          ? { title: 'notify.cancelled.title', body: 'notify.cancelled.bodyReason', vars: { code, reason } }
          : { title: 'notify.cancelled.title', body: 'notify.cancelled.body', vars: { code } },
      );
    }
    default:
      return null;
  }
}
