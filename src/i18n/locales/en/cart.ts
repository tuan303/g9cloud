import type { MessageShape } from '../../types';
import type { cart as V } from '../vi/cart';

export const cart: MessageShape<typeof V> = {
  title: 'Cart',
  itemCount: { one: '1 item', other: '{count} items' },
  clearAria: 'Empty the cart',
  empty: {
    title: 'Your cart is empty',
    body: 'Pick a few treats at Cloud 9, then come back here.',
    cta: 'Browse the menu',
  },
  sections: {
    items: 'Your items',
    fulfillment: 'How to get it',
    recipient: 'Your details',
    note: 'Order note',
    payment: 'Payment',
  },
  unavailable: {
    title: { one: '1 item just sold out', other: '{count} items just sold out' },
    body: 'The café just updated the menu. Remove these items to place your order.',
    removeAll: 'Remove all',
    block: { one: '1 item is sold out — remove it to continue', other: '{count} items are sold out — remove them to continue' },
    toast: 'Please remove sold-out items before ordering',
  },
  addMore: 'Add more items',
  minOrder: {
    short: 'Add {amount} more for delivery',
    hint: 'Delivery is available for orders from {min} — just add {amount} more.',
  },
  form: {
    name: 'Name',
    namePlaceholder: 'e.g. Alex Nguyen',
    phone: 'Phone number',
    phonePlaceholder: 'e.g. 0912 345 678',
    phoneHint: 'We’ll only call if we need to confirm your order',
    notePlaceholder: 'e.g. Extra paper straws, call me when it’s ready…',
    noteHint: 'A note for one item? Tap it in your cart to edit.',
  },
  errors: {
    address: 'Please enter where to deliver (class / office)',
    name: 'Please enter your name',
    phone: 'Please enter your phone number',
    phoneInvalid: 'That phone number doesn’t look right (e.g. 0912 345 678)',
  },
  submit: 'Get my order QR code',
  clearConfirm: {
    title: 'Empty your cart?',
    body: 'All items and notes in your cart will be removed.',
    confirm: 'Remove all',
    cancel: 'Keep them',
  },
  steps: {
    aria: 'Ordering steps',
    cart: 'Cart',
    scan: 'Scan QR',
    collect: 'Collect',
  },
  line: {
    edit: 'Edit {name}',
    unavailable: 'Sold out',
    remove: 'Remove',
    perItem: '{price} each',
  },
  pending: {
    title: 'Order {code} is awaiting payment',
    body: 'Open the QR code again for the cashier to scan',
  },
};
