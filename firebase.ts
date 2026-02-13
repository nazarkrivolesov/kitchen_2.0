import { initializeApp } from "firebase/app";
// Fix: Use any casting to handle potential type resolution issues with firebase/auth where members are reported as not exported
import * as authModule from "firebase/auth";
const { getAuth } = authModule as any;
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Fix: Use any casting for import.meta to bypass TypeScript environment issues with Vite's env properties
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
