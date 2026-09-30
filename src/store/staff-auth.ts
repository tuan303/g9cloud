import { create } from 'zustand';
import { APP_CONFIG } from '@/config/app';
import { BACKEND } from '@/config/firebase';
import { useSession } from './session';

/** Đăng nhập nhân viên bằng Firebase Auth (chỉ khi APP_CONFIG.admin.auth = 'firebase' và backend là Firebase) */
export const STAFF_FIREBASE_AUTH = APP_CONFIG.admin.auth === 'firebase' && BACKEND === 'firebase';

export type StaffStatus = 'disabled' | 'loading' | 'signed_out' | 'not_staff' | 'staff' | 'error';

interface StaffAuthState {
  status: StaffStatus;
  email?: string;
  uid?: string;
  /** Lý do khi status = 'error' (không kiểm tra được quyền: mất mạng, Rules...) */
  message?: string;
}

export const useStaffAuth = create<StaffAuthState>(() => ({ status: STAFF_FIREBASE_AUTH ? 'loading' : 'disabled' }));

let started = false;
export async function startStaffAuth() {
  if (!STAFF_FIREBASE_AUTH || started) return;
  started = true;
  const { onStaffAuthChanged, firebaseErrorMessage } = await import('@/services/firebase');
  onStaffAuthChanged((result, error) => {
    if (result === 'checking') return useStaffAuth.setState({ status: 'loading', message: undefined });
    if (!result) return useStaffAuth.setState({ status: 'signed_out', email: undefined, uid: undefined, message: undefined });
    const who = { email: result.user.email ?? undefined, uid: result.user.uid };
    if (error) {
      console.warn('[Cloud9] Không kiểm tra được quyền nhân viên', error);
      useStaffAuth.setState({ status: 'error', message: firebaseErrorMessage(error), ...who });
    } else {
      useStaffAuth.setState({ status: result.isStaff ? 'staff' : 'not_staff', message: undefined, ...who });
    }
  });
}

/** Kiểm tra lại quyền nhân viên (nút "Thử lại" khi lỗi mạng) */
export async function recheckStaff() {
  const { currentStaffUser, checkStaff, firebaseErrorMessage } = await import('@/services/firebase');
  const user = currentStaffUser();
  if (!user) return useStaffAuth.setState({ status: 'signed_out' });
  useStaffAuth.setState({ status: 'loading' });
  try {
    useStaffAuth.setState({ status: (await checkStaff(user)) ? 'staff' : 'not_staff', message: undefined });
  } catch (err) {
    useStaffAuth.setState({ status: 'error', message: firebaseErrorMessage(err) });
  }
}

/** Đang ở chế độ nhân viên? (PIN: cờ mở khoá trên máy · Firebase: tài khoản có trong staff/{uid}) */
export function isStaffActive(): boolean {
  return STAFF_FIREBASE_AUTH ? useStaffAuth.getState().status === 'staff' : useSession.getState().adminUnlocked;
}

/** Hook dùng trong giao diện */
export function useIsStaff(): { ready: boolean; staff: boolean } {
  const status = useStaffAuth((s) => s.status);
  const unlocked = useSession((s) => s.adminUnlocked);
  if (!STAFF_FIREBASE_AUTH) return { ready: true, staff: unlocked };
  return { ready: status !== 'loading', staff: status === 'staff' };
}

/** Khoá / đăng xuất khu vực quản trị */
export async function lockStaff() {
  useSession.getState().lockAdmin();
  if (STAFF_FIREBASE_AUTH) {
    const { staffSignOut } = await import('@/services/firebase');
    await staffSignOut();
  }
}
