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
