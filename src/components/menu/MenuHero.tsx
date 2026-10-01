import { useCallback, useState } from 'react';
import { Bike, ChevronDown, Clock, MoonStar, Store, Sun, Sunrise, Sunset, type LucideIcon } from 'lucide-react';
import heroSm from '@/assets/photos/espresso-bar-sm.webp';
import heroLg from '@/assets/photos/espresso-bar.webp';
import { APP_CONFIG } from '@/config/app';
import { LanguageSwitch, Logo } from '@/components/ui';
import { LoyaltyCard } from '@/components/loyalty/LoyaltyCard';
import { GUEST_NAME } from '@/components/onboarding/helpers';
import { useNow } from '@/hooks/useNow';
import { pick, useT } from '@/i18n';
import { cn } from '@/lib/cn';
import { formatDayMonth, formatWeekdayLong } from '@/lib/format';
import { useSession } from '@/store/session';
import { FulfillmentSheet } from './FulfillmentSheet';

type GreetingId = 'morning' | 'noon' | 'afternoon' | 'evening';

/** Lời chào theo giờ (chữ lấy từ khoá menu.hero.greeting.<id>) */
function greetingFor(hour: number): { id: GreetingId; icon: LucideIcon } {
  if (hour >= 4 && hour < 11) return { id: 'morning', icon: Sunrise };
  if (hour >= 11 && hour < 13) return { id: 'noon', icon: Sun };
  if (hour >= 13 && hour < 18) return { id: 'afternoon', icon: Sunset };
  return { id: 'evening', icon: MoonStar };
}

/** Tên gọi thân mật: người Việt gọi bằng từ cuối của họ tên ("Nguyễn Văn An" → "An"); khách chưa có tên → không gọi tên */
function callName(fullName: string | undefined): string {
  const n = fullName?.trim() ?? '';
  const parts = n === GUEST_NAME ? [] : n.split(/\s+/).filter(Boolean);
  return parts[parts.length - 1] ?? '';
}

/**
 * Hero trang Thực đơn — "Golden hour ở Cloud 9": ảnh quầy espresso thật + lớp phủ espresso,
 * logo màu kem, lời chào theo giờ và chip hình thức nhận món (chạm để đổi).
 */
export function MenuHero() {
  const { t, locale } = useT();
  const now = useNow(60_000);
  const userName = useSession((s) => s.user?.name);
  const fulfillment = useSession((s) => s.fulfillment);
  const deliveryAddress = useSession((s) => s.deliveryAddress);
  const [sheetOpen, setSheetOpen] = useState(false);
  const closeSheet = useCallback(() => setSheetOpen(false), []);

  const date = new Date(now);
  const greeting = greetingFor(date.getHours());
  const GreetIcon = greeting.icon;
  const name = callName(userName);
  const hours = pick(APP_CONFIG.shop.openingHours, APP_CONFIG.shop.openingHoursEn, locale).split(' · ')[0];

  const isDelivery = fulfillment === 'delivery';
  const address = deliveryAddress.trim();
  const FulfillIcon = isDelivery ? Bike : Store;
  const fulfillText = isDelivery
    ? address
      ? t('menu.hero.deliverTo', { address })
      : t('menu.hero.deliveryNoAddress')
    : t('fulfillment.pickup');

  return (
    <header className="relative isolate overflow-hidden bg-espresso-900 text-cream">
      <img
        src={heroSm}
        srcSet={`${heroSm} 640w, ${heroLg} 1200w`}
        sizes="(min-width: 448px) 448px, 100vw"
        alt=""
        aria-hidden
        decoding="async"
        draggable={false}
        className="absolute inset-0 -z-20 h-full w-full object-cover object-[58%_38%]"
      />
      {/* Lớp phủ espresso để chữ kem đủ tương phản + vệt nắng vàng góc phải */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-espresso-900/80 via-espresso-900/45 to-espresso-900/95" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-espresso-900/70 via-espresso-900/10 to-transparent" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(90%_60%_at_88%_12%,rgba(217,174,99,0.28),transparent_70%)]" />

      <div className="safe-top">
        <div className="flex items-center justify-between gap-3 px-5 pt-4">
          <Logo className="h-[28px] shrink-0 text-cream" />
          {/* Giờ mở cửa + chọn ngôn ngữ (màn hình hẹp: ẩn icon để vừa 1 hàng) */}
          <div className="flex min-w-0 items-center gap-2">
            <span className="inline-flex min-h-10 min-w-0 items-center gap-1.5 rounded-full bg-black/25 px-3 py-1.5 text-xs font-medium text-cream/90 ring-1 ring-white/15 backdrop-blur-md">
              <Clock className="h-3.5 w-3.5 shrink-0 text-gold max-[389px]:hidden" aria-hidden />
              <span className="sr-only">{t('menu.hero.hoursSr')} </span>
              <span className="truncate">{hours}</span>
            </span>
            <LanguageSwitch tone="dark" className="shrink-0" />
          </div>
        </div>

        <div className="px-5 pb-14 pt-9 [text-shadow:0_1px_14px_rgba(28,22,14,0.45)]">
          <p className="flex items-center gap-1.5 text-[13px] font-semibold text-gold-light">
            <GreetIcon className="h-4 w-4" aria-hidden />
            {formatWeekdayLong(now)}, {formatDayMonth(now)}
          </p>
          <h1 className="text-balance mt-1.5 font-display text-[27px] font-extrabold leading-[1.15] tracking-tight">
            {t(`menu.hero.greeting.${greeting.id}.title`)}
            {name && (
              <>
                , <span className="text-gold-light">{name}</span>
              </>
            )}
          </h1>
          <p className="mt-1.5 text-[15px] text-cream/80">{t(`menu.hero.greeting.${greeting.id}.sub`)}</p>

          {/* Chip hình thức nhận món + thẻ tích điểm gọn (ẩn với khách vãng lai) — không đủ chỗ thì xuống dòng */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              aria-haspopup="dialog"
              aria-label={t('menu.hero.fulfillmentAria', { value: fulfillText })}
              className={cn(
                'inline-flex min-h-[44px] min-w-0 max-w-full items-center gap-2.5 rounded-full bg-white/10 py-1.5 pl-1.5 pr-3.5 text-left',
                'ring-1 ring-white/20 backdrop-blur-md transition hover:bg-white/15 active:scale-[.98]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold [text-shadow:none]',
              )}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold text-espresso" aria-hidden>
                <FulfillIcon className="h-4 w-4" />
              </span>
              <span className="min-w-0 truncate text-sm font-semibold">{fulfillText}</span>
              <ChevronDown className="h-4 w-4 shrink-0 text-cream/70" aria-hidden />
            </button>
            <LoyaltyCard variant="compact" className="shrink-0 [text-shadow:none]" />
          </div>
        </div>
      </div>

      <FulfillmentSheet open={sheetOpen} onClose={closeSheet} />
    </header>
  );
}
