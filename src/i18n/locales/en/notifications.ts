import type { MessageShape } from '../../types';
import type { notifications as V } from '../vi/notifications';

export const notifications: MessageShape<typeof V> = {
  title: 'Notifications',
  unread: { one: '1 unread notification', other: '{count} unread notifications' },
  allRead: 'You’re all caught up',
  markAllRead: 'Mark all as read',
  today: 'Today',
  earlier: 'Earlier',
  emptyTitle: 'No notifications yet',
  emptyBody: 'Order updates will appear here — from the moment we receive your order until it’s ready.',
  unreadSr: 'Unread:',
  viewOrder: 'View order',
  permission: {
    aria: 'Turn on notifications',
    title: 'Turn on device notifications',
    body: 'Get notified the moment your order is ready, even when you’re in another app.',
    enable: 'Turn on notifications',
    dismissAria: 'Hide the notification prompt',
    dismissTitle: 'Hide',
    granted: 'Notifications on — Cloud 9 will let you know as soon as your order is ready',
    denied: 'Notifications could not be turned on. You can enable them later in your browser settings.',
  },
};
