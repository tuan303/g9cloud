import { Bike, Store } from 'lucide-react';
import { APP_CONFIG } from '@/config/app';
import { cn } from '@/lib/cn';
import { Input } from '@/components/ui';
import type { FulfillmentType } from '@/types';

/**
 * Chọn hình thức nhận món: Nhận tại quầy / Giao tận nơi (+ ô địa chỉ khi chọn giao).
 * Dùng ở màn hình chào (onboarding) và giỏ hàng.
 */
export function FulfillmentPicker({
  value,
  onChange,
  address,
  onAddressChange,
  addressError,
  tone = 'light',
}: {
  value: FulfillmentType;
  onChange: (v: FulfillmentType) => void;
  address: string;
  onAddressChange: (v: string) => void;
  addressError?: string;
  tone?: 'light' | 'dark';
}) {
  const { pickup, delivery } = APP_CONFIG.fulfillment;
  const options = [
    pickup.enabled && { value: 'pickup' as const, label: pickup.label, description: pickup.description, icon: Store },
    delivery.enabled && { value: 'delivery' as const, label: delivery.label, description: delivery.description, icon: Bike },
  ].filter(Boolean) as { value: FulfillmentType; label: string; description: string; icon: typeof Store }[];

  return (
    <div className="space-y-3">
      <div role="radiogroup" aria-label="Hình thức nhận món" className="grid grid-cols-2 gap-3">
        {options.map((o) => {
          const active = value === o.value;
          const Icon = o.icon;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(o.value)}
              className={cn(
                'relative flex flex-col items-start gap-2 rounded-3xl p-4 text-left ring-1 ring-inset transition active:scale-[.98]',
                tone === 'light'
                  ? active
                    ? 'bg-espresso text-cream ring-espresso'
                    : 'bg-white text-espresso ring-bronze-200 hover:ring-bronze-300'
                  : active
                    ? 'bg-cream text-espresso ring-gold'
                    : 'bg-white/5 text-cream ring-white/15 hover:bg-white/10',
              )}
            >
              <span
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-2xl',
                  active ? 'bg-gold text-espresso' : tone === 'light' ? 'bg-bronze-100 text-bronze-700' : 'bg-white/10 text-gold',
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="font-display text-[15px] font-bold leading-tight">{o.label}</span>
              <span className={cn('text-xs leading-snug', active ? (tone === 'light' ? 'text-cream/75' : 'text-stone') : tone === 'light' ? 'text-stone' : 'text-cream/60')}>
                {o.description}
              </span>
              <span
                aria-hidden
                className={cn(
                  'absolute right-3.5 top-3.5 h-5 w-5 rounded-full ring-2 ring-inset',
                  active ? 'bg-gold ring-gold' : tone === 'light' ? 'ring-bronze-300' : 'ring-white/30',
                )}
              >
                {active && <span className="absolute inset-[5px] rounded-full bg-espresso" />}
              </span>
            </button>
          );
        })}
      </div>
      {value === 'delivery' && (
        <div className="animate-fade-in">
          <Input
            label="Giao đến"
            required
            placeholder={delivery.addressPlaceholder}
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
            error={addressError}
            hint={delivery.fee ? `Phí giao: ${delivery.fee.toLocaleString('vi-VN')}đ` : 'Miễn phí giao trong trường'}
            autoComplete="off"
          />
        </div>
      )}
    </div>
  );
}
