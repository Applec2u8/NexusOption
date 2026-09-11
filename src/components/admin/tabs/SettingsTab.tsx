import React, { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { motion } from "framer-motion";
import { 
  Settings2, 
  Phone, 
  MessageCircle, 
  Send, 
  MessageSquare, 
  Globe, 
  Mail, 
  Hash, 
  Shield, 
  ShieldAlert, 
  Loader2, 
  Save,
  Activity,
  Trophy,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Lock
} from "lucide-react";
import { AdminInput } from "../AdminInput";
import { emailService } from "../../../services/emailService";
import type { GlobalSettings, EmailProvider } from "../../../types";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useAuth } from "../../../contexts/AuthContext";

interface SettingsTabProps {
  fadeProps: any;
  globalSettings: GlobalSettings;
  setGlobalSettings: React.Dispatch<React.SetStateAction<GlobalSettings>>;
  logAdminAction: (actionType: string, description: string, extra: object) => Promise<void>;
  onSaveSuccess?: (newSettings: GlobalSettings) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ 
  fadeProps, 
  globalSettings, 
  setGlobalSettings,
  logAdminAction,
  onSaveSuccess
}) => {
  const { t, language } = useLanguage();
  const { profile: currentAdmin } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string } | null>(null);
  const [isEmailSaving, setIsEmailSaving] = useState(false);
  const [providers, setProviders] = useState<EmailProvider[]>([]);
  const [isFetchingProviders, setIsFetchingProviders] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProvider, setNewProvider] = useState<Partial<EmailProvider>>({
    name: '',
    public_key: '',
    service_id: '',
    template_otp: '',
    template_win: '',
    is_active: true,
    priority: 0,
    sent_count: 0
  });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    setIsFetchingProviders(true);
    console.log('[SettingsTab] Fetching email providers...');
    try {
      setFetchError(null);
      const { data, error } = await supabase
        .from('email_providers')
        .select('*')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('[SettingsTab] Supabase Error:', error);
        setFetchError(error.message);
        throw error;
      }
      console.log('[SettingsTab] Providers found:', data?.length);
      setProviders(data || []);
    } catch (err: any) {
      console.error('[SettingsTab] Fetch Error:', err);
      setFetchError(err.message || 'Unknown error fetching providers');
    } finally {
      setIsFetchingProviders(false);
    }
  };

  const handleAddProvider = async () => {
    if (!newProvider.public_key || !newProvider.service_id) {
      alert("Please fill in Public Key and Service ID");
      return;
    }
    setIsEmailSaving(true);
    try {
      const { error } = await supabase
        .from('email_providers')
        .insert([{ ...newProvider, name: newProvider.name || 'EmailJS Provider' }]);
      
      if (error) throw error;
      setShowAddForm(false);
      setNewProvider({
        name: '',
        public_key: '',
        service_id: '',
        template_otp: '',
        template_win: '',
        is_active: true,
        priority: 0,
        sent_count: 0
      });
      fetchProviders();
      alert("Provider added successfully!");
    } catch (err: any) {
      alert("Error adding provider: " + err.message);
    } finally {
      setIsEmailSaving(false);
    }
  };

  const handleDeleteProvider = async (id: string) => {
    if (deleteConfirmText !== "confirm") {
      alert("Please type 'confirm' to delete.");
      return;
    }
    try {
      const { error } = await supabase
        .from('email_providers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setDeleteConfirmId(null);
      setDeleteConfirmText("");
      fetchProviders();
    } catch (err: any) {
      alert("Error deleting provider: " + err.message);
    }
  };

  const handleToggleProvider = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('email_providers')
        .update({ is_active: !currentStatus })
        .eq('id', id);
      
      if (error) throw error;
      fetchProviders();
    } catch (err: any) {
      alert("Error toggling provider: " + err.message);
    }
  };
  // Field groups
  const emailFields: (keyof GlobalSettings)[] = [
    'emailjs_public_key', 
    'emailjs_service_id', 
    'emailjs_template_otp', 
    'emailjs_template_win'
  ];

  // Track original settings to detect changes
  const [initialSettings, setInitialSettings] = useState<GlobalSettings>(globalSettings);
  
  // Check if global (non-email) fields are dirty
  const isGlobalDirty = Object.keys(globalSettings).some(key => {
    const k = key as keyof GlobalSettings;
    return !emailFields.includes(k) && initialSettings[k] !== globalSettings[k];
  });

  // Check if email fields are dirty
  const isEmailDirty = emailFields.some(k => initialSettings[k] !== globalSettings[k]);

  // Alert before refresh/leave
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isGlobalDirty || isEmailDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isGlobalDirty, isEmailDirty]);

  const handleUpdateSettings = async () => {
    setIsSaving(true);
    try {
      // Exclude email fields from global update
      const globalUpdates = { ...globalSettings };
      emailFields.forEach(field => delete globalUpdates[field]);

      const { error } = await supabase
        .from("global_settings")
        .update(globalUpdates)
        .eq("id", "main");

      if (error) throw error;
      
      // Update local initial settings for non-email fields to reset isGlobalDirty
      setInitialSettings(prev => {
        const next = { ...prev };
        (Object.keys(globalSettings) as (keyof GlobalSettings)[]).forEach(k => {
          if (!emailFields.includes(k)) {
            (next as any)[k] = globalSettings[k];
          }
        });
        return next;
      });

      await logAdminAction(
        "UPDATE_SETTINGS", 
        "Updated Global System Settings", 
        globalUpdates
      );
      
      if (onSaveSuccess) onSaveSuccess(globalSettings);
      alert(t("settingsUpdated") || "Settings updated successfully!");
    } catch (error: any) {
      console.error("Error updating settings:", error);
      alert("Error updating settings: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestEmail = async () => {
    const adminEmail = currentAdmin?.email || "";
    if (!adminEmail) {
      setTestResult({ success: false, msg: "Current admin email not found." });
      return;
    }

    setIsTestingEmail(true);
    setTestResult(null);

    try {
      const result = await emailService.sendOTP({
        email: adminEmail,
        code: "123456",
        userName: currentAdmin?.first_name || "Admin",
        lang: language as any,
        type: 'verification'
      });

      setIsTestingEmail(false);
      if (result.success) {
        setTestResult({ 
          success: true, 
          msg: `Test email sent successfully to ${adminEmail}` 
        });
      } else {
        setTestResult({ success: false, msg: result.error || "Failed to send test email." });
      }
    } catch (err: any) {
      setIsTestingEmail(false);
      setTestResult({ success: false, msg: err.message || "Error occurred during testing." });
    }
  };

  return (
    <motion.div {...fadeProps} className="space-y-6 px-4 sm:px-0">

      {/* ── Wallet Credit Tier Settings ──────────────── */}
      <div className="glass-card bg-card border border-border rounded-3xl overflow-hidden shadow-xl">
        {/* Header */}
        <div className="relative p-4 sm:p-8 pb-5 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border-b border-border rounded-2xl overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-full bg-gradient-to-l from-amber-500/5 to-transparent pointer-events-none" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="shrink-0 w-12 h-12 rounded-2xl bg-amber-500/15 flex items-center justify-center text-amber-500 border border-amber-500/30 shadow-inner">
              <Lock size={22} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-text-main uppercase tracking-tight">
                Wallet Credit Tier
              </h2>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mt-1">
                กำหนดวงเงินสะสมขั้นต่ำสำหรับ unlock แต่ละ Timeframe
              </p>
            </div>
          </div>
        </div>

        {/* Tier rows */}
        <div className="p-4 sm:p-8 space-y-4">
          <p className="text-[11px] text-text-muted font-bold leading-relaxed">
            ระบบจะ <span className="text-amber-400 font-black">Lock</span> timeframe ที่ผู้ใช้ยังไม่ถึงเกณฑ์ยอดเติมเงินสะสม (total_deposited) — <span className="text-text-main">ไม่ใช่ยอดเงินปัจจุบัน</span>
          </p>

          {[
            { key: "tier_1m_threshold" as const,  label: "1m",  payout: 10,  color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
            { key: "tier_3m_threshold" as const,  label: "3m",  payout: 15,  color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
            { key: "tier_5m_threshold" as const,  label: "5m",  payout: 20,  color: "bg-teal-500/20 text-teal-400 border-teal-500/30" },
            { key: "tier_15m_threshold" as const, label: "15m", payout: 25,  color: "bg-green-500/20 text-green-400 border-green-500/30" },
            { key: "tier_20m_threshold" as const, label: "20m", payout: 30,  color: "bg-violet-500/20 text-violet-400 border-violet-500/30" },
            { key: "tier_30m_threshold" as const, label: "30m", payout: 35,  color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
          ].map(({ key, label, payout, color }) => (
            <div key={key} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 rounded-2xl bg-card-header/30 border border-border hover:border-border/70 transition-colors">
              {/* Badge */}
              <div className={`shrink-0 mb-2 sm:mb-0 flex flex-col items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl border font-black ${color}`}>
                <span className="text-lg leading-none">{label}</span>
                <span className="text-[9px] font-black opacity-80">+{payout}%</span>
              </div>
              {/* Label */}
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-black text-text-main break-words">{label} Timeframe (+{payout}% Profit)</p>
                <p className="text-[10px] text-text-muted font-bold mt-0.5 break-words">
                  {(globalSettings[key] ?? 0) === 0
                    ? "ทุกคนใช้ได้ทันที (ไม่ต้องผ่านเกณฑ์)"
                    : `ต้องเคยเติมเงินสะสม ≥ $${Number(globalSettings[key]).toLocaleString()}`
                  }
                </p>
              </div>
              {/* Input */}
              <div className="w-full sm:w-auto flex items-center sm:items-center justify-end gap-1.5">
                <span className="text-sm font-black text-text-muted mr-2 sm:mr-0">$</span>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={globalSettings[key] ?? 0}
                  onChange={(e) =>
                    setGlobalSettings((prev) => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))
                  }
                  className="w-full sm:w-20 sm:w-24 bg-transparent border border-border hover:border-primary/50 focus:border-primary rounded-xl py-2 px-3 text-sm font-black text-text-main focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all tabular-nums text-right"
                />
              </div>
            </div>
          ))}

          <div className="flex justify-end pt-2">
            <button
              onClick={handleUpdateSettings}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500 text-amber-500 hover:text-white border border-amber-500/30 font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-sm"
            >
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              บันทึก Tier Settings
            </button>
          </div>
        </div>
      </div>

      {/* ── System / Contact Settings ─────────────── */}
      <div className="glass-card bg-card border border-border rounded-3xl p-4 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="shrink-0 w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
              <Settings2 size={24} />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-black text-text-main uppercase tracking-tight truncate">
                {t("systemSettings")}
              </h2>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mt-1 line-clamp-1">
                {t("manageContactPolicy")}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleUpdateSettings}
            disabled={isSaving || !isGlobalDirty}
            className={`shrink-0 flex items-center justify-center gap-2 px-5 py-3 sm:px-8 sm:py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all ${
              isSaving || !isGlobalDirty
                ? "bg-card-header text-text-muted cursor-not-allowed"
                : "bg-green-500 hover:bg-green-400 text-white shadow-[0_8px_20px_-4px_rgba(34,197,94,0.3)] active:scale-95"
            }`}
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isSaving ? t("loading") : t("save")}
          </button>
        </div>

        {/* Contact Links */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AdminInput icon={<Phone size={18} />} label={t("phoneNumber")} value={globalSettings.contact_phone} onChange={(val) => setGlobalSettings(prev => ({ ...prev, contact_phone: val }))} enabled={globalSettings.phone_enabled} onToggle={() => setGlobalSettings(prev => ({ ...prev, phone_enabled: !prev.phone_enabled }))} isPhone={true} />
            <AdminInput icon={<MessageCircle size={18} />} label="LINE ID" value={globalSettings.contact_line} onChange={(val) => setGlobalSettings(prev => ({ ...prev, contact_line: val }))} enabled={globalSettings.line_enabled} onToggle={() => setGlobalSettings(prev => ({ ...prev, line_enabled: !prev.line_enabled }))} />
            <AdminInput icon={<Send size={18} />} label="Telegram" value={globalSettings.contact_telegram} onChange={(val) => setGlobalSettings(prev => ({ ...prev, contact_telegram: val }))} enabled={globalSettings.telegram_enabled} onToggle={() => setGlobalSettings(prev => ({ ...prev, telegram_enabled: !prev.telegram_enabled }))} />
            <AdminInput icon={<MessageSquare size={18} />} label="WhatsApp" value={globalSettings.contact_whatsapp} onChange={(val) => setGlobalSettings(prev => ({ ...prev, contact_whatsapp: val }))} enabled={globalSettings.whatsapp_enabled} onToggle={() => setGlobalSettings(prev => ({ ...prev, whatsapp_enabled: !prev.whatsapp_enabled }))} isPhone={true} />
            <AdminInput icon={<Globe size={18} />} label="Facebook" value={globalSettings.contact_facebook} onChange={(val) => setGlobalSettings(prev => ({ ...prev, contact_facebook: val }))} enabled={globalSettings.facebook_enabled} onToggle={() => setGlobalSettings(prev => ({ ...prev, facebook_enabled: !prev.facebook_enabled }))} />
            <AdminInput icon={<Mail size={18} />} label={t("supportEmail")} value={globalSettings.contact_email} onChange={(val) => setGlobalSettings(prev => ({ ...prev, contact_email: val }))} enabled={globalSettings.email_enabled} onToggle={() => setGlobalSettings(prev => ({ ...prev, email_enabled: !prev.email_enabled }))} />
            <AdminInput icon={<Hash size={18} />} label="Discord" value={globalSettings.contact_discord} onChange={(val) => setGlobalSettings(prev => ({ ...prev, contact_discord: val }))} enabled={globalSettings.discord_enabled} onToggle={() => setGlobalSettings(prev => ({ ...prev, discord_enabled: !prev.discord_enabled }))} />
          </div>

          <div className="pt-4 border-t border-border space-y-4">
            <h4 className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1">{t("securitySettings")}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Registration OTP */}
              <div className="p-4 rounded-2xl bg-card-header/30 border border-border flex items-center justify-between group hover:border-primary/20 transition-all shadow-sm">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${globalSettings.registration_otp_enabled ? "bg-primary/20 text-primary" : "bg-card-header text-text-muted"}`}>
                    <Shield size={20} />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-text-main block">{t("registrationOtp")}</span>
                    <p className="text-[10px] text-text-muted font-bold">{t("registrationOtpDesc")}</p>
                  </div>
                </div>
                <button onClick={() => setGlobalSettings(prev => ({ ...prev, registration_otp_enabled: !prev.registration_otp_enabled }))} className={`shrink-0 w-12 h-6 rounded-full transition-all relative ${globalSettings.registration_otp_enabled ? "bg-primary" : "bg-card-header shadow-inner border border-border"}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-md ${globalSettings.registration_otp_enabled ? "left-7" : "left-1"}`} />
                </button>
              </div>

              {/* Change Email OTP */}
              <div className="p-4 rounded-2xl bg-card-header/30 border border-border flex items-center justify-between group hover:border-primary/20 transition-all shadow-sm">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${globalSettings.change_email_otp_enabled ? "bg-blue-500/20 text-blue-500" : "bg-card-header text-text-muted"}`}>
                    <Mail size={20} />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-text-main block">{t("changeEmailOtp")}</span>
                    <p className="text-[10px] text-text-muted font-bold">{t("changeEmailOtpDesc")}</p>
                  </div>
                </div>
                <button onClick={() => setGlobalSettings(prev => ({ ...prev, change_email_otp_enabled: !prev.change_email_otp_enabled }))} className={`shrink-0 w-12 h-6 rounded-full transition-all relative ${globalSettings.change_email_otp_enabled ? "bg-blue-500" : "bg-card-header shadow-inner border border-border"}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-md ${globalSettings.change_email_otp_enabled ? "left-7" : "left-1"}`} />
                </button>
              </div>

              {/* Change Password OTP */}
              <div className="p-4 rounded-2xl bg-card-header/30 border border-border flex items-center justify-between group hover:border-primary/20 transition-all shadow-sm">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${globalSettings.change_password_otp_enabled ? "bg-amber-500/20 text-amber-500" : "bg-card-header text-text-muted"}`}>
                    <ShieldAlert size={20} />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-text-main block">{t("changePasswordOtp")}</span>
                    <p className="text-[10px] text-text-muted font-bold">{t("changePasswordOtpDesc")}</p>
                  </div>
                </div>
                <button onClick={() => setGlobalSettings(prev => ({ ...prev, change_password_otp_enabled: !prev.change_password_otp_enabled }))} className={`shrink-0 w-12 h-6 rounded-full transition-all relative ${globalSettings.change_password_otp_enabled ? "bg-amber-500" : "bg-card-header shadow-inner border border-border"}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-md ${globalSettings.change_password_otp_enabled ? "left-7" : "left-1"}`} />
                </button>
              </div>

              {/* Recovery OTP */}
              <div className="p-4 rounded-2xl bg-card-header/30 border border-border flex items-center justify-between group hover:border-primary/20 transition-all shadow-sm">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${globalSettings.recovery_otp_enabled ? "bg-purple-500/20 text-purple-500" : "bg-card-header text-text-muted"}`}>
                    <Globe size={20} />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-text-main block">{t("recoveryOtp")}</span>
                    <p className="text-[10px] text-text-muted font-bold">{t("recoveryOtpDesc")}</p>
                  </div>
                </div>
                <button onClick={() => setGlobalSettings(prev => ({ ...prev, recovery_otp_enabled: !prev.recovery_otp_enabled }))} className={`shrink-0 w-12 h-6 rounded-full transition-all relative ${globalSettings.recovery_otp_enabled ? "bg-purple-500" : "bg-card-header shadow-inner border border-border"}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-md ${globalSettings.recovery_otp_enabled ? "left-7" : "left-1"}`} />
                </button>
              </div>

              {/* Winner Email Notification */}
              <div className="p-4 rounded-2xl bg-card-header/30 border border-border flex items-center justify-between group hover:border-primary/20 transition-all shadow-sm">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${globalSettings.winner_email_enabled ? "bg-green-500/20 text-green-500" : "bg-card-header text-text-muted"}`}>
                    <Mail size={20} />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-text-main block">{t("winnerEmail")}</span>
                    <p className="text-[10px] text-text-muted font-bold">{t("winnerEmailDesc")}</p>
                  </div>
                </div>
                <button onClick={() => setGlobalSettings(prev => ({ ...prev, winner_email_enabled: !prev.winner_email_enabled }))} className={`shrink-0 w-12 h-6 rounded-full transition-all relative ${globalSettings.winner_email_enabled ? "bg-green-500" : "bg-card-header shadow-inner border border-border"}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-md ${globalSettings.winner_email_enabled ? "left-7" : "left-1"}`} />
                </button>
              </div>
            </div>
            
            <div className="flex justify-end pt-4">
              <button
                onClick={handleUpdateSettings}
                disabled={isSaving || !isGlobalDirty}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                  isSaving || !isGlobalDirty
                    ? "bg-card-header text-text-muted cursor-not-allowed"
                    : "bg-green-500 hover:bg-green-400 text-white shadow-lg shadow-green-500/20 active:scale-95"
                }`}
              >
                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {language === 'th' ? 'บันทึกการตั้งค่าความปลอดภัย' : 'SAVE SECURITY SETTINGS'}
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-border space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
              <div className="space-y-1">
                <h4 className="text-[10px] font-black text-text-muted uppercase tracking-widest">Email Provider Library</h4>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-[9px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                    <RefreshCw size={10} className="animate-spin-slow" />
                    Auto-Failover Active
                  </div>
                  <div className="text-[9px] font-bold text-text-muted bg-card-header/50 px-2 py-0.5 rounded-full border border-border">
                    Pool Size: {providers.length}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setShowAddForm(!showAddForm)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 ${
                  showAddForm 
                    ? "bg-card-header text-text-main border border-border" 
                    : "bg-primary text-white hover:bg-primary-hover shadow-primary/20"
                }`}
              >
                {showAddForm ? <XCircle size={14} /> : <Plus size={14} />}
                {showAddForm ? (language === 'th' ? 'ปิดฟอร์ม' : 'CLOSE FORM') : (language === 'th' ? 'เพิ่ม API ใหม่' : 'ADD NEW API')}
              </button>
            </div>

            {showAddForm && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 sm:p-6 rounded-2xl bg-primary/5 border border-primary/20 space-y-6"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Display Name</label>
                    <input
                      type="text"
                      value={newProvider.name}
                      onChange={(e) => setNewProvider((prev: Partial<EmailProvider>) => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. Backup Account 1"
                      className="w-full bg-card border border-border rounded-xl py-3 px-4 text-xs font-bold text-text-main focus:outline-none focus:border-primary transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Public Key</label>
                    <input
                      type="text"
                      value={newProvider.public_key}
                      onChange={(e) => setNewProvider((prev: Partial<EmailProvider>) => ({ ...prev, public_key: e.target.value }))}
                      placeholder="EmailJS Public Key"
                      className="w-full bg-card border border-border rounded-xl py-3 px-4 text-xs font-bold text-text-main focus:outline-none focus:border-primary transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Service ID</label>
                    <input
                      type="text"
                      value={newProvider.service_id}
                      onChange={(e) => setNewProvider((prev: Partial<EmailProvider>) => ({ ...prev, service_id: e.target.value }))}
                      placeholder="EmailJS Service ID"
                      className="w-full bg-card border border-border rounded-xl py-3 px-4 text-xs font-bold text-text-main focus:outline-none focus:border-primary transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Priority (Higher = First)</label>
                    <input
                      type="number"
                      value={newProvider.priority}
                      onChange={(e) => setNewProvider((prev: Partial<EmailProvider>) => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
                      className="w-full bg-card border border-border rounded-xl py-3 px-4 text-xs font-bold text-text-main focus:outline-none focus:border-primary transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">OTP Template ID</label>
                    <input
                      type="text"
                      value={newProvider.template_otp}
                      onChange={(e) => setNewProvider((prev: Partial<EmailProvider>) => ({ ...prev, template_otp: e.target.value }))}
                      className="w-full bg-card border border-border rounded-xl py-3 px-4 text-xs font-bold text-text-main focus:outline-none focus:border-primary transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Win Template ID</label>
                    <input
                      type="text"
                      value={newProvider.template_win}
                      onChange={(e) => setNewProvider((prev: Partial<EmailProvider>) => ({ ...prev, template_win: e.target.value }))}
                      className="w-full bg-card border border-border rounded-xl py-3 px-4 text-xs font-bold text-text-main focus:outline-none focus:border-primary transition-all"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleAddProvider}
                    disabled={isEmailSaving}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-black text-[10px] uppercase tracking-widest hover:bg-primary-hover transition-all active:scale-95"
                  >
                    {isEmailSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    {language === 'th' ? 'ยืนยันการเพิ่ม' : 'CONFIRM ADD'}
                  </button>
                </div>
              </motion.div>
            )}
            
            <div className="space-y-3 min-h-[100px]">
              {isFetchingProviders ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-text-muted">
                  <Loader2 size={32} className="animate-spin text-primary/40" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Fetching Provider Pool...</span>
                </div>
              ) : fetchError ? (
                <div className="p-8 text-center rounded-2xl bg-red-500/5 border border-red-500/20">
                  <ShieldAlert size={24} className="mx-auto mb-2 text-red-500/50" />
                  <p className="text-xs font-bold text-red-500">Error: {fetchError}</p>
                  <button onClick={fetchProviders} className="mt-3 text-[10px] font-black text-primary uppercase underline underline-offset-4">Try Again</button>
                </div>
              ) : providers.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-card-header/10 border border-dashed border-border">
                  <p className="text-xs font-bold text-text-muted">No providers in library. Please add your first EmailJS account.</p>
                </div>
              ) : (
                providers.map((p, index) => (
                  <div 
                    key={p.id}
                    className={`group relative overflow-hidden p-4 sm:p-5 rounded-2xl border transition-all duration-300 ${
                      p.is_active 
                        ? "bg-card-header/10 border-border hover:border-primary/40 hover:bg-card-header/20 shadow-sm" 
                        : "bg-card-header/5 border-border/50 grayscale opacity-60"
                    }`}
                  >
                    {/* Priority Badge Background Decor */}
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                          p.is_active 
                            ? "bg-gradient-to-br from-primary/20 to-primary/5 text-primary shadow-inner" 
                            : "bg-text-muted/10 text-text-muted"
                        }`}>
                          <Mail size={24} className={p.is_active ? "animate-pulse-slow" : ""} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-text-main group-hover:text-primary transition-colors">{p.name}</span>
                            {index === 0 && p.is_active && (
                              <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-primary text-white uppercase tracking-tighter">
                                Primary
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-1">
                            <div className="flex items-center gap-1 text-[10px] text-text-muted font-bold whitespace-nowrap">
                              <Activity size={10} className="text-primary/60" />
                              ID: <span className="text-text-main/80">{p.service_id}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-text-muted font-bold whitespace-nowrap sm:border-l sm:border-border sm:pl-3">
                              <Send size={10} className="text-blue-500/60" />
                              Sent: <span className="text-text-main/80">{p.sent_count || 0}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-text-muted font-bold whitespace-nowrap sm:border-l sm:border-border sm:pl-3">
                              <ShieldAlert size={10} className={p.error_count > 0 ? "text-red-500" : "text-green-500"} />
                              Errors: <span className={p.error_count > 0 ? "text-red-500" : "text-green-500"}>{p.error_count}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-text-muted font-bold whitespace-nowrap sm:border-l sm:border-border sm:pl-3">
                              <Trophy size={10} className="text-amber-500/60" />
                              Priority: <span className="text-text-main/80">{p.priority}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {deleteConfirmId === p.id ? (
                          <motion.div 
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 'auto', opacity: 1 }}
                            className="flex items-center gap-2 bg-red-500/5 border border-red-500/20 p-1 rounded-xl"
                          >
                            <input 
                              autoFocus
                              type="text"
                              value={deleteConfirmText}
                              onChange={(e) => setDeleteConfirmText(e.target.value)}
                              placeholder="Type 'confirm'"
                              className="bg-transparent border-none outline-none text-[10px] font-bold text-red-500 px-2 w-24 placeholder:text-red-500/30"
                            />
                            <button 
                              onClick={() => handleDeleteProvider(p.id)}
                              disabled={deleteConfirmText !== 'confirm'}
                              className={`p-1.5 rounded-lg transition-all ${deleteConfirmText === 'confirm' ? "bg-red-500 text-white" : "bg-red-500/20 text-red-500/40 cursor-not-allowed"}`}
                            >
                              <Trash2 size={14} />
                            </button>
                            <button 
                              onClick={() => {
                                setDeleteConfirmId(null);
                                setDeleteConfirmText("");
                              }}
                              className="p-1.5 rounded-lg bg-card-header text-text-muted hover:text-text-main"
                            >
                              <XCircle size={14} />
                            </button>
                          </motion.div>
                        ) : (
                          <>
                            <button 
                              onClick={() => handleToggleProvider(p.id, p.is_active)}
                              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                p.is_active 
                                  ? "bg-green-500/10 text-green-500 hover:bg-green-500/20 border border-green-500/20" 
                                  : "bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20"
                              }`}
                            >
                              {p.is_active ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                              {p.is_active ? (language === 'th' ? 'เปิดใช้งาน' : 'ACTIVE') : (language === 'th' ? 'ปิดใช้งาน' : 'INACTIVE')}
                            </button>
                            <button 
                              onClick={() => {
                                setDeleteConfirmId(p.id);
                                setDeleteConfirmText("");
                              }}
                              className="p-2.5 rounded-xl bg-card-header border border-border text-text-muted hover:text-red-500 hover:border-red-500/30 hover:bg-red-500/5 transition-all shadow-sm"
                              title="Delete Provider"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-border space-y-4">
            <h4 className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1">Email Service Test</h4>
            <div className="p-6 rounded-2xl bg-transparent border border-border space-y-4">
              <div className="flex items-center gap-3 text-text-muted">
                <Mail size={18} />
                <span className="text-xs font-bold">Admin Email: <span className="text-text-main">{currentAdmin?.email}</span></span>
              </div>
              <p className="text-[10px] text-text-muted font-bold leading-relaxed">
                Click the button below to send a test verification email to your own admin account. This verifies that the Resend API and email templates are working correctly.
              </p>
              <button onClick={handleTestEmail} disabled={isTestingEmail || !currentAdmin?.email} className="w-full py-3 rounded-xl bg-card-header border border-border text-text-main text-[10px] font-black uppercase tracking-widest hover:bg-card-header/80 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm">
                {isTestingEmail ? <Loader2 size={16} className="animate-spin" /> : <ShieldAlert size={16} />} 
                {t("sendTestEmail")}
              </button>

              {testResult && (
                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className={`p-4 rounded-xl text-[11px] font-bold ${testResult.success ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"}`}>
                  {testResult.msg}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
