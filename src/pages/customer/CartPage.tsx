import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Coffee, Gift, Phone, Plus, QrCode, ShoppingBag, Trash, TriangleAlert, User } from 'lucide-react';
import { APP_CONFIG } from '@/config/app';
import { useDraftState } from '@/hooks/useDraftState';
import { useDataReady, useMenu } from '@/hooks/data';
import { useLoyalty, useRewardLine } from '@/hooks/loyalty';
import { useAction } from '@/hooks/useAction';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useT } from '@/i18n';
import { cn } from '@/lib/cn';
import { formatPrice, isValidVnPhone, normalizePhone } from '@/lib/format';
import { lineName } from '@/lib/i18n-data';
import { cartTotals } from '@/lib/pricing';
import { repo } from '@/services';
import { eligibleCups, rewardDiscount } from '@/services/order-logic';
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
import type { CartLine, CreateOrderInput, PaymentMethod } from '@/types';

type Field = 'address' | 'name' | 'phone';

/** Cuộn tới và focus ô cần sửa */
function focusField(el: HTMLElement | null | undefined) {
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.focus({ preventScroll: true });
}

export default function CartPage() {
  const { t } = useT();
  usePageTitle(t('cart.title'));
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
  // Giữ nội dung đang nhập khi khách đổi ngôn ngữ (trang được dựng lại)
  const [name, setName] = useDraftState('cart.name', () => (user && !(user.isGuest && user.name === GUEST_NAME) ? user.name : ''));
  const [phone, setPhone] = useDraftState('cart.phone', user?.phone ?? '');
  const [paymentMethod, setPaymentMethod] = useDraftState<PaymentMethod>('cart.payment', APP_CONFIG.payment.defaultMethod);
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [rewardOn, setRewardOn] = useDraftState('cart.reward', false);

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

  // ── Tích điểm: đổi 1 cốc miễn phí (cốc nước đắt nhất trong giỏ) ──
  const loyalty = useLoyalty();
  const rewardItem = useRewardLine(lines);
  const canRedeem = loyalty.member && loyalty.rewardsAvailable > 0;
  const hasEligible = !!rewardItem;
  const redeem = rewardOn && canRedeem && hasEligible;
  // Hết cốc miễn phí (VD vừa dùng ở đơn khác) hoặc giỏ không còn món nước → tắt lựa chọn
  useEffect(() => {
    if (!canRedeem || !hasEligible) setRewardOn(false);
  }, [canRedeem, hasEligible]);
  const discount = redeem ? rewardDiscount(lines) : 0;
  const grandTotal = totals.subtotal + totals.deliveryFee - discount;
  const cupsEarned = loyalty.member ? Math.max(0, eligibleCups(lines) - (redeem ? 1 : 0)) : 0;

  const errors: Partial<Record<Field, string>> = {
    address: isDelivery && !deliveryAddress.trim() ? t('cart.errors.address') : undefined,
    name: !name.trim() ? t('cart.errors.name') : undefined,
    phone: !phone.trim() ? t('cart.errors.phone') : !isValidVnPhone(phone) ? t('cart.errors.phoneInvalid') : undefined,
  };
  const errorOf = (f: Field) => (submitted || touched[f] ? errors[f] : undefined);
  const touch = (f: Field) => setTouched((prev) => (prev[f] ? prev : { ...prev, [f]: true }));

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
      toast(t('cart.unavailable.toast'), 'error');
      warningRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (errors.address) return focusField(fulfillmentRef.current?.querySelector('input'));
    if (shortOfMin > 0) {
      toast(t('cart.minOrder.short', { amount: formatPrice(shortOfMin) }), 'error');
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
      redeemReward: redeem || undefined,
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
        <PageHeader title={t('cart.title')} back fallback="/" />
        <EmptyState
          className="pt-16"
          icon={<ShoppingBag className="h-9 w-9" />}
          title={t('cart.empty.title')}
          description={t('cart.empty.body')}
          action={
            <Button size="lg" onClick={() => navigate('/')}>
              {t('cart.empty.cta')}
            </Button>
          }
        />
        <PendingOrderLink className="mx-4" />
      </div>
    );
  }

  const blockMessage = unavailableIds.size
    ? t('cart.unavailable.block', { count: unavailableIds.size })
    : shortOfMin > 0
      ? t('cart.minOrder.short', { amount: formatPrice(shortOfMin) })
      : null;

  return (
    <div className="min-h-dvh bg-cream" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 156px)' }}>
      <PageHeader
        title={t('cart.title')}
        subtitle={t('cart.itemCount', { count: totals.itemCount })}
        back
        fallback="/"
        right={
          <IconButton label={t('cart.clearAria')} onClick={() => setConfirmClear(true)}>
            <Trash className="h-5 w-5" />
          </IconButton>
        }
      />

      <div className="space-y-7 px-4 pt-4">
        <CheckoutSteps current={1} />

        {/* ── Món đã chọn ── */}
        <section>
          <SectionTitle title={t('cart.sections.items')} />

          {unavailableIds.size > 0 && (
            <div
              ref={warningRef}
              role="alert"
              className="mb-3 flex items-start gap-3 rounded-2xl bg-rattan-soft p-3.5 ring-1 ring-inset ring-rattan-light/40"
            >
              <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-rattan-dark" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-rattan-dark">{t('cart.unavailable.title', { count: unavailableIds.size })}</p>
                <p className="mt-0.5 text-xs leading-snug text-rattan-dark/80">{t('cart.unavailable.body')}</p>
              </div>
              <Button size="sm" variant="danger" onClick={removeUnavailable} className="shrink-0">
                {t('cart.unavailable.removeAll')}
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
              {t('cart.addMore')}
            </Link>
          </Card>
        </section>

        {/* ── Hình thức nhận ── */}
        <section>
          <SectionTitle title={t('cart.sections.fulfillment')} />
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
                {t('cart.minOrder.hint', { min: formatPrice(delivery.minOrder), amount: formatPrice(shortOfMin) })}
              </p>
            )}
          </div>
        </section>

        {/* ── Người nhận ── */}
        <section>
          <SectionTitle title={t('cart.sections.recipient')} />
          <Card className="space-y-4 p-4">
            <Input
              ref={nameRef}
              label={t('cart.form.name')}
              required
              icon={<User className="h-[18px] w-[18px]" />}
              placeholder={t('cart.form.namePlaceholder')}
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
              label={t('cart.form.phone')}
              required
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              enterKeyHint="done"
              maxLength={15}
              icon={<Phone className="h-[18px] w-[18px]" />}
              placeholder={t('cart.form.phonePlaceholder')}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onBlur={() => touch('phone')}
              error={errorOf('phone')}
              hint={t('cart.form.phoneHint')}
            />
          </Card>
        </section>

        {/* ── Ghi chú ── */}
        <section>
          <SectionTitle title={t('cart.sections.note')} />
          <TextArea
            aria-label={t('cart.sections.note')}
            rows={2}
            maxLength={200}
            placeholder={t('cart.form.notePlaceholder')}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            hint={t('cart.form.noteHint')}
          />
        </section>

        {/* ── Thanh toán ── */}
        <section>
          <SectionTitle title={t('cart.sections.payment')} />
          <PaymentMethodPicker value={paymentMethod} onChange={setPaymentMethod} />
        </section>

        {/* ── Cốc miễn phí từ thẻ tích điểm ── */}
        {canRedeem && (
          <RewardToggle
            on={redeem}
            onToggle={() => setRewardOn((v) => !v)}
            line={rewardItem}
            rewardsAvailable={loyalty.rewardsAvailable}
          />
        )}

        {/* ── Tổng tiền ── */}
        <Card className="p-4">
          <OrderTotals
            subtotal={totals.subtotal}
            deliveryFee={totals.deliveryFee}
            discount={discount}
            loyaltyRedeem={redeem}
            total={grandTotal}
            showDelivery={isDelivery}
          />
          {/* Thành viên chưa có cốc miễn phí: tiến độ tích điểm + số cốc đơn này được cộng */}
          {loyalty.member && !canRedeem && (
            <div className="mt-3.5 flex items-center gap-2 rounded-2xl bg-gold-soft/60 px-3 py-2 text-xs font-medium text-bronze-800">
              <Coffee className="h-3.5 w-3.5 shrink-0 text-gold-dark" aria-hidden />
              <span className="min-w-0 flex-1 leading-snug">
                {loyalty.pendingRedeemCodes.length > 0
                  ? t('loyalty.pendingNote', { count: loyalty.pendingRedeemCodes.length, codes: loyalty.pendingRedeemCodes.join(', ') })
                  : t('loyalty.toNext', { count: loyalty.toNext })}
              </span>
              {cupsEarned > 0 && (
                <span className="shrink-0 rounded-full bg-white/80 px-2 py-0.5 font-semibold tabular-nums text-bronze-700">
                  {t('loyalty.earned', { count: cupsEarned })}
                </span>
              )}
            </div>
          )}
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
            {t('totals.total')} · <span className="tabular-nums">{t('cart.itemCount', { count: totals.itemCount })}</span>
          </span>
          <span className="font-display text-[22px] font-extrabold tabular-nums leading-none text-espresso">{formatPrice(grandTotal)}</span>
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
          {t('cart.submit')}
        </Button>
      </div>

      <ItemDetailSheet item={editingItem} open={!!editingLine && !!editingItem} onClose={closeEditor} editLine={editingLine} />

      <ConfirmDialog
        open={confirmClear}
        title={t('cart.clearConfirm.title')}
        description={t('cart.clearConfirm.body')}
        confirmText={t('cart.clearConfirm.confirm')}
        cancelText={t('cart.clearConfirm.cancel')}
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

