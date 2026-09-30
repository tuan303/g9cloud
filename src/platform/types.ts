/**
 * Lớp trừu tượng nền tảng: cùng một giao diện chạy trên trình duyệt (web/PWA) và Zalo Mini App.
 * Giao diện chỉ gọi `platform.*` — không gọi trực tiếp API trình duyệt hay zmp-sdk.
 */
import type { KVStorage } from './storage';

export interface PlatformProfile {
  id: string;
  name: string;
  avatar?: string;
}

export interface PlatformAdapter {
  name: 'web' | 'zalo';
  /** Kho lưu trữ bền vững (web: localStorage · Zalo: nativeStorage) */
  storage: KVStorage;
  /** Có API quét QR gốc (Zalo) — nếu false, giao diện dùng camera trong trang (jsQR) */
  canNativeScan: boolean;
  /** Mở trình quét QR gốc. Trả về nội dung mã, hoặc null nếu người dùng huỷ. */
  scanQRCode(): Promise<string | null>;
  /** Hồ sơ người dùng từ nền tảng (Zalo). Web trả về null. */
  getProfile(): Promise<PlatformProfile | null>;
  setTitle(title: string): void;
  vibrate(pattern: number | number[]): void;
  /** Thông báo hệ thống khi app đang mở ở nền (web Notification API). */
  systemNotify(title: string, body: string): Promise<void>;
  requestNotificationPermission(): Promise<boolean>;
  share(data: { title: string; text?: string; url?: string }): Promise<boolean>;
  call(phone: string): void;
}
