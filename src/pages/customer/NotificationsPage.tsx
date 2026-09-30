import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { Button, EmptyState } from '@/components/ui';
import { NotificationItem, NotificationPermissionCard, TabPageHeader } from '@/components/tracking';
import { useNow } from '@/hooks/useNow';
import { usePageTitle } from '@/hooks/usePageTitle';
import { isSameDay } from '@/lib/format';
import { selectUnreadCount, useNotifications } from '@/store/notifications';
import type { AppNotification } from '@/types';

export default function NotificationsPage() {
  usePageTitle('Thông báo');
  const navigate = useNavigate();
  const items = useNotifications((s) => s.items);
  const markRead = useNotifications((s) => s.markRead);
  const markAllRead = useNotifications((s) => s.markAllRead);
  const unread = useNotifications(selectUnreadCount);
  const now = useNow(60_000);

  const groups = useMemo(() => {
    const sorted = [...items].sort((a, b) => b.createdAt - a.createdAt);
    return [
      { key: 'today', label: 'Hôm nay', items: sorted.filter((n) => isSameDay(n.createdAt, now)) },
      { key: 'earlier', label: 'Trước đó', items: sorted.filter((n) => !isSameDay(n.createdAt, now)) },
    ].filter((g) => g.items.length);
  }, [items, now]);

  const open = (n: AppNotification) => {
    if (!n.read) markRead(n.id);
    if (n.orderId) navigate(`/order/${n.orderId}`);
  };

  return (
    <div className="min-h-full">
      <TabPageHeader
        title="Thông báo"
        subtitle={unread ? `${unread} thông báo chưa đọc` : items.length ? 'Bạn đã xem hết thông báo' : undefined}
        right={
          unread > 0 && (
            <Button variant="ghost" leftIcon={<CheckCheck className="h-4 w-4" />} onClick={markAllRead}>
              Đánh dấu đã đọc
            </Button>
          )
        }
      />

      <div className="space-y-5 px-4 pt-4">
        <NotificationPermissionCard />

        {groups.length ? (
          groups.map((g) => (
            <section key={g.key} aria-label={g.label}>
              <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-[0.14em] text-bronze-600">{g.label}</h2>
              <ul className="space-y-2.5">
                {g.items.map((n) => (
                  <li key={n.id}>
                    <NotificationItem item={n} now={now} onOpen={open} />
                  </li>
                ))}
              </ul>
            </section>
          ))
        ) : (
          <EmptyState
            icon={<Bell className="h-9 w-9" />}
            title="Chưa có thông báo"
            description="Trạng thái đơn hàng sẽ hiện ở đây — từ lúc quán nhận đơn đến khi món sẵn sàng."
          />
        )}
      </div>
    </div>
  );
}
