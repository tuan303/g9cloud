import { useCallback, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, ChevronRight, GraduationCap, KeyRound, LogOut } from 'lucide-react';
import { Button, ConfirmDialog, Logo, SectionTitle } from '@/components/ui';
import { FulfillmentPicker } from '@/components/customer/FulfillmentPicker';
import {
  APP_VERSION,
  AboutCafeCard,
  AccountProfileCard,
  NotificationSettings,
  ProfileEditSheet,
} from '@/components/onboarding';
import { useDataReady, useMyActiveOrders, useMyOrders } from '@/hooks/data';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useSession } from '@/store/session';
import { toast } from '@/store/ui';

type Leave = 'logout' | 'upgrade';

export default function AccountPage() {
  usePageTitle('Tài khoản');
  const navigate = useNavigate();

  const user = useSession((s) => s.user);
  const logout = useSession((s) => s.logout);
  const fulfillment = useSession((s) => s.fulfillment);
  const deliveryAddress = useSession((s) => s.deliveryAddress);
  const setFulfillment = useSession((s) => s.setFulfillment);
  const setDeliveryAddress = useSession((s) => s.setDeliveryAddress);

  const ready = useDataReady();
  const myOrders = useMyOrders();
  const activeOrders = useMyActiveOrders();
  const orderCount = useMemo(() => myOrders.filter((o) => o.status !== 'cancelled').length, [myOrders]);
  const activeCodes = activeOrders.map((o) => o.code).join(', ');

  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState<Leave | null>(null);
  const [addressTouched, setAddressTouched] = useState(false);

  const closeEdit = useCallback(() => setEditing(false), []);
  const closeConfirm = useCallback(() => setConfirm(null), []);

  // RequireUser đã chặn trước; nhánh này chỉ xảy ra trong tích tắc sau khi đăng xuất
  if (!user) return <Navigate to="/welcome" replace />;

  /** Đăng xuất (giữ nguyên giỏ hàng). Nâng cấp từ khách → quay lại trang này sau khi đăng nhập. */
  const leave = (kind: Leave) => {
    setConfirm(null);
    logout();
    navigate('/welcome', { replace: true, state: kind === 'upgrade' ? { from: '/account' } : undefined });
    if (kind === 'logout') toast('Đã đăng xuất. Hẹn gặp lại bạn!');
  };

  const startUpgrade = () => (activeOrders.length ? setConfirm('upgrade') : leave('upgrade'));

  const addressError =
    fulfillment === 'delivery' && addressTouched && !deliveryAddress.trim()
      ? 'Nhập nơi giao để quán mang món đến đúng chỗ'
      : undefined;

  const activeNote = activeOrders.length > 0 && (
    <p className="mt-2 rounded-xl bg-rattan-soft px-3 py-2 text-[13px] font-medium leading-snug text-rattan-dark">
      Bạn còn {activeOrders.length} đơn đang xử lý ({activeCodes}) — nhớ mã đơn để nhận món nhé.
    </p>
  );

  return (
    <div className="safe-top">
      <div className="space-y-7 px-4 pt-4">
        <header className="flex items-center justify-between px-1">
          <h1 className="font-display text-[26px] font-extrabold tracking-tight text-espresso">Tài khoản</h1>
          <Logo className="h-6 text-bronze-300" />
        </header>

        <div className="-mt-3 space-y-3">
          <AccountProfileCard
            user={user}
            onEdit={() => setEditing(true)}
            orderCount={orderCount}
            activeCount={activeOrders.length}
            loading={!ready}
          />

          {user.isGuest && (
            <section className="relative overflow-hidden rounded-3xl bg-gold-soft p-4 ring-1 ring-inset ring-gold/50">
              <div aria-hidden className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-gold/35 blur-2xl" />
              <div className="relative flex gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gold text-espresso shadow-glow">
                  <GraduationCap className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <h2 className="font-display text-[15px] font-bold leading-snug text-espresso">
                    Đăng nhập bằng email trường để lưu lịch sử đơn
                  </h2>
                  <p className="mt-1 text-[13px] leading-snug text-bronze-800">
                    Xem lại đơn cũ và gọi lại món quen chỉ với vài chạm.
                  </p>
                </div>
              </div>
              <Button block className="relative mt-3.5" rightIcon={<ArrowRight className="h-4 w-4" aria-hidden />} onClick={startUpgrade}>
                Đăng nhập ngay
              </Button>
            </section>
          )}
        </div>

        <section>
          <SectionTitle
            title="Nhận món mặc định"
            action={
              <span className="inline-flex items-center gap-1 text-xs font-medium text-leaf-dark">
                <Check className="h-3.5 w-3.5" aria-hidden />
                Tự động lưu
              </span>
            }
          />
          <FulfillmentPicker
            value={fulfillment}
            onChange={(v) => setFulfillment(v)}
            address={deliveryAddress}
            onAddressChange={(v) => {
              setDeliveryAddress(v);
              setAddressTouched(true);
            }}
            addressError={addressError}
          />
          <p className="mt-2.5 px-1 text-xs leading-relaxed text-stone">
            Áp dụng sẵn cho đơn mới — bạn vẫn đổi được trong giỏ hàng.
          </p>
        </section>

        <section>
          <SectionTitle title="Thông báo" />
          <NotificationSettings />
        </section>

        <section>
          <SectionTitle title="Về Cloud 9" />
          <AboutCafeCard />
        </section>

        <section>
          <SectionTitle title="Dành cho nhân viên quán" />
          <Link
            to="/admin/login"
            className="flex min-h-[68px] items-center gap-3.5 rounded-3xl bg-white p-3.5 shadow-card ring-1 ring-bronze-200/50 transition hover:ring-bronze-300 active:scale-[.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-espresso text-gold">
              <KeyRound className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-espresso">Trang quản trị quán</span>
              <span className="block text-xs leading-snug text-stone">Nhận đơn, quét QR thu tiền, cập nhật thực đơn</span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-bronze-400" aria-hidden />
          </Link>
        </section>

        <div className="space-y-4 pb-2">
          <Button variant="danger" size="lg" block leftIcon={<LogOut className="h-5 w-5" aria-hidden />} onClick={() => setConfirm('logout')}>
            Đăng xuất
          </Button>
          <p className="text-center text-xs text-stone">
            Cloud 9 · Phiên bản {APP_VERSION} · Bản thử nghiệm
          </p>
        </div>
      </div>

      <ProfileEditSheet open={editing} onClose={closeEdit} user={user} />

      <ConfirmDialog
        open={confirm === 'logout'}
        title="Đăng xuất khỏi Cloud 9?"
        tone="danger"
        confirmText="Đăng xuất"
        cancelText="Ở lại"
        description={
          <>
            <p>
              Giỏ hàng của bạn vẫn được giữ nguyên.{' '}
              {user.isGuest
                ? 'Đơn đặt với tư cách khách sẽ không xem lại được sau khi đăng xuất.'
                : 'Đăng nhập lại bằng cùng tài khoản để xem lịch sử đơn.'}
            </p>
            {activeNote}
          </>
        }
        onConfirm={() => leave('logout')}
        onCancel={closeConfirm}
      />

      <ConfirmDialog
        open={confirm === 'upgrade'}
        title="Chuyển sang email trường?"
        confirmText="Tiếp tục"
        cancelText="Để sau"
        description={
          <>
            <p>Đơn đang xử lý được đặt với tư cách khách nên sẽ không hiện trong tài khoản mới.</p>
            {activeNote}
          </>
        }
        onConfirm={() => leave('upgrade')}
        onCancel={closeConfirm}
      />
    </div>
  );
}
