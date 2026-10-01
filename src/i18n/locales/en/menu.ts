import type { MessageShape } from '../../types';
import type { menu as V } from '../vi/menu';

export const menu: MessageShape<typeof V> = {
  added: 'Added {name}',
  addedQty: 'Added {count} × {name}',
  itemCount: { one: '1 item', other: '{count} items' },
  soldOut: 'Sold out',

  page: {
    loadFailedTitle: 'Couldn’t load the menu',
    loadFailedBody: 'The connection is slower than usual. Please try reloading the page.',
    reload: 'Reload',
    loadingAria: 'Loading the menu',
    emptyTitle: 'The menu is being updated',
    emptyBody: 'We’re getting today’s menu ready — please check back in a few minutes.',
    categoryEmptyTitle: 'Nothing here yet',
    categoryEmptyBody: 'We’re preparing new items for this section. Have a look at the other categories!',
  },

  search: {
    aria: 'Search the menu',
    placeholder: 'Search: latte, peach tea, croissant…',
    clear: 'Clear search',
    resultFor: 'for “{query}”',
    noResultsTitle: 'No matching items',
    noResultsBody: 'Try another keyword, e.g. “latte”, “peach tea” or “cake”.',
  },

  tabs: {
    aria: 'Menu categories',
    countSr: { one: 'item', other: 'items' },
  },

  card: {
    openAria: '{name}, {price}. View details',
    openAriaSoldOut: '{name}, {price}, sold out. View details',
    quickAddAria: 'Quick add {name} to cart',
    quickAddAriaInCart: 'Quick add {name} to cart ({count} in cart)',
  },

  detail: {
    maxChoices: { one: '{group}: choose up to 1 option', other: '{group}: choose up to {count} options' },
    chooseRequired: 'Please choose an option for “{group}”',
    updated: 'Updated {name}',
    soldOutButton: 'Sold out',
    update: 'Update item',
    addToCart: 'Add to cart',
    soldOutNotice: 'This item is sold out right now. Try something else or check back later!',
    noteLabel: 'Note for the café',
    notePlaceholder: 'e.g. less sweet, no straw…',
    noteHint: '{used}/{max} characters',
    quantity: 'Quantity',
    perServing: '{price} each',
    optional: 'Optional',
    optionalMax: 'Optional · up to {max}',
    pleaseChoose: 'Please choose an option for {group}',
    loyaltyHint: { one: 'Counts as 1 cup toward your loyalty card', other: 'Counts as {count} cups toward your loyalty card' },
  },

  cartBar: {
    aria: {
      one: 'Cart: 1 item, subtotal {subtotal}. Order with QR',
      other: 'Cart: {count} items, subtotal {subtotal}. Order with QR',
    },
    summary: { one: 'Cart · 1 item', other: 'Cart · {count} items' },
    orderQr: 'Order with QR',
  },

  hero: {
    greeting: {
      morning: { title: 'Good morning', sub: 'Start your day with a coffee?' },
      noon: { title: 'Happy lunchtime', sub: 'Take a break with something cold?' },
      afternoon: { title: 'Good afternoon', sub: 'Lovely afternoon light — what are you having?' },
      evening: { title: 'Good evening', sub: 'What would you like today?' },
    },
    hoursSr: 'Opening hours:',
    deliverTo: 'Deliver to: {address}',
    deliveryNoAddress: 'Delivery · Add a location',
    fulfillmentAria: 'How to get your order: {value}. Tap to change',
  },

  activeOrder: {
    orderSr: 'Order',
    view: 'View',
    more: {
      one: '1 more order in progress · See all',
      other: '{count} more orders in progress · See all',
    },
  },

  fulfillmentSheet: {
    title: 'Pickup or delivery',
    intro: 'Collect your order at the counter, or have us bring it to you?',
    confirm: 'Confirm',
    addressRequired: 'Please enter where to deliver (classroom or office)',
    toastDelivery: 'We’ll deliver to {address}',
    toastPickup: 'You’ll pick up at the counter',
    minOrder: 'Delivery is available for orders from {amount}.',
    counter: '{name} counter · {location}',
  },
};
