import { useCallback, useState } from 'react';
import { Bike, ChevronDown, Clock, MoonStar, Store, Sun, Sunrise, Sunset, type LucideIcon } from 'lucide-react';
import heroSm from '@/assets/photos/espresso-bar-sm.webp';
import heroLg from '@/assets/photos/espresso-bar.webp';
import { APP_CONFIG } from '@/config/app';
import { Logo } from '@/components/ui';
import { useNow } from '@/hooks/useNow';
import { cn } from '@/lib/cn';
import { formatDayMonth } from '@/lib/format';
import { useSession } from '@/store/session';
import { FulfillmentSheet } from './FulfillmentSheet';

const WEEKDAYS = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

function greetingFor(hour: number): { text: string; sub: string; icon: LucideIcon } {
  if (hour >= 4 && hour < 11) return { text: 'Chào buổi sáng', sub: 'Bắt đầu ngày mới với một ly cà phê nhé?', icon: Sunrise };
  if (hour >= 11 && hour < 13) return { text: 'Chào buổi trưa', sub: 'Nghỉ trưa với một ly mát lạnh nhé?', icon: Sun };
  if (hour >= 13 && hour < 18) return { text: 'Chào buổi chiều', sub: 'Nắng chiều đẹp, mình thưởng thức gì đây?', icon: Sunset };
  return { text: 'Chào buổi tối', sub: 'Hôm nay bạn muốn thưởng thức gì?', icon: MoonStar };
}

/** Tên gọi thân mật: người Việt gọi bằng từ cuối của họ tên ("Nguyễn Văn An" → "An") */
function callName(fullName: string | undefined): string {
  const parts = fullName?.trim().split(/\s+/).filter(Boolean) ?? [];
  return parts[parts.length - 1] ?? '';
}

/**
 * Hero trang Thực đơn — "Golden hour ở Cloud 9": ảnh quầy espresso thật + lớp phủ espresso,
 * logo màu kem, lời chào theo giờ và chip hình thức nhận món (chạm để đổi).
 */
export function MenuHero() {
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
  const hours = APP_CONFIG.shop.openingHours.split(' · ')[0];

  const isDelivery = fulfillment === 'delivery';
  const address = deliveryAddress.trim();
  const FulfillIcon = isDelivery ? Bike : Store;
  const fulfillText = isDelivery ? (address ? `Giao đến: ${address}` : 'Giao tận nơi · Thêm địa chỉ') : APP_CONFIG.fulfillment.pickup.label;

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
          <Logo className="h-[28px] text-cream" />
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/25 px-3 py-1.5 text-xs font-medium text-cream/90 ring-1 ring-white/15 backdrop-blur-md">
            <Clock className="h-3.5 w-3.5 text-gold" aria-hidden />
            <span className="sr-only">Giờ mở cửa: </span>
            {hours}
          </span>
        </div>

        <div className="px-5 pb-14 pt-9 [text-shadow:0_1px_14px_rgba(28,22,14,0.45)]">
          <p className="flex items-center gap-1.5 text-[13px] font-semibold text-gold-light">
            <GreetIcon className="h-4 w-4" aria-hidden />
            {WEEKDAYS[date.getDay()]}, {formatDayMonth(now)}
          </p>
          <h1 className="text-balance mt-1.5 font-display text-[27px] font-extrabold leading-[1.15] tracking-tight">
            {greeting.text}
            {name && (
              <>
                , <span className="text-gold-light">{name}</span>
              </>
            )}
          </h1>
          <p className="mt-1.5 text-[15px] text-cream/80">{greeting.sub}</p>

          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            aria-haspopup="dialog"
            aria-label={`Hình thức nhận món: ${fulfillText}. Chạm để thay đổi`}
            className={cn(
              'mt-5 inline-flex min-h-[44px] max-w-full items-center gap-2.5 rounded-full bg-white/10 py-1.5 pl-1.5 pr-3.5 text-left',
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
        </div>
      </div>

      <FulfillmentSheet open={sheetOpen} onClose={closeSheet} />
    </header>
  );
}
