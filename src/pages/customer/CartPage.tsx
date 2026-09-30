import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Phone, Plus, QrCode, ShoppingBag, Trash, TriangleAlert, User } from 'lucide-react';
import { APP_CONFIG } from '@/config/app';
import { useDataReady, useMenu } from '@/hooks/data';
import { useAction } from '@/hooks/useAction';
import { usePageTitle } from '@/hooks/usePageTitle';
import { formatPrice, isValidVnPhone, normalizePhone } from '@/lib/format';
import { cartTotals } from '@/lib/pricing';
import { repo } from '@/services';
import { useCart } from '@/store/cart';
import { useSession } from '@/store/session';
import { toast } from '@/store/ui';
import { Button, Card, ConfirmDialog, EmptyState, IconButton, Input, PageHeader, SectionTitle, TextArea } from '@/components/ui';
import { FulfillmentPicker } from '@/components/customer/FulfillmentPicker';
import { ItemDetailSheet } from '@/components/menu/ItemDetailSheet';
import { OrderTotals } from '@/components/order/OrderItemsList';
import { CartLineItem } from '@/components/checkout/CartLineItem';
import { CheckoutSteps } from '@/components/checkout/CheckoutSteps';
import { PaymentMethodPicker } from '@/components/checkout/PaymentMethodPicker';
import { PendingOrderLink } from '@/components/checkout/PendingOrderLink';
import { GUEST_NAME } from '@/components/onboarding/helpers';
import type { CreateOrderInput, PaymentMethod } from '@/types';

type Field = 'address' | 'name' | 'phone';

/** Cuộn tới và focus ô cần sửa */
function focusField(el: HTMLElement | null | undefined) {
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.focus({ preventScroll: true });
}

