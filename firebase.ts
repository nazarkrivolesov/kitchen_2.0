import { initializeApp } from "firebase/app";
// Fix: Use any casting to handle potential type resolution issues with firebase/auth where members are reported as not exported
import * as authModule from "firebase/auth";
const { getAuth } = authModule as any;
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

/**
 * Safely access environment variables with fallbacks.
 * This helper ensures compatibility whether the app is running in a Vite environment,
 * a Node-like environment with process.env, or a browser context where variables are shimmed.
 */
const getEnv = (key: string): string => {
  // Check Vite's import.meta.env
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      const val = (import.meta as any).env[key];
      if (val) return val;
    }
  } catch (e) {
    // import.meta might not be available in all contexts
  }
  
  // Check Node-style process.env (common in many CI/CD and deployment environments)
  try {
    if (typeof process !== 'undefined' && process.env) {
      const val = (process.env as any)[key];
      if (val) return val;
    }
  } catch (e) {
    // process might not be available
  }

  // Check globalThis fallbacks
  try {
    const globalEnv = (globalThis as any).process?.env || (window as any).process?.env;
    if (globalEnv && globalEnv[key]) {
      return globalEnv[key];
    }
  } catch (e) {
    // process on globalThis/window might not be available
  }

  return '';
};

// Exclusively use process.env.API_KEY pattern where possible as per guidelines
const firebaseConfig = {
  apiKey: getEnv('API_KEY') || getEnv('VITE_API_KEY'),
  authDomain: getEnv('VITE_AUTH_DOMAIN'),
  projectId: getEnv('VITE_PROJECT_ID'),
  storageBucket: getEnv('VITE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('VITE_MESSAGING_SENDER_ID'),
  appId: getEnv('VITE_APP_ID')
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
