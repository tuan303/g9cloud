import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, ShoppingBag } from 'lucide-react';
import { useT } from '@/i18n';
import { cn } from '@/lib/cn';
import { formatPrice } from '@/lib/format';
import { selectCartCount, selectCartSubtotal, useCart } from '@/store/cart';
import { bump } from './menu-utils';

/**
 * Thanh giỏ hàng nổi phía trên tab bar (chỉ hiện khi giỏ có món).
 * Nảy nhẹ mỗi khi số món tăng để khách thấy món đã vào giỏ.
 */
export function CartBar({ className }: { className?: string }) {
  const count = useCart(selectCartCount);
  const subtotal = useCart(selectCartSubtotal);
  const navigate = useNavigate();
  const { t } = useT();
  const barRef = useRef<HTMLButtonElement>(null);
  const bagRef = useRef<HTMLSpanElement>(null);
  const prevCount = useRef(count);

  useEffect(() => {
    // Lần xuất hiện đầu tiên đã có hiệu ứng trượt lên — chỉ nảy khi thêm món vào giỏ đang có sẵn
    if (prevCount.current > 0 && count > prevCount.current) {
      bump(barRef.current, [{ transform: 'scale(1)' }, { transform: 'scale(1.035)' }, { transform: 'scale(.995)' }, { transform: 'scale(1)' }]);
      bump(bagRef.current, [{ transform: 'rotate(0)' }, { transform: 'rotate(-14deg)' }, { transform: 'rotate(8deg)' }, { transform: 'rotate(0)' }], 480);
    }
    prevCount.current = count;
  }, [count]);

  if (!count) return null;

  return (
    <div className={cn('pointer-events-none fixed inset-x-0 bottom-tabbar z-30 mx-auto max-w-md px-3', className)}>
      <button
        ref={barRef}
        type="button"
        onClick={() => navigate('/cart')}
        aria-label={t('menu.cartBar.aria', { count, subtotal: formatPrice(subtotal) })}
        className={cn(
          'pointer-events-auto flex w-full animate-slide-up items-center gap-2.5 rounded-[26px] bg-espresso p-2 pl-2.5 text-left text-cream shadow-lift ring-1 ring-gold/25',
          'transition hover:bg-espresso-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
        )}
      >
        <span ref={bagRef} className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-gold" aria-hidden>
          <ShoppingBag className="h-5 w-5" />
          <span className="absolute -right-1 -top-1 min-w-[20px] rounded-full bg-gold px-1 text-center font-display text-[11px] font-bold leading-5 text-espresso ring-2 ring-espresso">
            {count > 99 ? '99+' : count}
          </span>
        </span>
        <span className="min-w-0 flex-1" aria-hidden>
          <span className="block text-[11px] font-medium text-cream/70">{t('menu.cartBar.summary', { count })}</span>
          <span className="block truncate font-display text-base font-bold tabular-nums">{formatPrice(subtotal)}</span>
        </span>
        <span
          aria-hidden
          className="flex h-11 shrink-0 items-center gap-1.5 rounded-2xl bg-leaf px-3.5 text-[13px] font-semibold text-white shadow-card"
        >
          <QrCode className="h-[18px] w-[18px]" />
          {t('menu.cartBar.orderQr')}
        </span>
      </button>
    </div>
  );
}
