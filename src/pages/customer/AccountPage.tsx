import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, ChevronRight, GraduationCap, KeyRound, LogOut } from 'lucide-react';
import { Button, Card, ConfirmDialog, LanguageSwitch, Logo, SectionTitle } from '@/components/ui';
import { FulfillmentPicker } from '@/components/customer/FulfillmentPicker';
import { LoyaltyCard } from '@/components/loyalty/LoyaltyCard';
import {
  APP_VERSION,
  AboutCafeCard,
  AccountProfileCard,
  NotificationSettings,
  ProfileEditSheet,
  reportSsoError,
} from '@/components/onboarding';
import { useDataReady, useMyActiveOrders, useMyOrders } from '@/hooks/data';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useT } from '@/i18n';
import { useSession } from '@/store/session';
import { APP_CONFIG, MICROSOFT_SSO } from '@/config/app';
import { checkAuthConfigured, completeMicrosoftRedirect, signInCustomerWithMicrosoft } from '@/services/firebase';
import { BACKEND } from '@/config/firebase';
import { toast } from '@/store/ui';

type Leave = 'logout' | 'upgrade';

export default function AccountPage() {
  const { t } = useT();
  usePageTitle(t('nav.account'));
  const navigate = useNavigate();

  const user = useSession((s) => s.user);
  const logout = useSession((s) => s.logout);
  const login = useSession((s) => s.login);
  const [upgrading, setUpgrading] = useState(false);
  useEffect(() => {
    if (!MICROSOFT_SSO || !user?.isGuest) return;
    void checkAuthConfigured();
    // Quay về từ trang đăng nhập Microsoft (popup bị chặn khi bấm "Đăng nhập ngay") → hoàn tất chuyển tài khoản
    let alive = true;
    completeMicrosoftRedirect()
      .then((profile) => {
        const guest = useSession.getState().user;
        if (!alive || !profile || !guest?.isGuest) return;
        login({
          id: `ms_${profile.uid}`,
          name: profile.name,
          email: profile.email,
          phone: guest.phone,
          studentId: guest.studentId,
          isGuest: false,
          authProvider: 'microsoft',
        });
        toast(t('onboarding.account.upgradedToast'), 'success');
      })
      .catch(reportSsoError);
    return () => {
      alive = false;
    };
  }, [user?.isGuest, login, t]);
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
    if (kind === 'logout') toast(t('onboarding.account.loggedOutToast'));
  };

  /**
   * Khách → tài khoản Microsoft 365: mở đăng nhập Microsoft ngay (không đăng xuất trước).
   * Huỷ / lỗi thì vẫn là khách, giữ nguyên tên và số điện thoại.
   */
  const upgradeWithMicrosoft = async () => {
    setConfirm(null);
    setUpgrading(true);
    try {
      const profile = await signInCustomerWithMicrosoft();
      login({
        id: `ms_${profile.uid}`,
        name: profile.name,
        email: profile.email,
        phone: user.phone,
        studentId: user.studentId,
        isGuest: false,
        authProvider: 'microsoft',
      });
      toast(t('onboarding.account.upgradedToast'), 'success');
    } catch (err) {
      reportSsoError(err);
    } finally {
      setUpgrading(false);
    }
  };
  const upgrade = () => (MICROSOFT_SSO ? void upgradeWithMicrosoft() : leave('upgrade'));
  const startUpgrade = () => (activeOrders.length ? setConfirm('upgrade') : upgrade());
  /** Khách nâng cấp được lên Microsoft 365 (SSO thật, hoặc bản demo offline → quay lại /welcome) */
  const canUpgrade = user.isGuest && (MICROSOFT_SSO || BACKEND === 'local');

  const addressError =
    fulfillment === 'delivery' && addressTouched && !deliveryAddress.trim() ? t('onboarding.account.addressError') : undefined;

  const activeNote = activeOrders.length > 0 && (
    <p className="mt-2 rounded-xl bg-rattan-soft px-3 py-2 text-[13px] font-medium leading-snug text-rattan-dark">
      {t('onboarding.account.activeNote', { count: activeOrders.length, codes: activeCodes })}
    </p>
  );

  return (
    <div className="safe-top">
      <div className="space-y-7 px-4 pt-4">
        <header className="flex items-center justify-between px-1">
          <h1 className="font-display text-[26px] font-extrabold tracking-tight text-espresso">{t('nav.account')}</h1>
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

          {/* Thẻ tích điểm; khách vãng lai thấy lời mời đăng nhập Microsoft 365 (thay cho thẻ nâng cấp tài khoản cũ) */}
          <LoyaltyCard variant="full" onSignIn={canUpgrade ? startUpgrade : undefined} signingIn={upgrading} />

          {/* Tắt tích điểm thì vẫn giữ thẻ mời nâng cấp tài khoản như trước */}
          {!APP_CONFIG.loyalty.enabled && canUpgrade && (
            <section className="relative overflow-hidden rounded-3xl bg-gold-soft p-4 ring-1 ring-inset ring-gold/50">
              <div aria-hidden className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-gold/35 blur-2xl" />
              <div className="relative flex gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gold text-espresso shadow-glow">
                  <GraduationCap className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <h2 className="font-display text-[15px] font-bold leading-snug text-espresso">{t('onboarding.account.upgradeTitle')}</h2>
                  <p className="mt-1 text-[13px] leading-snug text-bronze-800">{t('onboarding.account.upgradeBody')}</p>
                </div>
              </div>
              <Button block className="relative mt-3.5" rightIcon={<ArrowRight className="h-4 w-4" aria-hidden />} loading={upgrading} onClick={startUpgrade}>
                {t('onboarding.account.upgradeCta')}
              </Button>
            </section>
          )}
        </div>

        <section>
          <SectionTitle
            title={t('onboarding.account.fulfillmentTitle')}
            action={
              <span className="inline-flex items-center gap-1 text-xs font-medium text-leaf-dark">
                <Check className="h-3.5 w-3.5" aria-hidden />
                {t('onboarding.account.autoSaved')}
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
          <p className="mt-2.5 px-1 text-xs leading-relaxed text-stone">{t('onboarding.account.fulfillmentHint')}</p>
        </section>

        {/* Ngôn ngữ — tiêu đề luôn song ngữ để ai cũng tìm ra */}
        <section>
          <SectionTitle title={t('onboarding.account.languageTitle')} />
          <Card className="flex min-h-[68px] items-center gap-3 p-3.5 pl-4">
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-espresso">{t('onboarding.account.languageLabel')}</span>
              <span className="block text-xs leading-snug text-stone">{t('onboarding.account.languageHint')}</span>
            </span>
            <LanguageSwitch tone="light" className="shrink-0" />
          </Card>
        </section>

        <section>
          <SectionTitle title={t('onboarding.account.notificationsTitle')} />
          <NotificationSettings />
        </section>

        <section>
          <SectionTitle title={t('onboarding.account.aboutTitle')} />
          <AboutCafeCard />
        </section>

        <section>
          <SectionTitle title={t('onboarding.account.staffTitle')} />
          <Link
            to="/admin/login"
            className="flex min-h-[68px] items-center gap-3.5 rounded-3xl bg-white p-3.5 shadow-card ring-1 ring-bronze-200/50 transition hover:ring-bronze-300 active:scale-[.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-espresso text-gold">
              <KeyRound className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-espresso">{t('onboarding.account.adminTitle')}</span>
              <span className="block text-xs leading-snug text-stone">{t('onboarding.account.adminDesc')}</span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-bronze-400" aria-hidden />
          </Link>
        </section>

        <div className="space-y-4 pb-2">
          <Button variant="danger" size="lg" block leftIcon={<LogOut className="h-5 w-5" aria-hidden />} onClick={() => setConfirm('logout')}>
            {t('onboarding.account.logout')}
          </Button>
          <p className="text-center text-xs text-stone">{t('onboarding.account.version', { version: APP_VERSION })}</p>
        </div>
      </div>

      <ProfileEditSheet open={editing} onClose={closeEdit} user={user} />

      <ConfirmDialog
        open={confirm === 'logout'}
        title={t('onboarding.account.logoutConfirm.title')}
        tone="danger"
        confirmText={t('onboarding.account.logoutConfirm.confirm')}
        cancelText={t('onboarding.account.logoutConfirm.cancel')}
        description={
          <>
            <p>
              {t('onboarding.account.logoutConfirm.cartKept')}{' '}
              {user.isGuest ? t('onboarding.account.logoutConfirm.guest') : t('onboarding.account.logoutConfirm.member')}
            </p>
            {activeNote}
          </>
        }
        onConfirm={() => leave('logout')}
        onCancel={closeConfirm}
      />

      <ConfirmDialog
        open={confirm === 'upgrade'}
        title={t('onboarding.account.upgradeConfirm.title')}
        confirmText={t('onboarding.account.upgradeConfirm.confirm')}
        cancelText={t('common.later')}
        description={
          <>
            <p>{t('onboarding.account.upgradeConfirm.body')}</p>
            {activeNote}
          </>
        }
        onConfirm={upgrade}
        onCancel={closeConfirm}
      />
    </div>
  );
}