export default function CartPage() {
  usePageTitle('Giỏ hàng');
  const navigate = useNavigate();
  const ready = useDataReady();
  const menu = useMenu();

  const lines = useCart((s) => s.lines);
  const note = useCart((s) => s.note);
  const setQuantity = useCart((s) => s.setQuantity);
  const removeLine = useCart((s) => s.remove);
  const setNote = useCart((s) => s.setNote);
  const clearCart = useCart((s) => s.clear);

  const user = useSession((s) => s.user);
  const fulfillment = useSession((s) => s.fulfillment);
  const deliveryAddress = useSession((s) => s.deliveryAddress);
  const setFulfillment = useSession((s) => s.setFulfillment);
  const setDeliveryAddress = useSession((s) => s.setDeliveryAddress);
  const updateProfile = useSession((s) => s.updateProfile);

  // Khách vãng lai chưa nhập tên thì phiên lưu 'Khách' — không coi đó là tên người nhận
  const [name, setName] = useState(user && !(user.isGuest && user.name === GUEST_NAME) ? user.name : '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(APP_CONFIG.payment.defaultMethod);
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const fulfillmentRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const warningRef = useRef<HTMLDivElement>(null);
  const submittingRef = useRef(false); // chặn chạm đúp tạo 2 đơn

  // Nếu hình thức đang lưu bị tắt trong cấu hình → chuyển sang hình thức còn lại
  useEffect(() => {
    const cfg = APP_CONFIG.fulfillment;
    if (cfg[fulfillment].enabled) return;
    const alt = fulfillment === 'pickup' ? 'delivery' : 'pickup';
    if (cfg[alt].enabled) setFulfillment(alt);
  }, [fulfillment, setFulfillment]);

  const menuById = useMemo(() => new Map(menu.map((m) => [m.id, m])), [menu]);
  // Chỉ đối chiếu tình trạng món khi thực đơn đã tải xong
  const unavailableIds = useMemo(() => {
    if (!ready) return new Set<string>();
    return new Set(
      lines
        .filter((l) => {
          const m = menuById.get(l.itemId);
          return !m || !m.available;
        })
        .map((l) => l.lineId),
    );
  }, [ready, lines, menuById]);

  const delivery = APP_CONFIG.fulfillment.delivery;
  const isDelivery = fulfillment === 'delivery';
  const totals = cartTotals(lines, isDelivery ? delivery.fee : 0);
  const shortOfMin = isDelivery && delivery.minOrder > 0 ? Math.max(0, delivery.minOrder - totals.subtotal) : 0;

  const errors: Partial<Record<Field, string>> = {
    address: isDelivery && !deliveryAddress.trim() ? 'Vui lòng nhập nơi giao (lớp / phòng ban)' : undefined,
    name: !name.trim() ? 'Vui lòng nhập tên người nhận' : undefined,
    phone: !phone.trim()
      ? 'Vui lòng nhập số điện thoại'
      : !isValidVnPhone(phone)
        ? 'Số điện thoại chưa đúng (VD: 0912 345 678)'
        : undefined,
  };
  const errorOf = (f: Field) => (submitted || touched[f] ? errors[f] : undefined);
  const touch = (f: Field) => setTouched((t) => (t[f] ? t : { ...t, [f]: true }));

  const editingLine = editingLineId ? lines.find((l) => l.lineId === editingLineId) : undefined;
  const editingItem = editingLine ? (menuById.get(editingLine.itemId) ?? null) : null;
  // Giữ onClose ổn định để BottomSheet không chạy lại hiệu ứng (focus/khoá cuộn) mỗi lần render
  const closeEditor = useCallback(() => setEditingLineId(null), []);

  const [createOrder, creating] = useAction((input: CreateOrderInput) => repo.createOrder(input));

  const removeUnavailable = () => {
    lines.filter((l) => unavailableIds.has(l.lineId)).forEach((l) => removeLine(l.lineId));
  };

  const submit = async () => {
    setSubmitted(true);
    if (!user) {
      navigate('/welcome', { replace: true });
      return;
    }
    if (unavailableIds.size) {
      toast('Vui lòng xoá món đã hết trước khi đặt', 'error');
      warningRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (errors.address) return focusField(fulfillmentRef.current?.querySelector('input'));
    if (shortOfMin > 0) {
      toast(`Thêm ${formatPrice(shortOfMin)} nữa để được giao tận nơi`, 'error');
      fulfillmentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (errors.name) return focusField(nameRef.current);
    if (errors.phone) return focusField(phoneRef.current);

    const cleanName = name.trim();
    const cleanPhone = normalizePhone(phone);
    updateProfile({ name: cleanName, phone: cleanPhone });

    if (submittingRef.current) return;
    submittingRef.current = true;
    const order = await createOrder({
      customer: { ...user, name: cleanName, phone: cleanPhone },
      fulfillment,
      deliveryAddress: isDelivery ? deliveryAddress.trim() : undefined,
      note: note.trim() || undefined,
      lines,
      paymentMethod,
    });
    submittingRef.current = false;
    if (!order) return;
    clearCart();
    navigate(`/order/${order.id}/pay`, { replace: true });
  };

  // ───────────── Giỏ trống ─────────────
  if (!lines.length) {
    return (
      <div className="min-h-dvh bg-cream">
        <PageHeader title="Giỏ hàng" back fallback="/" />
        <EmptyState
          className="pt-16"
          icon={<ShoppingBag className="h-9 w-9" />}
          title="Giỏ hàng đang trống"
          description="Chọn vài món ngon ở Cloud 9 rồi quay lại đây nhé."
          action={
            <Button size="lg" onClick={() => navigate('/')}>
              Xem thực đơn
            </Button>
          }
        />
        <PendingOrderLink className="mx-4" />
      </div>
    );
  }

  const blockMessage = unavailableIds.size
    ? `${unavailableIds.size} món đã hết — xoá khỏi giỏ để tiếp tục`
    : shortOfMin > 0
      ? `Thêm ${formatPrice(shortOfMin)} nữa để được giao tận nơi`
      : null;

  return (
    <div className="min-h-dvh bg-cream" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 156px)' }}>
      <PageHeader
        title="Giỏ hàng"
        subtitle={`${totals.itemCount} món`}
        back
        fallback="/"
        right={
          <IconButton label="Xoá toàn bộ giỏ hàng" onClick={() => setConfirmClear(true)}>
            <Trash className="h-5 w-5" />
          </IconButton>
        }
      />

      <div className="space-y-7 px-4 pt-4">
        <CheckoutSteps current={1} />

        {/* ── Món đã chọn ── */}
        <section>
          <SectionTitle title="Món đã chọn" />

          {unavailableIds.size > 0 && (
            <div
              ref={warningRef}
              role="alert"
              className="mb-3 flex items-start gap-3 rounded-2xl bg-rattan-soft p-3.5 ring-1 ring-inset ring-rattan-light/40"
            >
              <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-rattan-dark" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-rattan-dark">{unavailableIds.size} món vừa tạm hết</p>
                <p className="mt-0.5 text-xs leading-snug text-rattan-dark/80">Quán vừa cập nhật thực đơn. Xoá các món này để tiếp tục đặt hàng.</p>
              </div>
              <Button size="sm" variant="danger" onClick={removeUnavailable} className="shrink-0">
                Xoá hết
              </Button>
            </div>
          )}

          <Card className="overflow-hidden">
            <ul className="divide-y divide-bronze-100">
              {lines.map((line) => (
                <CartLineItem
                  key={line.lineId}
                  line={line}
                  unavailable={unavailableIds.has(line.lineId)}
                  onEdit={ready ? () => setEditingLineId(line.lineId) : undefined}
                  onQuantityChange={(q) => setQuantity(line.lineId, q)}
                  onRemove={() => removeLine(line.lineId)}
                />
              ))}
            </ul>
            <Link
              to="/"
              className="flex h-12 items-center justify-center gap-2 border-t border-dashed border-bronze-200 text-sm font-semibold text-bronze-700 transition hover:bg-bronze-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Thêm món khác
            </Link>
          </Card>
        </section>

        {/* ── Hình thức nhận ── */}
        <section>
          <SectionTitle title="Hình thức nhận" />
          <div ref={fulfillmentRef}>
            <FulfillmentPicker
              value={fulfillment}
              onChange={(f) => setFulfillment(f)}
              address={deliveryAddress}
              onAddressChange={(v) => {
                setDeliveryAddress(v);
                touch('address');
              }}
              addressError={errorOf('address')}
            />
            {shortOfMin > 0 && (
              <p className="mt-2.5 flex items-start gap-1.5 px-1 text-xs font-medium text-rattan-dark">
                <TriangleAlert className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
                Giao tận nơi áp dụng cho đơn từ {formatPrice(delivery.minOrder)} — thêm {formatPrice(shortOfMin)} nữa nhé.
              </p>
            )}
          </div>
        </section>

        {/* ── Người nhận ── */}
        <section>
          <SectionTitle title="Thông tin người nhận" />
          <Card className="space-y-4 p-4">
            <Input
              ref={nameRef}
              label="Tên người nhận"
              required
              icon={<User className="h-[18px] w-[18px]" />}
              placeholder="VD: Nguyễn Minh Anh"
              autoComplete="name"
              enterKeyHint="next"
              maxLength={60}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => touch('name')}
              error={errorOf('name')}
            />
            <Input
              ref={phoneRef}
              label="Số điện thoại"
              required
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              enterKeyHint="done"
              maxLength={15}
              icon={<Phone className="h-[18px] w-[18px]" />}
              placeholder="VD: 0912 345 678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onBlur={() => touch('phone')}
              error={errorOf('phone')}
              hint="Quán liên hệ số này khi cần xác nhận đơn"
            />
          </Card>
        </section>

        {/* ── Ghi chú ── */}
        <section>
          <SectionTitle title="Ghi chú đơn hàng" />
          <TextArea
            aria-label="Ghi chú đơn hàng"
            rows={2}
            maxLength={200}
            placeholder="VD: Lấy thêm ống hút giấy, gọi mình khi món xong…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            hint="Muốn dặn riêng từng món? Chạm vào món trong giỏ để sửa."
          />
        </section>

        {/* ── Thanh toán ── */}
        <section>
          <SectionTitle title="Thanh toán" />
          <PaymentMethodPicker value={paymentMethod} onChange={setPaymentMethod} />
        </section>

        {/* ── Tổng tiền ── */}
        <Card className="p-4">
          <OrderTotals
            subtotal={totals.subtotal}
            deliveryFee={totals.deliveryFee}
            total={totals.total}
            showDelivery={isDelivery}
          />
        </Card>
      </div>

      {/* ── Thanh đặt hàng cố định ── */}
      <div className="safe-bottom fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md border-t border-bronze-200/70 bg-cream/90 px-4 pt-3 backdrop-blur-md">
        {blockMessage && (
          <p role="status" className="mb-2 flex items-center gap-1.5 text-xs font-medium text-rattan-dark">
            <TriangleAlert className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {blockMessage}
          </p>
        )}
        <div className="mb-2.5 flex items-baseline justify-between gap-3 px-0.5">
          <span className="text-sm text-stone">
            Tổng cộng · <span className="tabular-nums">{totals.itemCount}</span> món
          </span>
          <span className="font-display text-[22px] font-extrabold tabular-nums leading-none text-espresso">{formatPrice(totals.total)}</span>
        </div>
        <Button
          variant="leaf"
          size="lg"
          block
          loading={creating}
          disabled={!ready}
          onClick={() => void submit()}
          leftIcon={<QrCode className="h-5 w-5" aria-hidden />}
        >
          Tạo mã QR đặt hàng
        </Button>
      </div>

      <ItemDetailSheet item={editingItem} open={!!editingLine && !!editingItem} onClose={closeEditor} editLine={editingLine} />

      <ConfirmDialog
        open={confirmClear}
        title="Xoá toàn bộ giỏ hàng?"
        description="Tất cả món và ghi chú trong giỏ sẽ bị xoá."
        confirmText="Xoá hết"
        cancelText="Giữ lại"
        tone="danger"
        onConfirm={() => {
          clearCart();
          setConfirmClear(false);
        }}
        onCancel={() => setConfirmClear(false)}
      />
    </div>
  );
}
