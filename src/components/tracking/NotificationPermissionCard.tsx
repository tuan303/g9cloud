import { useState } from 'react';
import { BellRing, X } from 'lucide-react';
import { Button } from '@/components/ui';
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
    if (granted) toast('Đã bật thông báo — Cloud 9 sẽ báo ngay khi món sẵn sàng', 'success');
    else {
      toast('Chưa bật được thông báo. Bạn có thể bật lại trong cài đặt trình duyệt.', 'info');
      dismiss();
    }
  };

  return (
    <section
      aria-label="Bật thông báo"
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
          <h2 className="font-display text-[15px] font-bold leading-snug">Bật thông báo trên máy</h2>
          <p className="mt-0.5 text-[13px] leading-snug text-cream/75">Nhận tin ngay khi món sẵn sàng, kể cả khi bạn đang mở ứng dụng khác.</p>
          <Button variant="gold" className="mt-3" loading={busy} onClick={enable}>
            Bật thông báo
          </Button>
        </div>
      </div>
      <button
        type="button"
        aria-label="Ẩn gợi ý bật thông báo"
        title="Ẩn gợi ý"
        onClick={dismiss}
        className="absolute right-1 top-1 inline-flex h-11 w-11 items-center justify-center rounded-full text-cream/70 transition hover:bg-white/10 hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold active:scale-95"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </section>
  );
}