/**
 * Thẻ bật/tắt "Dùng 1 cốc miễn phí" (viền vàng nắng, icon quà). Ghi rõ món nào được miễn phí và giá;
 * giỏ chưa có món nước thì khoá công tắc và nhắc thêm một món nước.
 */
function RewardToggle({
  on,
  onToggle,
  line,
  rewardsAvailable,
}: {
  on: boolean;
  onToggle: () => void;
  line: CartLine | undefined;
  rewardsAvailable: number;
}) {
  const { t } = useT();
  const titleId = useId();
  const hintId = useId();
  const disabled = !line;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-labelledby={titleId}
      aria-describedby={hintId}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        'relative flex w-full items-center gap-3 overflow-hidden rounded-3xl p-4 text-left ring-1 ring-inset transition',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
        on ? 'bg-gold-soft shadow-glow ring-gold' : 'bg-white ring-gold/50',
        disabled ? 'cursor-not-allowed' : 'active:scale-[.99]',
        !disabled && !on && 'hover:ring-gold',
      )}
    >
      <span aria-hidden className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-gold/25 blur-2xl" />
      <span
        className={cn(
          'relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl',
          disabled ? 'bg-bronze-100 text-bronze-500' : 'bg-gold text-espresso',
        )}
      >
        <Gift className="h-5 w-5" aria-hidden />
      </span>
      <span className="relative min-w-0 flex-1">
        <span id={titleId} className="flex flex-wrap items-baseline gap-x-2 font-display text-[15px] font-bold leading-tight text-espresso">
          {t('loyalty.useReward')}
          <span className="font-sans text-[11px] font-semibold text-bronze-600">{t('loyalty.rewardsAvailable', { count: rewardsAvailable })}</span>
        </span>
        <span id={hintId} className={cn('mt-1 block text-[13px] leading-snug', disabled ? 'text-stone' : 'text-bronze-800')}>
          {line ? t('loyalty.useRewardHint', { name: lineName(line), amount: formatPrice(line.unitPrice) }) : t('loyalty.noEligible')}
        </span>
      </span>
      {/* Công tắc */}
      <span
        aria-hidden
        className={cn(
          'relative h-7 w-12 shrink-0 rounded-full transition-colors',
          on ? 'bg-gold-dark' : 'bg-bronze-200',
          disabled && 'opacity-50',
        )}
      >
        <span className={cn('absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all', on ? 'left-6' : 'left-1')} />
      </span>
    </button>
  );
}
