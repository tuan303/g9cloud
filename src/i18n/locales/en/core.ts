import type { MessageShape } from '../../types';
import type * as V from '../vi/core';

export const common: MessageShape<typeof V.common> = {
  appName: 'Cloud 9',
  tagline: 'Bakery · Cafe',
  loading: 'Loading',
  close: 'Close',
  back: 'Back',
  cancel: 'Cancel',
  confirm: 'OK',
  later: 'Not now',
  save: 'Save',
  edit: 'Edit',
  delete: 'Delete',
  retry: 'Try again',
  free: 'Free',
  required: 'Required',
  optional: 'Optional',
  genericError: 'Something went wrong',
  reloadApp: 'Reload the app',
  backToMenu: 'Back to menu',
};

export const lang: MessageShape<typeof V.lang> = {
  label: 'Language',
  switchTo: 'Change language',
};

export const nav: MessageShape<typeof V.nav> = {
  main: 'Main navigation',
  menu: 'Menu',
  orders: 'Orders',
  notifications: 'Alerts',
  account: 'Account',
  admin: 'Admin navigation',
  adminBadge: 'Admin',
  adminArea: 'Café admin',
  dashboard: 'Overview',
  adminOrders: 'Orders',
  scan: 'Scan QR',
  adminMenu: 'Menu',
  customerApp: 'Open customer app',
  lock: 'Lock screen',
  lockAria: 'Lock the admin screen',
  checkingAccess: 'Checking access',
};

export const ui: MessageShape<typeof V.ui> = {
  closeNotification: 'Dismiss notification',
  hideWarning: 'Hide warning',
  decrease: 'Decrease quantity',
  increase: 'Increase quantity',
  removeItem: 'Remove item',
  removeNamed: 'Remove {name} from cart',
  decreaseNamed: 'Decrease {name}',
  increaseNamed: 'Increase {name}',
  tagBestseller: 'Bestseller',
  tagNew: 'New',
  tagSignature: 'Signature',
};

export const notFound: MessageShape<typeof V.notFound> = {
  errorTitle: 'Oops, something went wrong',
  errorBody: 'Please reload the app.',
  title: 'Page not found',
  body: 'The page you are looking for does not exist or has moved.',
};

export const connection: MessageShape<typeof V.connection> = {
  lost: 'Lost connection to the server.',
  denied: 'Cannot access data.',
  notReady: 'The server is not ready yet.',
  busy: 'The server is busy.',
  autoRetry: 'The app will reconnect automatically.',
};

export const fulfillment: MessageShape<typeof V.fulfillment> = {
  aria: 'How to get your order',
  pickup: 'Pick up at counter',
  pickupDesc: 'Collect at the counter or enjoy it in the café',
  delivery: 'Deliver to me',
  deliveryDesc: 'Delivered to your classroom or office on campus',
  deliverTo: 'Deliver to',
  addressPlaceholder: 'e.g. Class 8A1 – Floor 3, Building B',
  freeDelivery: 'Free delivery on campus',
  deliveryFee: 'Delivery fee: {fee}',
};

export const totals: MessageShape<typeof V.totals> = {
  subtotal: 'Subtotal',
  deliveryFee: 'Delivery fee',
  discount: 'Discount',
  loyaltyReward: 'Free cup (loyalty)',
  total: 'Total',
};

export const status: MessageShape<typeof V.status> = {
  pending_payment: { label: 'Awaiting payment', description: 'Show the QR code to the cashier at the counter to pay' },
  received: { label: 'Order received', description: 'The café has received your order and payment' },
  preparing: { label: 'Preparing', description: 'Our barista is making your order' },
  ready: { label: 'Ready', description: 'Your order is ready — please collect it at the counter' },
  delivering: { label: 'On the way', description: 'Our staff is bringing your order to you' },
  completed: { label: 'Completed', description: 'Enjoy!' },
  cancelled: { label: 'Cancelled', description: 'This order was cancelled' },
  stepDelivered: 'Delivered',
  paidAtPos: 'Paid at the POS',
  stepPickedUp: 'Picked up',
  action: {
    confirmPayment: 'Confirm payment',
    startPreparing: 'Start preparing',
    startDelivery: 'Start delivery',
    markReady: 'Mark as ready',
    pickedUp: 'Picked up',
    delivered: 'Delivered',
  },
};

export const notify: MessageShape<typeof V.notify> = {
  received: { title: 'Order received ✅', body: 'Order {code} is paid. We are starting on it now!' },
  preparing: { title: 'Preparing ☕', body: 'Our barista is making order {code}.' },
  ready: { title: 'Your order is ready 🛍️', body: 'Order {code} is ready — please collect it at the counter.' },
  delivering: { title: 'On the way 🚚', body: 'Order {code} is on its way to {address}.' },
  deliveringDefault: 'you',
  completed: { title: 'Completed 🎉', body: 'Thanks for choosing Cloud 9! Enjoy.' },
  cancelled: { title: 'Order cancelled', body: 'Order {code} was cancelled.', bodyReason: 'Order {code} was cancelled: {reason}' },
  reward: { title: 'You have a free cup 🎁', body: '{cups} cups collected! Use it when you place your next order.' },
};

