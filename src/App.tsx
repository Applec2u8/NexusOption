import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { WalletProvider } from "./contexts/WalletContext";
import { Layout } from "./components/layout/Layout";
import { Home } from "./pages/Home";
import { Trade } from "./pages/Trade";
import { Wallet } from "./pages/Wallet";
import { Settings } from "./pages/Settings";
import { History } from "./pages/History";
import { News } from "./pages/News";
import { AuthForms } from "./components/auth/AuthForms";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Admin } from "./pages/Admin";
import { ScrollToTop } from "./components/layout/ScrollToTop";
import { SystemLoader } from "./components/shared/SystemLoader";
import { supabaseUrl, supabaseAnonKey } from "./lib/supabase";

function AppContent() {
  const { session, isAdmin, loading } = useAuth();
  
  // System Integrity Check
  useEffect(() => {
    const requiredEnv = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_PUBLISHABLE_KEY',
      'VITE_FINNHUB_API_KEY'
    ];
    
    const missing = requiredEnv.filter(key => !import.meta.env[key]);
    if (missing.length > 0) {
      console.warn(`[System Check] Missing environment variables: ${missing.join(', ')}`);
      console.warn("The application may not function correctly without these keys.");
    } else {
      console.log("[System Check] All core environment variables are present.");
    }
  }, []);

  // Push Notification Initialization
  useEffect(() => {
    const userId = session?.user?.id;
    if (userId) {
      import("./services/pushNotificationService").then(({ pushNotificationService }) => {
        pushNotificationService.init(userId);
      });
    }
  }, [session?.user?.id]);

  // Audio Unlocker for Mobile Browsers
  useEffect(() => {
    const unlockAudio = () => {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      
      // Also play a tiny silent sound to unlock HTML5 Audio
      const silentAudio = new Audio();
      silentAudio.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
      silentAudio.play().catch(() => {});
      
      // Remove listeners once unlocked
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };

    window.addEventListener('click', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);

    // PWA Install Prompt Handler
    const handleInstallPrompt = (e: any) => {
      e.preventDefault();
      (window as any).deferredPrompt = e;
    };
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    
    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
    };
  }, []);

  // If environment variables are missing, show the loading/error screen with a specific message
  if (!supabaseUrl || !supabaseAnonKey) {
    return <SystemLoader message="System Configuration Missing" />;
  }

  if (loading) {
    return <SystemLoader message="Accessing Nexus Option" />;
  }

  if (!session) {
    return <AuthForms />;
  }

  return (
    <WalletProvider>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="trade" element={<Trade />} />
          <Route path="news" element={<News />} />
          <Route path="history" element={<History />} />
          <Route path="wallet" element={<Wallet />} />
          <Route path="settings" element={<Settings />} />

          <Route
            path="admin"
            element={isAdmin ? <Admin /> : <Navigate to="/" replace />}
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </WalletProvider>
  );
}

import { ThemeProvider } from "./contexts/ThemeContext";

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
