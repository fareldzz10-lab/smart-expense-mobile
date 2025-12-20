import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import type { User, Auth } from "firebase/auth";
import type { FirebaseApp } from "firebase/app";
import { UserProfile } from "../types";

// Konfigurasi Hardcoded (Sesuai Screenshot Anda)
const firebaseConfig = {
  apiKey: "AIzaSyBFSteGdB0TFUyfSzjiGxxGVm5YgCBDqIk",
  authDomain: "smart-expense-mobile.firebaseapp.com",
  projectId: "smart-expense-mobile",
  storageBucket: "smart-expense-mobile.firebasestorage.app",
  messagingSenderId: "418250456324",
  appId: "1:418250456324:web:18e13a51aff1942a372451",
};

// Initialize Firebase with Singleton Pattern
let app: FirebaseApp;

// Check if firebase app is already initialized to prevent errors
if (getApps().length > 0) {
  app = getApp();
  console.log("Firebase using existing instance.");
} else {
  try {
    app = initializeApp(firebaseConfig);
    console.log("Firebase initialized fresh.");
  } catch (e) {
    console.error("Firebase Initialization Error:", e);
    // Re-throw to ensure we don't try to use an uninitialized app
    throw e;
  }
}

// Initialize Auth
const auth: Auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth };

export const loginWithGoogle = async (): Promise<UserProfile | null> => {
  if (!auth) {
    console.error("Firebase Auth not initialized.");
    return null;
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    if (!user) return null;

    return {
      name: user.displayName || "User",
      email: user.email || "",
      currency: "IDR",
      avatarUrl:
        user.photoURL ||
        `https://ui-avatars.com/api/?name=${user.displayName}&background=random`,
    };
  } catch (error: any) {
    console.error("Firebase Login Error Full:", error);
    if (error.code === "auth/configuration-not-found") {
      alert(
        "Error Config: Pastikan domain localhost sudah ada di Authorized Domains di Firebase Console."
      );
    } else if (error.code === "auth/popup-closed-by-user") {
      // User closed the popup, no need to alert
      console.log("Login cancelled by user");
    } else {
      alert("Gagal Login: " + error.message);
    }
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

export const subscribeToAuthChanges = (
  callback: (user: User | null) => void
) => {
  if (!auth) {
    setTimeout(() => callback(null), 100);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};
