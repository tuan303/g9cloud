import { createJSONStorage } from 'zustand/middleware';
import { platform } from '@/platform';

/**
 * Bộ lưu cho zustand persist: ghi lỗi (bộ nhớ đầy, chế độ riêng tư) chỉ cảnh báo, không ném ra
 * để thao tác của người dùng (thêm món, đăng nhập...) không bị đứt giữa chừng.
 */
export const persistStorage = createJSONStorage(() => ({
  getItem: (k: string) => platform.storage.getItem(k),
  setItem: (k: string, v: string) => {
    try {
      platform.storage.setItem(k, v);
    } catch (err) {
      console.warn('[Cloud9] Không lưu được', k, err);
    }
  },
  removeItem: (k: string) => platform.storage.removeItem(k),
}));
