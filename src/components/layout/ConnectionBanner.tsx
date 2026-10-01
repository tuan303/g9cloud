import { useT, type MessageKey } from '@/i18n';
import { CloudOff, X } from 'lucide-react';
import { useState } from 'react';
import { useDataStore } from '@/store/data';

const TITLES: Record<string, MessageKey> = {
  'permission-denied': 'connection.denied',
  'failed-precondition': 'connection.notReady',
  'resource-exhausted': 'connection.busy',
};

/** Lỗi đã biết → dịch lại theo ngôn ngữ đang chọn (nội dung lưu sẵn là theo ngôn ngữ lúc lỗi xảy ra) */
const DETAILS: Record<string, MessageKey> = {
  'permission-denied': 'errors.firebase.permission',
  unavailable: 'errors.firebase.unavailable',
  'failed-precondition': 'errors.firebase.notReady',
};

/**
 * Dải cảnh báo khi không kết nối được máy chủ (Firestore). Đặt ở trên cùng để không che
 * thanh tab, giỏ hàng hay nút thanh toán ở đáy màn hình. Tự ẩn khi kết nối lại được.
 */
export function ConnectionBanner() {
  const error = useDataStore((s) => s.error);
  const { t } = useT();
  const [hidden, setHidden] = useState<string | null>(null);
  // Ẩn theo mã lỗi (không theo nội dung) để đổi ngôn ngữ không làm cảnh báo đã tắt hiện lại
  const hideKey = error ? error.code || error.message : null;
  if (!error || hidden === hideKey) return null;
  const code = error.code?.replace('firestore/', '') ?? '';
  const title = t(TITLES[code] ?? 'connection.lost');
  const detail = DETAILS[code] ? t(DETAILS[code]) : error.message;
  return (
    <div className="safe-top pointer-events-none fixed inset-x-0 top-0 z-[65] mx-auto max-w-md px-3 pt-2 md:max-w-lg">
      <div role="alert" className="pointer-events-auto flex items-start gap-3 rounded-2xl bg-rattan-dark px-4 py-3 text-sm text-white shadow-lift">
        <CloudOff className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <p className="min-w-0 flex-1 leading-snug">
          <span className="font-semibold">{title}</span> {detail} <span className="text-white/75">{t('connection.autoRetry')}</span>
        </p>
        <button type="button" aria-label={t('ui.hideWarning')} onClick={() => setHidden(hideKey)} className="-mr-1 rounded-full p-1 text-white/80 hover:bg-white/10">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
