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

// --- CONFIG HARDCODED ---
const firebaseConfig = {
  apiKey: "AIzaSyBFSteGdB0TFUyfSzjiGxxGVm5YgCBDqIk",
  authDomain: "smart-expense-mobile.firebaseapp.com",
  projectId: "smart-expense-mobile",
  storageBucket: "smart-expense-mobile.firebasestorage.app",
  messagingSenderId: "418250456324",
  appId: "1:418250456324:web:18e13a51aff1942a372451",
};

// Initialize Firebase
let app;
let auth: any;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  console.log("Firebase initialized successfully.");
} catch (e) {
  console.error("Firebase Initialization Error:", e);
}

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

    return {
      name: user.displayName || "User",
      email: user.email || "",
      currency: "IDR",
      avatarUrl:
        user.photoURL ||
        `https://ui-avatars.com/api/?name=${user.displayName}&background=random`,
    };
  } catch (error: any) {
    console.error("Firebase Login Error:", error);
    if (error.code !== "auth/popup-closed-by-user") {
      alert("Gagal Login: " + error.message);
    }
    return null;
  }
};

// --- BAGIAN YANG DIPERBAIKI (LOGOUT) ---
export const logoutUser = async () => {
  if (!auth) return false;
  try {
    // 1. Tunggu proses Sign Out Firebase sampai BENAR-BENAR selesai
    await auth.signOut();

    // 2. Bersihkan data lokal setelah step 1 sukses
    localStorage.removeItem("smart_expense_user");
    localStorage.clear();

    // 3. Beri jeda sedikit (500ms) untuk memastikan browser menghapus session
    setTimeout(() => {
      window.location.reload();
    }, 500);

    return true;
  } catch (error) {
    console.error("Logout Error:", error);
    // Tetap paksa reload jika error, agar tidak stuck
    window.location.reload();
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
