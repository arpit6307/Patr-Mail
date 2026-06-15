import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

// Check if we have the minimum configuration to initialize Firebase.
// During build time on Vercel/CI, if env vars are missing, we skip initialization.
const hasFirebaseConfig = !!(
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
);

const app = getApps().length > 0 
  ? getApp() 
  : (hasFirebaseConfig ? initializeApp(firebaseConfig) : null);

let dbInstance: any = null;
if (app) {
  try {
    dbInstance = initializeFirestore(app, {
      experimentalForceLongPolling: true,
    });
  } catch (error) {
    dbInstance = getFirestore(app);
  }
}

export const db = dbInstance;
export const rtdb = app && firebaseConfig.databaseURL ? getDatabase(app) : (null as any);
export const auth = app ? getAuth(app) : (null as any);
export default app;
