import { ChevronRight } from 'lucide-react';
import { useT } from '@/i18n';
import { cn } from '@/lib/cn';
import { formatRelative, formatTime, isSameDay } from '@/lib/format';
import { legacyNotificationMsg, notificationText } from '@/lib/order-status';
import type { AppNotification } from '@/types';
import { NOTIFICATION_VISUAL } from './visuals';

/** Một dòng thông báo: ô icon màu theo loại, tiêu đề, nội dung, thời gian, chấm chưa đọc */
export function NotificationItem({ item, now, onOpen }: { item: AppNotification; now: number; onOpen: (n: AppNotification) => void }) {
  const { t } = useT();
  const v = NOTIFICATION_VISUAL[item.kind] ?? NOTIFICATION_VISUAL.info;
  const Icon = v.icon;
  const unread = !item.read;
  // Thông báo mới lưu khoá dịch → hiện theo ngôn ngữ đang chọn; thông báo cũ thì nhận lại mẫu câu, không được thì giữ chữ đã lưu
  const msg = item.msg ?? legacyNotificationMsg(item);
  const text = msg ? notificationText(msg) : item;
  const when = isSameDay(item.createdAt, now)
    ? formatRelative(item.createdAt, now)
    : `${formatRelative(item.createdAt, now)} · ${formatTime(item.createdAt)}`;

  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className={cn(
        'flex w-full items-start gap-3 rounded-3xl p-3.5 text-left transition active:scale-[.99]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
        unread ? 'bg-white shadow-card ring-1 ring-gold/40' : 'bg-white/55 ring-1 ring-bronze-200/40 hover:bg-white',
      )}
    >
      <span className={cn('relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl', v.className, !unread && 'opacity-85')}>
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className={cn('font-display text-[15px] leading-snug text-espresso', unread ? 'font-bold' : 'font-semibold')}>
            {unread && <span className="sr-only">{t('notifications.unreadSr')} </span>}
            {text.title}
          </span>
          {unread && <span aria-hidden className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-gold ring-4 ring-gold-soft" />}
        </span>
        <span className={cn('mt-0.5 block text-[13px] leading-snug', unread ? 'text-espresso/80' : 'text-stone')}>{text.body}</span>
        <span className="mt-1.5 flex items-center justify-between gap-2">
          <span className="text-[11px] font-medium tabular-nums text-stone">{when}</span>
          {item.orderId && (
            <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-bronze-600">
              {t('notifications.viewOrder')}
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            </span>
          )}
        </span>
      </span>
    </button>
  );
}
