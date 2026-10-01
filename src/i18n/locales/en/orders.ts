import type { MessageShape } from '../../types';
import type { orders as V } from '../vi/orders';

export const orders: MessageShape<typeof V> = {
  subtitleActive: { one: 'You have 1 order in progress', other: 'You have {count} orders in progress' },
  subtitle: 'Track and reorder your favourites',
  filterAria: 'Filter orders',
  tabActive: 'In progress',
  tabHistory: 'History',
  panelActive: 'Orders in progress',
  panelHistory: 'Order history',
  loading: 'Loading orders',
  live: 'Live updates',
  liveHint: 'Status updates automatically — we will notify you as soon as your order is ready.',
  today: 'Today',
  yesterday: 'Yesterday',
  dayLabel: '{weekday}, {date}',
  emptyActive: {
    title: 'No orders in progress',
    description: 'Pick a favourite — Cloud 9 will make it fresh for you.',
    cta: 'Browse the menu',
  },
  emptyHistory: {
    title: 'No past orders yet',
    description: 'Completed and cancelled orders will show up here so you can reorder quickly.',
    cta: 'Order now',
  },
  card: {
    aria: 'Order {code}, {status}, {total}',
    more: { one: '+1 more', other: '+{count} more' },
    reorder: 'Reorder',
    reorderAria: 'Order {code} again',
    openQr: 'Open the QR code to pay',
    freeCup: 'Free cup',
  },
  reorder: {
    allUnavailable: 'Everything in this order is sold out right now — please pick something else',
    added: { one: 'Added 1 item to your cart', other: 'Added {count} items to your cart' },
    addedPartial: {
      one: 'Added 1 item to your cart · {missing} unavailable',
      other: 'Added {count} items to your cart · {missing} unavailable',
    },
    missingCount: { one: '1 item', other: '{count} items' },
  },
};
