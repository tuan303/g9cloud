import { Link } from 'react-router-dom';
import { ChevronRight, QrCode } from 'lucide-react';
import { APP_CONFIG } from '@/config/app';
import { useMyActiveOrders } from '@/hooks/data';
import { useNow } from '@/hooks/useNow';
import { cn } from '@/lib/cn';

/** Nhắc khách còn đơn đang chờ thanh toán (mã QR chưa hết hạn) → mở lại màn hình mã QR */
export function PendingOrderLink({ className }: { className?: string }) {
  const active = useMyActiveOrders();
  const now = useNow(15_000);
  const limit = APP_CONFIG.payment.qrExpiryMinutes * 60_000;
  const pending = active.find((o) => o.status === 'pending_payment' && now - o.createdAt < limit);
  if (!pending) return null;

  return (
    <Link
      to={`/order/${pending.id}/pay`}
      className={cn(
        'flex min-h-[64px] items-center gap-3 rounded-3xl bg-white p-4 shadow-card ring-1 ring-leaf/30 transition active:scale-[.99]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
        className,
      )}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-leaf text-white">
        <QrCode className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-[15px] font-bold text-espresso">Đơn {pending.code} đang chờ thanh toán</span>
        <span className="block text-xs text-stone">Mở lại mã QR để thu ngân quét tại quầy</span>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-bronze-400" aria-hidden />
    </Link>
  );
}
