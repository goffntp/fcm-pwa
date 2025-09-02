/* global importScripts, firebase, self */
importScripts(
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js"
);

// ดึง Firebase config จาก API
fetch('/api/firebase-config')
  .then(response => response.json())
  .then(config => {
    firebase.initializeApp(config);
    
    const messaging = firebase.messaging();
    
    // รับโนติฯ ตอน background/ปิดเบราว์เซอร์
    messaging.onBackgroundMessage((payload) => {
      const { title, body, icon, image } = payload.notification || {};
      self.registration.showNotification(title || "Notification", {
        body: body || "",
        icon: icon || "/icons/icon-192.png",
        image: image,
        data: payload.data || {},
      });
    });
  })
  .catch(error => {
    console.error('Failed to load Firebase config:', error);
  });

// คลิกแล้วเปิดแอป
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = self.location.origin + "/";
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === url && "focus" in client) return client.focus();
        }
        if (clients.openWindow) return clients.openWindow(url);
      })
  );
});
