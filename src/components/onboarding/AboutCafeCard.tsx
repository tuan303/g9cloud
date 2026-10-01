import { Clock, MapPin, Phone, PhoneCall, type LucideIcon } from 'lucide-react';
import counterUrl from '@/assets/photos/counter-sm.webp';
import { APP_CONFIG } from '@/config/app';
import { Card } from '@/components/ui';
import { pick, useT } from '@/i18n';
import { platform } from '@/platform';
import { formatPhoneDisplay } from './helpers';

function InfoRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <li className="flex min-h-14 items-center gap-3 py-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-bronze-100 text-bronze-700">
        <Icon className="h-[18px] w-[18px]" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-stone">{label}</p>
        <p className="text-sm font-semibold text-espresso">{value}</p>
      </div>
    </li>
  );
}

/** Thẻ “Về Cloud 9”: ảnh quầy thật, giờ mở cửa, vị trí, hotline (nếu đã cấu hình) */
export function AboutCafeCard() {
  const { t } = useT();
  const { shop } = APP_CONFIG;
  const hotline = shop.hotline.trim();
  const openingHours = pick(shop.openingHours, shop.openingHoursEn);
  const location = pick(shop.location, shop.locationEn);
  return (
    <Card className="overflow-hidden">
      <div className="relative h-44 bg-espresso">
        <img
          src={counterUrl}
          alt={t('onboarding.about.photoAlt')}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Ảnh đã có logo thật trên tường → chỉ đặt tên quán làm chú thích, không lặp logo */}
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-espresso-900/85 via-espresso-900/10 via-50% to-transparent" />
        <p className="absolute inset-x-4 bottom-3.5 font-display text-[17px] font-bold text-cream [text-shadow:0_1px_10px_rgba(28,22,14,0.7)]">
          {shop.name} <span className="font-semibold text-gold-light">· {shop.tagline}</span>
        </p>
      </div>

      <p className="px-4 pt-4 text-sm leading-relaxed text-bronze-700">
        {t('onboarding.about.blurb')}
      </p>

      <ul className="mt-1 divide-y divide-bronze-100 px-4 pb-1">
        {openingHours && <InfoRow icon={Clock} label={t('onboarding.about.hours')} value={openingHours} />}
        {location && <InfoRow icon={MapPin} label={t('onboarding.about.location')} value={location} />}
        {hotline && (
          <li>
            <button
              type="button"
              onClick={() => platform.call(hotline)}
              aria-label={t('onboarding.about.callAria', { phone: formatPhoneDisplay(hotline) })}
              className="flex min-h-14 w-full items-center gap-3 rounded-xl py-3 text-left transition active:scale-[.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-bronze-100 text-bronze-700">
                <Phone className="h-[18px] w-[18px]" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs text-stone">{t('onboarding.about.hotline')}</span>
                <span className="block font-display text-sm font-bold tabular-nums text-espresso">{formatPhoneDisplay(hotline)}</span>
              </span>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-leaf text-white shadow-card">
                <PhoneCall className="h-[18px] w-[18px]" aria-hidden />
              </span>
            </button>
          </li>
        )}
      </ul>
    </Card>
  );
}
