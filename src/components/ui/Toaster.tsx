import { useNavigate } from 'react-router-dom';
import { Bell, Bike, CheckCircle2, ChefHat, CircleX, PartyPopper, ShoppingBag, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useUi, type Banner } from '@/store/ui';

const BANNER_ICON: Record<NonNullable<Banner['icon']>, { icon: typeof Bell; className: string }> = {
  received: { icon: CheckCircle2, className: 'bg-leaf text-white' },
  preparing: { icon: ChefHat, className: 'bg-rattan text-white' },
  ready: { icon: ShoppingBag, className: 'bg-gold text-espresso' },
  delivering: { icon: Bike, className: 'bg-leaf text-white' },
  completed: { icon: PartyPopper, className: 'bg-espresso text-gold' },
  cancelled: { icon: CircleX, className: 'bg-stone text-white' },
  info: { icon: Bell, className: 'bg-bronze-600 text-cream' },
};

/** Toast (dưới) + banner thông báo đơn hàng (trên). Gắn một lần ở gốc app. */
export function Toaster() {
  const { toasts, banner, hideBanner, dismissToast } = useUi();
  const navigate = useNavigate();
  const b = banner?.icon ? BANNER_ICON[banner.icon] : BANNER_ICON.info;
  const BIcon = b.icon;

  return (
    <>
      {/* Vùng thông báo luôn tồn tại để trình đọc màn hình đọc được nội dung mới */}
      <div role="status" aria-live="assertive" aria-atomic="true" className="sr-only">
        {banner ? `${banner.title}. ${banner.body}` : ''}
      </div>
      {banner && (
        <div className="safe-top pointer-events-none fixed inset-x-0 top-0 z-[70] mx-auto max-w-md px-3 pt-2">
          <div
            className="pointer-events-auto flex animate-slide-down items-start gap-3 rounded-3xl bg-espresso/95 p-3.5 pr-2 text-cream shadow-lift ring-1 ring-gold/30 backdrop-blur-md"
          >
            <button
              type="button"
              className="flex min-w-0 flex-1 items-start gap-3 text-left"
              onClick={() => {
                if (banner.href) navigate(banner.href);
                hideBanner();
              }}
            >
              <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl', b.className)}>
                <BIcon className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block font-display text-[15px] font-bold">{banner.title}</span>
                <span className="mt-0.5 block text-[13px] leading-snug text-cream/80">{banner.body}</span>
              </span>
            </button>
            <button type="button" aria-label="Đóng thông báo" onClick={hideBanner} className="rounded-full p-1.5 text-cream/60 hover:bg-white/10">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      {/* Toast đặt phía trên (dưới thanh tiêu đề) để không đè thanh giỏ hàng / nút thanh toán cố định ở đáy */}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 z-[70] mx-auto flex max-w-md flex-col items-center gap-2 px-4"
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 64px)' }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            onClick={() => dismissToast(t.id)}
            className={cn(
              'pointer-events-auto animate-pop-in rounded-2xl px-4 py-2.5 text-sm font-medium shadow-lift',
              t.tone === 'success' && 'bg-leaf text-white',
              t.tone === 'error' && 'bg-rattan-dark text-white',
              t.tone === 'info' && 'bg-gold text-espresso',
              t.tone === 'default' && 'bg-espresso text-cream',
            )}
          >
            {t.message}
          </div>
        ))}
      </div>
    </>
  );
}
