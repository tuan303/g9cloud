import type { MessageShape } from '../../types';
import type { vi } from '../vi';
import { common, lang, nav, ui, notFound, connection, fulfillment, totals, status, notify, errors, time, loyalty } from './core';
import { onboarding } from './onboarding';
import { menu } from './menu';
import { cart } from './cart';
import { payment } from './payment';
import { orderStatus } from './orderStatus';
import { orders } from './orders';
import { notifications } from './notifications';
import { adminDashboard } from './adminDashboard';
import { adminLogin } from './adminLogin';
import { adminOrders } from './adminOrders';
import { adminScan } from './adminScan';
import { adminMenu } from './adminMenu';

export const en: MessageShape<typeof vi> = {
  common,
  lang,
  nav,
  ui,
  notFound,
  connection,
  fulfillment,
  totals,
  status,
  notify,
  errors,
  time,
  loyalty,
  onboarding,
  menu,
  cart,
  payment,
  orderStatus,
  orders,
  notifications,
  adminDashboard,
  adminLogin,
  adminOrders,
  adminScan,
  adminMenu,
};
