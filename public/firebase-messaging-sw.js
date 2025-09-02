/* global importScripts, firebase, self */
importScripts(
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js"
);

// Firebase config คงที่ - ใช้ตรงเพื่อให้ SW ทำงาน
const firebaseConfig = {
  apiKey: "AIzaSyCy5-6upXqbtk5SK1tF4euPz8InHZtQhvg",
  authDomain: "sg-secom-notify.firebaseapp.com",
  projectId: "sg-secom-notify",
  storageBucket: "sg-secom-notify.firebasestorage.app",
  messagingSenderId: "100477729239",
  appId: "1:100477729239:web:c33aab9e5a2393443f7392",
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// รับโนติฯ ตอน background/ปิดเบราว์เซอร์
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message received:', payload);
  const { title, body, icon, image } = payload.notification || {};
  self.registration.showNotification(title || "Notification", {
    body: body || "",
    icon: icon || "/icons/icon-192.png",
    image: image,
    data: payload.data || {},
  });
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
