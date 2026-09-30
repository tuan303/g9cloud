/**
 * Kho key-value đồng bộ (chuỗi) — trừu tượng hoá localStorage.
 * Lý do: Zalo Mini App KHÔNG hỗ trợ localStorage/sessionStorage/cookie; ở đó phải dùng
 * `nativeStorage` của zmp-sdk (cùng kiểu API đồng bộ, chỉ nhận chuỗi, giới hạn 5 MB).
 */
export interface KVStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** Bộ nhớ tạm trong RAM — dự phòng khi kho thật không dùng được (chế độ riêng tư, bị chặn...) */
export function memoryStorage(): KVStorage {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  };
}

/** Bọc một kho có thể ném lỗi: đọc lỗi → null, ghi lỗi → ném lại để nơi gọi báo người dùng */
export function safeStorage(primary: () => KVStorage | undefined): KVStorage {
  const fallback = memoryStorage();
  let store: KVStorage | undefined;
  try {
    store = primary();
    // thử ghi/đọc để chắc chắn dùng được
    store?.setItem('__c9_probe__', '1');
    store?.removeItem('__c9_probe__');
  } catch {
    store = undefined;
  }
  const s = store ?? fallback;
  return {
    getItem: (k) => {
      try {
        return s.getItem(k);
      } catch {
        return fallback.getItem(k);
      }
    },
    setItem: (k, v) => s.setItem(k, v),
    removeItem: (k) => {
      try {
        s.removeItem(k);
      } catch {
        fallback.removeItem(k);
      }
    },
  };
}
