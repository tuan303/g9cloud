import type { MessageShape } from '../../types';
import type { onboarding as V } from '../vi/onboarding';

export const onboarding: MessageShape<typeof V> = {
  guestName: 'Guest',
  callNameFallback: 'friend',

  hero: {
    aria: 'Welcome to Cloud 9',
    morning: 'Good morning',
    noon: 'Happy lunchtime',
    afternoon: 'Good afternoon',
    evening: 'Good evening',
    title: 'What are we drinking today?',
    subtitle: 'Fresh coffee & bakes every day — order in a tap, pick up right here on campus.',
  },

  steps: {
    signIn: 'Sign in',
    fulfillment: 'Pickup or delivery',
    back: 'Back to previous step',
    progress: 'Step {step}/{total}',
    progressAria: 'Step {step} of {total}: {label}',
  },

  welcome: {
    pageTitle: 'Sign in',
    methodTitle: 'How would you like to sign in?',
    methodLead: 'It takes less than a minute.',
    microsoftTitle: 'Sign in with Microsoft 365',
    microsoftDesc: 'Use your school email · keep your order history on any device',
    zaloTitle: 'Sign in with Zalo',
    zaloDesc: 'Use your Zalo name and profile photo',
    or: 'or',
    guestTitle: 'Continue as a guest',
    guestDesc: 'Order right away, no account needed',
    privacy: 'Cloud 9 only uses your name and phone number to handle your order and let you know when it’s ready.',
    staffLink: 'Café staff? Go to the admin page',
    zaloError: 'We couldn’t get your Zalo details. Please try again or choose another option.',
    profile: {
      microsoft: {
        title: 'Confirm your details',
        description: 'You’re signed in with your school Microsoft 365 account. Add a phone number so we can reach you if needed.',
      },
      school_email: {
        title: 'Sign in with your school email',
        description: 'Sign in with the same email next time to see your past orders.',
      },
      zalo: {
        title: 'Confirm your details',
        description: 'Check your name and add a phone number so we can reach you if needed.',
      },
      guest: {
        title: 'Continue as a guest',
        description: 'Order right away, no account needed.',
      },
    },
    verified: 'Verified · {email}',
    zaloConnected: 'Connected with Zalo',
    zaloAccount: 'Zalo account',
    guestNote: 'Your name and phone number are optional for now, but we’ll need them at checkout to call you when your order is ready.',
    guestPhoneHint: 'Optional · needed at checkout',
    demoNote: 'Offline preview: Microsoft 365 sign-in is simulated with an email',
    continue: 'Continue',
    start: 'Start ordering',
    fulfillmentTitle: 'How would you like to get your order?',
    fulfillmentLead: 'Pick your usual — you can still change it for each order.',
    editAria: 'Edit sign-in details',
    addressRequired: 'Please enter a delivery location, e.g. Class 8A1 – Floor 3',
    welcomeToast: 'Welcome to Cloud 9, {name}!',
  },

  fields: {
    emailLabel: 'School email',
    emailReadonlyHint: 'This is your sign-in email, so it can’t be changed',
    emailDomainHint: 'School emails only ({domains})',
    emailPlaceholderUser: 'your.name',
    emailPlaceholderDomain: 'school.edu.vn',
    nameLabel: 'Full name',
    namePlaceholder: 'e.g. Nguyen Minh An',
    phoneLabel: 'Phone number',
    phoneHint: 'So we can call you when your order is ready',
    studentIdLabel: 'Student / staff ID',
    studentIdPlaceholder: 'e.g. HS2025-0123',
  },

  validation: {
    emailRequired: 'Please enter your school email',
    emailInvalid: 'That email doesn’t look right',
    emailDomain: 'Please use your school email ({domains})',
    nameRequired: 'Please enter your full name',
    nameTooShort: 'Name must be at least 2 characters',
    nameTooLong: 'Name can be up to 60 characters',
    phoneRequired: 'Please enter your phone number',
    phoneInvalid: 'That phone number doesn’t look right, e.g. 0912 345 678',
    idTooLong: 'ID can be up to 20 characters',
    idChars: 'ID can only contain letters without accents, numbers, dots or dashes',
  },

  edit: {
    title: 'Edit your details',
    save: 'Save changes',
    saved: 'Your details have been updated',
    guestPhoneHint: 'Optional · we’ll call this number when your order is ready',
  },

  profileCard: {
    aria: 'Account details',
    edit: 'Edit',
    hello: 'Hello there!',
    provider: {
      microsoft: 'Microsoft 365',
      school_email: 'School email',
      zalo: 'Zalo',
      guest: 'Guest',
    },
    phone: 'Phone',
    studentId: 'Student / staff ID',
    empty: 'Not set',
    loadingOrders: 'Loading orders',
    ordersPlaced: { one: 'order placed', other: 'orders placed' },
    ordersActive: 'in progress',
    noOrders: 'No orders yet — order now',
  },

  notifications: {
    granted: {
      title: 'Notifications are on',
      description: 'Cloud 9 will let you know as soon as your order is ready or on its way.',
    },
    default: {
      title: 'Get notified when it’s ready',
      description: 'Get alerts even while you’re using other apps.',
    },
    unknown: {
      title: 'Get notified when it’s ready',
      description: 'Get alerts when your order is ready or on its way.',
    },
    dismissed: {
      title: 'Not allowed yet',
      description: 'Tap “Turn on notifications”, then choose Allow when asked.',
    },
    denied: {
      title: 'Notifications are blocked',
      description: 'Allow notifications for Cloud 9 in your settings, then try again.',
    },
    unsupported: {
      title: 'Not supported on this device',
      description: 'You’ll still see in-app alerts while Cloud 9 is open.',
    },
    on: 'On',
    enable: 'Turn on notifications',
    enabledToast: 'Notifications turned on',
  },

  about: {
    photoAlt: 'The Cloud 9 pastry and coffee counter in the afternoon sun',
    blurb: 'A great coffee and a pastry fresh from the oven — that’s cloud nine.',
    hours: 'Opening hours',
    location: 'Location',
    hotline: 'Hotline',
    callAria: 'Call hotline {phone}',
  },

  account: {
    upgradedToast: 'Switched to your Microsoft 365 account',
    loggedOutToast: 'Signed out. See you soon!',
    addressError: 'Enter a delivery location so we bring your order to the right place',
    upgradeTitle: 'Sign in with your school Microsoft 365 to save your order history',
    upgradeBody: 'Use your school email account — see past orders on any device and reorder your favourites in a few taps.',
    upgradeCta: 'Sign in now',
    activeNote: {
      one: 'You have 1 order in progress ({codes}) — keep the order code handy for pickup.',
      other: 'You have {count} orders in progress ({codes}) — keep the order codes handy for pickup.',
    },
    fulfillmentTitle: 'Default pickup or delivery',
    autoSaved: 'Saved automatically',
    fulfillmentHint: 'Used for new orders — you can still change it in your cart.',
    languageTitle: 'Language',
    languageLabel: 'Display language',
    languageHint: 'Applies to the whole app',
    notificationsTitle: 'Notifications',
    aboutTitle: 'About Cloud 9',
    staffTitle: 'For café staff',
    adminTitle: 'Café admin',
    adminDesc: 'Take orders, scan QR payments, update the menu',
    logout: 'Sign out',
    version: 'Cloud 9 · Version {version} · Beta',
    logoutConfirm: {
      title: 'Sign out of Cloud 9?',
      confirm: 'Sign out',
      cancel: 'Stay',
      cartKept: 'Your cart will be kept.',
      guest: 'Orders placed as a guest can’t be viewed after you sign out.',
      member: 'Sign in again with the same account to see your order history.',
    },
    upgradeConfirm: {
      title: 'Switch to your Microsoft 365 account?',
      confirm: 'Continue',
      body: 'Orders in progress were placed as a guest, so they won’t appear in your new account.',
    },
  },
};
