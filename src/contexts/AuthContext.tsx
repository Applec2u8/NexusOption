import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "../lib/supabase";
import { getPublicIP } from "../utils/ipUtils";
import { getDeviceDetails } from "../utils/deviceUtils";

export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email?: string | null;
  password?: string | null;
  code: string | null;
  phone_number: string | null;
  address: string | null;
  kyc_status: string;
  bank_network: string | null;
  bank_account: string | null;
  bank_name: string | null;
  avatar_url: string | null;
  balance: number;
  total_deposited?: number;
  is_admin: boolean;
  otp_code: string | null;
  otp_expires_at: string | null;
  is_verified: boolean;
  language?: string;
  updated_at: string;
}

export interface LocalUser {
  id: string;
  email?: string;
  user_metadata?: any;
}

export interface LocalSession {
  user: LocalUser | null;
  access_token?: string;
  session_id?: string;
}

interface AuthContextType {
  session: LocalSession | null;
  user: LocalUser | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
  isProfileLoading: boolean;
  refreshProfile: () => Promise<void>;
  login: (profile: Profile) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<LocalSession | null>(null);
  const [user, setUser] = useState<LocalUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  // --- Session Verification ---
  const verifySession = async (sessionId: string) => {
    if (!supabase) return false;
    try {
      const { data, error } = await supabase
        .from("user_sessions")
        .select("id")
        .eq("id", sessionId)
        .single();

      if (error || !data) {
        console.warn("Session expired or removed. Logging out...");
        handleLogout(false); // Logout without deleting DB (it's already gone)
        return false;
      }
      
      // Update last active
      await supabase
        .from("user_sessions")
        .update({ last_active: new Date().toISOString() })
        .eq("id", sessionId);
        
      return true;
    } catch (err) {
      return true; // Tentatively keep session on network error
    }
  };

  const fetchProfile = async (userId: string) => {
    if (!supabase) return;
    setIsProfileLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error.message);
        setProfile(null);
        setIsAdmin(false);
        handleLogout();
      } else {
        const localLang = localStorage.getItem('appLanguage');
        const finalProfile = { ...data };
        if (localLang && (localLang === 'th' || localLang === 'en')) {
          finalProfile.language = localLang;
        }

        setProfile(finalProfile);
        localStorage.setItem("user_profile", JSON.stringify(finalProfile));
        setIsAdmin(finalProfile.is_admin || false);
        if (finalProfile.email) {
          setUser(prev => prev ? { ...prev, email: finalProfile.email } : { id: userId, email: finalProfile.email });
        }
      }
    } catch (err) {
      console.error("Unexpected error fetching profile:", err);
    } finally {
      setIsProfileLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      const sessionId = localStorage.getItem("metabridge_session_id");
      if (sessionId) {
        const isValid = await verifySession(sessionId);
        if (!isValid) return;
      }
      await fetchProfile(user.id);
    }
  };

  const handleLogin = (newProfile: Profile) => {
    const localLang = localStorage.getItem('appLanguage');
    if (localLang && (localLang === 'th' || localLang === 'en')) {
      newProfile.language = localLang as any;
    }

    const localUser: LocalUser = { id: newProfile.id, email: newProfile.email || undefined };
    
    localStorage.setItem("metabridge_user_id", newProfile.id);
    localStorage.setItem("user_profile", JSON.stringify(newProfile));
    
    setProfile(newProfile);
    setIsAdmin(newProfile.is_admin || false);
    setUser(localUser);

    // Initial session state
    setSession({ user: localUser });

    // Handle session registration and history
    (async () => {
      if (!supabase) return;
      try {
        const { deviceName, osName, browserName } = getDeviceDetails();
        let ip = "Unknown IP";
        try { ip = await getPublicIP(); } catch (e) {}
        
        // 1. Create Active Session
        const { data: sessionData, error: sessionError } = await supabase
          .from("user_sessions")
          .insert({
            user_id: newProfile.id,
            device_name: deviceName,
            os_name: osName,
            browser_name: browserName,
            ip_address: ip
          })
          .select("id")
          .single();

        if (sessionError) throw sessionError;

        if (sessionData) {
          localStorage.setItem("metabridge_session_id", sessionData.id);
          setSession({ user: localUser, session_id: sessionData.id });
        }

        // 2. Record Login History
        await supabase.from("user_login_history").insert({
           user_id: newProfile.id,
           device_name: deviceName,
           os_name: osName,
           browser_name: browserName,
           ip_address: ip
        });
      } catch (err) {
        console.error("Error creating session", err);
      }
    })();
  };

  const handleLogout = async (cleanupDb = true) => {
    const sessionId = localStorage.getItem("metabridge_session_id");
    
    if (cleanupDb && sessionId && supabase) {
      await supabase.from("user_sessions").delete().eq("id", sessionId);
    }

    localStorage.removeItem("metabridge_user_id");
    localStorage.removeItem("metabridge_session_id");
    setUser(null);
    setProfile(null);
    setIsAdmin(false);
    setSession(null);
  };

  useEffect(() => {
    const checkUser = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }
      const storedUserId = localStorage.getItem("metabridge_user_id");
      const storedSessionId = localStorage.getItem("metabridge_session_id");
      
      if (storedUserId) {
        // Verification phase
        if (storedSessionId) {
          const isValid = await verifySession(storedSessionId);
          if (!isValid) {
            setLoading(false);
            return;
          }
        }

        const localUser: LocalUser = { id: storedUserId };
        setUser(localUser);
        setSession({ user: localUser, session_id: storedSessionId || undefined });
        await fetchProfile(storedUserId);
      } else {
        setProfile(null);
        setUser(null);
        setSession(null);
        setIsAdmin(false);
      }
      setLoading(false);
    };

    checkUser();

    // Set up periodic verification (every 1 minute)
    const interval = setInterval(() => {
      const sid = localStorage.getItem("metabridge_session_id");
      if (sid) verifySession(sid);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const contextValue = React.useMemo(() => ({
    session,
    user,
    profile,
    isAdmin,
    loading,
    isProfileLoading,
    refreshProfile,
    login: handleLogin,
    logout: handleLogout,
  }), [session, user, profile, isAdmin, loading, isProfileLoading]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined)
    throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
