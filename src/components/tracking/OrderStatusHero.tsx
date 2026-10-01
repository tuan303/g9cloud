import { Hourglass, Info, MapPin } from 'lucide-react';
import heroPhoto from '@/assets/photos/espresso-bar-sm.webp';
import { APP_CONFIG } from '@/config/app';
import { Logo } from '@/components/ui';
import { useNow } from '@/hooks/useNow';
import { useT } from '@/i18n';
import { cn } from '@/lib/cn';
import { isActiveOrder, STATUS_META } from '@/lib/order-status';
import type { Order, OrderStatus } from '@/types';
import { LiveIndicator } from './LiveIndicator';
import { OrderProgress } from './OrderProgress';
import { cancellationInfo } from './OrderTimeline';
import { STATUS_VISUAL } from './visuals';

/** Icon trạng thái cỡ lớn, có vòng lan toả khi đơn đang được xử lý */
function StatusIcon({ status }: { status: OrderStatus }) {
  const v = STATUS_VISUAL[status];
  const Icon = v.icon;
  return (
    <div className="relative flex h-24 w-24 animate-pop-in items-center justify-center">
      {v.pulse && (
        <>
          <span aria-hidden className={cn('absolute inset-2 rounded-full motion-safe:animate-pulse-ring', v.pulse)} />
          <span aria-hidden className={cn('absolute inset-2 rounded-full motion-safe:animate-pulse-ring', v.pulse)} style={{ animationDelay: '.8s' }} />
        </>
      )}
      <span aria-hidden className="absolute inset-0 rounded-full ring-1 ring-white/10" />
      <span className={cn('relative flex h-20 w-20 items-center justify-center rounded-full shadow-lift', v.hero)}>
        <Icon className="h-9 w-9" strokeWidth={1.8} aria-hidden />
      </span>
      {status === 'preparing' && (
        // Hơi nước bốc lên — barista đang pha
        <span aria-hidden className="absolute -top-3 left-1/2 flex -translate-x-1/2 gap-1.5">
          {[0, 0.6, 1.2].map((d) => (
            <span
              key={d}
              className="h-3.5 w-1 rounded-full bg-cream/45 motion-safe:animate-[slide-down_2s_ease-in_infinite_reverse]"
              style={{ animationDelay: `${d}s` }}
            />
          ))}
        </span>
      )}
    </div>
  );
}

/** Đếm ngược hiệu lực mã QR khi đơn chờ thanh toán */
function PaymentCountdown({ createdAt }: { createdAt: number }) {
  const { t } = useT();
  const now = useNow(1000);
  const remaining = createdAt + APP_CONFIG.payment.qrExpiryMinutes * 60_000 - now;
  const secs = Math.max(0, Math.floor(remaining / 1000));
  const mmss = `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;
  return (
    <div className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm text-cream/85 ring-1 ring-inset ring-white/10">
      <Hourglass className="h-4 w-4 shrink-0 text-gold" aria-hidden />
      {secs > 0 ? (
        <span>
          {t('orderStatus.hero.qrValid')} <span className="font-display font-bold tabular-nums text-gold-light">{mmss}</span>
        </span>
      ) : (
        <span>{t('orderStatus.hero.qrExpired')}</span>
      )}
    </div>
  );
}

/**
 * Khối trạng thái nổi bật (nền tối, ảnh quầy espresso + ánh nắng vàng):
 * icon lớn, nhãn + mô tả, mã đơn, lời nhắc theo trạng thái và thanh tiến trình ngang.
 */
export function OrderStatusHero({ order }: { order: Order }) {
  const { t } = useT();
  const meta = STATUS_META[order.status];
  const active = isActiveOrder(order);
  const cancelled = order.status === 'cancelled';
  const cancel = cancellationInfo(order);

  return (
    <section aria-label={t('orderStatus.hero.aria')} className="relative isolate overflow-hidden rounded-b-[32px] bg-espresso text-cream shadow-lift">
      <img src={heroPhoto} alt="" aria-hidden className="absolute inset-0 -z-10 h-full w-full object-cover object-[center_30%] opacity-30" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-espresso via-espresso-900/80 to-espresso-900/95" />
      {/* Nắng chiều hắt qua cửa sổ */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage:
            'radial-gradient(85% 55% at 88% 8%, rgba(217,174,99,0.30), transparent 70%), repeating-linear-gradient(112deg, transparent 0 38px, rgba(235,207,149,0.05) 38px 62px)',
        }}
      />

      <div className="px-5 pb-6 pt-2">
        <div className="flex h-8 items-center justify-between gap-3">
          {/* !h-5: Logo mặc định h-8 — cần important để thu nhỏ chắc chắn */}
          <Logo className="!h-5 text-cream/85" />
          {active && <LiveIndicator tone="dark" />}
        </div>

        <div className="mt-4 flex flex-col items-center text-center">
          <StatusIcon key={order.status} status={order.status} />
          <div aria-live="polite" aria-atomic="true">
            <h2 className="mt-4 font-display text-[26px] font-extrabold leading-tight tracking-tight">{meta.label}</h2>
            <p className="text-balance mx-auto mt-1 max-w-[19rem] text-sm leading-relaxed text-cream/75">{meta.description}</p>
          </div>
          {order.status !== 'ready' && (
            <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 ring-1 ring-inset ring-white/10">
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cream/65">{t('orderStatus.hero.orderCode')}</span>
              <span className="font-display text-sm font-extrabold tracking-wider text-gold-light">{order.code}</span>
            </p>
          )}
        </div>

        {order.status === 'ready' && (
          <div className="mt-5 animate-pop-in rounded-3xl bg-gold px-4 py-4 text-center text-espresso shadow-glow">
            <p className="text-sm font-semibold">{t('orderStatus.hero.collect')}</p>
            <p className="mt-0.5 font-display text-[40px] font-extrabold leading-none tracking-[0.06em]">{order.code}</p>
          </div>
        )}

        {order.status === 'delivering' && order.deliveryAddress && (
          <div className="mt-5 flex items-center gap-3 rounded-2xl bg-white/10 p-3.5 text-left ring-1 ring-inset ring-white/10">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-leaf text-white">
              <MapPin className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-cream/60">{t('orderStatus.hero.deliveringTo')}</p>
              <p className="font-semibold leading-snug">{order.deliveryAddress}</p>
            </div>
          </div>
        )}

        {order.status === 'pending_payment' && <PaymentCountdown createdAt={order.createdAt} />}

        {cancelled ? (
          <div role="note" className="mt-5 flex items-start gap-3 rounded-2xl bg-white/[0.08] p-4 text-left ring-1 ring-inset ring-white/10">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-gold" aria-hidden />
            <div className="min-w-0 text-sm">
              <p className="font-semibold text-cream">{cancel.title}</p>
              {cancel.reason && <p className="mt-0.5 text-cream/75">{t('orderStatus.reason', { reason: cancel.reason })}</p>}
              {order.paymentStatus === 'refunded' && <p className="mt-1 text-cream/75">{t('orderStatus.hero.refunded')}</p>}
            </div>
          </div>
        ) : (
          <OrderProgress order={order} tone="dark" className="mt-6" />
        )}
      </div>
    </section>
  );
}
