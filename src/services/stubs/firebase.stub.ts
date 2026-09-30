// Stub dùng cho bản build một file (VITE_BACKEND=local) — không nhúng Firebase SDK.
const unavailable = () => {
  throw new Error('Firebase không có trong bản build này (VITE_BACKEND=local)');
};

export const customerFirebase = unavailable;
export const staffFirebase = unavailable;
export const ensureCustomerAuth = async () => null;
export const onStaffAuthChanged = () => () => undefined;
export const staffSignIn = unavailable;
export const staffSignOut = async () => undefined;
export const firebaseErrorMessage = (err: unknown) => (err as Error)?.message || 'Đã có lỗi xảy ra';
export const checkStaff = async () => false;
export const currentStaffUser = () => null;
export const signInCustomerWithMicrosoft = unavailable;
export const completeMicrosoftRedirect = async () => null;
export const signOutCustomer = async () => undefined;
export const onCustomerAuthChanged = () => () => undefined;
export const staffSignInWithMicrosoft = unavailable;
export type MicrosoftProfile = { uid: string; name: string; email: string };
export const checkAuthConfigured = async () => false;
export const completeStaffMicrosoftRedirect = async () => undefined;
export const reconcileCustomerAuth = async () => 'ok' as const;
export const currentCustomerUid = () => null;
