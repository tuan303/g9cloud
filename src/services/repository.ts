import type { CreateOrderInput, LoyaltyAccount, MenuItem, Order, OrderStatus } from '@/types';

/**
 * Lớp truy cập dữ liệu. Bản demo dùng `LocalRepository` (localStorage + đồng bộ giữa các tab).
 * Khi có backend thật (Firebase / Supabase / API riêng), chỉ cần viết một lớp mới
 * cài đặt interface này và đổi export trong src/services/index.ts — giao diện không phải sửa.
 */
export interface DataRepository {
  // ── Thực đơn ──
  listMenu(): Promise<MenuItem[]>;
  saveMenuItem(item: MenuItem): Promise<MenuItem>;
  deleteMenuItem(id: string): Promise<void>;
  setItemAvailability(id: string, available: boolean): Promise<void>;

  // ── Đơn hàng ──
  listOrders(): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  /** Tìm đơn theo nội dung quét được từ mã QR, hoặc mã ngắn gõ tay (VD "C9-027") */
  findOrderByScan(raw: string): Promise<Order | undefined>;
  createOrder(input: CreateOrderInput): Promise<Order>;
  /** Thu ngân quét QR tại POS và xác nhận đã thu tiền → đơn chuyển sang "Đã nhận đơn" */
  confirmPayment(orderId: string): Promise<Order>;
  updateOrderStatus(orderId: string, status: OrderStatus, by?: 'customer' | 'staff' | 'system'): Promise<Order>;
  cancelOrder(orderId: string, reason?: string, by?: 'customer' | 'staff'): Promise<Order>;

  // ── Tích điểm ──
  /** Thẻ tích điểm của khách (null nếu chưa có) */
  getLoyalty(customerId: string): Promise<LoyaltyAccount | null>;
  /** Theo dõi thẻ tích điểm theo thời gian thực; trả về hàm huỷ theo dõi */
  watchLoyalty(customerId: string, cb: (account: LoyaltyAccount | null) => void): () => void;

  // ── Thời gian thực ──
  subscribe(listener: (event: RepoEvent) => void): () => void;

  // ── Dữ liệu demo ──
  clearDemoOrders(): Promise<void>;
  resetAll(): Promise<void>;

  // ── Tuỳ chọn (backend thời gian thực) ──
  /** Chờ lần tải đầu tiên (thực đơn) xong */
  whenReady?(): Promise<void>;
  /**
   * Cho repo biết ai đang xem để chỉ tải phần dữ liệu cần thiết:
   * khách → chỉ đơn của mình; nhân viên → toàn bộ đơn gần đây (quy tắc bảo mật Firestore yêu cầu vậy).
   */
  setViewer?(viewer: Viewer): void;
}

export interface Viewer {
  /** CustomerInfo.id của khách đang đăng nhập (nếu có) */
  customerId?: string;
  /** Đang ở chế độ nhân viên (đã mở khoá quản trị) */
  staff: boolean;
}

export type RepoEvent =
  | { type: 'menu' }
  | { type: 'orders' } // danh sách thay đổi hàng loạt (đồng bộ từ tab khác, xoá demo...)
  | { type: 'order'; order: Order; previous?: Order }
  | { type: 'error'; message: string; code?: string }
  | { type: 'recovered' }; // kết nối lại được sau lỗi

export class RepoError extends Error {
  constructor(
    message: string,
    public code: 'not_found' | 'invalid_state' | 'validation' | 'unknown' = 'unknown',
  ) {
    super(message);
  }
}
