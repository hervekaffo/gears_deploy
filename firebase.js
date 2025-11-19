import 'react-native-url-polyfill/auto';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

export const firebaseConfig = {
  apiKey: "AIzaSyA0rCf3azEpNersjHAm5lv3mxPHV-f9ZVE",
  authDomain: "baseproject-ca69c.firebaseapp.com",
  projectId: "baseproject-ca69c",
  storageBucket: "baseproject-ca69c.firebasestorage.app",
  messagingSenderId: "312943486418",
  appId: "1:312943486418:web:429fff99b3480fcaaed40b",
  measurementId: "G-91TZ49XXWP"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

//  Auth persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

//  Firestore (long‑polling)
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false
});

//  Storage
export const storage = getStorage(app);

export default app;
