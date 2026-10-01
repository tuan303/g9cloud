import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Gift, Landmark, QrCode as QrIcon, ReceiptText, Sun, Timer } from 'lucide-react';
import barPhoto from '@/assets/photos/espresso-bar.webp';
import { APP_CONFIG } from '@/config/app';
import { useDataReady, useMenu, useOrder } from '@/hooks/data';
import { useAction } from '@/hooks/useAction';
import { useNow } from '@/hooks/useNow';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useT } from '@/i18n';
import { cn } from '@/lib/cn';
import { formatPrice } from '@/lib/format';
import { buildOrderQrPayload } from '@/lib/qr';
import { platform } from '@/platform';
import { repo } from '@/services';
import { expiredReason, isExpiryCancel } from '@/services/order-logic';
import { useCart } from '@/store/cart';
import { toast, useUi } from '@/store/ui';
import { Button, Card, ConfirmDialog, EmptyState, PageHeader, Segmented, Skeleton, StatusBadge } from '@/components/ui';
import { DemoPaymentSimulator } from '@/components/checkout/DemoPaymentSimulator';
import { OrderSummaryCard } from '@/components/checkout/OrderSummaryCard';
import { PayAtCounterSteps } from '@/components/checkout/PayAtCounterSteps';
import { PaymentClosed } from '@/components/checkout/PaymentClosed';
import { PaymentSuccess } from '@/components/checkout/PaymentSuccess';
import { QR_RESPONSIVE_CLASS, QrCode, QrFrame } from '@/components/checkout/QrCode';
import { VietQrPanel } from '@/components/checkout/VietQrPanel';
import { planReorder } from '@/components/checkout/reorder';

type PayTab = 'pos' | 'vietqr';

const EXPIRY_MS = APP_CONFIG.payment.qrExpiryMinutes * 60_000;
/** Nút quay lại trên header tối: đảm bảo icon màu kem (IconButton mặc định dùng text-espresso) */
const DARK_HEADER_CLASS = '[&_button:hover]:!bg-white/10 [&_button]:!text-cream';

