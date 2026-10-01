import { useEffect, useId, useRef, type ComponentType, type KeyboardEvent } from 'react';
import { cn } from '@/lib/cn';
import { LOCALES, useLocale, type Locale } from '@/i18n';

/**
 * Đổi ngôn ngữ làm cả trang được dựng lại (Root key={locale}) → nút đang có tiêu điểm bị huỷ.
 * Ghi nhớ ngôn ngữ vừa chọn để nút tương ứng của bản dựng mới lấy lại tiêu điểm
 * (bàn phím / trình đọc màn hình không bị đẩy về đầu trang).
 */
let refocus: Locale | null = null;

/** Cờ Việt Nam (tròn): nền đỏ, sao vàng năm cánh */
function FlagVN() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden className="h-full w-full">
      <rect width="20" height="20" fill="#DA251D" />
      <polygon
        fill="#FFDD00"
        points="10,4.7 11.26,8.57 15.33,8.57 12.03,10.96 13.29,14.83 10,12.44 6.71,14.83 7.97,10.96 4.67,8.57 8.74,8.57"
      />
    </svg>
  );
}

/** Cờ Anh (tròn, cắt phần giữa của Union Jack). id clipPath riêng cho mỗi lần vẽ (trang có thể có 2 công tắc) */
function FlagGB() {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="15 0 30 30" aria-hidden className="h-full w-full">
      <clipPath id={`${id}t`}>
        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
      </clipPath>
      <rect width="60" height="30" fill="#012169" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
      <path d="M0,0 L60,30 M60,0 L0,30" clipPath={`url(#${id}t)`} stroke="#C8102E" strokeWidth="4" />
      <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
      <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
    </svg>
  );
}

const FLAGS: Record<Locale, ComponentType> = { vi: FlagVN, en: FlagGB };

/**
 * Chọn ngôn ngữ bằng cờ: 🇻🇳 Tiếng Việt / 🇬🇧 English. Tên ngôn ngữ nằm trong aria-label + title
 * (luôn song ngữ để người không đọc được ngôn ngữ hiện tại vẫn tìm ra). tone="dark" dùng trên nền ảnh / espresso.
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
        'inline-flex items-center gap-0.5 rounded-full p-1',
        tone === 'dark' ? 'bg-black/30 ring-1 ring-white/15 backdrop-blur-md' : 'bg-bronze-100',
        disabled && 'opacity-50',
        className,
      )}
    >
      {LOCALES.map((l) => {
        const active = l.value === locale;
        const Flag = FLAGS[l.value];
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
              'group/flag flex min-h-9 min-w-9 items-center justify-center rounded-full transition disabled:cursor-not-allowed',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
              active && (tone === 'dark' ? 'bg-white/20' : 'bg-white shadow-sm'),
            )}
          >
            <span
              className={cn(
                'block h-6 w-6 overflow-hidden rounded-full transition',
                active
                  ? cn('ring-2', tone === 'dark' ? 'ring-cream' : 'ring-espresso')
                  : 'opacity-70 ring-1 ring-black/10 group-hover/flag:opacity-100',
              )}
            >
              <Flag />
            </span>
          </button>
        );
      })}
    </div>
  );
}
