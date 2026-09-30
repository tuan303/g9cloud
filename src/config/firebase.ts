/**
 * Cấu hình Firebase (project g9cloud-22931).
 * Đây là cấu hình phía web — Google thiết kế để nằm trong mã nguồn client, KHÔNG phải mật khẩu.
 * Dữ liệu được bảo vệ bằng Firestore Security Rules (firestore.rules) + Firebase Auth.
 * Có thể ghi đè bằng biến môi trường VITE_FIREBASE_* (xem .env.example).
 */
const env = import.meta.env;

/**
 * Tên miền xử lý đăng nhập (/__/auth/handler). Khi app chạy trên Firebase Hosting (web.app / firebaseapp.com)
 * dùng chính tên miền đó — trình duyệt mới (Safari, Chrome, Firefox) chặn lưu trữ bên thứ ba nên đăng nhập
 * kiểu chuyển trang chỉ hoạt động khi cùng tên miền. Tên miền riêng: đặt VITE_FIREBASE_AUTH_DOMAIN.
 * Nhớ thêm https://<tên miền>/__/auth/handler vào Redirect URIs của app trên Entra ID (docs/M365_SSO.md).
 */
function defaultAuthDomain(): string {
  if (typeof location !== 'undefined' && /^g9cloud-22931\.(web\.app|firebaseapp\.com)$/.test(location.hostname)) return location.hostname;
  return 'g9cloud-22931.firebaseapp.com';
}

export const FIREBASE_CONFIG = {
  apiKey: env.VITE_FIREBASE_API_KEY || 'AIzaSyAld0cHa4Xk60H_IRY49E2dvcJmUAAYH4c',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || defaultAuthDomain(),
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'g9cloud-22931',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'g9cloud-22931.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '311440715113',
  appId: env.VITE_FIREBASE_APP_ID || '1:311440715113:web:02dd00d61dad037c73a1f8',
};

/** Nơi lưu dữ liệu: Firestore (mặc định) hoặc máy cục bộ (bản xem thử / demo offline) */
export const BACKEND: 'firebase' | 'local' = env.VITE_BACKEND === 'local' ? 'local' : 'firebase';
