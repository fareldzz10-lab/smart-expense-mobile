import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { UserProfile } from "../types";

// Safe accessor for environment variables to prevent crashes in different environments
const getEnv = (key: string): string => {
  try {
    // Check for Vite/ESM environment
    if (
      typeof import.meta !== "undefined" &&
      (import.meta as any).env &&
      (import.meta as any).env[key]
    ) {
      return (import.meta as any).env[key];
    }
  } catch (e) {
    // ignore
  }

  try {
    // Check for process.env (Node/Webpack)
    // @ts-ignore
    if (typeof process !== "undefined" && process.env && process.env[key]) {
      // @ts-ignore
      return process.env[key];
    }
  } catch (e) {
    // ignore
  }

  return "";
};

const firebaseConfig = {
  apiKey: getEnv("VITE_FIREBASE_API_KEY"),
  authDomain: getEnv("VITE_FIREBASE_AUTH_DOMAIN"),
  projectId: getEnv("VITE_FIREBASE_PROJECT_ID"),
  storageBucket: getEnv("VITE_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: getEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  appId: getEnv("VITE_FIREBASE_APP_ID"),
};

// Initialize Firebase
// We wrap this in a try-catch or check config to avoid immediate crashes if keys are missing
let app;
let auth: any;

try {
  if (firebaseConfig.apiKey) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
  } else {
    console.warn("Firebase config missing. Auth will not work.");
  }
} catch (e) {
  console.error("Firebase Initialization Error:", e);
}

const googleProvider = new GoogleAuthProvider();

export { auth };

export const loginWithGoogle = async (): Promise<UserProfile | null> => {
  if (!auth) {
    console.error("Firebase Auth not initialized. Check .env variables.");
    return null;
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    return {
      name: user.displayName || "User",
      email: user.email || "",
      currency: "IDR",
      avatarUrl:
        user.photoURL ||
        `https://ui-avatars.com/api/?name=${user.displayName}&background=random`,
    };
  } catch (error) {
    console.error("Firebase Login Error:", error);
    return null;
  }
};

export const logoutUser = async () => {
  if (!auth) return false;
  try {
    await signOut(auth);
    localStorage.removeItem("smart_expense_user");
    return true;
  } catch (error) {
    console.error("Logout Error:", error);
    return false;
  }
};

// Helper to subscribe to auth changes
export const subscribeToAuthChanges = (
  callback: (user: User | null) => void
) => {
  if (!auth) {
    // CRITICAL FIX: If auth is missing (no keys), immediately callback with null
    // so the app stops loading and shows the login screen.
    setTimeout(() => callback(null), 100);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};
