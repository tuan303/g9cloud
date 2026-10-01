import { Banknote, CreditCard, Landmark, QrCode, Smartphone } from 'lucide-react';
import { APP_CONFIG } from '@/config/app';
import { translate, useT, type MessageKey } from '@/i18n';
import { cn } from '@/lib/cn';
import type { PaymentMethod } from '@/types';

interface MethodOption {
  value: PaymentMethod;
  title: string;
  description: string;
  icon: typeof QrCode;
}

/** Các phương thức thanh toán đang bật (VietQR chỉ có khi đã cấu hình tài khoản ngân hàng) */
export function availablePaymentMethods(): MethodOption[] {
  const list: MethodOption[] = [
    {
      value: 'qr_pos',
      title: translate('payment.methods.posTitle'),
      description: translate('payment.methods.posDesc'),
      icon: QrCode,
    },
  ];
  const vq = APP_CONFIG.payment.vietqr;
  if (vq) {
    list.push({
      value: 'vietqr',
      title: translate('payment.methods.vietqrTitle'),
      description: translate('payment.methods.vietqrDesc', { bank: vq.bankName }),
      icon: Landmark,
    });
  }
  return list;
}

const COUNTER_WAYS: { label: MessageKey; icon: typeof Banknote }[] = [
  { label: 'payment.methods.cash', icon: Banknote },
  { label: 'payment.methods.transfer', icon: Smartphone },
  { label: 'payment.methods.card', icon: CreditCard },
];

/** Chọn phương thức thanh toán. Nếu chỉ có một phương thức, hiển thị dạng thẻ thông tin. */
export function PaymentMethodPicker({ value, onChange }: { value: PaymentMethod; onChange: (v: PaymentMethod) => void }) {
  const { t } = useT();
  const methods = availablePaymentMethods();
  const single = methods.length === 1;

  return (
    <div role={single ? undefined : 'radiogroup'} aria-label={t('payment.methods.aria')} className="space-y-2.5">
      {methods.map((m) => {
        const active = single || m.value === value;
        const Icon = m.icon;
        const body = (
          <>
            <span
              className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl',
                active ? 'bg-leaf text-white' : 'bg-bronze-100 text-bronze-700',
              )}
            >
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-[15px] font-bold leading-tight text-espresso">{m.title}</span>
              <span className="mt-1 block text-[13px] leading-snug text-stone">{m.description}</span>
              {m.value === 'qr_pos' && (
                <span className="mt-2.5 flex flex-wrap gap-1.5">
                  {COUNTER_WAYS.map((w) => (
                    <span key={w.label} className="inline-flex items-center gap-1 rounded-full bg-cream px-2 py-1 text-[11px] font-semibold text-bronze-700 ring-1 ring-inset ring-bronze-200">
                      <w.icon className="h-3 w-3" aria-hidden />
                      {t(w.label)}
                    </span>
                  ))}
                </span>
              )}
            </span>
            {!single && (
              <span
                aria-hidden
                className={cn(
                  'relative mt-0.5 h-5 w-5 shrink-0 rounded-full ring-2 ring-inset',
                  active ? 'bg-leaf ring-leaf' : 'ring-bronze-300',
                )}
              >
                {active && <span className="absolute inset-[5px] rounded-full bg-white" />}
              </span>
            )}
          </>
        );

        const cls = cn(
          'flex w-full items-start gap-3 rounded-3xl p-4 text-left ring-1 ring-inset transition',
          active ? 'bg-leaf-soft/60 ring-leaf/40' : 'bg-white ring-bronze-200 hover:ring-bronze-300',
        );

        return single ? (
          <div key={m.value} className={cls}>
            {body}
          </div>
        ) : (
          <button
            key={m.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(m.value)}
            className={cn(cls, 'active:scale-[.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold')}
          >
            {body}
          </button>
        );
      })}
    </div>
  );
}