export const errors: MessageShape<typeof V.errors> = {
  cartEmpty: 'Your cart is empty',
  addressRequired: 'Please enter a delivery location',
  soldOut: 'Sold out: {items}',
  optionsChanged: '{name}: options have changed, please choose again',
  priceChanged: 'Prices just changed — please review your cart',
  orderNotFound: 'Order not found',
  itemNotFound: 'Item not found',
  orderCancelled: 'This order was cancelled',
  orderCompleted: 'This order is already completed',
  orderFinished: 'This order is closed and cannot be updated',
  notPaid: 'This order has not been paid',
  noGoingBack: 'An order status cannot move backwards',
  paidContactCounter: 'This order is paid — please ask at the counter to cancel',
  priceMismatch: 'Order {code} does not match menu prices ({detail}). Do not collect payment — cancel it and order again.',
  duplicateCode: '{count} orders share code {code} — please scan the QR code on the customer’s phone',
  nameRequired: 'Item name is required',
  invalidPrice: 'Invalid price',
  storageFull: 'Device storage is full — please use a smaller photo.',
  loyaltyNotEnough: 'This customer has fewer than {cups} cups — the free cup cannot be applied.',
  loyaltyGuest: 'Guests cannot use free cups.',
  priceDetail: {
    quantity: '{name}: invalid quantity / line total',
    price: '{name}: price differs from the menu',
    subtotal: 'subtotal does not match the items',
    total: 'total does not match',
    fee: 'wrong delivery fee',
  },
  reasonCustomer: 'Cancelled by customer',
  reasonStaff: 'Cancelled by the café',
  reasonExpired: 'Payment time expired',
  pricesUpdated: 'Some prices in your cart were just updated by the café',
  sessionExpired: 'Your Microsoft 365 session has ended — please sign in again.',
  ssoSetup: 'Microsoft 365 sign-in is being set up. You can continue as a guest.',
  firebase: {
    permission: 'No permission to access data — check the staff sign-in or Firestore Security Rules.',
    unavailable: 'Cannot reach the server — check your connection and try again.',
    notReady: 'Firestore is not ready (missing index or database not created).',
    badCredentials: 'Incorrect email or password.',
    tooMany: 'Too many attempts — please wait a moment.',
    offline: 'No internet connection.',
    providerOff: 'This sign-in method is not enabled in Firebase Authentication (see docs/M365_SSO.md).',
    popupClosed: 'You closed the sign-in window.',
    popupBlocked: 'The browser blocked the sign-in window — redirecting to Microsoft sign-in…',
    unauthorizedDomain: 'This app’s domain is not in Firebase › Authentication › Authorized domains.',
    accountExists: 'This email is registered with another sign-in method — please contact the café admin.',
    microsoftRejected: 'Microsoft 365 rejected the sign-in: {code}',
    signInFailed: 'Sign-in failed — please try again.',
    notSchool: 'The account {email} is not a school account. Please use your school email.',
    thisAccount: 'you used',
  },
};

export const time: MessageShape<typeof V.time> = {
  justNow: 'just now',
  minutesAgo: { one: '1 min ago', other: '{count} min ago' },
  hoursAgo: { one: '1 hour ago', other: '{count} hours ago' },
  yesterday: 'yesterday',
  weekdaysShort: 'Sun,Mon,Tue,Wed,Thu,Fri,Sat',
  weekdaysLong: 'Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday',
};

export const loyalty: MessageShape<typeof V.loyalty> = {
  title: 'Loyalty card',
  rule: 'Buy {cups} drinks, get 1 free',
  progress: '{stamps}/{cups} cups',
  toNext: { one: '1 more cup to a free drink', other: '{count} more cups to a free drink' },
  rewardsAvailable: { one: 'You have 1 free cup', other: 'You have {count} free cups' },
  rewardReady: '{cups} cups collected — you have a free cup!',
  totalCups: { one: '1 cup bought', other: '{count} cups bought' },
  guestTitle: 'Collect cups, get a free drink',
  guestBody: 'Sign in with your school Microsoft 365 account to collect stamps: buy {cups}, get 1 free.',
  guestCta: 'Sign in to collect',
  stampAria: '{stamps} of {cups} cups collected',
  chip: '{stamps}/{cups}',
  chipAria: 'Loyalty: {stamps} of {cups} cups',
  useReward: 'Use 1 free cup',
  useRewardHint: 'Applies to {name} (−{amount})',
  noEligible: 'Add a drink to use your free cup',
  earned: { one: '+1 loyalty cup', other: '+{count} loyalty cups' },
  redeemed: '1 free cup used',
  redeemBadge: 'Free cup reward',
  customerStamps: { one: 'Customer has 1 cup ({rewards} free)', other: 'Customer has {count} cups ({rewards} free)' },
  pendingNote: {
    one: 'A free cup is waiting for payment on order {codes}',
    other: 'Free cups are waiting for payment on orders {codes}',
  },
};
