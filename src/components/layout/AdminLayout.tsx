import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ClipboardList, LayoutDashboard, Lock, ScanLine, Store, UtensilsCrossed } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Logo } from '@/components/ui';
import { useOrders } from '@/hooks/data';
import { lockStaff } from '@/store/staff-auth';

const NAV = [
  { to: '/admin', label: 'Tổng quan', icon: LayoutDashboard, end: true },
  { to: '/admin/orders', label: 'Đơn hàng', icon: ClipboardList },
  { to: '/admin/scan', label: 'Quét QR', icon: ScanLine },
  { to: '/admin/menu', label: 'Thực đơn', icon: UtensilsCrossed },
] as const;

/** Khung trang quản trị: thanh bên trên màn hình lớn, thanh tab dưới trên điện thoại */
export function AdminLayout() {
  const navigate = useNavigate();
  const orders = useOrders();
  const pending = orders.filter((o) => o.status === 'pending_payment').length;
  const active = orders.filter((o) => ['received', 'preparing'].includes(o.status)).length;
  const badges: Record<string, number> = { '/admin/orders': active, '/admin/scan': pending };

  const lock = () => {
    void lockStaff();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="min-h-dvh bg-cream md:flex">
      {/* Sidebar — tablet/desktop */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col bg-espresso text-cream md:flex">
        <div className="px-6 pb-6 pt-7">
          <Logo className="h-9 text-cream" />
          <p className="mt-2 text-xs uppercase tracking-[0.2em] text-gold">Quản trị quán</p>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV.map(({ to, label, icon: Icon, ...rest }) => (
            <NavLink
              key={to}
              to={to}
              end={'end' in rest}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition',
                  isActive ? 'bg-cream text-espresso' : 'text-cream/75 hover:bg-white/10 hover:text-cream',
                )
              }
            >
              <Icon className="h-5 w-5" />
              <span className="flex-1">{label}</span>
              {!!badges[to] && <span className="rounded-full bg-gold px-2 text-xs font-bold leading-5 text-espresso">{badges[to]}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="space-y-1 border-t border-white/10 p-3">
          <NavLink to="/" className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-cream/75 hover:bg-white/10">
            <Store className="h-5 w-5" /> Xem app khách
          </NavLink>
          <button onClick={lock} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm text-cream/75 hover:bg-white/10">
            <Lock className="h-5 w-5" /> Khoá màn hình
          </button>
        </div>
      </aside>

      {/* Nội dung */}
      <div className="min-w-0 flex-1">
        <header className="safe-top sticky top-0 z-30 bg-espresso text-cream md:hidden">
          <div className="flex h-14 items-center justify-between px-4">
            <div className="flex items-center gap-2.5">
              <Logo className="h-6 text-cream" />
              <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-gold">Admin</span>
            </div>
            <button onClick={lock} aria-label="Khoá màn hình quản trị" className="rounded-full p-2 text-cream/80 hover:bg-white/10">
              <Lock className="h-5 w-5" />
            </button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl pb-28 md:pb-10">
          <Outlet />
        </main>
      </div>

      {/* Tab dưới — điện thoại */}
      <nav
        aria-label="Điều hướng quản trị"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-bronze-200 bg-cream/95 backdrop-blur-md md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <ul className="grid h-16 grid-cols-4">
          {NAV.map(({ to, label, icon: Icon, ...rest }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={'end' in rest}
                className={({ isActive }) =>
                  cn('relative flex h-full flex-col items-center justify-center gap-1 text-[11px] font-semibold', isActive ? 'text-espresso' : 'text-stone')
                }
              >
                <span className="relative">
                  <Icon className="h-[22px] w-[22px]" />
                  {!!badges[to] && (
                    <span className="absolute -right-2.5 -top-1.5 min-w-[18px] rounded-full bg-rattan px-1 text-center text-[10px] font-bold leading-[18px] text-white ring-2 ring-cream">
                      {badges[to]}
                    </span>
                  )}
                </span>
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
