/**
 * Cấu hình cửa hàng — chỉnh tại đây khi có thông tin thật.
 * Các giá trị đánh dấu TODO là giá trị tạm, cần quán xác nhận (xem README.md › "Thông tin cần cung cấp").
 */
import { BACKEND } from './firebase';

export const APP_CONFIG = {
  version: '0.1.0',

  shop: {
    name: 'Cloud 9',
    tagline: 'Bakery · Cafe',
    // TODO: địa chỉ / vị trí quầy chính xác trong trường
    location: 'Khuôn viên trường',
    // TODO: giờ mở cửa thật
    openingHours: '07:00 – 17:00 · Thứ 2 – Thứ 7',
    // TODO: số hotline của quán (để trống thì ẩn)
    hotline: '',
    currency: 'VND',
  },

  auth: {
    /**
     * TODO: tên miền email trường, ví dụ ['tentruong.edu.vn'].
     * Để trống = chấp nhận mọi email hợp lệ (chế độ demo).
     */
    schoolEmailDomains: [] as string[],
    allowGuest: true,
  },

  fulfillment: {
    pickup: {
      enabled: true,
      label: 'Nhận tại quầy',
      description: 'Lấy tại quầy hoặc dùng tại quán',
    },
    delivery: {
      enabled: true,
      label: 'Giao tận nơi',
      description: 'Giao đến lớp học / phòng ban trong trường',
      fee: 0, // TODO: phí giao (VND)
      minOrder: 0, // TODO: giá trị đơn tối thiểu để giao (VND)
      addressPlaceholder: 'VD: Lớp 8A1 – Tầng 3, Toà B',
    },
  },

  payment: {
    /** Mặc định: khách đưa mã QR đơn hàng cho thu ngân quét tại POS rồi thanh toán tại quầy. */
    defaultMethod: 'qr_pos' as const,
    /** Mã QR đơn hàng hết hạn sau N phút nếu chưa thanh toán */
    qrExpiryMinutes: 15,
    /**
     * Tuỳ chọn: chuyển khoản VietQR (mã QR ngân hàng có sẵn số tiền).
     * TODO: điền để bật. bankBin = mã BIN ngân hàng (VD Vietcombank 970436, MB 970422, Techcombank 970407...).
     */
    vietqr: null as null | { bankBin: string; bankName: string; accountNo: string; accountName: string },
  },

  admin: {
    /**
     * Cách nhân viên đăng nhập trang quản trị:
     *  - 'pin': mã PIN trên thiết bị (tạm thời — chỉ an toàn khi Firestore Rules còn ở chế độ thử nghiệm)
     *  - 'firebase': email + mật khẩu Firebase Auth, quyền nhân viên kiểm tra bằng staff/{uid} (khuyến nghị)
     * Xem docs/FIREBASE.md để chuyển sang 'firebase'.
     */
    auth: 'pin' as 'pin' | 'firebase',
    /** TODO: đổi mã PIN nhân viên (chỉ dùng khi auth = 'pin') */
    pin: '9999',
  },

  demo: {
    /** Tạo sẵn đơn hàng mẫu 7 ngày gần nhất (chỉ bản lưu trên máy — Firestore dùng nút "Tạo dữ liệu demo") */
    seedOrders: BACKEND === 'local',
    /**
     * Hiện nút "Giả lập thu ngân quét QR" trên màn hình thanh toán để demo trên một thiết bị.
     * TẮT (false) khi triển khai thật.
     */
    showPaymentSimulator: BACKEND === 'local',
  },
};

export type AppConfig = typeof APP_CONFIG;
