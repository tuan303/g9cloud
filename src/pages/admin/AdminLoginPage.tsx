import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Delete, LockKeyhole } from 'lucide-react';
import counterPhoto from '@/assets/photos/counter.webp';
import { APP_CONFIG } from '@/config/app';
import { useNow } from '@/hooks/useNow';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useT } from '@/i18n';
import { cn } from '@/lib/cn';
import { platform } from '@/platform';
import { useSession } from '@/store/session';
import { LanguageSwitch, Logo } from '@/components/ui';

const PIN = APP_CONFIG.admin.pin;
/** Chỉ gợi ý PIN khi quán chưa đổi mã mặc định (bản demo) */
const SHOW_DEFAULT_HINT = PIN === '9999';
const MAX_ATTEMPTS = 5;
const LOCK_MS = 30_000;
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'] as const;

const SHAKE_CSS = `@keyframes c9-shake{0%,100%{transform:translateX(0)}15%{transform:translateX(-10px)}30%{transform:translateX(9px)}45%{transform:translateX(-7px)}60%{transform:translateX(5px)}75%{transform:translateX(-3px)}}`;

type Phase = 'input' | 'checking' | 'error' | 'success';

/** Số lần sai + thời điểm hết khoá lưu theo phiên trình duyệt: đổi ngôn ngữ / tải lại trang không xoá được khoá */
const LOCK_KEY = 'c9.admin.pinLock';
interface PinLock {
  attempts: number;
  lockedUntil: number;
}
function readLock(): PinLock {
  try {
    const v = JSON.parse(sessionStorage.getItem(LOCK_KEY) ?? 'null') as Partial<PinLock> | null;
    return { attempts: Number(v?.attempts) || 0, lockedUntil: Number(v?.lockedUntil) || 0 };
  } catch {
    return { attempts: 0, lockedUntil: 0 };
  }
}
function writeLock(lock: PinLock) {
  try {
    sessionStorage.setItem(LOCK_KEY, JSON.stringify(lock));
  } catch {
    /* chế độ riêng tư / bị chặn bộ nhớ: khoá chỉ còn trong trang */
  }
}

/** Chỉ quay lại trang quản trị (không mở trang tuỳ ý từ state) */
function safeDestination(from: unknown): string {
  return typeof from === 'string' && from.startsWith('/admin') && !from.startsWith('/admin/login') ? from : '/admin';
}

