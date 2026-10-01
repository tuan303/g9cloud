import { useEffect, useRef, type KeyboardEvent } from 'react';
import { Languages } from 'lucide-react';
import { cn } from '@/lib/cn';
import { LOCALES, useLocale, type Locale } from '@/i18n';

/**
 * Đổi ngôn ngữ làm cả trang được dựng lại (Root key={locale}) → nút đang có tiêu điểm bị huỷ.
 * Ghi nhớ ngôn ngữ vừa chọn để nút tương ứng của bản dựng mới lấy lại tiêu điểm
 * (bàn phím / trình đọc màn hình không bị đẩy về đầu trang).
 */
let refocus: Locale | null = null;

/**
 * Chọn ngôn ngữ Tiếng Việt / English. Nhãn luôn song ngữ để người không đọc được ngôn ngữ hiện tại
 * vẫn tìm ra. tone="dark" dùng trên nền ảnh / nền espresso.
 */
export function LanguageSwitch({
  tone = 'light',
  className,
  disabled,
}: {
  tone?: 'light' | 'dark';
  className?: string;
  disabled?: boolean;
}) {
  const locale = useLocale((s) => s.locale);
  const setLocale = useLocale((s) => s.setLocale);
  const groupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!refocus) return;
    const el = groupRef.current?.querySelector<HTMLButtonElement>(`[lang="${refocus}"]`);
    // Trang quản trị có 2 công tắc (đầu trang mobile + thanh bên desktop) → chỉ bản đang hiện lấy tiêu điểm
    if (el && el.offsetParent !== null) {
      el.focus({ preventScroll: true });
      refocus = null;
    }
  }, []);

  const choose = (next: Locale, keepFocus: boolean) => {
    if (next === locale) return;
    if (keepFocus) refocus = next;
    setLocale(next);
  };

  // Nhóm radio chuẩn: mũi tên trái/phải (lên/xuống) chuyển lựa chọn
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!step || disabled) return;
    e.preventDefault();
    const i = LOCALES.findIndex((l) => l.value === locale);
    choose(LOCALES[(i + step + LOCALES.length) % LOCALES.length].value, true);
  };

  return (
    <div
      ref={groupRef}
      role="radiogroup"
      aria-label="Ngôn ngữ / Language"
      aria-disabled={disabled || undefined}
      onKeyDown={onKeyDown}
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full p-1 text-xs font-bold',
        tone === 'dark' ? 'bg-black/30 text-cream ring-1 ring-white/15 backdrop-blur-md' : 'bg-bronze-100 text-bronze-700',
        disabled && 'opacity-50',
        className,
      )}
    >
      <Languages aria-hidden className={cn('mx-1.5 h-3.5 w-3.5', tone === 'dark' ? 'text-gold' : 'text-bronze-500')} />
      {LOCALES.map((l) => {
        const active = l.value === locale;
        return (
          <button
            key={l.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={l.label}
            title={l.label}
            lang={l.value}
            tabIndex={active ? 0 : -1}
            disabled={disabled}
            onClick={(e) => choose(l.value, document.activeElement === e.currentTarget)}
            className={cn(
              'min-h-8 min-w-9 rounded-full px-2.5 tracking-wide transition disabled:cursor-not-allowed',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
              active
                ? tone === 'dark'
                  ? 'bg-cream text-espresso'
                  : 'bg-espresso text-cream'
                : tone === 'dark'
                  ? 'text-cream/80 hover:text-cream'
                  : 'hover:text-espresso',
            )}
          >
            {l.short}
          </button>
        );
      })}
    </div>
  );
}
