import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { App } from './App';
import { startDataSync } from './store/data';
import { startOrderWatcher } from './store/order-watcher';
import { startCrossTabSync } from './store/cross-tab';

void startDataSync();
startOrderWatcher();
startCrossTabSync();

// Service worker (chỉ bản web production, cần https) — để thông báo "Đơn hàng sẵn sàng" hiện được trên Android
if (import.meta.env.PROD && import.meta.env.MODE !== 'single' && 'serviceWorker' in navigator && window.isSecureContext) {
  navigator.serviceWorker.register('./sw.js').catch(() => undefined);
}

// Zalo Mini App dùng index.html riêng với phần tử #app
ReactDOM.createRoot((document.getElementById('app') ?? document.getElementById('root'))!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
