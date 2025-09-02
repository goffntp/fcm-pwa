import { initializeApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported,
  Messaging,
} from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

export const app = initializeApp(firebaseConfig);

let _messaging: Messaging | null = null;

export const getMessagingIfSupported = async () => {
  if (!_messaging && (await isSupported())) {
    _messaging = getMessaging(app);
  }
  return _messaging;
};

const registerSW = async () => {
  if (!("serviceWorker" in navigator)) return null;
  
  const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
  
  // รอให้ service worker active
  if (registration.installing) {
    await new Promise((resolve) => {
      registration.installing!.addEventListener('statechange', () => {
        if (registration.installing!.state === 'activated') {
          resolve(void 0);
        }
      });
    });
  }
  
  return registration;
};

export const subscribeAndGetToken = async (): Promise<string | null> => {
  const permission = await Notification.requestPermission();
  if (permission !== "granted")
    throw new Error("Notification permission denied");

  const messaging = await getMessagingIfSupported();
  if (!messaging) throw new Error("FCM not supported in this browser");

  const swReg = await registerSW();
  if (!swReg) throw new Error("Service Worker not available");

  const token = await getToken(messaging, {
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY!,
    serviceWorkerRegistration: swReg,
  });
  
  // Token จะถูกส่งไป server ใน handleSubscribe
  
  return token || null;
};

export const onForegroundMessage = async (cb: (payload: unknown) => void) => {
  const messaging = await getMessagingIfSupported();
  if (!messaging) return () => {};
  return onMessage(messaging, cb);
};
