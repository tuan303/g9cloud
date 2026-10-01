import type { MessageKey } from '@/i18n/types';

// ───────────────────────── Menu ─────────────────────────

export type CategoryId = 'coffee' | 'drinks' | 'desserts';

export interface Category {
  id: CategoryId;
  name: string; // Tiếng Việt (hiển thị)
  nameEn: string;
  emoji: string;
}

export interface OptionChoice {
  id: string;
  name: string;
  nameEn?: string;
  priceDelta: number; // VND cộng thêm
  /**
   * Cách ghi trong tóm tắt đơn (giỏ hàng, phiếu pha chế). VD "50%" → "50% đường".
   * Chuỗi rỗng = không ghi (lựa chọn mặc định không cần nhắc, như "Không hâm nóng").
   */
  summary?: string;
  summaryEn?: string;
}

export interface OptionGroup {
  id: string;
  name: string;
  nameEn?: string;
  type: 'single' | 'multi';
  required?: boolean;
  choices: OptionChoice[];
  /** Lựa chọn mặc định (id). Với nhóm single bắt buộc, nếu bỏ trống sẽ lấy choice đầu tiên. */
  defaultChoiceIds?: string[];
  /** Giới hạn số lựa chọn cho nhóm multi */
  max?: number;
}

export type MenuTag = 'bestseller' | 'new' | 'signature';

export interface MenuItem {
  id: string;
  categoryId: CategoryId;
  name: string;
  nameEn?: string;
  description: string;
  descriptionEn?: string;
  price: number; // VND, giá size mặc định
  /**
   * Ảnh món: URL / data URL (ảnh do quản trị tải lên) hoặc khoá minh hoạ dạng "@menu/<key>"
   * (được giải quyết bởi `resolveMenuImage` trong src/lib/images.ts).
   */
  image: string;
  available: boolean;
  tags?: MenuTag[];
  optionGroups?: OptionGroup[];
  sortOrder: number;
  updatedAt?: number;
}

// ───────────────────────── Cart ─────────────────────────

export interface SelectedOption {
  groupId: string;
  groupName: string;
  groupNameEn?: string;
  choiceIds: string[];
  choiceNames: string[];
  /** Tên lựa chọn bằng tiếng Anh (cùng thứ tự choiceNames) */
  choiceNamesEn?: string[];
  priceDelta: number; // tổng phụ thu của nhóm
}

export interface CartLine {
  lineId: string;
  itemId: string;
  categoryId: CategoryId;
  name: string;
  nameEn?: string;
  image: string;
  basePrice: number;
  unitPrice: number; // basePrice + tổng phụ thu tuỳ chọn
  quantity: number;
  options: SelectedOption[];
  note?: string;
}

// ───────────────────────── Customer ─────────────────────────

/** microsoft = SSO Microsoft 365 của trường · school_email = email nhập tay (chỉ bản demo offline) */
export type AuthProvider = 'microsoft' | 'school_email' | 'guest' | 'zalo';

export interface CustomerInfo {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  studentId?: string; // Mã học sinh / nhân viên
  isGuest: boolean;
  authProvider: AuthProvider;
  avatar?: string;
}

// ───────────────────────── Orders ─────────────────────────

/** pickup = nhận tại quầy / dùng tại quán; delivery = giao tận nơi (lớp, phòng ban...) */
export type FulfillmentType = 'pickup' | 'delivery';

export type OrderStatus =
  | 'pending_payment' // đã tạo đơn, chờ quét QR tại POS
  | 'received' // đã thanh toán — quán đã nhận đơn
  | 'preparing' // đang pha chế / chuẩn bị
  | 'ready' // sẵn sàng tại quầy (pickup)
  | 'delivering' // đang giao (delivery)
  | 'completed' // khách đã nhận / đã giao xong
  | 'cancelled';

export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';
export type PaymentMethod = 'qr_pos' | 'vietqr';

export interface OrderLine extends CartLine {
  lineTotal: number;
}

export interface StatusEvent {
  status: OrderStatus;
  at: number;
  by: 'customer' | 'staff' | 'system';
  note?: string;
}

export interface Order {
  id: string;
  /** Mã ngắn để gọi món tại quầy, ví dụ "C9-027" (đánh số theo ngày) */
  code: string;
  customer: CustomerInfo;
  /** uid Firebase Auth của thiết bị đặt đơn (dùng cho quy tắc bảo mật Firestore); null nếu chưa bật Auth */
  customerUid?: string | null;
  fulfillment: FulfillmentType;
  deliveryAddress?: string;
  note?: string;
  items: OrderLine[];
  itemCount: number;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  createdAt: number;
  updatedAt: number;
  paidAt?: number;
  statusHistory: StatusEvent[];
  cancelReason?: string;
  /** Đơn dùng 1 cốc miễn phí từ thẻ tích điểm (discount = giá 1 cốc nước đắt nhất trong đơn) */
  loyaltyRedeem?: boolean;
  /** Số cốc được tích khi đơn được thanh toán (ghi lúc thu ngân xác nhận) */
  loyaltyEarned?: number;
  /** Đơn dữ liệu mẫu (để biểu đồ thống kê có số liệu khi demo) */
  isDemo?: boolean;
}

export interface CreateOrderInput {
  customer: CustomerInfo;
  fulfillment: FulfillmentType;
  deliveryAddress?: string;
  note?: string;
  lines: CartLine[];
  paymentMethod?: PaymentMethod;
  /** Dùng 1 cốc miễn phí từ thẻ tích điểm */
  redeemReward?: boolean;
}

// ───────────────────────── Loyalty (tích điểm) ─────────────────────────

/** Thẻ tích điểm của một khách (mua đủ N cốc nước được 1 cốc miễn phí) */
export interface LoyaltyAccount {
  /** = CustomerInfo.id (VD "ms_<uid>") */
  customerId: string;
  /** Số cốc đang tích (≥ N nghĩa là có cốc miễn phí; đổi 1 cốc trừ N) */
  stamps: number;
  /** Tổng số cốc đã mua (thống kê) */
  totalCups: number;
  rewardsRedeemed: number;
  updatedAt: number;
}

// ───────────────────────── Notifications ─────────────────────────

export type NotificationKind =
  | 'order_received'
  | 'order_preparing'
  | 'order_ready'
  | 'order_delivering'
  | 'order_completed'
  | 'order_cancelled'
  | 'info';

/** Khoá bản dịch của thông báo — hiển thị lại theo ngôn ngữ đang chọn (title/body chỉ là bản lưu dự phòng) */
export interface NotificationMsg {
  title: MessageKey;
  body: MessageKey;
  vars?: Record<string, string | number>;
}

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  msg?: NotificationMsg;
  orderId?: string;
  createdAt: number;
  read: boolean;
}
