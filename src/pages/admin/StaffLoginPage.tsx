import { useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Lock, LogOut, Mail, RefreshCw, ShieldAlert } from 'lucide-react';
import counterPhoto from '@/assets/photos/counter-sm.webp';
import { Button, Input, LanguageSwitch, Logo } from '@/components/ui';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useT } from '@/i18n';
import {
  checkAuthConfigured,
  completeStaffMicrosoftRedirect,
  firebaseErrorMessage,
  staffSignIn,
  staffSignInWithMicrosoft,
  staffSignOut,
} from '@/services/firebase';
import { APP_CONFIG } from '@/config/app';
import { MicrosoftLogo } from '@/components/onboarding';
import { recheckStaff, useStaffAuth } from '@/store/staff-auth';

const SILENT = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request', 'auth/user-cancelled'];

/**
 * Đăng nhập nhân viên bằng Microsoft 365 của trường hoặc tài khoản Firebase (email + mật khẩu).
 * Chỉ dùng khi APP_CONFIG.admin.auth = 'firebase'. Quyền nhân viên = có tài liệu staff/{uid} trong Firestore.
 */
export default function StaffLoginPage() {
  const { t } = useT();
  usePageTitle(t('adminLogin.staffArea'));
  const { status, email: signedEmail, uid, message } = useStaffAuth();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  const target = from && from.startsWith('/admin') && from !== '/admin/login' ? from : '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [msBusy, setMsBusy] = useState(false);
  const [msError, setMsError] = useState('');
  useEffect(() => {
    void checkAuthConfigured();
    // Quay về từ trang đăng nhập Microsoft (khi popup bị chặn): báo lỗi nếu có (VD tài khoản ngoài trường)
    completeStaffMicrosoftRedirect().catch((err) => {
      if (!SILENT.includes((err as { code?: string })?.code ?? '')) setMsError(firebaseErrorMessage(err));
    });
  }, []);

  const signInMicrosoft = async () => {
    setMsBusy(true);
    setMsError('');
    try {
      await staffSignInWithMicrosoft();
    } catch (err) {
      if (!SILENT.includes((err as { code?: string })?.code ?? '')) setMsError(firebaseErrorMessage(err));
    } finally {
      setMsBusy(false);
    }
  };

  if (status === 'staff') return <Navigate to={target} replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError(t('adminLogin.staff.missingFields'));
      return;
    }
    setBusy(true);
    setError('');
    try {
      // Không tự chuyển trang: đợi kiểm tra quyền staff/{uid} xong, trang tự chuyển khi status = 'staff'
      await staffSignIn(email, password);
    } catch (err) {
      setError(firebaseErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-dvh flex-col bg-espresso-900 text-cream">
      <div aria-hidden className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: `url(${counterPhoto})` }} />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-espresso-900/60 via-espresso-900/90 to-espresso-900" />

      <div className="safe-top relative mx-auto flex w-full max-w-sm flex-1 flex-col px-6 pb-10">
        <div className="mt-4 flex items-center justify-between gap-3">
          <Link to="/" className="inline-flex min-h-11 items-center gap-2 text-sm text-cream/80 hover:text-cream">
            <ArrowLeft aria-hidden className="h-4 w-4" /> {t('adminLogin.backToOrdering')}
          </Link>
          <LanguageSwitch tone="dark" className="shrink-0" />
        </div>

        <div className="mt-10 flex flex-col items-center text-center">
          <Logo className="h-10 text-cream" />
          <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-gold">
            <Lock aria-hidden className="h-3.5 w-3.5" /> {t('adminLogin.staffArea')}
          </span>
          <h1 className="mt-5 font-display text-2xl font-bold">{t('adminLogin.staff.title')}</h1>
          <p className="mt-1.5 text-sm text-cream/70">{t('adminLogin.staff.subtitle')}</p>
        </div>

        {status === 'error' ? (
          <div className="mt-8 rounded-3xl bg-white/5 p-5 ring-1 ring-white/10">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
              <div className="min-w-0 text-sm">
                <p className="font-semibold">{t('adminLogin.staff.checkFailed')}</p>
                <p className="mt-1 text-cream/70">{message}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button variant="light" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={() => void recheckStaff()}>
                {t('common.retry')}
              </Button>
              <Button variant="outline" className="bg-transparent text-cream ring-white/30 hover:bg-white/10" onClick={() => void staffSignOut()}>
                {t('adminLogin.staff.signOut')}
              </Button>
            </div>
          </div>
        ) : status === 'not_staff' ? (
          <div className="mt-8 rounded-3xl bg-white/5 p-5 ring-1 ring-white/10">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
              <div className="min-w-0 text-sm">
                <p className="font-semibold">{t('adminLogin.staff.notStaffTitle')}</p>
                <p className="mt-1 text-cream/70">
                  {t('adminLogin.staff.notStaffBefore', { email: signedEmail ?? '' })}
                  <code className="mx-1 rounded bg-white/10 px-1 py-0.5 text-[12px]">staff/{uid}</code>
                  {t('adminLogin.staff.notStaffAfter')}
                </p>
              </div>
            </div>
            <Button variant="light" block className="mt-4" leftIcon={<LogOut className="h-4 w-4" />} onClick={() => void staffSignOut()}>
              {t('adminLogin.staff.otherAccount')}
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="mt-8 space-y-4 rounded-3xl bg-cream p-5 text-espresso shadow-lift">
            {APP_CONFIG.auth.microsoft.enabled && (
              <>
                <Button
                  variant="outline"
                  block
                  size="lg"
                  className="bg-white"
                  leftIcon={<MicrosoftLogo className="h-5 w-5" />}
                  loading={msBusy}
                  onClick={() => void signInMicrosoft()}
                >
                  {t('adminLogin.staff.microsoft')}
                </Button>
                {msError && (
                  <p role="alert" className="rounded-xl bg-rattan-soft px-3 py-2 text-[13px] leading-snug text-rattan-dark">
                    {msError}
                  </p>
                )}
                <div aria-hidden className="flex items-center gap-3 text-xs font-medium text-stone">
                  <span className="h-px flex-1 bg-bronze-200" />
                  {t('adminLogin.staff.or')}
                  <span className="h-px flex-1 bg-bronze-200" />
                </div>
              </>
            )}
            <Input
              label={t('adminLogin.staff.email')}
              type="email"
              inputMode="email"
              autoComplete="username"
              icon={<Mail className="h-4 w-4" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('adminLogin.staff.emailPlaceholder')}
            />
            <Input
              label={t('adminLogin.staff.password')}
              type="password"
              autoComplete="current-password"
              icon={<Lock className="h-4 w-4" />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={error || undefined}
            />
            <Button type="submit" block size="lg" loading={busy || status === 'loading'}>
              {t('adminLogin.staff.submit')}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
