import { useEffect, useRef } from 'react';
import { ArrowRight, Bike, Coffee, Gift, Store } from 'lucide-react';
import { useLoyalty } from '@/hooks/loyalty';
import { useT } from '@/i18n';
import { cn } from '@/lib/cn';
import { formatPrice, formatTime } from '@/lib/format';
import { STATUS_META } from '@/lib/order-status';
import { Button, Logo } from '@/components/ui';
import type { Order } from '@/types';

const BURST_COLORS = ['#D9AE63', '#EBCF95', '#8BA24A', '#B26A40', '#C7AB82', '#5E7A2E'];

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Trạng thái "Đơn hàng đã nhận!" sau khi thu ngân quét mã & xác nhận thanh toán.
 * `celebrate` = vừa chuyển trạng thái khi khách đang ở màn hình → có hiệu ứng pop + pháo giấy.
 */
export function PaymentSuccess({
  order,
  celebrate,
  onTrack,
  onHome,
}: {
  order: Order;
  celebrate: boolean;
  onTrack: () => void;
  onHome: () => void;
}) {
  const { t } = useT();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const checkRef = useRef<SVGPathElement>(null);
  const burstRef = useRef<HTMLDivElement>(null);
  const isDelivery = order.fulfillment === 'delivery';
  const FIcon = isDelivery ? Bike : Store;
  // Đơn này vừa giúp khách đủ cốc miễn phí? (thẻ tích điểm cập nhật trực tiếp, không phụ thuộc banner)
  const loyalty = useLoyalty();
  const per = loyalty.cupsPerReward;
  const stampsBefore = loyalty.stamps - (order.loyaltyEarned ?? 0) + (order.loyaltyRedeem ? per : 0);
  const unlocked =
    loyalty.member && !!order.loyaltyEarned && Math.floor(loyalty.stamps / per) > Math.floor(Math.max(0, stampsBefore) / per);

  useEffect(() => {
    titleRef.current?.focus({ preventScroll: true });
    if (!celebrate || prefersReducedMotion()) return;
    // Nét "tích" tự vẽ + các hạt vàng bung ra quanh vòng tròn (Web Animations API, không cần CSS riêng)
    checkRef.current?.animate?.([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], {
      duration: 420,
      delay: 220,
      easing: 'cubic-bezier(.3,.7,.3,1)',
      fill: 'backwards',
    });
    const dots = burstRef.current ? Array.from(burstRef.current.children) : [];
    dots.forEach((el, i) => {
      const angle = (i / dots.length) * Math.PI * 2 + (i % 2 ? 0.2 : 0);
      const dist = 78 + (i % 3) * 16;
      el.animate?.(
        [
          { transform: 'translate(-50%, -50%) scale(.4)', opacity: 0 },
          { opacity: 1, offset: 0.25 },
          {
            transform: `translate(calc(-50% + ${Math.cos(angle) * dist}px), calc(-50% + ${Math.sin(angle) * dist}px)) scale(1)`,
            opacity: 0,
          },
        ],
        { duration: 900 + (i % 4) * 90, delay: 160, easing: 'cubic-bezier(.15,.7,.3,1)', fill: 'both' },
      );
    });
  }, [celebrate]);

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-cream">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(120%_70%_at_50%_0%,rgba(235,207,149,.6)_0%,rgba(246,242,234,0)_72%)]"
      />

      <div className="safe-top relative">
        <div className="flex justify-center pt-6">
          <Logo className="h-6 text-bronze-500" />
        </div>
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center px-6 pb-6 pt-8 text-center">
        {/* Vòng tròn xanh lá + tích */}
        <div className="relative h-32 w-32">
          {celebrate && (
            <>
              <span aria-hidden className="absolute inset-0 rounded-full bg-leaf/25 motion-safe:animate-pulse-ring" />
              <div ref={burstRef} aria-hidden className="pointer-events-none absolute left-1/2 top-1/2">
                {Array.from({ length: 12 }, (_, i) => (
                  <span
                    key={i}
                    className={cn('absolute left-0 top-0 block opacity-0', i % 3 === 0 ? 'h-2.5 w-2.5 rounded-sm' : 'h-2 w-2 rounded-full')}
                    style={{ backgroundColor: BURST_COLORS[i % BURST_COLORS.length] }}
                  />
                ))}
              </div>
            </>
          )}
          <span
            className={cn(
              'relative flex h-32 w-32 items-center justify-center rounded-full bg-leaf text-white shadow-[0_14px_40px_rgba(94,122,46,.35)] ring-8 ring-leaf-soft',
              celebrate && 'motion-safe:animate-[pop-in_.6s_cubic-bezier(.2,1.6,.35,1)_both]',
            )}
          >
            <svg viewBox="0 0 24 24" className="h-16 w-16" fill="none" aria-hidden>
              <path
                ref={checkRef}
                d="M5 12.8l4.4 4.2L19 7.5"
                stroke="currentColor"
                strokeWidth={2.6}
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={0}
              />
            </svg>
          </span>
        </div>

        <div role="status" aria-live="polite" className="mt-8">
          <h1 ref={titleRef} tabIndex={-1} className="font-display text-[26px] font-extrabold tracking-tight text-espresso outline-none">
            {celebrate ? t('payment.success.title') : t('payment.success.titlePaid')}
          </h1>
          <p className="mx-auto mt-2 max-w-[18rem] text-[15px] leading-relaxed text-stone">
            {celebrate
              ? t('payment.success.body')
              : t('payment.success.bodyStatus', { status: STATUS_META[order.status].label })}
          </p>
        </div>

        {/* Vé đơn hàng */}
        <div className="relative mt-8 w-full max-w-sm rounded-3xl bg-white text-left shadow-card ring-1 ring-bronze-200/60">
          <div className="flex items-center justify-between gap-3 px-5 pb-4 pt-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[.18em] text-bronze-500">{t('payment.success.orderCode')}</p>
              <p className="font-display text-3xl font-extrabold tracking-tight text-espresso">{order.code}</p>
            </div>
            <span className="rounded-full bg-leaf-soft px-3 py-1 text-xs font-bold text-leaf-dark ring-1 ring-leaf-light/60">{t('payment.success.paidBadge')}</span>
          </div>
          {/* Đường răng cưa vé */}
          <div aria-hidden className="relative h-4">
            <span className="absolute -left-2 top-0 h-4 w-4 rounded-full bg-cream ring-1 ring-inset ring-bronze-200/60" />
            <span className="absolute -right-2 top-0 h-4 w-4 rounded-full bg-cream ring-1 ring-inset ring-bronze-200/60" />
            <span className="absolute inset-x-4 top-1/2 border-t border-dashed border-bronze-200" />
          </div>
          <div className="space-y-2.5 px-5 pb-5 pt-3 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-stone">{t('payment.success.amount')}</span>
              <span className="font-display font-bold tabular-nums text-espresso">{formatPrice(order.total)}</span>
            </div>
            {order.paidAt && (
              <div className="flex justify-between gap-3">
                <span className="text-stone">{t('payment.success.paidAt')}</span>
                <span className="font-semibold tabular-nums text-espresso">{formatTime(order.paidAt)}</span>
              </div>
            )}
            <div className="flex items-start justify-between gap-3">
              <span className="text-stone">{t(isDelivery ? 'payment.success.collectDelivery' : 'payment.success.collect')}</span>
              <span className="inline-flex min-w-0 items-center gap-1.5 text-right font-semibold text-espresso">
                <FIcon className="h-4 w-4 shrink-0 text-bronze-500" aria-hidden />
                <span className="truncate">
                  {isDelivery ? order.deliveryAddress || t('fulfillment.delivery') : t('fulfillment.pickup')}
                </span>
              </span>
            </div>
          </div>
        </div>
        {/* Tích điểm: cốc miễn phí đã dùng / số cốc được cộng sau khi thanh toán */}
        {(order.loyaltyRedeem || !!order.loyaltyEarned) && (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {order.loyaltyRedeem && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-soft px-3 py-1 text-xs font-semibold text-bronze-800 ring-1 ring-inset ring-gold/50">
                <Gift className="h-3.5 w-3.5 text-gold-dark" aria-hidden />
                {t('loyalty.redeemed')}
              </span>
            )}
            {!!order.loyaltyEarned && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-soft px-3 py-1 text-xs font-semibold text-bronze-800 ring-1 ring-inset ring-gold/50">
                <Coffee className="h-3.5 w-3.5 text-gold-dark" aria-hidden />
                {t('loyalty.earned', { count: order.loyaltyEarned })}
              </span>
            )}
            {unlocked && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-leaf-soft px-3 py-1 text-xs font-bold text-leaf-dark ring-1 ring-inset ring-leaf-light/60">
                <Gift className="h-3.5 w-3.5" aria-hidden />
                {t('loyalty.rewardReady', { cups: per })}
              </span>
            )}
          </div>
        )}
        {!isDelivery && <p className="mt-3 text-xs text-stone">{t('payment.success.rememberCode')}</p>}
      </div>

      <div className="safe-bottom relative space-y-1 px-5">
        <Button variant="leaf" size="lg" block onClick={onTrack} rightIcon={<ArrowRight className="h-5 w-5" aria-hidden />}>
          {t('payment.success.track')}
        </Button>
        <Button variant="ghost" block onClick={onHome}>
          {t('common.backToMenu')}
        </Button>
      </div>
    </div>
  );
}
