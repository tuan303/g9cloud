/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 'firebase' (mặc định) | 'local' (dữ liệu lưu trên máy — dùng cho bản xem thử) */
  readonly VITE_BACKEND?: 'firebase' | 'local';
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
