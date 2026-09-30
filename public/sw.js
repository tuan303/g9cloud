// Service worker tối thiểu: cho phép hiện thông báo hệ thống trên Android Chrome
// (Chrome Android không cho dùng `new Notification()` trực tiếp trong trang).
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const client = list[0];
      return client ? client.focus() : self.clients.openWindow('./');
    }),
  );
});
