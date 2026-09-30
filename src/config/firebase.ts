/**
 * Cấu hình Firebase (project g9cloud-22931).
 * Đây là cấu hình phía web — Google thiết kế để nằm trong mã nguồn client, KHÔNG phải mật khẩu.
 * Dữ liệu được bảo vệ bằng Firestore Security Rules (firestore.rules) + Firebase Auth.
 * Có thể ghi đè bằng biến môi trường VITE_FIREBASE_* (xem .env.example).
 */
const env = import.meta.env;

export const FIREBASE_CONFIG = {
  apiKey: env.VITE_FIREBASE_API_KEY || 'AIzaSyAld0cHa4Xk60H_IRY49E2dvcJmUAAYH4c',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'g9cloud-22931.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'g9cloud-22931',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'g9cloud-22931.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '311440715113',
  appId: env.VITE_FIREBASE_APP_ID || '1:311440715113:web:02dd00d61dad037c73a1f8',
};

/** Nơi lưu dữ liệu: Firestore (mặc định) hoặc máy cục bộ (bản xem thử / demo offline) */
export const BACKEND: 'firebase' | 'local' = env.VITE_BACKEND === 'local' ? 'local' : 'firebase';
