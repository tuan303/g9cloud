import { useState } from 'react';
import { Bell, BellOff, BellRing, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button, Card } from '@/components/ui';
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

const META: Record<
  NotifyStatus,
  { icon: LucideIcon; tile: string; title: string; description: string; action?: 'enable' | 'retry' }
> = {
  granted: {
    icon: BellRing,
    tile: 'bg-leaf-soft text-leaf-dark',
    title: 'Thông báo đã bật',
    description: 'Cloud 9 sẽ báo ngay khi món sẵn sàng hoặc đang được giao.',
  },
  default: {
    icon: Bell,
    tile: 'bg-gold-soft text-bronze-700',
    title: 'Báo khi món xong',
    description: 'Nhận thông báo cả khi bạn đang mở ứng dụng khác.',
    action: 'enable',
  },
  unknown: {
    icon: Bell,
    tile: 'bg-gold-soft text-bronze-700',
    title: 'Báo khi món xong',
    description: 'Nhận thông báo khi món sẵn sàng hoặc đang được giao.',
    action: 'enable',
  },
  dismissed: {
    icon: Bell,
    tile: 'bg-gold-soft text-bronze-700',
    title: 'Bạn chưa cho phép',
    description: 'Chạm “Bật thông báo” rồi chọn Cho phép khi được hỏi nhé.',
    action: 'enable',
  },
  denied: {
    icon: BellOff,
    tile: 'bg-rattan-soft text-rattan-dark',
    title: 'Thông báo đang bị chặn',
    description: 'Hãy cho phép thông báo cho Cloud 9 trong phần cài đặt, rồi thử lại.',
    action: 'retry',
  },
  unsupported: {
    icon: BellOff,
    tile: 'bg-bronze-100 text-stone',
    title: 'Thiết bị chưa hỗ trợ',
    description: 'Bạn vẫn nhận thông báo trong ứng dụng khi đang mở Cloud 9.',
  },
};

/** Thẻ bật thông báo hệ thống qua platform.requestNotificationPermission() */
export function NotificationSettings() {
  const [status, setStatus] = useState<NotifyStatus>(readNotifyStatus);
  const [request, loading] = useAction(() => platform.requestNotificationPermission());

  const enable = async () => {
    const granted = await request();
    if (granted === undefined) return; // lỗi đã hiện toast
    if (granted) {
      setStatus('granted');
      platform.vibrate(30);
      toast('Đã bật thông báo', 'success');
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
            <p className="font-semibold text-espresso">{m.title}</p>
            {status === 'granted' && (
              <span className="shrink-0 rounded-full bg-leaf px-2.5 py-0.5 text-[11px] font-bold text-white">Đang bật</span>
            )}
          </div>
          <p className="mt-0.5 text-[13px] leading-snug text-stone">{m.description}</p>
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
          {m.action === 'enable' ? 'Bật thông báo' : 'Thử lại'}
        </Button>
      )}
    </Card>
  );
}
