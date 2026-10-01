import { Coffee, Gift, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { useLoyalty } from '@/hooks/loyalty';
import { useT } from '@/i18n';
import { Button } from '@/components/ui';

/**
 * Thẻ tích điểm "mua N cốc tặng 1 cốc".
 *  - variant="full": thẻ đầy đủ với lưới N ô cốc (trang Tài khoản)
 *  - variant="compact": viên nhỏ "☕ 7/20 🎁" (đầu trang Thực đơn) — chạm để mở Tài khoản
 * Khách vãng lai thấy lời mời đăng nhập (onSignIn) thay cho thẻ.
 */
export function LoyaltyCard({
  variant = 'full',
  onSignIn,
  signingIn,
  className,
}: {
  variant?: 'full' | 'compact';
  onSignIn?: () => void;
  signingIn?: boolean;
  className?: string;
}) {
  const { t } = useT();
  const navigate = useNavigate();
  const l = useLoyalty();
  if (!l.enabled) return null;

  if (variant === 'compact') {
    if (!l.member) return null;
    return (
      <button
        type="button"
        onClick={() => navigate('/account')}
        aria-label={t('loyalty.chipAria', { stamps: l.progress, cups: l.cupsPerReward })}
        className={cn(
          'inline-flex min-h-10 items-center gap-1.5 rounded-full bg-black/30 px-3 text-xs font-bold text-cream ring-1 ring-white/15 backdrop-blur-md transition hover:bg-black/40',
          className,
        )}
      >
        <Coffee className="h-4 w-4 text-gold" aria-hidden />
        <span className="tabular-nums">{t('loyalty.chip', { stamps: l.progress, cups: l.cupsPerReward })}</span>
        {l.rewardsAvailable > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-gold px-2 py-0.5 text-espresso">
            <Gift className="h-3.5 w-3.5" aria-hidden />
            {l.rewardsAvailable}
          </span>
        )}
      </button>
    );
  }

  if (!l.member) {
    return (
      <section className={cn('relative overflow-hidden rounded-3xl bg-gold-soft p-4 ring-1 ring-inset ring-gold/50', className)}>
        <div aria-hidden className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-gold/35 blur-2xl" />
        <div className="relative flex gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gold text-espresso shadow-glow">
            <Gift className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-[15px] font-bold leading-snug text-espresso">{t('loyalty.guestTitle')}</h2>
            <p className="mt-1 text-[13px] leading-snug text-bronze-800">{t('loyalty.guestBody', { cups: l.cupsPerReward })}</p>
          </div>
        </div>
        {onSignIn && (
          <Button block className="relative mt-3.5" leftIcon={<GraduationCap className="h-4 w-4" aria-hidden />} loading={signingIn} onClick={onSignIn}>
            {t('loyalty.guestCta')}
          </Button>
        )}
      </section>
    );
  }

  const filled = l.progress;
  return (
    <section
      aria-label={t('loyalty.title')}
      className={cn('relative overflow-hidden rounded-3xl bg-espresso p-5 text-cream shadow-lift', className)}
    >
      <div aria-hidden className="absolute -right-12 -top-16 h-44 w-44 rounded-full bg-gold/20 blur-3xl" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold">{t('loyalty.title')}</p>
          <h2 className="mt-1 font-display text-lg font-extrabold leading-snug">{t('loyalty.rule', { cups: l.cupsPerReward })}</h2>
        </div>
        <span className="shrink-0 rounded-full bg-white/10 px-3 py-1 font-display text-sm font-bold tabular-nums">
          {t('loyalty.progress', { stamps: filled, cups: l.cupsPerReward })}
        </span>
      </div>

      <ol
        className="relative mt-4 grid grid-cols-10 gap-1.5"
        aria-label={t('loyalty.stampAria', { stamps: filled, cups: l.cupsPerReward })}
      >
        {Array.from({ length: l.cupsPerReward }, (_, i) => (
          <li
            key={i}
            aria-hidden
            className={cn(
              'flex aspect-square items-center justify-center rounded-full transition',
              i < filled ? 'bg-gold text-espresso shadow-glow' : 'bg-white/5 text-cream/25 ring-1 ring-inset ring-white/15',
            )}
          >
            <Coffee className="h-3 w-3" />
          </li>
        ))}
      </ol>

      <div className="relative mt-4 flex flex-wrap items-center gap-2 text-sm">
        {l.rewardsAvailable > 0 ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gold px-3 py-1.5 font-bold text-espresso">
            <Gift className="h-4 w-4" aria-hidden />
            {t('loyalty.rewardsAvailable', { count: l.rewardsAvailable })}
          </span>
        ) : (
          <span className="text-cream/80">{t('loyalty.toNext', { count: l.toNext })}</span>
        )}
        {l.totalCups > 0 && <span className="ml-auto text-xs text-cream/60">{t('loyalty.totalCups', { count: l.totalCups })}</span>}
      </div>
      {l.pendingRedeemCodes.length > 0 && (
        <p className="relative mt-2 text-xs text-cream/70">{t('loyalty.pendingNote', { count: l.pendingRedeemCodes.length, codes: l.pendingRedeemCodes.join(', ') })}</p>
      )}
    </section>
  );
}
