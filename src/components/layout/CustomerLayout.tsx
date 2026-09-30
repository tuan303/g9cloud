import { Outlet } from 'react-router-dom';
import { TabBar } from './TabBar';

/** Các trang có thanh tab dưới cùng (Thực đơn, Đơn hàng, Thông báo, Tài khoản) */
export function CustomerLayout() {
  return (
    <>
      <main className="pb-tabbar">
        <Outlet />
      </main>
      <TabBar />
    </>
  );
}
