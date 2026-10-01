import { useState } from 'react';
import { BellRing, X } from 'lucide-react';
import { Button } from '@/components/ui';
import { useT } from '@/i18n';
import { cn } from '@/lib/cn';
import { platform } from '@/platform';
import { toast } from '@/store/ui';

const DISMISS_KEY = 'c9.notify-prompt.dismissed';

type PermissionState = NotificationPermission | 'unsupported';

function currentPermission(): PermissionState {
  return typeof Notification === 'undefined' ? 'unsupported' : Notification.permission;
}

function readDismissed(): boolean {
  try {
    return platform.storage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Gợi ý bật thông báo hệ thống. Ẩn khi trình duyệt không hỗ trợ, đã cấp quyền,
 * đã bị từ chối (không thể hỏi lại) hoặc khách đã tắt gợi ý.
 */
export function NotificationPermissionCard({ className }: { className?: string }) {
  const { t } = useT();
  const [permission, setPermission] = useState<PermissionState>(currentPermission);
  const [dismissed, setDismissed] = useState(readDismissed);
  const [busy, setBusy] = useState(false);

  if (permission !== 'default' || dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      platform.storage.setItem(DISMISS_KEY, '1');
    } catch {
      /* bộ nhớ bị chặn — chỉ ẩn trong phiên này */
    }
  };

  const enable = async () => {
    setBusy(true);
    const granted = await platform.requestNotificationPermission();
    setBusy(false);
    setPermission(currentPermission());
    if (granted) toast(t('notifications.permission.granted'), 'success');
    else {
      toast(t('notifications.permission.denied'), 'info');
      dismiss();
    }
  };

  return (
    <section
      aria-label={t('notifications.permission.aria')}
      className={cn('relative isolate overflow-hidden rounded-3xl bg-espresso p-4 pr-12 text-cream shadow-lift', className)}
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{ backgroundImage: 'radial-gradient(70% 90% at 100% 0%, rgba(217,174,99,0.32), transparent 70%)' }}
      />
      <div className="flex gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gold text-espresso shadow-glow">
          <BellRing className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-[15px] font-bold leading-snug">{t('notifications.permission.title')}</h2>
          <p className="mt-0.5 text-[13px] leading-snug text-cream/75">{t('notifications.permission.body')}</p>
          <Button variant="gold" className="mt-3" loading={busy} onClick={enable}>
            {t('notifications.permission.enable')}
          </Button>
        </div>
      </div>
      <button
        type="button"
        aria-label={t('notifications.permission.dismissAria')}
        title={t('notifications.permission.dismissTitle')}
        onClick={dismiss}
        className="absolute right-1 top-1 inline-flex h-11 w-11 items-center justify-center rounded-full text-cream/70 transition hover:bg-white/10 hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold active:scale-95"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </section>
  );
}
