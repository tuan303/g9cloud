import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Phone, QrCode, ReceiptText, RotateCcw } from 'lucide-react';
import { APP_CONFIG } from '@/config/app';
import { Button, Card, ConfirmDialog, EmptyState, PageHeader, SectionTitle, Skeleton } from '@/components/ui';
import { OrderItemsList, OrderTotals } from '@/components/order/OrderItemsList';
import { OrderInfoCard, OrderStatusHero, OrderTimeline, useReorder } from '@/components/tracking';
import { useDataReady, useOrder } from '@/hooks/data';
import { useAction } from '@/hooks/useAction';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useT } from '@/i18n';
import { isActiveOrder } from '@/lib/order-status';
import { platform } from '@/platform';
import { repo } from '@/services';
import { useSession } from '@/store/session';

/**
 * Tạm vá: trong PageHeader tone="dark", lớp text-espresso mặc định của IconButton đứng sau text-cream
 * trong CSS (Tailwind xếp theo tên) nên mũi tên quay lại bị chìm. Bộ chọn con có độ ưu tiên cao hơn.
 */
const DARK_HEADER_FIX = '[&_button]:text-cream';

function StatusSkeleton() {
  const { t } = useT();
  return (
    <div className="min-h-dvh bg-cream" aria-busy="true" aria-label={t('orderStatus.loading')}>
      <PageHeader tone="dark" back fallback="/orders" title={t('orderStatus.headerTitle')} className={DARK_HEADER_FIX} />
      <div className="rounded-b-[32px] bg-espresso px-5 pb-7 pt-4">
        <div className="flex flex-col items-center">
          <div className="h-20 w-20 animate-pulse rounded-full bg-white/10" />
          <div className="mt-5 h-7 w-40 animate-pulse rounded-xl bg-white/10" />
          <div className="mt-2 h-4 w-56 animate-pulse rounded-lg bg-white/10" />
        </div>
        <div className="mt-8 h-14 animate-pulse rounded-2xl bg-white/[0.06]" />
      </div>
      <div className="space-y-4 px-4 pt-5">
        <Skeleton className="h-48 rounded-3xl" />
        <Skeleton className="h-40 rounded-3xl" />
      </div>
    </div>
  );
}

export default function OrderStatusPage() {
  const { t } = useT();
  const headerTitle = t('orderStatus.headerTitle');
  const { id } = useParams<{ id: string }>();
  const order = useOrder(id);
  const ready = useDataReady();
  const userId = useSession((s) => s.user?.id);
  const navigate = useNavigate();
  const reorder = useReorder();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancel, cancelling] = useAction(
    async () => {
      if (id) await repo.cancelOrder(id, t('errors.reasonCustomer'), 'customer');
    },
    { success: t('orderStatus.cancelSuccess') },
  );
  usePageTitle(order ? t('orderStatus.pageTitle', { code: order.code }) : headerTitle);

  if (!ready) return <StatusSkeleton />;

  if (!order) {
    return (
      <div className="min-h-dvh bg-cream">
        <PageHeader back fallback="/orders" title={headerTitle} />
        <EmptyState
          className="pt-20"
          icon={<ReceiptText className="h-9 w-9" />}
          title={t('errors.orderNotFound')}
          description={t('orderStatus.notFoundBody')}
          action={
            <Button onClick={() => navigate('/orders', { replace: true })}>{t('orderStatus.myOrders')}</Button>
          }
        />
      </div>
    );
  }

  const pending = order.status === 'pending_payment';
  const active = isActiveOrder(order);
  // Chỉ chủ đơn mới được tự huỷ (và chỉ khi chưa thanh toán)
  const canCancel = pending && order.customer.id === userId;
  const hotline = APP_CONFIG.shop.hotline;

  const onConfirmCancel = async () => {
    await cancel();
    setConfirmCancel(false);
  };

  return (
    <div className="min-h-dvh bg-cream pb-32">
      <PageHeader tone="dark" back fallback="/orders" title={headerTitle} className={DARK_HEADER_FIX} />
      <OrderStatusHero order={order} />

      <div className="space-y-5 px-4 pt-5">
        <section>
          <SectionTitle title={t('orderStatus.infoSection')} />
          <OrderInfoCard order={order} />
        </section>

        <section>
          <SectionTitle
            title={t('orderStatus.itemsSection')}
            action={<span className="text-xs font-semibold text-stone">{t('orderStatus.itemCount', { count: order.itemCount })}</span>}
          />
          <Card className="px-4 pb-4 pt-1">
            <OrderItemsList lines={order.items} />
            <OrderTotals
              className="mt-1 border-t border-bronze-100 pt-3"
              subtotal={order.subtotal}
              deliveryFee={order.deliveryFee}
              discount={order.discount}
              loyaltyRedeem={order.loyaltyRedeem}
              total={order.total}
              showDelivery={order.fulfillment === 'delivery'}
            />
          </Card>
        </section>

        <section>
          <SectionTitle title={t('orderStatus.journeySection')} />
          <Card className="p-4">
            <OrderTimeline order={order} />
          </Card>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md border-t border-bronze-200/70 bg-cream/95 px-4 pt-3 backdrop-blur-md safe-bottom">
        {pending ? (
          <div className="flex gap-3">
            {canCancel && (
              <Button variant="danger" size="lg" className="shrink-0" onClick={() => setConfirmCancel(true)}>
                {t('orderStatus.cancelOrder')}
              </Button>
            )}
            <Button
              variant="leaf"
              size="lg"
              className="min-w-0 flex-1"
              leftIcon={<QrCode className="h-5 w-5" />}
              onClick={() => navigate(`/order/${order.id}/pay`, { replace: true })}
            >
              {t('orderStatus.openQr')}
            </Button>
          </div>
        ) : (
          <div className="flex gap-3">
            {hotline && (
              <Button variant="outline" size="lg" className="shrink-0" leftIcon={<Phone className="h-5 w-5" />} onClick={() => platform.call(hotline)}>
                {t('orderStatus.callShop')}
              </Button>
            )}
            <Button
              variant={active ? 'outline' : 'primary'}
              size="lg"
              className="min-w-0 flex-1"
              leftIcon={<RotateCcw className="h-5 w-5" />}
              onClick={() => reorder(order)}
            >
              {t('orderStatus.reorder')}
            </Button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmCancel && canCancel}
        tone="danger"
        title={t('orderStatus.cancelDialog.title')}
        description={t('orderStatus.cancelDialog.body', { code: order.code })}
        confirmText={t('orderStatus.cancelOrder')}
        cancelText={t('orderStatus.cancelDialog.keep')}
        loading={cancelling}
        onConfirm={onConfirmCancel}
        onCancel={() => setConfirmCancel(false)}
      />
    </div>
  );
}
