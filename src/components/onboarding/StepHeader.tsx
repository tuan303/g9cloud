import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/cn';
import { IconButton } from '@/components/ui';
import { useT } from '@/i18n';

/** Chỉ báo tiến trình “Bước 1/2” + nút quay lại (nếu có) */
export function StepHeader({
  step,
  labels,
  onBack,
}: {
  step: number;
  labels: string[];
  onBack?: () => void;
}) {
  const { t } = useT();
  const total = labels.length;
  // Chỉ có 1 bước → không cần thanh tiến trình, chỉ giữ nút quay lại
  if (total <= 1) {
    return onBack ? (
      <IconButton label={t('onboarding.steps.back')} onClick={onBack} className="-ml-1.5 bg-bronze-100/80 hover:bg-bronze-200/70">
        <ArrowLeft className="h-5 w-5" />
      </IconButton>
    ) : null;
  }
  return (
    <div className="flex items-center gap-3">
      {onBack && (
        <IconButton label={t('onboarding.steps.back')} onClick={onBack} className="-ml-1.5 bg-bronze-100/80 hover:bg-bronze-200/70">
          <ArrowLeft className="h-5 w-5" />
        </IconButton>
      )}
      <div
        className="min-w-0 flex-1"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={step}
        aria-valuetext={t('onboarding.steps.progressAria', { step, total, label: labels[step - 1] })}
      >
        <div className="flex items-baseline justify-between gap-2 text-xs">
          <span className="font-display font-bold uppercase tracking-[0.16em] text-bronze-600">
            {t('onboarding.steps.progress', { step, total })}
          </span>
          <span className="truncate font-medium text-stone">{labels[step - 1]}</span>
        </div>
        <div className="mt-2 flex gap-1.5" aria-hidden>
          {labels.map((l, i) => (
            <span
              key={l}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-colors duration-500',
                i < step ? 'bg-gold' : 'bg-bronze-200/80',
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
