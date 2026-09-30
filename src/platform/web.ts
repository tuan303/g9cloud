import { safeStorage } from './storage';
import type { PlatformAdapter } from './types';

export const webPlatform: PlatformAdapter = {
  name: 'web',
  storage: safeStorage(() => (typeof localStorage !== 'undefined' ? localStorage : undefined)),
  canNativeScan: false,

  async scanQRCode() {
    // Trên web, giao diện tự dựng trình quét bằng camera (src/components/admin/scan/QrScanner.tsx)
    return null;
  },

  async getProfile() {
    return null;
  },

  setTitle(title) {
    document.title = title ? `${title} · Cloud 9` : 'Cloud 9 · Bakery Cafe';
  },

  vibrate(pattern) {
    try {
      navigator.vibrate?.(pattern);
    } catch {
      /* không hỗ trợ */
    }
  },

  async requestNotificationPermission() {
    if (typeof Notification === 'undefined') return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    try {
      return (await Notification.requestPermission()) === 'granted';
    } catch {
      return false;
    }
  },

  async systemNotify(title, body) {
    // Chỉ gửi thông báo hệ thống khi tab đang ẩn — khi đang mở đã có banner trong app
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    if (document.visibilityState === 'visible') return;
    const options = { body, icon: './icon-192.png', tag: 'c9-order' };
    try {
      // Android Chrome chỉ cho hiện thông báo qua Service Worker (public/sw.js)
      const reg = await navigator.serviceWorker?.getRegistration();
      if (reg) {
        await reg.showNotification(title, options);
        return;
      }
    } catch {
      /* chưa có service worker */
    }
    try {
      new Notification(title, options);
    } catch {
      /* trình duyệt không hỗ trợ */
    }
  },

  async share(data) {
    if (navigator.share) {
      try {
        await navigator.share(data);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  },

  call(phone) {
    window.location.href = `tel:${phone}`;
  },
};