/** Đăng nhập nhân viên bằng mã PIN — bàn phím số lớn, hỗ trợ cả bàn phím vật lý */
export default function AdminLoginPage() {
  const { t } = useT();
  usePageTitle(t('adminLogin.staffArea'));
  const unlocked = useSession((s) => s.adminUnlocked);
  const unlockAdmin = useSession((s) => s.unlockAdmin);
  const navigate = useNavigate();
  const location = useLocation();
  const dest = safeDestination((location.state as { from?: unknown } | null)?.from);

  const [value, setValue] = useState('');
  const [phase, setPhase] = useState<Phase>('input');
  const [attempts, setAttempts] = useState(() => readLock().attempts);
  const [lockedUntil, setLockedUntil] = useState(() => readLock().lockedUntil);
  const [shakeKey, setShakeKey] = useState(0);
  const now = useNow(1000);
  const locked = lockedUntil > now;
  const inputDisabled = locked || phase === 'checking' || phase === 'success';

  // Dọn các hẹn giờ khi rời trang
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);
  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const verify = (pin: string) => {
    if (pin === PIN) {
      writeLock({ attempts: 0, lockedUntil: 0 });
      setPhase('success');
      platform.vibrate(20);
      later(() => {
        unlockAdmin();
        navigate(dest, { replace: true });
      }, 240);
      return;
    }
    setPhase('checking');
    setShakeKey((k) => k + 1);
    platform.vibrate([40, 60, 40]);
    const next = attempts + 1;
    const lock = next >= MAX_ATTEMPTS;
    if (lock) {
      const until = Date.now() + LOCK_MS;
      setAttempts(0);
      setLockedUntil(until);
      writeLock({ attempts: 0, lockedUntil: until });
    } else {
      setAttempts(next);
      writeLock({ attempts: next, lockedUntil });
    }
    later(() => {
      setValue('');
      // Khi bị khoá tạm, thông báo đếm ngược thay cho lỗi; hết khoá thì trở lại trạng thái nhập
      setPhase(lock ? 'input' : 'error');
    }, 460);
  };

  // Tự kiểm tra khi nhập đủ số chữ số
  useEffect(() => {
    if (phase === 'input' && value.length === PIN.length) verify(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, phase]);

  const press = (digit: string) => {
    if (inputDisabled) return;
    if (phase === 'error') setPhase('input');
    setValue((v) => (v.length < PIN.length ? v + digit : v));
  };
  const backspace = () => {
    if (inputDisabled) return;
    if (phase === 'error') setPhase('input');
    setValue((v) => v.slice(0, -1));
  };
  const submit = () => {
    if (inputDisabled || !value) return;
    verify(value);
  };

  // Bàn phím vật lý: số, Backspace/Delete, Enter, Esc
  const handlers = useRef({ press, backspace, submit, clear: () => !inputDisabled && setValue('') });
  handlers.current = { press, backspace, submit, clear: () => !inputDisabled && setValue('') };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const h = handlers.current;
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        h.press(e.key);
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        h.backspace();
      } else if (e.key === 'Enter') {
        // Enter trên liên kết / nút chọn ngôn ngữ vẫn giữ hành vi mặc định (điều hướng / chọn)
        const active = document.activeElement;
        if (active instanceof HTMLAnchorElement || active?.getAttribute('role') === 'radio') return;
        e.preventDefault();
        h.submit();
      } else if (e.key === 'Escape') {
        h.clear();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Đã mở khoá (VD mở lại trang đăng nhập) → vào thẳng trang quản trị
  if (unlocked && phase !== 'success') return <Navigate to={dest} replace />;

  const showError = phase === 'checking' || phase === 'error';
  const secondsLeft = Math.ceil((lockedUntil - now) / 1000);
  const attemptsLeft = MAX_ATTEMPTS - attempts;
  const message = locked
    ? t('adminLogin.pin.locked', { count: secondsLeft })
    : phase === 'success'
      ? t('adminLogin.pin.success')
      : showError
        ? `${t('adminLogin.pin.wrong')}${attempts >= 2 && attemptsLeft > 0 ? t('adminLogin.pin.attemptsLeft', { count: attemptsLeft }) : ''}`
        : '';

  return (
    <div className="relative isolate min-h-dvh overflow-hidden bg-espresso-900 text-cream">
      <style>{SHAKE_CSS}</style>
      {/* Ảnh quầy bánh mờ phía sau + lớp phủ espresso để chữ đủ tương phản */}
      <div aria-hidden className="absolute inset-0 -z-10 scale-105 bg-cover bg-center opacity-35 blur-[2px]" style={{ backgroundImage: `url(${counterPhoto})` }} />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-espresso-900/75 via-espresso-900/90 to-espresso-900" />
      <div aria-hidden className="absolute -top-28 left-1/2 -z-10 h-80 w-80 -translate-x-1/2 rounded-full bg-gold/20 blur-3xl" />

      <div className="safe-top mx-auto flex min-h-dvh w-full max-w-sm flex-col px-6">
        <div className="flex h-14 shrink-0 items-center justify-between gap-3">
          <Link
            to="/"
            className="-ml-3 inline-flex h-11 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-cream/80 transition hover:bg-white/10 hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            <ArrowLeft aria-hidden className="h-4 w-4" />
            {t('adminLogin.backToOrdering')}
          </Link>
          <LanguageSwitch tone="dark" className="shrink-0" disabled={locked} />
        </div>

        <main className="flex flex-1 flex-col items-center justify-center py-4">
          <Logo className="h-9 text-cream [@media(min-height:720px)]:h-11" />
          <p className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-white/[0.07] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-gold ring-1 ring-gold/30">
            <LockKeyhole aria-hidden className="h-3.5 w-3.5" />
            {t('adminLogin.staffArea')}
          </p>
          <h1 className="mt-4 font-display text-2xl font-bold tracking-tight">{t('adminLogin.pin.title')}</h1>
          <p className="mt-1 text-sm text-cream/70">{t('adminLogin.pin.subtitle')}</p>

          {/* Chấm PIN */}
          <div
            key={shakeKey}
            aria-hidden
            className={cn('mt-7 flex gap-4', phase === 'checking' && 'motion-safe:animate-[c9-shake_0.46s_ease-in-out]')}
          >
            {Array.from({ length: PIN.length }, (_, i) => {
              const filled = i < value.length;
              return (
                <span
                  key={i}
                  className={cn(
                    'h-3.5 w-3.5 rounded-full ring-2 ring-inset transition duration-150',
                    phase === 'success'
                      ? 'scale-110 bg-leaf-light ring-leaf-light'
                      : phase === 'checking'
                        ? 'bg-rattan-light ring-rattan-light'
                        : filled
                          ? 'scale-110 bg-gold ring-gold'
                          : 'ring-cream/40',
                  )}
                />
              );
            })}
          </div>
          <p className="sr-only" aria-live="polite">
            {t('adminLogin.pin.progress', { count: value.length, total: PIN.length })}
          </p>
          <p
            aria-live="assertive"
            className={cn('mt-4 min-h-5 px-2 text-center text-sm font-medium', phase === 'success' ? 'text-leaf-soft' : 'text-rattan-soft')}
          >
            {message}
          </p>

          {/* Bàn phím số 3×4 */}
          <div role="group" aria-label={t('adminLogin.pin.keypad')} className="mt-5 grid grid-cols-3 gap-x-6 gap-y-3.5 [@media(min-height:720px)]:gap-y-4">
            {KEYS.map((k, i) => {
              if (k === '') return <span key={`empty-${i}`} aria-hidden />;
              const isBack = k === 'back';
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => (isBack ? backspace() : press(k))}
                  disabled={inputDisabled || (isBack && !value)}
                  aria-label={isBack ? t('adminLogin.pin.backspace') : undefined}
                  className={cn(
                    'flex h-16 w-16 select-none items-center justify-center rounded-full transition duration-100 active:scale-95',
                    '[@media(min-height:720px)]:h-[72px] [@media(min-height:720px)]:w-[72px]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-35',
                    isBack
                      ? 'text-cream/80 hover:bg-white/10 active:bg-white/15'
                      : 'bg-white/[0.07] font-display text-[26px] font-semibold text-cream ring-1 ring-inset ring-white/10 hover:bg-white/[0.12] active:bg-gold active:text-espresso',
                  )}
                >
                  {isBack ? <Delete aria-hidden className="h-6 w-6" /> : k}
                </button>
              );
            })}
          </div>
        </main>

        <footer className="safe-bottom shrink-0 pt-2 text-center text-xs text-cream/55">
          {SHOW_DEFAULT_HINT ? (
            <>
              {t('adminLogin.pin.defaultHint')} <span className="font-display font-semibold tracking-[0.2em] text-cream/75">{PIN}</span>
            </>
          ) : (
            t('adminLogin.pin.forgot')
          )}
        </footer>
      </div>
    </div>
  );
}
