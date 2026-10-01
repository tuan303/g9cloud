import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { Button, EmptyState } from '@/components/ui';
import { NotificationItem, NotificationPermissionCard, TabPageHeader } from '@/components/tracking';
import { useNow } from '@/hooks/useNow';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useT } from '@/i18n';
import { isSameDay } from '@/lib/format';
import { selectUnreadCount, useNotifications } from '@/store/notifications';
import type { AppNotification } from '@/types';

export default function NotificationsPage() {
  const { t } = useT();
  usePageTitle(t('notifications.title'));
  const navigate = useNavigate();
  const items = useNotifications((s) => s.items);
  const markRead = useNotifications((s) => s.markRead);
  const markAllRead = useNotifications((s) => s.markAllRead);
  const unread = useNotifications(selectUnreadCount);
  const now = useNow(60_000);

  const groups = useMemo(() => {
    const sorted = [...items].sort((a, b) => b.createdAt - a.createdAt);
    return [
      { key: 'today', label: t('notifications.today'), items: sorted.filter((n) => isSameDay(n.createdAt, now)) },
      { key: 'earlier', label: t('notifications.earlier'), items: sorted.filter((n) => !isSameDay(n.createdAt, now)) },
    ].filter((g) => g.items.length);
  }, [items, now, t]);

  const open = (n: AppNotification) => {
    if (!n.read) markRead(n.id);
    if (n.orderId) navigate(`/order/${n.orderId}`);
  };

  return (
    <div className="min-h-full">
      <TabPageHeader
        title={t('notifications.title')}
        subtitle={unread ? t('notifications.unread', { count: unread }) : items.length ? t('notifications.allRead') : undefined}
        right={
          unread > 0 && (
            <Button variant="ghost" leftIcon={<CheckCheck className="h-4 w-4" />} onClick={markAllRead}>
              {t('notifications.markAllRead')}
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
            title={t('notifications.emptyTitle')}
            description={t('notifications.emptyBody')}
          />
        )}
      </div>
    </div>
  );
}
