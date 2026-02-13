
import { initializeApp } from "firebase/app";
// @ts-ignore - Fixing "no exported member 'getAuth'" error in specific TypeScript environments
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Using a type-agnostic access to import.meta.env to satisfy the TS compiler
const metaEnv = (import.meta as any).env;

const firebaseConfig = {
  apiKey: metaEnv.VITE_API_KEY,
  authDomain: metaEnv.VITE_AUTH_DOMAIN,
  projectId: metaEnv.VITE_PROJECT_ID,
  storageBucket: metaEnv.VITE_STORAGE_BUCKET,
  messagingSenderId: metaEnv.VITE_MESSAGING_SENDER_ID,
  appId: metaEnv.VITE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
