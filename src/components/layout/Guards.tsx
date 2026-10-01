import { useT } from '@/i18n';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useSession } from '@/store/session';
import { useIsStaff } from '@/store/staff-auth';

/** Yêu cầu đã đăng nhập (Microsoft 365 của trường hoặc khách) */
export function RequireUser() {
  const user = useSession((s) => s.user);
  const location = useLocation();
  if (!user) return <Navigate to="/welcome" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

/** Yêu cầu quyền nhân viên (PIN hoặc tài khoản Firebase có trong staff/{uid}) */
export function RequireAdmin() {
  const { ready, staff } = useIsStaff();
  const { t } = useT();
  const location = useLocation();
  if (!ready)
    return (
      <div className="flex min-h-dvh items-center justify-center bg-cream text-bronze-500" role="status" aria-label={t('nav.checkingAccess')}>
        <Loader2 className="h-7 w-7 animate-spin" />
      </div>
    );
  if (!staff) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}
