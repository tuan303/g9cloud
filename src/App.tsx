import { lazy, Suspense, type ReactNode } from 'react';
import { createHashRouter, Outlet, RouterProvider, ScrollRestoration } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Toaster } from '@/components/ui';
import { AppShell } from '@/components/layout/AppShell';
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { RequireAdmin, RequireUser } from '@/components/layout/Guards';
import WelcomePage from '@/pages/customer/WelcomePage';
import MenuPage from '@/pages/customer/MenuPage';
import CartPage from '@/pages/customer/CartPage';
import PaymentPage from '@/pages/customer/PaymentPage';
import OrderStatusPage from '@/pages/customer/OrderStatusPage';
import OrdersPage from '@/pages/customer/OrdersPage';
import NotificationsPage from '@/pages/customer/NotificationsPage';
import AccountPage from '@/pages/customer/AccountPage';
import NotFoundPage from '@/pages/NotFoundPage';
import { ConnectionBanner } from '@/components/layout/ConnectionBanner';
import { STAFF_FIREBASE_AUTH } from '@/store/staff-auth';

// Khu quản trị (kèm thư viện quét QR) tách thành gói riêng — app khách tải nhẹ hơn.
const AdminLayout = lazy(() => import('@/components/layout/AdminLayout').then((m) => ({ default: m.AdminLayout })));
// Đăng nhập nhân viên: PIN trên máy hoặc tài khoản Firebase (APP_CONFIG.admin.auth)
const AdminLoginPage = lazy(() =>
  STAFF_FIREBASE_AUTH ? import('@/pages/admin/StaffLoginPage') : import('@/pages/admin/AdminLoginPage'),
);
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'));
const AdminOrdersPage = lazy(() => import('@/pages/admin/AdminOrdersPage'));
const AdminScanPage = lazy(() => import('@/pages/admin/AdminScanPage'));
const AdminMenuPage = lazy(() => import('@/pages/admin/AdminMenuPage'));

function Loading({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-cream text-bronze-500" role="status" aria-label="Đang tải">
          <Loader2 className="h-7 w-7 animate-spin" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

function Root() {
  return (
    <>
      <Outlet />
      <ConnectionBanner />
      <Toaster />
      <ScrollRestoration />
    </>
  );
}

function CustomerShell() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

/**
 * Hash router: chạy ổn định cả trên hosting tĩnh, WebView lẫn Zalo Mini App (không cần cấu hình server).
 */
const router = createHashRouter([
  {
    element: <Root />,
    errorElement: <NotFoundPage error />,
    children: [
      {
        element: <CustomerShell />,
        children: [
          { path: '/welcome', element: <WelcomePage /> },
          {
            element: <RequireUser />,
            children: [
              {
                element: <CustomerLayout />,
                children: [
                  { index: true, element: <MenuPage /> },
                  { path: '/orders', element: <OrdersPage /> },
                  { path: '/notifications', element: <NotificationsPage /> },
                  { path: '/account', element: <AccountPage /> },
                ],
              },
              { path: '/cart', element: <CartPage /> },
              { path: '/order/:id', element: <OrderStatusPage /> },
              { path: '/order/:id/pay', element: <PaymentPage /> },
            ],
          },
        ],
      },
      { path: '/admin/login', element: <Loading><AdminLoginPage /></Loading> },
      {
        path: '/admin',
        element: <RequireAdmin />,
        children: [
          {
            element: (
              <Loading>
                <AdminLayout />
              </Loading>
            ),
            children: [
              { index: true, element: <Loading><AdminDashboardPage /></Loading> },
              { path: 'orders', element: <Loading><AdminOrdersPage /></Loading> },
              { path: 'scan', element: <Loading><AdminScanPage /></Loading> },
              { path: 'menu', element: <Loading><AdminMenuPage /></Loading> },
            ],
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
