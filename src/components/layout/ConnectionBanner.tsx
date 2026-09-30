import { CloudOff, X } from 'lucide-react';
import { useState } from 'react';
import { useDataStore } from '@/store/data';

const TITLES: Record<string, string> = {
  'permission-denied': 'Không truy cập được dữ liệu.',
  'failed-precondition': 'Máy chủ chưa sẵn sàng.',
  'resource-exhausted': 'Máy chủ đang quá tải.',
};

/**
 * Dải cảnh báo khi không kết nối được máy chủ (Firestore). Đặt ở trên cùng để không che
 * thanh tab, giỏ hàng hay nút thanh toán ở đáy màn hình. Tự ẩn khi kết nối lại được.
 */
export function ConnectionBanner() {
  const error = useDataStore((s) => s.error);
  const [hidden, setHidden] = useState<string | null>(null);
  if (!error || hidden === error.message) return null;
  const title = TITLES[error.code?.replace('firestore/', '') ?? ''] ?? 'Mất kết nối máy chủ.';
  return (
    <div className="safe-top pointer-events-none fixed inset-x-0 top-0 z-[65] mx-auto max-w-md px-3 pt-2 md:max-w-lg">
      <div role="alert" className="pointer-events-auto flex items-start gap-3 rounded-2xl bg-rattan-dark px-4 py-3 text-sm text-white shadow-lift">
        <CloudOff className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <p className="min-w-0 flex-1 leading-snug">
          <span className="font-semibold">{title}</span> {error.message} <span className="text-white/75">App sẽ tự kết nối lại.</span>
        </p>
        <button type="button" aria-label="Ẩn cảnh báo" onClick={() => setHidden(error.message)} className="-mr-1 rounded-full p-1 text-white/80 hover:bg-white/10">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
