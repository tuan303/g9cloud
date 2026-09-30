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
import { isActiveOrder } from '@/lib/order-status';
import { platform } from '@/platform';
import { repo } from '@/services';
import { useSession } from '@/store/session';

const HEADER_TITLE = 'Theo dõi đơn hàng';
/**
 * Tạm vá: trong PageHeader tone="dark", lớp text-espresso mặc định của IconButton đứng sau text-cream
 * trong CSS (Tailwind xếp theo tên) nên mũi tên quay lại bị chìm. Bộ chọn con có độ ưu tiên cao hơn.
 */
const DARK_HEADER_FIX = '[&_button]:text-cream';

function StatusSkeleton() {
  return (
    <div className="min-h-dvh bg-cream" aria-busy="true" aria-label="Đang tải đơn hàng">
      <PageHeader tone="dark" back fallback="/orders" title={HEADER_TITLE} className={DARK_HEADER_FIX} />
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
  const { id } = useParams<{ id: string }>();
  const order = useOrder(id);
  const ready = useDataReady();
  const userId = useSession((s) => s.user?.id);
  const navigate = useNavigate();
  const reorder = useReorder();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancel, cancelling] = useAction(
    async () => {
      if (id) await repo.cancelOrder(id, 'Khách huỷ đơn', 'customer');
    },
    { success: 'Đã huỷ đơn hàng' },
  );
  usePageTitle(order ? `Đơn ${order.code}` : HEADER_TITLE);

  if (!ready) return <StatusSkeleton />;

  if (!order) {
    return (
      <div className="min-h-dvh bg-cream">
        <PageHeader back fallback="/orders" title={HEADER_TITLE} />
        <EmptyState
          className="pt-20"
          icon={<ReceiptText className="h-9 w-9" />}
          title="Không tìm thấy đơn hàng"
          description="Đơn có thể đã bị xoá hoặc đường dẫn không còn đúng."
          action={
            <Button onClick={() => navigate('/orders', { replace: true })}>Xem đơn của tôi</Button>
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
      <PageHeader tone="dark" back fallback="/orders" title={HEADER_TITLE} className={DARK_HEADER_FIX} />
      <OrderStatusHero order={order} />

      <div className="space-y-5 px-4 pt-5">
        <section>
          <SectionTitle title="Thông tin đơn" />
          <OrderInfoCard order={order} />
        </section>

        <section>
          <SectionTitle
            title="Món đã đặt"
            action={<span className="text-xs font-semibold text-stone">{order.itemCount} món</span>}
          />
          <Card className="px-4 pb-4 pt-1">
            <OrderItemsList lines={order.items} />
            <OrderTotals
              className="mt-1 border-t border-bronze-100 pt-3"
              subtotal={order.subtotal}
              deliveryFee={order.deliveryFee}
              discount={order.discount}
              total={order.total}
              showDelivery={order.fulfillment === 'delivery'}
            />
          </Card>
        </section>

        <section>
          <SectionTitle title="Hành trình đơn hàng" />
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
                Huỷ đơn
              </Button>
            )}
            <Button
              variant="leaf"
              size="lg"
              className="min-w-0 flex-1"
              leftIcon={<QrCode className="h-5 w-5" />}
              onClick={() => navigate(`/order/${order.id}/pay`, { replace: true })}
            >
              Mở mã QR thanh toán
            </Button>
          </div>
        ) : (
          <div className="flex gap-3">
            {hotline && (
              <Button variant="outline" size="lg" className="shrink-0" leftIcon={<Phone className="h-5 w-5" />} onClick={() => platform.call(hotline)}>
                Gọi quán
              </Button>
            )}
            <Button
              variant={active ? 'outline' : 'primary'}
              size="lg"
              className="min-w-0 flex-1"
              leftIcon={<RotateCcw className="h-5 w-5" />}
              onClick={() => reorder(order)}
            >
              Đặt lại
            </Button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmCancel && canCancel}
        tone="danger"
        title="Huỷ đơn này?"
        description={`Đơn ${order.code} chưa thanh toán sẽ bị huỷ. Bạn có thể đặt lại bất cứ lúc nào.`}
        confirmText="Huỷ đơn"
        cancelText="Giữ đơn"
        loading={cancelling}
        onConfirm={onConfirmCancel}
        onCancel={() => setConfirmCancel(false)}
      />
    </div>
  );
}
