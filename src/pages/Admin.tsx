import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Activity, 
  History, 
  MessageSquare,
  Users,
  Settings
} from "lucide-react";
import type { Profile, GlobalSettings } from "../types";
import { useLanguage } from "../contexts/LanguageContext";
import { AuditLogTable } from "../components/admin/AuditLogTable";
import { auditService } from "../services/auditService";
import { useAuth } from "../contexts/AuthContext";
import { UserActivityLog } from "../components/admin/UserActivityLog";
import { IssueManagement } from "../components/admin/IssueManagement";
import { AdminMobileNav } from "../components/admin/AdminMobileNav";
import { AdminHeader } from "../components/admin/AdminHeader";
import { AdminTabs } from "../components/admin/AdminTabs";
import { UsersTab } from "../components/admin/tabs/UsersTab";
import { SettingsTab } from "../components/admin/tabs/SettingsTab";
import { AdminSkeleton } from "../components/shared/PageSkeletons";

/* ─── Types ────────────────────────────────────────────── */
type AdminTab = "users" | "activity" | "logs" | "issues" | "settings";

/* ═══════════════════════════════════════════════════════ */
export const Admin: React.FC = () => {
  const { t, language } = useLanguage();
  const { profile: currentAdmin } = useAuth();

  /* ── State ─────────────────────────────────────────── */
  const [activeTab, setActiveTab] = useState<AdminTab>(() => {
    return (sessionStorage.getItem("adminActiveTab") as AdminTab) || "users";
  });

  useEffect(() => {
    sessionStorage.setItem("adminActiveTab", activeTab);
  }, [activeTab]);

  const [pendingIssuesCount, setPendingIssuesCount] = useState(0);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>({
    contact_phone: "",
    contact_line: "",
    contact_telegram: "",
    contact_whatsapp: "",
    contact_facebook: "",
    contact_email: "",
    contact_discord: "",
    phone_enabled: true,
    line_enabled: true,
    telegram_enabled: true,
    whatsapp_enabled: false,
    facebook_enabled: false,
    email_enabled: false,
    discord_enabled: false,
    registration_otp_enabled: true,
    change_email_otp_enabled: true,
    change_password_otp_enabled: true,
    recovery_otp_enabled: true,
    winner_email_enabled: true,
    emailjs_public_key: "",
    emailjs_service_id: "",
    emailjs_template_otp: "",
    emailjs_template_win: "",
    // Wallet Credit Tier thresholds
    tier_1m_threshold: 0,
    tier_3m_threshold: 500,
    tier_5m_threshold: 1000,
    tier_15m_threshold: 2500,
    tier_20m_threshold: 5000,
    tier_30m_threshold: 10000,
  });

  const initialSettings = React.useRef<GlobalSettings>(globalSettings);

  /* ── Effects ───────────────────────────────────────── */
  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchSettings(), fetchPendingIssuesCount()]);
      setPageLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (activeTab === "logs") fetchAuditLogs();
  }, [activeTab]);

  /* ── Data fetchers ─────────────────────────────────── */
  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from("global_settings")
      .select("*")
      .eq("id", "main")
      .single();
    if (!error && data) {
      const fetched = {
        contact_phone: data.contact_phone || "",
        contact_line: data.contact_line || "",
        contact_telegram: data.contact_telegram || "",
        contact_whatsapp: data.contact_whatsapp || "",
        contact_facebook: data.contact_facebook || "",
        contact_email: data.contact_email || "",
        contact_discord: data.contact_discord || "",
        phone_enabled: data.phone_enabled ?? true,
        line_enabled: data.line_enabled ?? true,
        telegram_enabled: data.telegram_enabled ?? true,
        whatsapp_enabled: data.whatsapp_enabled ?? false,
        facebook_enabled: data.facebook_enabled ?? false,
        email_enabled: data.email_enabled ?? false,
        discord_enabled: data.discord_enabled ?? false,
        registration_otp_enabled: data.registration_otp_enabled ?? true,
        change_email_otp_enabled: data.change_email_otp_enabled ?? true,
        change_password_otp_enabled: data.change_password_otp_enabled ?? true,
        recovery_otp_enabled: data.recovery_otp_enabled ?? true,
        winner_email_enabled: data.winner_email_enabled ?? true,
        emailjs_public_key: data.emailjs_public_key || "",
        emailjs_service_id: data.emailjs_service_id || "",
        emailjs_template_otp: data.emailjs_template_otp || "",
        emailjs_template_win: data.emailjs_template_win || "",
        // Wallet Credit Tier thresholds
        tier_1m_threshold: data.tier_1m_threshold ?? 0,
        tier_3m_threshold: data.tier_3m_threshold ?? 500,
        tier_5m_threshold: data.tier_5m_threshold ?? 1000,
        tier_15m_threshold: data.tier_15m_threshold ?? 2500,
        tier_20m_threshold: data.tier_20m_threshold ?? 5000,
        tier_30m_threshold: data.tier_30m_threshold ?? 10000,
      };
      setGlobalSettings(fetched);
      initialSettings.current = fetched;
    }
  };

  const fetchPendingIssuesCount = async () => {
    const { count, error } = await supabase
      .from("issue_reports")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");
    if (!error) setPendingIssuesCount(count || 0);
  };

  const fetchAuditLogs = async () => {
    setLogsLoading(true);
    const logs = await auditService.fetchLogs(100);
    setAuditLogs(logs);
    setLogsLoading(false);
  };

  const logAdminAction = async (
    actionType: any,
    description: string,
    extra: object,
    targetProfile?: Profile,
  ) => {
    if (!currentAdmin?.id) return;
    await auditService.logAction({
      adminId: currentAdmin.id,
      adminEmail: currentAdmin.email || "unknown",
      targetUserId: targetProfile?.id,
      targetUserEmail: targetProfile?.email,
      actionType,
      description,
      details: extra,
    });
    if (activeTab === "logs") fetchAuditLogs();
  };

  /* ── Tab definitions ───────────────────────────────── */
  const TABS: { id: AdminTab; labelKey: string; icon?: React.ReactNode }[] = [
    { id: "users", labelKey: "users", icon: <Users size={13} /> },
    { id: "activity", labelKey: "activity", icon: <Activity size={13} /> },
    { id: "logs", labelKey: "auditLogs", icon: <History size={13} /> },
    { id: "issues", labelKey: "reports", icon: <MessageSquare size={13} /> },
    { id: "settings", labelKey: "settings", icon: <Settings size={13} /> },
  ];

  const fadeProps = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
    transition: { duration: 0.2 }
  };

  /* ── Tab handling with unsaved changes guard ──────────────── */
  const handleTabChange = (newTab: AdminTab) => {
    // Check for unsaved settings changes
    const isDirty = JSON.stringify(initialSettings.current) !== JSON.stringify(globalSettings);
    
    if (activeTab === "settings" && isDirty && newTab !== "settings") {
      const confirmLeave = window.confirm(
        language === "th" 
          ? "คุณยังไม่ได้บันทึกการเปลี่ยนแปลงในการตั้งค่า ต้องการออกจากหน้านี้โดยไม่บันทึกใช่หรือไม่?" 
          : "You have unsaved settings. Do you want to leave without saving?"
      );
      if (!confirmLeave) return;
    }
    setActiveTab(newTab);
  };

  if (pageLoading) {
    return <AdminSkeleton />;
  }

  return (
    <div className="pt-24 pb-32 px-4 md:px-6 max-w-7xl mx-auto">
      <AdminHeader language={language} />

      <AdminTabs 
        tabs={TABS} 
        activeTab={activeTab} 
        setActiveTab={handleTabChange} 
        pendingIssuesCount={pendingIssuesCount} 
      />

      <div className="min-h-[500px]">
        <AnimatePresence mode="wait">
          {/* USERS */}
          {activeTab === "users" && (
            <UsersTab fadeProps={fadeProps} logAdminAction={logAdminAction} />
          )}

          {/* ACTIVITY */}
          {activeTab === "activity" && (
            <motion.div key="activity" {...fadeProps} className="space-y-6">
              <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
                <Activity size={20} className="text-primary" />
                {t("userActivity")}
              </h2>
              <UserActivityLog />
            </motion.div>
          )}

          {/* AUDIT LOGS */}
          {activeTab === "logs" && (
            <motion.div key="logs" {...fadeProps} className="space-y-6">
              <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
                <History size={20} className="text-primary" />
                {t("auditLogs")}
              </h2>
              <AuditLogTable logs={auditLogs} loading={logsLoading} />
            </motion.div>
          )}

          {/* ISSUES */}
          {activeTab === "issues" && (
            <motion.div key="issues" {...fadeProps} className="space-y-6">
              <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
                <MessageSquare size={20} className="text-primary" />
                {t("userReports")}
              </h2>
              <IssueManagement />
            </motion.div>
          )}

          {/* SETTINGS */}
          {activeTab === "settings" && (
            <SettingsTab 
              fadeProps={fadeProps} 
              globalSettings={globalSettings} 
              setGlobalSettings={setGlobalSettings} 
              logAdminAction={logAdminAction} 
              onSaveSuccess={(newSettings) => {
                initialSettings.current = newSettings;
              }}
            />
          )}
        </AnimatePresence>
      </div>

      <AdminMobileNav 
        activeTab={activeTab} 
        setActiveTab={handleTabChange} 
        pendingIssuesCount={pendingIssuesCount}
      />
    </div>
  );
};
