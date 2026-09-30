import { firebaseErrorMessage } from '@/services/firebase';
import { toast } from '@/store/ui';

/** Người dùng tự đóng cửa sổ đăng nhập — không cần báo lỗi */
const SILENT_SSO_ERRORS = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request', 'auth/user-cancelled'];
/** Lỗi do quán chưa cấu hình SSO (Firebase / Entra ID) */
const SETUP_ERRORS = ['auth/configuration-not-found', 'auth/operation-not-allowed', 'auth/unauthorized-domain', 'auth/invalid-api-key'];

/** Báo lỗi đăng nhập Microsoft 365 theo loại (tự đóng → im lặng; chưa cấu hình → gợi ý đi đường khác) */
export function reportSsoError(err: unknown) {
  const code = (err as { code?: string })?.code ?? '';
  if (SILENT_SSO_ERRORS.includes(code)) return;
  if (SETUP_ERRORS.includes(code)) {
    // Lỗi cấu hình phía quán — khách không sửa được; chi tiết ghi console cho quản trị
    console.warn('[Cloud9] SSO Microsoft 365 chưa cấu hình:', code, '— xem docs/M365_SSO.md');
    toast('Đăng nhập Microsoft 365 đang được quán thiết lập. Bạn có thể tiếp tục với tư cách khách.', 'info');
    return;
  }
  toast(firebaseErrorMessage(err), 'error');
}
