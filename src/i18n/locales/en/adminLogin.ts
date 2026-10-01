import type { MessageShape } from '../../types';
import type { adminLogin as V } from '../vi/adminLogin';

export const adminLogin: MessageShape<typeof V> = {
  staffArea: 'Staff area',
  backToOrdering: 'Back to ordering',
  pin: {
    title: 'Enter PIN',
    subtitle: 'Unlock the café admin screen',
    progress: { one: '1 of {total} digits entered', other: '{count} of {total} digits entered' },
    locked: {
      one: 'Too many wrong attempts. Try again in 1 second.',
      other: 'Too many wrong attempts. Try again in {count} seconds.',
    },
    success: 'Unlocked — welcome!',
    wrong: 'Incorrect PIN',
    attemptsLeft: { one: ' · 1 attempt left', other: ' · {count} attempts left' },
    keypad: 'Number pad',
    backspace: 'Delete last digit',
    defaultHint: 'Default PIN:',
    forgot: 'Forgot the PIN? Ask the café manager.',
  },
  staff: {
    title: 'Admin sign-in',
    subtitle: 'Use the staff account your café manager gave you.',
    missingFields: 'Please enter your email and password.',
    checkFailed: 'Could not verify staff access',
    signOut: 'Sign out',
    notStaffTitle: 'This account has no staff access yet',
    notStaffBefore: '{email} is signed in but is not on the staff list yet. Ask a manager to create the document',
    notStaffAfter: 'in Firestore.',
    otherAccount: 'Sign in with another account',
    microsoft: 'Sign in with Microsoft 365',
    or: 'or email & password',
    email: 'Email',
    emailPlaceholder: 'staff@cloud9.vn',
    password: 'Password',
    submit: 'Sign in',
  },
};
