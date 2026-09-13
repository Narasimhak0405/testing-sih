import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const requiredConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const missingConfig = Object.entries(requiredConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

export const firebaseConfigError =
  missingConfig.length > 0
    ? `Firebase configuration is missing: ${missingConfig.join(", ")}. Set the VITE_FIREBASE_* variables in Vercel project settings.`
    : "";

export const firebaseConfigured = missingConfig.length === 0;

const firebaseApp =
  firebaseConfigured
    ? getApps().length
      ? getApps()[0]
      : initializeApp(requiredConfig)
    : null;

export const auth = firebaseApp ? getAuth(firebaseApp) : null;
