import { ExternalLink, FlaskConical, ScanLine } from 'lucide-react';
import { Button } from '@/components/ui';

/**
 * Hộp "Chế độ demo" — giả lập thu ngân quét mã để thử trọn luồng trên một thiết bị.
 * Chỉ hiển thị khi APP_CONFIG.demo.showPaymentSimulator = true (tắt khi triển khai thật).
 */
export function DemoPaymentSimulator({ loading, onSimulate }: { loading?: boolean; onSimulate: () => void }) {
  return (
    <section aria-label="Chế độ demo" className="rounded-3xl border-2 border-dashed border-bronze-300/80 bg-bronze-50/60 p-4">
      <div className="flex items-center gap-2 text-bronze-700">
        <FlaskConical className="h-4 w-4" aria-hidden />
        <h2 className="text-xs font-bold uppercase tracking-[.16em]">Chế độ demo</h2>
      </div>
      <p className="mt-1.5 text-[13px] leading-snug text-stone">
        Chưa có máy POS? Bấm nút dưới đây để đóng vai thu ngân và xem màn hình xác nhận.
      </p>
      <Button
        variant="outline"
        block
        className="mt-3"
        loading={loading}
        onClick={onSimulate}
        leftIcon={<ScanLine className="h-4 w-4" aria-hidden />}
      >
        Giả lập thu ngân quét mã
      </Button>
      <p className="mt-3 text-xs leading-snug text-stone">
        Muốn thử luồng thật? Mở{' '}
        <a
          href="#/admin/scan"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 font-semibold text-bronze-700 underline decoration-bronze-300 underline-offset-2"
        >
          trang quét mã của quán
          <ExternalLink className="h-3 w-3" aria-hidden />
        </a>{' '}
        (/#/admin/scan) ở một tab khác rồi quét mã QR trên màn hình này.
      </p>
    </section>
  );
}
