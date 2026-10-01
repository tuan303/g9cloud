import { useT } from '@/i18n';
import { NavLink } from 'react-router-dom';
import { Bell, Coffee, Receipt, UserRound } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useMyActiveOrders } from '@/hooks/data';
import { selectUnreadCount, useNotifications } from '@/store/notifications';

const TABS = [
  { to: '/', label: 'nav.menu', icon: Coffee, end: true },
  { to: '/orders', label: 'nav.orders', icon: Receipt },
  { to: '/notifications', label: 'nav.notifications', icon: Bell },
  { to: '/account', label: 'nav.account', icon: UserRound },
] as const;

export function TabBar() {
  const { t } = useT();
  const activeOrders = useMyActiveOrders().length;
  const unread = useNotifications(selectUnreadCount);
  const badges: Record<string, number> = { '/orders': activeOrders, '/notifications': unread };

  return (
    <nav
      aria-label={t('nav.main')}
      className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md border-t border-bronze-200/70 bg-cream/95 backdrop-blur-md"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <ul className="grid h-[var(--tabbar-h)] grid-cols-4">
        {TABS.map(({ to, label, icon: Icon, ...rest }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={'end' in rest}
              className={({ isActive }) =>
                cn(
                  'relative flex h-full flex-col items-center justify-center gap-1 text-[11px] font-semibold transition',
                  isActive ? 'text-espresso' : 'text-stone hover:text-bronze-700',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className={cn('absolute top-0 h-[3px] w-8 rounded-b-full transition', isActive ? 'bg-gold' : 'bg-transparent')} />
                  <span className="relative">
                    <Icon className="h-[22px] w-[22px]" strokeWidth={isActive ? 2.4 : 1.9} />
                    {!!badges[to] && (
                      <span className="absolute -right-2.5 -top-1.5 min-w-[18px] rounded-full bg-rattan px-1 text-center text-[10px] font-bold leading-[18px] text-white ring-2 ring-cream">
                        {badges[to] > 9 ? '9+' : badges[to]}
                      </span>
                    )}
                  </span>
                  {t(label)}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
