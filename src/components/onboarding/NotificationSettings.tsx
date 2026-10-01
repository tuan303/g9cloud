import { useState } from 'react';
import { Bell, BellOff, BellRing, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button, Card } from '@/components/ui';
import { useT } from '@/i18n';
import { useAction } from '@/hooks/useAction';
import { platform } from '@/platform';
import { toast } from '@/store/ui';

type NotifyStatus = 'granted' | 'denied' | 'default' | 'dismissed' | 'unsupported' | 'unknown';

/**
 * Trạng thái quyền thông báo hiện tại.
 * TODO: chuyển thành `platform.getNotificationPermission()` — PlatformAdapter hiện chưa có hàm đọc trạng thái.
 * Trên Zalo trả về 'unknown' (chỉ biết sau khi xin quyền).
 */
function readNotifyStatus(): NotifyStatus {
  if (platform.name !== 'web') return 'unknown';
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return window.Notification.permission;
}

// Tiêu đề / mô tả lấy từ onboarding.notifications.<trạng thái>.title|description
const META: Record<NotifyStatus, { icon: LucideIcon; tile: string; action?: 'enable' | 'retry' }> = {
  granted: { icon: BellRing, tile: 'bg-leaf-soft text-leaf-dark' },
  default: { icon: Bell, tile: 'bg-gold-soft text-bronze-700', action: 'enable' },
  unknown: { icon: Bell, tile: 'bg-gold-soft text-bronze-700', action: 'enable' },
  dismissed: { icon: Bell, tile: 'bg-gold-soft text-bronze-700', action: 'enable' },
  denied: { icon: BellOff, tile: 'bg-rattan-soft text-rattan-dark', action: 'retry' },
  unsupported: { icon: BellOff, tile: 'bg-bronze-100 text-stone' },
};

/** Thẻ bật thông báo hệ thống qua platform.requestNotificationPermission() */
export function NotificationSettings() {
  const { t } = useT();
  const [status, setStatus] = useState<NotifyStatus>(readNotifyStatus);
  const [request, loading] = useAction(() => platform.requestNotificationPermission());

  const enable = async () => {
    const granted = await request();
    if (granted === undefined) return; // lỗi đã hiện toast
    if (granted) {
      setStatus('granted');
      platform.vibrate(30);
      toast(t('onboarding.notifications.enabledToast'), 'success');
      return;
    }
    const now = readNotifyStatus();
    setStatus(now === 'default' ? 'dismissed' : now === 'unsupported' ? 'unsupported' : 'denied');
  };

  const m = META[status];
  const Icon = m.icon;
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3.5">
        <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl', m.tile)}>
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1" aria-live="polite">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-espresso">{t(`onboarding.notifications.${status}.title`)}</p>
            {status === 'granted' && (
              <span className="shrink-0 rounded-full bg-leaf px-2.5 py-0.5 text-[11px] font-bold text-white">
                {t('onboarding.notifications.on')}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[13px] leading-snug text-stone">{t(`onboarding.notifications.${status}.description`)}</p>
        </div>
      </div>
      {m.action && (
        <Button
          variant={m.action === 'enable' ? 'gold' : 'outline'}
          block
          className="mt-3.5"
          loading={loading}
          leftIcon={<BellRing className="h-[18px] w-[18px]" aria-hidden />}
          onClick={enable}
        >
          {m.action === 'enable' ? t('onboarding.notifications.enable') : t('common.retry')}
        </Button>
      )}
    </Card>
  );
}
