import React, { useState, useEffect } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { useWallet } from "../contexts/WalletContext";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  ShieldCheck,
  CreditCard,
  History,
  Loader2,
  MessageSquare,
  LogOut,
  Copy,
  Check,
  Bell,
  Share2,
  ChevronRight,
  LayoutGrid,
} from "lucide-react";
import { TabButton } from "../components/settings/TabButton";
import { SettingsContent } from "../components/settings/SettingsContent";
import { InstallModal } from "../components/settings/InstallModal";
import { ShareModal } from "../components/shared/ShareModal";
import { SettingsSkeleton } from "../components/shared/PageSkeletons";

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { balance, transactions, loading } = useWallet();
  const { user, profile, refreshProfile, logout, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "profile" | "bank" | "security" | "history" | "notifications" | "language" | "display" | "reports"
  >(() => {
    return (sessionStorage.getItem("settings_active_tab") as any) || "profile";
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const [profileData, setProfileData] = useState({
    first_name: "",
    last_name: "",
    username: "",
    phone_number: "",
    address: "",
    kyc_status: "unverified",
    bank_network: "",
    bank_account: "",
    bank_name: "",
    code: "",
    email: "",
  });

  // Sync with AuthContext profile
  useEffect(() => {
    if (profile) {
      setProfileData({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        username: profile.username || "",
        phone_number: profile.phone_number || "",
        address: profile.address || "",
        kyc_status: profile.kyc_status || "unverified",
        bank_network: profile.bank_network || "",
        bank_account: profile.bank_account || "",
        bank_name: profile.bank_name || "",
        code: profile.code || "",
        email: profile.email || user?.email || "",
      });
    }
  }, [profile]);

  const handleCopyCode = (code: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    logout();
  };

  const handleShare = async () => {
    setIsShareModalOpen(true);
  };

  // Close modal when resizing to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close any open modal/panel on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isShareModalOpen) setIsShareModalOpen(false);
        else if (isInstallModalOpen) setIsInstallModalOpen(false);
        else if (isModalOpen) setIsModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, isInstallModalOpen, isShareModalOpen]);

  const handleTabChange = (
    tab:
      | "profile"
      | "bank"
      | "security"
      | "history"
      | "notifications"
      | "language"
      | "display"
      | "reports",
  ) => {
    setActiveTab(tab);
    sessionStorage.setItem("settings_active_tab", tab);
    if (window.innerWidth < 768) {
      setIsModalOpen(true);
    }
  };

  const handleCreateShortcut = async () => {
    // Detect iOS
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

    if (isIOS) {
      setIsInstallModalOpen(true);
    } else {
      // Trigger Android/Chrome prompt
      const deferredPrompt = (window as any).deferredPrompt;
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        (window as any).deferredPrompt = null;
      } else {
        // Fallback for desktop or non-installable state
        alert(
          "To install, use your browser's 'Install' or 'Add to Home Screen' menu.",
        );
      }
    }
  };

  if (loading || authLoading) {
    return <SettingsSkeleton />;
  }

  return (
    <div className="pt-24 pb-32 px-4 sm:px-6 max-w-5xl mx-auto flex flex-col md:flex-row gap-6 sm:gap-8">
      {/* Sidebar Tabs */}
      <div className="md:w-64 space-y-5">
        {/* Account Section */}
        <div className="space-y-3">
          <h4 className="px-4 text-[9px] font-black text-text-muted uppercase tracking-[0.2em]">
            {t("account")}
          </h4>
          
          <div className="glass-card bg-card p-5 relative overflow-hidden group border-border shadow-lg">
            {/* Mesh Gradient Background */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[50px] -z-10 group-hover:bg-primary/20 transition-colors duration-500" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/5 blur-[40px] -z-10" />

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm">
                  <User size={20} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-text-main leading-tight truncate">
                    {profileData.first_name} {profileData.last_name}
                  </p>
                  <p className="text-[10px] font-medium text-text-muted uppercase tracking-widest mt-0.5">
                    {profile?.is_admin ? t("administrator") : t("traderAccount")}
                  </p>
                </div>
              </div>
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-tight shadow-sm shrink-0 ${
                  profileData.kyc_status === "verified" 
                    ? "bg-green-500/10 border-green-500/20 text-green-600" 
                    : "bg-amber-500/10 border-amber-500/20 text-amber-600"
                }`}
              >
                <ShieldCheck size={10} />
                {profileData.kyc_status === "verified" ? "Verified" : "Pending"}
              </div>
            </div>

            <div className="space-y-3 pt-3.5 border-t border-border shadow-inner">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mb-0.5">{t("totalBalance")}</p>
                  <p className="text-lg sm:text-xl font-black text-text-main tracking-tighter tabular-nums">
                    ${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-card-header/50 pl-2 pr-1 py-1 rounded-lg border border-border group/copy transition-colors hover:border-primary/30">
                  <span className="text-[11px] font-mono font-bold text-primary tracking-tight">
                    {profileData.code || "---"}
                  </span>
                  <button
                    onClick={() => handleCopyCode(profileData.code)}
                    className="p-1.5 hover:bg-card-header rounded-lg transition-all text-text-muted hover:text-text-main"
                  >
                    {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="space-y-3">
          <h4 className="px-4 text-[9px] font-black text-text-muted uppercase tracking-[0.2em]">
            {t("navigation")}
          </h4>
          <div className="glass-card bg-card p-1.5 space-y-0.5 border-border shadow-sm">
            <TabButton
              active={activeTab === "profile"}
              onClick={() => handleTabChange("profile")}
              icon={<User size={18} />}
              label={t("verification")}
            />
            <TabButton
              active={activeTab === "bank"}
              onClick={() => handleTabChange("bank")}
              icon={<CreditCard size={18} />}
              label={t("bankDetails")}
            />
            <TabButton
              active={activeTab === "security"}
              onClick={() => handleTabChange("security")}
              icon={<ShieldCheck size={18} />}
              label={t("accountSecurity") || t("changePassword")}
            />
            <TabButton
              active={activeTab === "history"}
              onClick={() => handleTabChange("history")}
              icon={<History size={18} />}
              label={t("historyDeposit")}
            />
            <TabButton
              active={activeTab === "notifications"}
              onClick={() => handleTabChange("notifications")}
              icon={<Bell size={18} />}
              label={t("notifications")}
            />
            <TabButton
              active={activeTab === "language"}
              onClick={() => handleTabChange("language")}
              icon={<div className="w-5 h-5 flex flex-col items-center justify-center leading-[0.7] text-[7px] font-black bg-card-header rounded border border-border"><span>EN</span><div className="w-3 h-[1px] bg-border my-0.5" /><span>TH</span></div>}
              label={t("languageSettings")}
            />
            <TabButton
              active={activeTab === "display"}
              onClick={() => handleTabChange("display")}
              icon={<LayoutGrid size={18} />}
              label={t("displaySettings")}
            />
            <TabButton
              active={activeTab === "reports"}
              onClick={() => handleTabChange("reports")}
              icon={<MessageSquare size={18} />}
              label={t("reportIssue") || (language === 'th' ? "รายงานปัญหา" : "Report Issue")}
            />
          </div>
        </div>

        {/* App Tools Section */}
        <div className="space-y-2.5">
          <h4 className="px-4 text-[9px] font-black text-text-muted uppercase tracking-[0.2em]">
            {t("appTools")}
          </h4>
          
          <div className="grid grid-cols-1 gap-1.5">
            <button
              onClick={handleCreateShortcut}
              className="group flex items-center justify-between gap-3 px-4 py-2 sm:py-2.5 rounded-xl bg-card text-text-main hover:bg-card-header/50 transition-all duration-300 border border-border hover:border-primary/30 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <LayoutGrid size={14} className="text-primary" />
                </div>
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest">{t("createShortcut")}</span>
              </div>
              <ChevronRight size={12} className="text-text-muted group-hover:text-primary transition-colors" />
            </button>

            <button
              onClick={handleShare}
              className="group flex items-center justify-between gap-3 px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 border border-white/10"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                  {copied ? <Check size={14} /> : <Share2 size={14} />}
                </div>
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest">{copied ? t("linkCopied") : t("shareApp")}</span>
              </div>
              {!copied && <ChevronRight size={12} className="opacity-40" />}
            </button>
          </div>
        </div>

        {/* Admin Section */}
        {profile?.is_admin && (
          <button
            onClick={() => navigate("/admin")}
            className="w-full py-3 rounded-xl bg-primary/10 text-primary font-black uppercase tracking-[0.15em] text-[9px] hover:bg-primary/20 transition-all border border-primary/20 hover:border-primary/40"
          >
            {t("adminDashboard")}
          </button>
        )}

        {/* Logout Section */}
        <div className="pt-2 border-t border-border">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-red-500/60 hover:text-red-500 bg-red-500/5 hover:bg-red-500/10 transition-all duration-300 font-black uppercase tracking-widest text-[9px] disabled:opacity-40 shadow-inner"
          >
            {loggingOut ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
            {loggingOut ? t("signingOut") : t("logout")}
          </button>
        </div>
      </div>

      {/* Main Content Area (Desktop) */}
      <div className="flex-1 hidden md:block md:pt-[24px]">
        <SettingsContent
          activeTab={activeTab}
          balance={balance}
          t={t}
          onClose={() => setIsModalOpen(false)}
          profileData={profileData}
          setProfileData={setProfileData}
          userId={user?.id}
          refreshProfile={refreshProfile}
          transactions={transactions}
        />
      </div>
      {/* Mobile Modal Overlay */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsModalOpen(false)}
            className="fixed inset-0 z-50 md:hidden bg-background/80 backdrop-blur-sm p-4 pt-10"
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[80vh] overflow-y-auto custom-scrollbar"
            >
              <SettingsContent
                activeTab={activeTab}
                balance={balance}
                t={t}
                onClose={() => setIsModalOpen(false)}
                isMobile
                profileData={profileData}
                setProfileData={setProfileData}
                userId={user?.id}
                refreshProfile={refreshProfile}
                transactions={transactions}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <InstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onInstall={handleCreateShortcut}
      />
    </div>
  );
};