const pad2 = (n: number) => String(n).padStart(2, '0');
const formatCountdown = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${pad2(Math.floor(s / 60))}:${pad2(s % 60)}`;
};

export default function PaymentPage() {
  const { t } = useT();
  usePageTitle(t('payment.title'));
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const ready = useDataReady();
  const order = useOrder(id);
  const menu = useMenu();
  const addToCart = useCart((s) => s.add);

  const isPending = order?.status === 'pending_payment';
  const now = useNow(isPending ? 1000 : 30_000);
  const remainingMs = order ? order.createdAt + EXPIRY_MS - now : 0;
  const isPaid = !!order && order.status !== 'pending_payment' && order.status !== 'cancelled';
  const timedOut = isPending && remainingMs <= 0;
  const isClosed = !!order && (order.status === 'cancelled' || timedOut);

  // Chỉ "ăn mừng" khi khách đã thấy đơn ở trạng thái chờ trên chính màn hình này
  const [sawPending, setSawPending] = useState(false);
  useEffect(() => {
    if (isPending) setSawPending(true);
  }, [isPending]);
  const celebrate = isPaid && sawPending;

  useEffect(() => {
    if (!celebrate) return;
    // Màn hình này đã hiển thị trạng thái thành công → ẩn banner chung để không trùng lặp
    useUi.getState().hideBanner();
    platform.vibrate([80, 60, 160]);
  }, [celebrate]);

  // Khi chuyển trạng thái (đã trả / hết hạn / huỷ) → đưa về đầu trang
  const phase = isPaid ? 'paid' : isClosed ? 'closed' : 'pending';
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [phase]);

  const [tabChoice, setTabChoice] = useState<PayTab | null>(null);
  const vietqr = APP_CONFIG.payment.vietqr;
  const tab: PayTab = vietqr ? (tabChoice ?? (order?.paymentMethod === 'vietqr' ? 'vietqr' : 'pos')) : 'pos';

  const [confirmCancel, setConfirmCancel] = useState(false);
  const [runCancel, cancelling] = useAction((orderId: string, reason: string) => repo.cancelOrder(orderId, reason, 'customer'));
  const [runSimulate, simulating] = useAction((orderId: string) => repo.confirmPayment(orderId));

  const reorderingRef = useRef(false); // chặn chạm đúp thêm món 2 lần

  const goHome = () => navigate('/', { replace: true });

  if (!ready) return <PaymentSkeleton />;

  if (!order) {
    return (
      <div className="min-h-dvh bg-cream">
        <PageHeader title={t('payment.title')} back fallback="/" />
        <EmptyState
          className="pt-20"
          icon={<ReceiptText className="h-9 w-9" />}
          title={t('payment.notFound.title')}
          description={t('payment.notFound.body')}
          action={<Button onClick={goHome}>{t('common.backToMenu')}</Button>}
        />
      </div>
    );
  }

  if (isPaid) {
    return (
      <PaymentSuccess
        order={order}
        celebrate={celebrate}
        onTrack={() => navigate(`/order/${order.id}`, { replace: true })}
        onHome={goHome}
      />
    );
  }

  const cancel = async () => {
    const done = await runCancel(order.id, t('errors.reasonCustomer'));
    setConfirmCancel(false);
    // Màn hình chuyển sang trạng thái "Đã huỷ" → ẩn banner chung
    if (done) useUi.getState().hideBanner();
  };

  const reorder = async () => {
    if (reorderingRef.current) return;
    const { entries, skipped } = planReorder(order.items, menu);
    if (!entries.length) {
      toast(t('payment.reorder.allSoldOut'), 'error');
      return;
    }
    reorderingRef.current = true;
    if (order.status === 'pending_payment') {
      // Mã đã hết hạn nhưng hệ thống chưa kịp huỷ → huỷ luôn để thu ngân không quét nhầm mã cũ
      const done = await runCancel(order.id, expiredReason());
      if (!done) {
        reorderingRef.current = false;
        return;
      }
      useUi.getState().hideBanner();
    }
    entries.forEach((e) => addToCart(e.item, e.options, e.quantity, e.note));
    toast(
      skipped.length
        ? t('payment.reorder.partial', { count: entries.length, items: skipped.join(', ') })
        : t('payment.reorder.done'),
      skipped.length ? 'info' : 'success',
    );
    navigate('/cart', { replace: true });
  };

  if (isClosed) {
    return (
      <div className="min-h-dvh bg-cream">
        <PageHeader title={t('payment.title')} subtitle={t('payment.orderSubtitle', { code: order.code })} back fallback="/" />
        <PaymentClosed
          order={order}
          expired={timedOut || isExpiryCancel(order)}
          reordering={cancelling}
          onReorder={() => void reorder()}
          onHome={goHome}
        />
      </div>
    );
  }

  // ───────────── Đang chờ thanh toán ─────────────
  const lowTime = remainingMs <= 2 * 60_000;
  const progress = Math.min(100, Math.max(0, (remainingMs / EXPIRY_MS) * 100));

  return (
    <div className="min-h-dvh bg-cream pb-10">
      <PageHeader title={t('payment.title')} back fallback="/" tone="dark" className={DARK_HEADER_CLASS} />

      {/* Hero tối: quầy espresso thật của quán dưới nắng chiều */}
      <section className="relative overflow-hidden bg-espresso-900 px-5 pb-24 pt-5 text-center text-cream">
        <img src={barPhoto} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover object-[70%_35%] opacity-60" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-espresso via-espresso-900/70 to-espresso-900" />
        <div className="relative">
          <p className="text-[11px] font-semibold uppercase tracking-[.24em] text-gold-light">{t('payment.yourCode')}</p>
          <p className="mt-1.5 font-display text-[clamp(32px,11vw,44px)] font-extrabold leading-none tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,.35)]">
            {order.code}
          </p>
          <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2">
            <StatusBadge status={order.status} />
            <span
              role="timer"
              aria-label={t('payment.expiresAria', { time: formatCountdown(remainingMs) })}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 backdrop-blur',
                lowTime ? 'bg-rattan/90 text-white ring-rattan-light' : 'bg-white/10 text-cream ring-white/15',
              )}
            >
              <Timer className="h-3.5 w-3.5" aria-hidden />
              {t('payment.expiresIn')} <span className="font-display tabular-nums">{formatCountdown(remainingMs)}</span>
            </span>
          </div>
        </div>
      </section>

      <div className="relative -mt-16 space-y-4 px-4">
        <Card className="overflow-hidden rounded-4xl shadow-lift">
          {/* Thời gian còn lại của mã */}
          <div className="h-1 bg-bronze-100" aria-hidden>
            <div
              className={cn('h-full transition-[width] duration-1000 ease-linear', lowTime ? 'bg-rattan-light' : 'bg-gold')}
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="px-5 pb-6 pt-5">
            {vietqr && (
              <Segmented<PayTab>
                className="mb-5"
                ariaLabel={t('payment.tabsAria')}
                value={tab}
                onChange={setTabChoice}
                options={[
                  { value: 'pos', label: t('payment.tabPos'), icon: <QrIcon className="hidden h-4 w-4 min-[360px]:block" aria-hidden /> },
                  // Nhãn ngắn (ẩn icon dưới 360px) để vừa màn hình hẹp; tiêu đề VietQR nằm trong nội dung tab
                  { value: 'vietqr', label: t('payment.tabTransfer'), icon: <Landmark className="hidden h-4 w-4 min-[360px]:block" aria-hidden /> },
                ]}
              />
            )}

            {tab === 'vietqr' && vietqr ? (
              <VietQrPanel order={order} bank={vietqr} />
            ) : (
              <div className="flex flex-col items-center">
                <QrFrame>
                  <QrCode
                    value={buildOrderQrPayload(order)}
                    level="Q"
                    margin={1}
                    className={QR_RESPONSIVE_CLASS}
                    label={t('payment.qrAria', { code: order.code })}
                  />
                </QrFrame>
                <p className="mt-4 text-center font-display text-lg font-bold tracking-tight text-espresso">{t('payment.scanAtPos')}</p>
                <p className="mt-1 text-center text-sm text-stone">
                  {t('payment.amountDue')}{' '}
                  <span className="font-display text-base font-extrabold tabular-nums text-espresso">{formatPrice(order.total)}</span>
                </p>
                {order.loyaltyRedeem && (
                  <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-gold-soft px-3 py-1 text-xs font-semibold text-bronze-800 ring-1 ring-inset ring-gold/50">
                    <Gift className="h-3.5 w-3.5 text-gold-dark" aria-hidden />
                    {t('loyalty.redeemed')}
                  </p>
                )}

                <PayAtCounterSteps className="mt-6 w-full" />

                <p className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-gold-soft/70 px-3 py-1.5 text-xs font-medium text-bronze-800">
                  <Sun className="h-3.5 w-3.5 text-gold-dark" aria-hidden />
                  {t('payment.brightness')}
                </p>
              </div>
            )}
          </div>
        </Card>

        <OrderSummaryCard order={order} />

        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setConfirmCancel(true)}
            className="h-11 rounded-xl px-4 text-sm font-semibold text-rattan-dark underline-offset-4 transition hover:bg-rattan-soft/60 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            {t('payment.cancelOrder')}
          </button>
        </div>

        {APP_CONFIG.demo.showPaymentSimulator && (
          <DemoPaymentSimulator loading={simulating} onSimulate={() => void runSimulate(order.id)} />
        )}
      </div>

      <ConfirmDialog
        open={confirmCancel}
        title={t('payment.cancelConfirm.title')}
        description={t('payment.cancelConfirm.body', { code: order.code })}
        confirmText={t('payment.cancelConfirm.confirm')}
        cancelText={t('payment.cancelConfirm.keep')}
        tone="danger"
        loading={cancelling}
        onConfirm={() => void cancel()}
        onCancel={() => setConfirmCancel(false)}
      />
    </div>
  );
}

/** Khung chờ khi dữ liệu chưa sẵn sàng */
function PaymentSkeleton() {
  const { t } = useT();
  return (
    <div className="min-h-dvh bg-cream" aria-busy="true" aria-label={t('payment.loadingAria')}>
      <PageHeader title={t('payment.title')} back fallback="/" tone="dark" className={DARK_HEADER_CLASS} />
      <div className="flex flex-col items-center bg-espresso-900 px-5 pb-24 pt-6">
        <div className="h-3 w-28 animate-pulse rounded-full bg-white/10" />
        <div className="mt-3 h-10 w-40 animate-pulse rounded-2xl bg-white/10" />
        <div className="mt-4 h-5 w-48 animate-pulse rounded-full bg-white/10" />
      </div>
      <div className="relative -mt-16 space-y-4 px-4">
        <Card className="flex flex-col items-center rounded-4xl px-5 py-8 shadow-lift">
          <Skeleton className="aspect-square w-[min(264px,calc(100vw-104px))] rounded-3xl" />
          <Skeleton className="mt-5 h-5 w-56" />
          <Skeleton className="mt-2 h-4 w-40" />
        </Card>
        <Skeleton className="h-16 rounded-3xl" />
      </div>
    </div>
  );
}
