import React, { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { Header } from "./components/mobile/Header";
import { BottomNav } from "./components/mobile/BottomNav";
import { FAB } from "./components/mobile/FAB";
import { AddTransactionModal } from "./components/mobile/AddTransactionModal";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import Advisor from "./pages/Advisor";
import Budgets from "./pages/Budgets";
import Auto from "./pages/Auto";
import Savings from "./pages/Savings";
import Tools from "./pages/Tools";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import {
  initDB,
  checkAndProcessRecurring,
  setCurrentUserId,
  seedCategories,
} from "./services/storageService";
import { UserProfile } from "./types";
import { ToastProvider } from "./context/ToastContext";
import { subscribeToAuthChanges } from "./services/firebase";

interface MainLayoutProps {
  user: UserProfile;
  currentPath: string;
  onNavigate: (path: string) => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  user,
  currentPath,
  onNavigate,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Hide FAB on certain screens
  const showFab =
    currentPath !== "/advisor" &&
    currentPath !== "/tools" &&
    currentPath !== "/settings";

  const renderPage = () => {
    switch (currentPath) {
      case "/":
        return <Dashboard key="home" user={user} />;
      case "/history":
        return <History key="history" user={user} />;
      case "/tools":
        return <Tools key="tools" />;
      case "/budgets":
        return <Budgets key="budgets" user={user} />;
      case "/savings":
        return <Savings key="savings" user={user} />;
      case "/advisor":
        return <Advisor key="advisor" />;
      case "/profile":
        return <Profile user={user} key="profile" onNavigate={onNavigate} />;
      case "/auto":
        return <Auto key="auto" user={user} />;
      case "/settings":
        return (
          <Settings
            key="settings"
            user={user}
            onBack={() => onNavigate("/profile")}
          />
        );
      default:
        return <Dashboard key="default" user={user} />;
    }
  };

  return (
    // changed h-screen to h-[100dvh] for mobile browser address bar support
    <div className="flex flex-col h-[100dvh] w-full max-w-md mx-auto text-slate-100 overflow-hidden relative shadow-2xl border-x border-white/5">
      {currentPath !== "/settings" && (
        <Header user={user} onNavigate={onNavigate} />
      )}

      <main className="flex-1 overflow-y-auto no-scrollbar pb-28 scroll-smooth relative z-10 overscroll-none">
        <AnimatePresence mode="wait">{renderPage()}</AnimatePresence>
      </main>

      {showFab && <FAB onClick={() => setIsModalOpen(true)} />}

      {currentPath !== "/settings" && (
        <BottomNav currentPath={currentPath} onNavigate={onNavigate} />
      )}

      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPath, setCurrentPath] = useState("/");

  useEffect(() => {
    // Initialize DB
    initDB();

    // Listen to Firebase Auth state
    const unsubscribe = subscribeToAuthChanges(async (firebaseUser) => {
      if (firebaseUser) {
        const userProfile: UserProfile = {
          name: firebaseUser.displayName || "User",
          email: firebaseUser.email || "",
          currency: "IDR",
          avatarUrl:
            firebaseUser.photoURL ||
            `https://ui-avatars.com/api/?name=${firebaseUser.displayName}&background=random`,
        };

        setUser(userProfile);
        setCurrentUserId(userProfile.email);
        await seedCategories();
        await checkAndProcessRecurring();
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <ToastProvider>
      {!user ? (
        <Login onLogin={setUser} />
      ) : (
        <MainLayout
          user={user}
          currentPath={currentPath}
          onNavigate={setCurrentPath}
        />
      )}
    </ToastProvider>
  );
};

export default App;
