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
  priceDelta: number; // VND cộng thêm
  /**
   * Cách ghi trong tóm tắt đơn (giỏ hàng, phiếu pha chế). VD "50%" → "50% đường".
   * Chuỗi rỗng = không ghi (lựa chọn mặc định không cần nhắc, như "Không hâm nóng").
   */
  summary?: string;
}

export interface OptionGroup {
  id: string;
  name: string;
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
  choiceIds: string[];
  choiceNames: string[];
  priceDelta: number; // tổng phụ thu của nhóm
}

export interface CartLine {
  lineId: string;
  itemId: string;
  categoryId: CategoryId;
  name: string;
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

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  orderId?: string;
  createdAt: number;
  read: boolean;
}
