
import { initializeApp } from "firebase/app";
// @ts-ignore - Suppress false-positive module resolution error in some environments
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// @ts-ignore - Accessing Vite environment variables requires casting to any for ImportMeta in some TypeScript configurations
const firebaseConfig = {
  apiKey: (import.meta as any).env.VITE_API_KEY,
  authDomain: (import.meta as any).env.VITE_AUTH_DOMAIN,
  projectId: (import.meta as any).env.VITE_PROJECT_ID,
  storageBucket: (import.meta as any).env.VITE_STORAGE_BUCKET,
  messagingSenderId: (import.meta as any).env.VITE_MESSAGING_SENDER_ID,
  appId: (import.meta as any).env.VITE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
