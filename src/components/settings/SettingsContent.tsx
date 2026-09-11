import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  Loader2,
  Save,
  Landmark,
  History,
  ShieldCheck,
  KeyRound,
  Mail,
  ArrowLeft,
  Bell,
  BellOff,
  AlertCircle,
  CheckCircle,
  X,
  User,
  Smartphone,
  Tablet,
  Monitor,
  Send,
  MessageSquare,
  Sun,
  Moon,
} from "lucide-react";
import {
  getNotificationPermissionStatus,
  requestNotificationPermission,
} from "../../utils/notifications";
import { supabase } from "../../lib/supabase";
import { SettingsInput } from "./SettingsInput";
import { useLanguage } from "../../contexts/LanguageContext";
import { maskEmail } from "../../utils/format";
import { generateOTP } from "../../utils/otp";
import { emailService } from "../../services/emailService";
import { encryptPassword, comparePassword } from "../../utils/security";
import { Check, Globe, Zap, Sparkles } from "lucide-react";
import { activityService } from "../../services/activityService";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";

const THAI_BANKS = [
  { id: 'KBank', name: 'Kasikorn Bank', nameTh: 'ธนาคารกสิกรไทย', color: '#00A950', icon: 'K' },
  { id: 'SCB', name: 'Siam Commercial Bank', nameTh: 'ธนาคารไทยพาณิชย์', color: '#4E2E7F', icon: 'S' },
  { id: 'BBL', name: 'Bangkok Bank', nameTh: 'ธนาคารกรุงเทพ', color: '#1E4595', icon: 'B' },
  { id: 'KTB', name: 'Krungthai Bank', nameTh: 'ธนาคารกรุงไทย', color: '#00A1E0', icon: 'KTB' },
  { id: 'Krungsri', name: 'Krungsri Bank', nameTh: 'ธนาคารกรุงศรีอยุธยา', color: '#FFD700', icon: 'KS' },
  { id: 'TTB', name: 'ttb bank', nameTh: 'ธนาคารทหารไทยธนชาต', color: '#001E62', icon: 'ttb' },
  { id: 'GSB', name: 'Government Savings Bank', nameTh: 'ธนาคารออมสิน', color: '#EC068D', icon: 'GSB' },
];

// Custom Crypto Icons
const USDTLogo = () => (
  <svg viewBox="0 0 24 24" className="w-full h-full fill-white">
    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm.875 14.875v3h-1.75v-3c-1.89-.074-3.375-.623-3.375-.623v-1.354s1.614.545 3.375.62v-4.137h-3.375v-1.75H16.25v1.75h-3.375v4.137c1.76-.075 3.375-.62 3.375-.62v1.354s-1.485.549-3.375.623z" />
  </svg>
);

const ETHLogo = () => (
  <svg viewBox="0 0 24 24" className="w-full h-full fill-white">
    <path d="M11.944 17.97L4.58 13.62l7.36 10.38 7.366-10.38-7.362 4.35v.001zm0-17.97L4.58 12.326l7.364 4.352 7.362-4.352L11.944 0z" />
  </svg>
);

const BNBLogo = () => (
  <svg viewBox="0 0 24 24" className="w-full h-full fill-white">
    <path d="M16.624 13.92l2.817-2.819 2.819 2.819-2.819 2.818-2.817-2.818zm-3.384-3.384l2.819-2.819 2.818 2.819-2.818 2.818-2.819-2.818zm.003 6.771l2.818-2.819 2.819 2.819-2.819 2.818-2.818-2.818zm-3.387-3.387l2.818-2.819 2.819 2.819-2.819 2.818-2.818-2.818zm0-6.774l2.818-2.819 2.819 2.819-2.819 2.818-2.818-2.818zm-3.384 3.384l2.819-2.819 2.818 2.819-2.818 2.818-2.819-2.818zm.003 6.771l2.818-2.819 2.819 2.819-2.819 2.818-2.818-2.818zM12 21.485l-2.819-2.819 2.819-2.818 2.818 2.818L12 21.485zM12 5.334l-2.819-2.818L12-.303l2.818 2.819L12 5.334z" />
  </svg>
);

const CRYPTO_NETWORKS = [
  { id: 'TRC-20', name: 'USDT (TRC-20)', desc: 'Tron Network (Low Fee)', color: '#26A17B', icon: <USDTLogo /> },
  { id: 'ERC-20', name: 'USDT (ERC-20)', desc: 'Ethereum Network', color: '#627EEA', icon: <ETHLogo /> },
  { id: 'BEP-20', name: 'USDT (BEP-20)', desc: 'Binance Smart Chain', color: '#F3BA2F', icon: <BNBLogo /> },
];

interface SettingsContentProps {
  activeTab: "profile" | "bank" | "security" | "history" | "notifications" | "language" | "display" | "reports";
  balance: number;
  t: (key: string) => string;
  onClose: () => void;
  isMobile?: boolean;
  profileData: any;
  setProfileData: any;
  userId?: string;
  refreshProfile: () => Promise<void>;
  transactions?: any[];
}

export const SettingsContent: React.FC<SettingsContentProps> = ({
  activeTab,
  t,
  onClose,
  isMobile,
  profileData,
  setProfileData,
  userId,
  refreshProfile,
  transactions = [],
}) => {
  const { language } = useLanguage();
  const { session } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  // Password States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(() => {
    return sessionStorage.getItem("settings_is_changing_password") === "true";
  });

  // Notification System
  const [notifications, setNotifications] = useState<{ id: string; message: string; type: 'success' | 'error' }[]>([]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  React.useEffect(() => {
    sessionStorage.setItem("settings_is_changing_password", isChangingPassword.toString());
  }, [isChangingPassword]);

  // OTP States
  const [isOtpFlow, setIsOtpFlow] = useState(() => {
    return sessionStorage.getItem("settings_is_otp_flow") === "true";
  });
  const [otpStep, setOtpStep] = useState<"request" | "verify" | "new_password">(() => {
    return sessionStorage.getItem("settings_otp_step") as any || "request";
  });

  React.useEffect(() => {
    sessionStorage.setItem("settings_is_otp_flow", isOtpFlow.toString());
    sessionStorage.setItem("settings_otp_step", otpStep);
  }, [isOtpFlow, otpStep]);

  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  // Email States
  const [isEmailFlow, setIsEmailFlow] = useState(() => {
    return sessionStorage.getItem("settings_is_email_flow") === "true";
  });
  const [emailOtpStep, setEmailOtpStep] = useState<"request_old" | "verify_old" | "new_email" | "verify_new">(() => {
    return sessionStorage.getItem("settings_email_otp_step") as any || "request_old";
  });

  React.useEffect(() => {
    sessionStorage.setItem("settings_is_email_flow", isEmailFlow.toString());
    sessionStorage.setItem("settings_email_otp_step", emailOtpStep);
  }, [isEmailFlow, emailOtpStep]);
  const [isLoginHistoryFlow, setIsLoginHistoryFlow] = useState(false);
  const [loginHistoryList, setLoginHistoryList] = useState<any[]>([]);
  const [isLoginHistoryLoading, setIsLoginHistoryLoading] = useState(false);

  // Bank 2.0 States
  const [bankType, setBankType] = useState<"bank" | "crypto">(() => {
    const net = profileData.bank_network?.toUpperCase() || "";
    return (net.includes("RC-") || net.includes("EP-")) ? "crypto" : "bank";
  });
  const [tempBankNetwork, setTempBankNetwork] = useState(profileData.bank_network);
  const [tempBankName, setTempBankName] = useState(profileData.bank_name);
  const [tempBankAccount, setTempBankAccount] = useState(profileData.bank_account);

  // Validation functions
  const getAccountError = () => {
    if (!tempBankAccount) return "";

    if (bankType === "bank") {
      const digitsOnly = tempBankAccount.replace(/[^0-9]/g, "");
      if (digitsOnly.length !== tempBankAccount.length) {
        return language === "th" ? "เลขบัญชีต้องเป็นตัวเลขเท่านั้น" : "Account number must contain only digits";
      }
      if (tempBankAccount.length < 10 || tempBankAccount.length > 12) {
        return language === "th" ? "เลขบัญชีธนาคารปกติจะมี 10-12 หลัก" : "Bank accounts are usually 10-12 digits";
      }
    } else {
      if (tempBankNetwork === "TRC-20") {
        if (!tempBankAccount.startsWith("T")) {
          return language === "th" ? "ที่อยู่ TRC-20 ต้องขึ้นต้นด้วย 'T'" : "TRC-20 address must start with 'T'";
        }
        if (tempBankAccount.length !== 34) {
          return language === "th" ? "ที่อยู่ TRC-20 ต้องมีความยาว 34 ตัวอักษร" : "TRC-20 address must be 34 characters long";
        }
      } else if (tempBankNetwork === "ERC-20" || tempBankNetwork === "BEP-20") {
        if (!tempBankAccount.startsWith("0x")) {
          return language === "th" ? "ที่อยู่ต้องขึ้นต้นด้วย '0x'" : "Address must start with '0x'";
        }
        if (tempBankAccount.length !== 42) {
          return language === "th" ? "ที่อยู่ต้องมีความยาว 42 ตัวอักษร" : "Address must be 42 characters long";
        }
      }
    }
    return "";
  };

  const accountError = getAccountError();

  React.useEffect(() => {
    if (activeTab === "bank") {
      setTempBankNetwork(profileData.bank_network);
      setTempBankName(profileData.bank_name);
      setTempBankAccount(profileData.bank_account);
      const net = profileData.bank_network?.toUpperCase() || "";
      setBankType((net.includes("RC-") || net.includes("EP-")) ? "crypto" : "bank");
    }
  }, [activeTab, profileData]);

  React.useEffect(() => {
    if (isLoginHistoryFlow && userId) {
      const fetchHistory = async () => {
        setIsLoginHistoryLoading(true);
        try {
          const data = await activityService.fetchActivities({ userId, type: 'login' });
          setLoginHistoryList(data);
        } catch (err) {
          console.error("[Settings] fetchHistory Error:", err);
        } finally {
          setIsLoginHistoryLoading(false);
        }
      };
      fetchHistory();
    }
  }, [isLoginHistoryFlow, userId]);

  const handleLogoutSession = async (historyId: string, sessionId?: string) => {
    if (!window.confirm(language === 'th' ? "คุณแน่ใจหรือไม่ว่าต้องการออกจากระบบและลบประวัตินี้?" : "Are you sure you want to logout and delete this record?")) return;
    try {
      if (sessionId) {
        await activityService.kickSession(sessionId);
      }
      await activityService.deleteActivity(historyId);
      
      setLoginHistoryList(prev => prev.filter(a => a.id !== historyId));
      showToast(language === 'th' ? "ออกจากระบบเรียบร้อยแล้ว" : "Logged out successfully", "success");
    } catch (err: any) {
      console.error("[Settings] handleLogoutSession Error:", err);
      showToast(language === 'th' ? "เกิดข้อผิดพลาด: " + err.message : "Error: " + err.message, "error");
    }
  };

  const handleLogoutAllOther = async () => {
    const sessId = (session as any)?.session_id;
    if (!sessId || !userId) return;
    if (!window.confirm(language === 'th' ? "ออกจากระบบเครื่องอื่นทั้งหมดและล้างประวัติ?" : "Logout all other devices and clear history?")) return;
    
    try {
      await activityService.kickAllOtherSessions(userId!, sessId);
      await activityService.clearLoginHistory(userId!, sessId);
      
      const data = await activityService.fetchActivities({ userId, type: 'login' });
      setLoginHistoryList(data);
      
      showToast(language === 'th' ? "ออกจากระบบเครื่องอื่นทั้งหมดแล้ว" : "All other sessions logged out", "success");
    } catch (err: any) {
      console.error("[Settings] handleLogoutAllOther Error:", err);
      showToast(language === 'th' ? "เกิดข้อผิดพลาด: " + err.message : "Error: " + err.message, "error");
    }
  };


  const [newEmail, setNewEmail] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  // Notification States
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>(getNotificationPermissionStatus());
  
  // Issue Reports States
  const [reports, setReports] = useState<any[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportForm, setReportForm] = useState({ category: "#Other", subject: "", message: "" });
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const fetchReports = async () => {
    if (!userId) return;
    setReportsLoading(true);
    try {
      const { data, error } = await supabase
        .from("issue_reports")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setReports(data || []);
    } catch (err) {
      console.error("[Settings] fetchReports Error:", err);
    } finally {
      setReportsLoading(false);
    }
  };

  React.useEffect(() => {
    if (activeTab === "reports") {
      fetchReports();
    }
  }, [activeTab, userId]);

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    if (!reportForm.subject.trim() || !reportForm.message.trim()) {
      showToast(language === 'th' ? "กรุณากรอกข้อมูลให้ครบถ้วน" : "Please fill in all fields", "error");
      return;
    }
    setReportSubmitting(true);
    try {
      const { error } = await supabase
        .from("issue_reports")
        .insert({
          user_id: userId,
          category: reportForm.category,
          subject: reportForm.subject.trim(),
          message: reportForm.message.trim(),
          status: 'pending'
        });
      if (error) throw error;
      showToast(language === 'th' ? "ส่งรายงานเรียบร้อยแล้ว" : "Report submitted successfully", "success");
      setReportForm({ category: "#Other", subject: "", message: "" });
      fetchReports();
    } catch (err: any) {
      showToast(err.message || "Failed to submit report", "error");
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleSave = async () => {
    if (!userId) return;

    // Basic Validation
    if (!profileData.first_name?.trim() || !profileData.last_name?.trim()) {
      const fallbackMsg = language === "th" ? "กรุณาระบุชื่อและนามสกุล" : "First name and last name are required";
      showToast(t("nameRequired") !== "nameRequired" ? t("nameRequired") : fallbackMsg, "error");
      return;
    }

    if (profileData.username && profileData.username.length < 3) {
      showToast(t("usernameTooShort") || "Username must be at least 3 characters", "error");
      return;
    }

    setIsSaving(true);
    try {
      let newKycStatus = profileData.kyc_status;
      const isProfileComplete = Boolean(
        profileData.first_name?.trim() &&
        profileData.last_name?.trim() &&
        profileData.phone_number?.trim() &&
        profileData.address?.trim()
      );
      const isBankComplete = Boolean(
        profileData.bank_network?.trim() &&
        profileData.bank_account?.trim() &&
        profileData.bank_name?.trim()
      );

      if (isProfileComplete && isBankComplete && newKycStatus !== "verified") {
        newKycStatus = "verified";
      } else if ((!isProfileComplete || !isBankComplete) && newKycStatus === "verified") {
        newKycStatus = "unverified";
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: profileData.first_name.trim(),
          last_name: profileData.last_name.trim(),
          username: profileData.username?.trim(),
          phone_number: profileData.phone_number?.trim(),
          address: profileData.address?.trim(),
          bank_network: profileData.bank_network?.trim(),
          bank_account: profileData.bank_account?.trim(),
          bank_name: profileData.bank_name?.trim(),
          kyc_status: newKycStatus,
        })
        .eq("id", userId);

      if (error) {
        // Handle specific unique constraint error for username
        if (error.code === "23505" || error.message?.includes("unique")) {
          throw new Error(t("usernameTaken") || "This username is already taken");
        }
        console.error("[Settings] handleSave Error Object:", error);
        throw error;
      };

      showToast(t("saveSuccess") || "Settings saved successfully", "success");
      await refreshProfile();
    } catch (err: any) {
      showToast(err.message || "Failed to save settings", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setProfileData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleNormalPasswordUpdate = async () => {
    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }
    if (newPassword.length < 6) {
      showToast("Password must be at least 6 characters", "error");
      return;
    }

    setIsSaving(true);
    try {
      if (!userId) throw new Error("You must be logged in to change your password");

      const { data: userProfile, error: fetchError } = await supabase
        .from("profiles")
        .select("password")
        .eq("id", userId)
        .single();

      if (fetchError || !userProfile) throw new Error("User not found");

      if (!(await comparePassword(currentPassword, userProfile.password))) {
        throw new Error("Current password incorrect");
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ password: encryptPassword(newPassword) })
        .eq("id", userId);

      if (updateError) throw updateError;

      showToast("Password updated successfully!", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsChangingPassword(false);
    } catch (err: any) {
      showToast(err.message || "Error updating password", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendOtp = async () => {
    if (!profileData.email) {
      showToast("Email not found. Please refresh the page.", "error");
      return;
    }
    setOtpLoading(true);
    try {
      // Check if change password OTP is enabled
      const { data: settings } = await supabase
        .from("global_settings")
        .select("change_password_otp_enabled")
        .eq("id", "main")
        .single();

      if (settings?.change_password_otp_enabled === false) {
        showToast(language === "th" 
          ? "การเปลี่ยนรหัสผ่านผ่านอีเมลถูกปิดใช้งานชั่วคราว กรุณาติดต่อฝ่ายสนับสนุน" 
          : "Password change via email is currently disabled. Please contact support.", "error");
        return;
      }

      const code = generateOTP();
      const expires_at = new Date(Date.now() + 10 * 60000).toISOString();

      const { error } = await supabase
        .from("profiles")
        .update({ otp_code: code, otp_expires_at: expires_at })
        .eq("id", userId);

      if (error) throw error;

      await emailService.sendOTP({
        email: profileData.email,
        code,
        userName: profileData.first_name,
        lang: language,
        type: 'reset'
      });

      setOtpStep("verify");
      showToast("Verification code sent!", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to send OTP", "error");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setOtpLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .eq("otp_code", otpCode)
        .single();

      if (error || !data) throw new Error(t("invalidOtp"));

      // Check expiry
      if (new Date(data.otp_expires_at) < new Date()) throw new Error(t("invalidOtp"));

      setOtpStep("new_password");
    } catch (err: any) {
      showToast(err.message || "Invalid or expired OTP", "error");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleOtpPasswordUpdate = async () => {
    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }
    setOtpLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ password: encryptPassword(newPassword), otp_code: null })
        .eq("id", userId);

      if (error) throw error;
      showToast(t("passwordChanged"), "success");
      setIsOtpFlow(false);
      setOtpStep("request");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      showToast(err.message || "Error resetting password", "error");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSendOldEmailOtp = async () => {
    setEmailLoading(true);
    try {
      // Check if change email OTP is enabled
      const { data: settings } = await supabase
        .from("global_settings")
        .select("change_email_otp_enabled")
        .eq("id", "main")
        .single();

      if (settings?.change_email_otp_enabled === false) {
        showToast(language === "th" 
          ? "การเปลี่ยนอีเมลผ่านระบบ OTP ถูกปิดใช้งานชั่วคราว กรุณาติดต่อฝ่ายสนับสนุน" 
          : "Email change via OTP is currently disabled. Please contact support.", "error");
        return;
      }

      const code = generateOTP();
      const expires_at = new Date(Date.now() + 10 * 60000).toISOString();
      const { error } = await supabase
        .from("profiles")
        .update({ otp_code: code, otp_expires_at: expires_at })
        .eq("id", userId);
      if (error) throw error;
      await emailService.sendOTP({
        email: profileData.email,
        code,
        userName: profileData.first_name || "User",
        lang: language,
        type: 'change_email'
      });
      setEmailOtpStep("verify_old");
      showToast("Verification code sent!", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to send code", "error");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleVerifyOldEmailOtp = async () => {
    setEmailLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .eq("otp_code", emailOtp)
        .single();
      if (error || !data) throw new Error(t("invalidOtp"));
      if (new Date(data.otp_expires_at) < new Date()) throw new Error(t("invalidOtp"));

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ otp_code: null })
        .eq("id", userId);

      if (updateError) throw updateError;

      setEmailOtpStep("new_email");
      setEmailOtp("");
    } catch (err: any) {
      showToast(err.message || "Invalid or expired OTP", "error");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleSendEmailOtp = async () => {
    if (!newEmail || !newEmail.includes("@")) {
      showToast("Please enter a valid email address.", "error");
      return;
    }
    setEmailLoading(true);
    try {
      const code = generateOTP();
      const expires_at = new Date(Date.now() + 10 * 60000).toISOString();
      const { error } = await supabase
        .from("profiles")
        .update({ otp_code: code, otp_expires_at: expires_at })
        .eq("id", userId);
      if (error) throw error;
      await emailService.sendOTP({
        email: newEmail,
        code,
        userName: profileData.first_name || "User",
        lang: language,
        type: 'change_email'
      });
      setEmailOtpStep("verify_new");
      showToast("Verification code sent to new email!", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to send code", "error");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    setEmailLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .eq("otp_code", emailOtp)
        .single();
      if (error || !data) throw new Error(t("invalidOtp"));
      if (new Date(data.otp_expires_at) < new Date()) throw new Error(t("invalidOtp"));

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ email: newEmail, otp_code: null })
        .eq("id", userId);

      if (updateError) throw updateError;

      setProfileData((prev: any) => ({ ...prev, email: newEmail }));
      showToast(t("emailUpdated"), "success");
      setIsEmailFlow(false);
      setEmailOtpStep("request_old");
      setNewEmail("");
      setEmailOtp("");
    } catch (err: any) {
      showToast(err.message || "Invalid or expired OTP", "error");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleRequestPermission = async () => {
    const result = await requestNotificationPermission();
    setNotificationPermission(result);
  };

  return (
    <>
      <div className="fixed top-20 right-3 z-[200] space-y-1 pointer-events-none max-w-[calc(100vw-24px)] w-auto">
        <AnimatePresence>
          {notifications.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 12, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 8, scale: 0.95 }}
              className={`px-2 py-1.5 rounded-lg shadow-xl flex items-start gap-1.5 pointer-events-auto backdrop-blur-xl border text-[9px] font-bold leading-tight ${n.type === "success"
                ? "bg-green-500/10 border-green-500/20 text-green-600"
                : "bg-red-500/10 border-red-500/20 text-red-600"
                }`}
            >
              <div className={`shrink-0 mt-px ${n.type === "success" ? "text-green-600" : "text-red-600"}`}>
                {n.type === "success" ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
              </div>
              <span className="whitespace-nowrap flex-1">{n.message}</span>
              <button
                onClick={() => setNotifications(prev => prev.filter(item => item.id !== n.id))}
                className="shrink-0 mt-px hover:opacity-70 transition-opacity"
              >
                <X size={9} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "profile" && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, x: isMobile ? 0 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isMobile ? 0 : -20 }}
            className="glass-card relative"
          >
            {isMobile && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white"
              >
                <ChevronRight className="rotate-180" size={24} />
              </button>
            )}
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <User size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-text-main leading-tight">{t("verification")}</h2>
                <p className="text-text-muted text-[11px]">{t("managePersonalInfo")}</p>
              </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-8 mt-8">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <SettingsInput
                    label={t("firstName")}
                    placeholder="สมชาย"
                    value={profileData.first_name}
                    onChange={(e) => updateField("first_name", e.target.value)}
                  />
                  <SettingsInput
                    label={t("lastName")}
                    placeholder="ใจดี"
                    value={profileData.last_name}
                    onChange={(e) => updateField("last_name", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <SettingsInput
                    label={t("username")}
                    placeholder="somchai123"
                    value={profileData.username}
                    onChange={(e) => updateField("username", e.target.value)}
                  />
                  <SettingsInput
                    label={t("phone")}
                    placeholder="08x-xxx-xxxx"
                    value={profileData.phone_number}
                    onChange={(e) => updateField("phone_number", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <SettingsInput
                    label={t("address")}
                    placeholder="123 Example St."
                    value={profileData.address}
                    onChange={(e) => updateField("address", e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end items-center pt-6 border-t border-white/5 gap-3">
                <button
                  type="button"
                  onClick={() => refreshProfile()}
                  className="px-6 py-2 rounded-xl bg-white/5 text-slate-400 font-bold text-sm hover:text-white transition-colors"
                >
                  {t("discard")}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full sm:w-auto px-5 py-2 rounded-xl bg-primary text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  {t("save")}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {activeTab === "bank" && (
          <motion.div
            key="bank"
            initial={{ opacity: 0, x: isMobile ? 0 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isMobile ? 0 : -20 }}
            className="glass-card space-y-8 relative"
          >
            {isMobile && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white"
              >
                <ChevronRight className="rotate-180" size={24} />
              </button>
            )}

            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <div className="w-9 h-9 rounded-xl bg-accent/20 flex items-center justify-center text-accent shrink-0">
                <Landmark size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-white leading-tight">{t("bankDetails")}</h2>
                <p className="text-slate-400 text-[11px]">{t("bankDescription")}</p>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              {/* Bank/Crypto Toggle */}
              <div className="flex p-1 bg-transparent rounded-2xl border border-border w-full max-w-sm mx-auto">
                {(["bank", "crypto"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setBankType(type)}
                    className={`flex-1 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${bankType === type
                      ? "bg-primary text-white shadow-lg shadow-primary/20"
                      : "text-text-muted hover:text-text-main"
                      }`}
                  >
                    {type === "bank" ? <Landmark size={14} /> : <Zap size={14} />}
                    {type === "bank" ? (language === "th" ? "ธนาคารไทย" : "Thai Bank") : (language === "th" ? "คริปโต (USDT)" : "Crypto Wallet")}
                  </button>
                ))}
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();

                  // Block saving if there's a validation error
                  if (accountError) {
                    showToast(accountError, "error");
                    return;
                  }

                  setIsSaving(true);

                  let newKycStatus = profileData.kyc_status;
                  const isProfileComplete = Boolean(
                    profileData.first_name?.trim() &&
                    profileData.last_name?.trim() &&
                    profileData.phone_number?.trim() &&
                    profileData.address?.trim()
                  );
                  const isBankComplete = Boolean(
                    tempBankNetwork?.trim() &&
                    tempBankAccount?.trim() &&
                    tempBankName?.trim()
                  );

                  if (isProfileComplete && isBankComplete && newKycStatus !== "verified") {
                    newKycStatus = "verified";
                  } else if ((!isProfileComplete || !isBankComplete) && newKycStatus === "verified") {
                    newKycStatus = "unverified";
                  }

                  const { error } = await supabase
                    .from("profiles")
                    .update({
                      bank_network: tempBankNetwork,
                      bank_account: tempBankAccount,
                      bank_name: tempBankName,
                      kyc_status: newKycStatus
                    })
                    .eq("id", userId);

                  if (!error) {
                    showToast(language === "th" ? "บันทึกข้อมูลสำเร็จ" : "Bank details updated", "success");
                    await refreshProfile();
                  } else {
                    showToast(error.message, "error");
                  }
                  setIsSaving(false);
                }}
                className="space-y-8"
              >
                <div className="space-y-6">
                  {bankType === "bank" ? (
                    <div className="space-y-3">
                      <label className="text-[11px] sm:text-[10px] font-bold text-text-muted uppercase tracking-widest block ml-1">
                        {t("selectBank")}
                      </label>
                      {/* Custom Dropdown */}
                      <div className="relative">
                        <select
                          value={tempBankNetwork || ""}
                          onChange={(e) => {
                            setTempBankNetwork(e.target.value);
                            setTempBankName("");
                          }}
                          className="w-full appearance-none bg-input-bg backdrop-blur-md border border-border rounded-2xl py-3.5 sm:py-4 pl-16 pr-10 text-text-main font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all cursor-pointer shadow-inner"
                        >
                          <option value="" disabled>{language === "th" ? "— เลือกธนาคาร —" : "— Select a bank —"}</option>
                          {THAI_BANKS.map((bank) => (
                            <option key={bank.id} value={bank.id}>
                              {language === "th" ? bank.nameTh : bank.name}
                            </option>
                          ))}
                        </select>

                        {/* Left: colored bank logo */}
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                          {(() => {
                            const bank = THAI_BANKS.find(b => b.id === tempBankNetwork);
                            return bank ? (
                              <div
                                className="w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-[10px] shadow-md"
                                style={{ backgroundColor: bank.color }}
                              >
                                {bank.icon}
                              </div>
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-card-header/50 flex items-center justify-center border border-border">
                                <Landmark size={16} className="text-text-muted" />
                              </div>
                            );
                          })()}
                        </div>

                        {/* Right: chevron arrow */}
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                          <ChevronRight size={16} className="rotate-90" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <label className="text-[11px] sm:text-[10px] font-bold text-text-muted uppercase tracking-widest block ml-1">
                        {t("network")}
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {CRYPTO_NETWORKS.map((net) => (
                          <button
                            key={net.id}
                            type="button"
                            onClick={() => setTempBankNetwork(net.id)}
                            className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all  ${tempBankNetwork === net.id
                              ? "bg-primary/10 border-primary/30 ring-1 ring-primary/10 shadow-md"
                              : "bg-transparent border-border hover:border-primary/30"
                              }`}
                          >
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center text-white shadow-lg shrink-0 p-1.5"
                              style={{ backgroundColor: net.color }}
                            >
                              {net.icon}
                            </div>
                            <div className="text-left">
                              <p className={`font-bold text-[11px] leading-tight ${tempBankNetwork === net.id ? 'text-text-main' : 'text-text-muted'}`}>{net.name}</p>
                              <p className="text-[9px] text-text-muted/60 leading-none mt-1">{net.desc}</p>
                            </div>
                            {tempBankNetwork === net.id && (
                              <div className="ml-auto text-primary">
                                <Check size={12} strokeWidth={4} />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-card-header/40 p-3.5 sm:p-4 rounded-2xl border border-border space-y-3 shadow-inner">
                    <div className="space-y-1">
                      <SettingsInput
                        label={bankType === "bank" ? t("accountNumberLabel") : t("walletAddress")}
                        placeholder={bankType === "bank" ? "xxx-x-xxxxx-x" : "Paste your TRC-20 address"}
                        value={tempBankAccount || ""}
                        onChange={(e) => setTempBankAccount(e.target.value)}
                      />
                      {accountError && (
                        <p className="text-red-500 text-[10px] font-bold ml-1 animate-pulse">
                          ⚠️ {accountError}
                        </p>
                      )}
                    </div>

                    <SettingsInput
                      label={t("accountName")}
                      placeholder="Full name on account"
                      value={tempBankName || ""}
                      onChange={(e) => setTempBankName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold flex gap-3">
                  <ShieldCheck size={18} className="shrink-0" />
                  <p>{t("bankWarning")}</p>
                </div>

                <div className="flex justify-end pt-6 border-t border-border">
                  <button
                    type="submit"
                    disabled={isSaving || !tempBankNetwork || !tempBankAccount || !tempBankName || !!accountError}
                    className="w-full sm:w-auto px-10 py-3.5 sm:py-4 rounded-2xl bg-primary text-white font-black text-sm uppercase tracking-widest flex items-center justify-center gap-4 hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Save size={18} />
                    )}
                    <span className="text-base">{t("save")}</span>
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {activeTab === "security" && (
          <motion.div
            key="security"
            initial={{ opacity: 0, x: isMobile ? 0 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isMobile ? 0 : -20 }}
            className="glass-card max-w-lg relative"
          >
            {isMobile && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white"
              >
                <ChevronRight className="rotate-180" size={24} />
              </button>
            )}

            {!isOtpFlow && !isEmailFlow && !isChangingPassword && !isLoginHistoryFlow ? (
              <div className="space-y-8">
                {/* Account Binding Section */}
                <div>
                  <h2 className="text-base font-bold text-text-main mb-1">
                    {t("accountSecurity") || t("changePassword")}
                  </h2>
                  <p className="text-text-muted text-[11px] mb-3">
                    {t("securityDescription")}
                  </p>

                  <h3 className="text-sm font-bold text-text-main mb-4 flex items-center gap-2">
                    <Globe size={16} className="text-primary" />
                    {t("loginMethods") || "Login Methods"}
                  </h3>

                  <div className="p-3 sm:p-4 rounded-xl bg-card-header/50 border border-border flex items-center justify-between gap-3 shadow-sm">
                    <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 shadow-inner">
                        <Mail size={20} />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-text-main font-bold text-sm truncate">{t("emailLogin")}</p>
                        <p className="text-xs text-text-muted truncate">{maskEmail(profileData.email)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                      <span className="px-2 py-1 rounded bg-green-500/10 text-green-600 text-[10px] font-bold uppercase tracking-wider hidden lg:block border border-green-500/10">
                        {t("connected") || "Connected"}
                      </span>
                      <button
                        onClick={() => setIsEmailFlow(true)}
                        className="text-[10px] sm:text-xs font-bold text-primary hover:text-white transition-colors px-2 sm:px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary hover:border-primary shadow-sm whitespace-nowrap"
                      >
                        {t("changeEmail") || "Change Email"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Login History Section */}
                <div className="pt-6 border-t border-border">
                  <h3 className="text-sm font-bold text-text-main mb-4 flex items-center gap-2">
                    <History size={16} className="text-primary" />
                    {t("loginHistory")}
                  </h3>
                  <div className="p-3 sm:p-4 flex items-center justify-between gap-3 rounded-xl bg-card-header/50 border border-border shadow-sm">
                    <div className="overflow-hidden">
                      <p className="text-text-main font-bold text-sm truncate">{t("recentActivity")}</p>
                      <p className="text-[11px] sm:text-xs text-text-muted truncate">{t("viewRecentSignins")}</p>
                    </div>
                    <button
                      onClick={() => setIsLoginHistoryFlow(true)}
                      className="text-[10px] sm:text-xs font-bold text-primary hover:text-white transition-colors px-2 sm:px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary hover:border-primary shrink-0 whitespace-nowrap shadow-sm"
                    >
                      {t("viewHistory")}
                    </button>
                  </div>
                </div>

                {/* Password Section */}
                <div className="pt-6 border-t border-border">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-text-main flex items-center gap-2">
                      <KeyRound size={16} className="text-primary" />
                      {t("changePassword")}
                    </h3>
                    <button
                      onClick={() => setIsOtpFlow(true)}
                      className="text-xs font-bold text-primary hover:underline transition-all"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  <div className="p-3 sm:p-4 flex items-center justify-between gap-3 rounded-xl bg-card-header/50 border border-border shadow-sm">
                    <div className="overflow-hidden">
                      <p className="text-text-main font-bold text-sm truncate">{t("accountPassword")}</p>
                      <p className="text-[11px] sm:text-xs text-text-muted truncate">{t("updatePasswordDesc")}</p>
                    </div>
                    <button
                      onClick={() => setIsChangingPassword(true)}
                      className="text-[10px] sm:text-xs font-bold text-primary hover:text-white transition-colors px-2 sm:px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary hover:border-primary shrink-0 whitespace-nowrap shadow-sm"
                    >
                      {t("changePassword")}
                    </button>
                  </div>
                </div>
              </div>
            ) : isChangingPassword ? (
              <form onSubmit={(e) => { e.preventDefault(); handleNormalPasswordUpdate(); }} className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsChangingPassword(false);
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                    className="p-1 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-colors"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <h2 className="text-xl sm:text-2xl font-black text-white">{t("changePassword")}</h2>
                </div>

                <p className="text-slate-400 text-sm mb-6">
                  {t("ensureStrongPassword")}
                </p>

                <div className="space-y-4">
                  <SettingsInput
                    label="Current Password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                  <SettingsInput
                    label="New Password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                  <SettingsInput
                    label="Confirm New Password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <KeyRound size={18} />}
                  {t("save")}
                </button>
              </form>
            ) : isLoginHistoryFlow ? (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={() => setIsLoginHistoryFlow(false)}
                    className="p-1 hover:bg-card-header rounded-lg text-text-muted hover:text-text-main transition-colors"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <h2 className="text-xl sm:text-2xl font-black text-text-main">{t("loginHistory")}</h2>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                  <p className="text-text-muted text-xs sm:text-sm">
                    {t("loginHistoryDesc")}
                  </p>
                  {loginHistoryList.length > 0 && (
                    <div className="w-full sm:w-auto shrink-0">
                       <button
                         onClick={handleLogoutAllOther}
                         className="w-full sm:w-auto px-4 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all hover:bg-rose-500 hover:text-white shadow-lg shadow-rose-500/5"
                       >
                         {language === 'th' ? 'ออกจากระบบทั้งหมด' : 'Logout All Devices'}
                       </button>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {isLoginHistoryLoading ? (
                    <div className="py-8 flex justify-center text-primary">
                      <Loader2 size={24} className="animate-spin" />
                    </div>
                  ) : loginHistoryList.length > 0 ? (
                    loginHistoryList.map((hist, i) => {
                      const isMobile = /iPhone|Android|Mobile/i.test(hist.os_name || hist.device || hist.device_name);
                      const isTablet = /iPad|Tablet/i.test(hist.os_name || hist.device || hist.device_name);
                      const currentUserSessionId = (session as any)?.session_id;
                      const isCurrent = hist.sessionId && currentUserSessionId && hist.sessionId === currentUserSessionId;

                      return (
                        <div key={hist.id || i} className={`p-4 rounded-xl transition-all ${isCurrent ? "bg-primary/5 border-primary/40 shadow-xl shadow-primary/5 ring-1 ring-primary/20" : "bg-card-header/40 border border-border hover:bg-card-header/60"}`}>
                          <div className="flex items-start sm:items-center gap-3 md:gap-4">
                            <div className={`mt-0.5 sm:mt-0 w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${isCurrent ? "bg-primary/20 text-primary" : "bg-card-header text-text-muted"}`}>
                              {isTablet ? <Tablet size={20} /> : isMobile ? <Smartphone size={20} /> : <Monitor size={20} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-text-main font-bold text-sm truncate">{hist.device || hist.device_name || "Legacy Session"}</p>
                                {isCurrent ? (
                                  <span className="px-2 py-0.5 rounded-full bg-primary text-[9px] font-black text-background whitespace-nowrap shrink-0 shadow-lg shadow-primary/20">
                                    {language === 'th' ? 'เซสชันปัจจุบัน' : 'Current Session'}
                                  </span>
                                ) : hist.isActive ? (
                                  <span className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 shrink-0">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-[9px] font-bold text-green-600 whitespace-nowrap">{language === 'th' ? 'กำลังออนไลน์' : 'Online'}</span>
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-full bg-card-header border border-border shrink-0 opacity-60">
                                    <div className="w-1.5 h-1.5 rounded-full bg-text-muted" />
                                    <span className="text-[9px] font-bold text-text-muted whitespace-nowrap">{language === 'th' ? 'ออฟไลน์' : 'Offline'}</span>
                                  </span>
                                )}
                              </div>

                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                                <div className="space-y-0.5">
                                  <p className="text-xs text-slate-400 flex items-center gap-2 truncate">
                                    <span className="text-primary/80 font-medium">{hist.os_name || "Unknown OS"}</span>
                                    <span className="w-1 h-1 rounded-full bg-white/20 shrink-0" />
                                    <span className="opacity-70 font-mono text-[11px]">{hist.ip || hist.ip_address}</span>
                                  </p>
                                  <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1 whitespace-nowrap">
                                    <History size={10} className="opacity-50" />
                                    {new Date(hist.createdAt || hist.created_at).toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>

                                {!isCurrent && (
                                  <button
                                    onClick={(e) => { 
                                      e.stopPropagation(); 
                                      handleLogoutSession(hist.id, (hist.isActive && hist.sessionId) ? hist.sessionId : undefined); 
                                    }}
                                    className="w-full sm:w-auto px-4 py-2 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold whitespace-nowrap shrink-0 transition-all bg-white/5 border border-white/10 text-slate-400 hover:bg-rose-500 hover:border-rose-500 hover:text-white"
                                  >
                                    {language === 'th' ? 'ออกจากระบบ' : 'Logout'}
                                  </button>
                                )}
                              </div>

                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-8 text-center text-slate-500 text-sm">
                      {t("noRecentActivity")}
                    </div>
                  )}
                </div>
              </div>
            ) : isEmailFlow ? (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEmailFlow(false);
                      setEmailOtpStep("request_old");
                      setNewEmail("");
                      setEmailOtp("");
                    }}
                    className="p-1 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-colors"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <h2 className="text-xl sm:text-2xl font-black text-white">{t("updateEmail")}</h2>
                </div>

                {emailOtpStep === "request_old" && (
                  <form onSubmit={(e) => { e.preventDefault(); handleSendOldEmailOtp(); }} className="text-center space-y-6 py-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto">
                      <Mail size={32} />
                    </div>
                    <div className="space-y-2">
                      <p className="text-text-main font-bold">{t("verifyCurrentEmail")}</p>
                      <p className="text-sm text-text-muted px-8">
                        {t("verifyCurrentEmailDesc")}
                        <span className="text-primary block mt-1 font-bold">{maskEmail(profileData.email)}</span>
                      </p>
                    </div>
                    <button
                      type="submit"
                      disabled={emailLoading}
                      className="btn-primary w-full flex items-center justify-center gap-2"
                    >
                      {emailLoading ? <Loader2 size={18} className="animate-spin" /> : t("sendCode")}
                    </button>
                  </form>
                )}

                {emailOtpStep === "verify_old" && (
                  <form onSubmit={(e) => { e.preventDefault(); handleVerifyOldEmailOtp(); }} className="space-y-6">
                    <div className="text-center space-y-2">
                      <p className="text-white font-bold">{t("enterVerificationCode")}</p>
                      <p className="text-sm text-slate-400">
                        {t("checkInboxCode")} <span className="text-primary font-bold">{maskEmail(profileData.email)}</span>
                      </p>
                    </div>
                    <SettingsInput
                      label={t("verifyCodeLabel")}
                      placeholder={t("otpPlaceholder")}
                      value={emailOtp}
                      onChange={(e) => setEmailOtp(e.target.value)}
                      maxLength={6}
                    />
                    <button
                      type="submit"
                      disabled={emailLoading || emailOtp.length < 6}
                      className="btn-primary w-full flex items-center justify-center gap-2"
                    >
                      {emailLoading ? <Loader2 size={18} className="animate-spin" /> : t("verifyCode")}
                    </button>
                    <button
                      type="button"
                      onClick={handleSendOldEmailOtp}
                      className="w-full text-xs font-bold text-text-muted hover:text-text-main"
                    >
                      {t("didntGetCode")}
                    </button>
                  </form>
                )}

                {emailOtpStep === "new_email" && (
                  <form onSubmit={(e) => { e.preventDefault(); handleSendEmailOtp(); }} className="space-y-6">
                    <div className="text-center space-y-2">
                      <p className="text-white font-bold">{t("newEmail")}</p>
                      <p className="text-sm text-slate-400">
                        {t("enterNewEmailDesc")}
                      </p>
                    </div>
                    <SettingsInput
                      label={t("newEmail")}
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="example@mail.com"
                    />
                    <button
                      type="submit"
                      disabled={emailLoading || !newEmail.includes("@")}
                      className="btn-primary w-full flex items-center justify-center gap-2"
                    >
                      {emailLoading ? <Loader2 size={18} className="animate-spin" /> : t("sendCode")}
                    </button>
                  </form>
                )}

                {emailOtpStep === "verify_new" && (
                  <form onSubmit={(e) => { e.preventDefault(); handleVerifyEmailOtp(); }} className="space-y-6">
                    <div className="text-center space-y-2">
                      <p className="text-white font-bold">{t("verifyNewEmail")}</p>
                      <p className="text-sm text-slate-400">
                        {t("checkInboxNewEmail")} <span className="text-primary font-bold">{maskEmail(newEmail)}</span>
                      </p>
                    </div>
                    <SettingsInput
                      label={t("verifyCodeLabel")}
                      placeholder={t("otpPlaceholder")}
                      value={emailOtp}
                      onChange={(e) => setEmailOtp(e.target.value)}
                      maxLength={6}
                    />
                    <button
                      type="submit"
                      disabled={emailLoading || emailOtp.length < 6}
                      className="btn-primary w-full flex items-center justify-center gap-2"
                    >
                      {emailLoading ? <Loader2 size={18} className="animate-spin" /> : t("verifyAndUpdateEmail")}
                    </button>
                    <button
                      type="button"
                      onClick={handleSendEmailOtp}
                      className="w-full text-xs font-bold text-slate-500 hover:text-white"
                    >
                      {t("didntGetCode")}
                    </button>
                  </form>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOtpFlow(false);
                      setOtpStep("request");
                    }}
                    className="p-1 hover:bg-card-header rounded-lg text-text-muted hover:text-text-main transition-colors"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <h2 className="text-xl sm:text-2xl font-black text-text-main">{t("resetPassword")}</h2>
                </div>

                {otpStep === "request" && (
                  <form onSubmit={(e) => { e.preventDefault(); handleSendOtp(); }} className="text-center space-y-6 py-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto">
                      <Mail size={32} />
                    </div>
                    <div className="space-y-2">
                      <p className="text-text-main font-bold">{t("requestPasswordReset")}</p>
                      <p className="text-sm text-text-muted px-8">
                        {t("sendCodeToEmail")}
                        <span className="text-primary block mt-1 font-bold">{maskEmail(profileData.email)}</span>
                      </p>
                    </div>
                    <button
                      type="submit"
                      disabled={otpLoading}
                      className="btn-primary w-full flex items-center justify-center gap-2"
                    >
                      {otpLoading ? <Loader2 size={18} className="animate-spin" /> : t("sendCode")}
                    </button>
                  </form>
                )}

                {otpStep === "verify" && (
                  <form onSubmit={(e) => { e.preventDefault(); handleVerifyOtp(); }} className="space-y-6">
                    <div className="text-center space-y-2">
                      <p className="text-text-main font-bold">{t("enterVerificationCode")}</p>
                      <p className="text-sm text-text-muted">
                        {t("checkInboxCode")} <span className="text-primary font-bold">{maskEmail(profileData.email)}</span>
                      </p>
                    </div>
                    <SettingsInput
                      label={t("verifyCodeLabel")}
                      placeholder={t("otpPlaceholder")}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      maxLength={6}
                    />
                    <button
                      type="submit"
                      disabled={otpLoading || otpCode.length < 6}
                      className="btn-primary w-full flex items-center justify-center gap-2"
                    >
                      {otpLoading ? <Loader2 size={18} className="animate-spin" /> : t("verifyCode")}
                    </button>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      className="w-full text-xs font-bold text-slate-500 hover:text-white"
                    >
                      {t("didntGetCode")}
                    </button>
                  </form>
                )}

                {otpStep === "new_password" && (
                  <form onSubmit={(e) => { e.preventDefault(); handleOtpPasswordUpdate(); }} className="space-y-6">
                    <div className="text-center space-y-2">
                      <p className="text-white font-bold">{t("setNewPassword")}</p>
                      <p className="text-sm text-slate-400">
                        {t("codeVerifiedNewPassword")}
                      </p>
                    </div>
                    <div className="space-y-4">
                      <SettingsInput
                        label={t("newPasswordLabel")}
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                      />
                      <SettingsInput
                        label={t("confirmNewPasswordLabel")}
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={otpLoading}
                      className="btn-primary w-full flex items-center justify-center gap-2"
                    >
                      {otpLoading ? <Loader2 size={18} className="animate-spin" /> : t("resetPassword")}
                    </button>
                  </form>
                )}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "history" && (
          <motion.div
            key="history"
            initial={{ opacity: 0, x: isMobile ? 0 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isMobile ? 0 : -20 }}
            className="glass-card max-w-lg relative"
          >
            {isMobile && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white"
              >
                <ChevronRight className="rotate-180" size={20} />
              </button>
            )}
            <h2 className="text-base font-bold text-text-main mb-1">
              {t("historyDeposit")}
            </h2>
            <p className="text-text-muted text-[11px] mb-4">
              {t("historyDepositDesc")}
            </p>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
              {transactions.filter((t) => t.type === "deposit").length === 0 ? (
                <div className="text-center py-8">
                  <History
                    size={32}
                    className="mx-auto text-slate-600 mb-1.5 opacity-50"
                  />
                  <p className="text-slate-400 text-sm font-bold">
                    {t("noDepositHistory")}
                  </p>
                </div>
              ) : (
                transactions
                  .filter((t) => t.type === "deposit")
                  .map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-card-header/50 border border-border shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-500/10 text-green-600 flex items-center justify-center font-bold text-xs border border-green-500/20">
                          +
                        </div>
                        <div>
                          <p className="text-text-main font-bold text-sm uppercase">
                            {tx.asset || "Deposit"}
                          </p>
                          <p className="text-[10px] text-text-muted font-bold mt-0.5">
                            {new Date(tx.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-green-600 font-bold text-[13px]">
                          +$
                          {tx.amount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                        <p className="text-[9px] text-text-muted uppercase tracking-widest mt-0.5 font-bold">
                          {tx.status}
                        </p>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </motion.div>
        )}

        {activeTab === "notifications" && (
          <motion.div
            key="notifications"
            initial={{ opacity: 0, x: isMobile ? 0 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isMobile ? 0 : -20 }}
            className="glass-card max-w-lg relative"
          >
            {isMobile && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white"
              >
                <ChevronRight className="rotate-180" size={20} />
              </button>
            )}
            <h2 className="text-base font-bold text-white mb-1">
              {t("systemNotifications")}
            </h2>
            <p className="text-slate-400 text-[11px] mb-5">
              {t("systemNotificationsDesc")}
            </p>

            <div className="space-y-5">
              <div className="p-3 sm:p-4 rounded-xl bg-card-header/50 border border-border flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-inner ${notificationPermission === 'granted' ? 'bg-green-500/10 text-green-600' :
                    notificationPermission === 'denied' ? 'bg-red-500/10 text-red-600' : 'bg-primary/10 text-primary'
                    }`}>
                    {notificationPermission === 'granted' ? <Bell size={16} /> :
                      notificationPermission === 'denied' ? <BellOff size={16} /> : <Bell size={16} />}
                  </div>
                  <div>
                    <p className="text-text-main font-bold text-xs">
                      {notificationPermission === 'granted' ? t("notificationsEnabled") :
                        notificationPermission === 'denied' ? t("notificationsDisabled") : t("enableNotifications")}
                    </p>
                    <p className="text-[10px] text-text-muted mt-0.5">
                      {notificationPermission === 'unsupported' ? t("notificationsUnsupported") :
                        notificationPermission === 'denied' ? t("notificationsDenied") : 'Web Push Notifications'}
                    </p>
                  </div>
                </div>

                {notificationPermission !== 'unsupported' && (
                  <button
                    onClick={handleRequestPermission}
                    disabled={notificationPermission === 'granted'}
                    className={`px-3 py-1.5 rounded-lg font-bold text-[10px] transition-all ${notificationPermission === 'granted'
                      ? 'bg-green-500/20 text-green-500 cursor-default'
                      : 'bg-primary text-white hover:bg-primary/80 active:scale-95'
                      }`}
                  >
                    {notificationPermission === 'granted' ? t('notificationsEnabled') : t('enableNotifications')}
                  </button>
                )}
              </div>

              {notificationPermission === 'denied' && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] flex gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <p>{t("notificationsDenied")}</p>
                </div>
              )}

              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-text-muted uppercase tracking-widest">{t("notificationTypes")}</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-card-header/50 shadow-inner border border-border">
                    <span className="text-xs font-bold text-text-main">{t("tradeOutcomes")}</span>
                    <div className="w-8 h-4 rounded-full bg-green-500 relative cursor-default">
                      <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow-sm" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-card-header/30 opacity-50 border border-border shadow-inner">
                    <span className="text-xs font-bold text-text-main">{t("priceAlerts")}</span>
                    <div className="w-8 h-4 rounded-full bg-card relative cursor-not-allowed border border-border">
                      <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-text-muted rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "language" && (
          <motion.div
            key="language"
            initial={{ opacity: 0, x: isMobile ? 0 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isMobile ? 0 : -20 }}
            className="glass-card max-w-lg relative"
          >
            {isMobile && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white"
              >
                <ChevronRight className="rotate-180" size={20} />
              </button>
            )}
            <h2 className="text-base font-bold text-text-main mb-1">
              {t("languageSettings")}
            </h2>
            <p className="text-text-muted text-[11px] mb-5">
              {t("languageSettingsDesc")}
            </p>

            <div className="space-y-2">
              {[
                { id: 'th', label: 'ภาษาไทย (Thai)', icon: '🇹🇭' },
                { id: 'en', label: 'English (US)', icon: '🇺🇸' },
              ].map((lang) => {
                const { language, setLanguage } = useLanguage();
                const isActive = language === lang.id;

                return (
                  <button
                    key={lang.id}
                    onClick={() => setLanguage(lang.id as 'th' | 'en')}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${isActive
                      ? 'bg-primary/10 border-primary/50 text-white shadow-lg shadow-primary/10'
                      : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:border-white/10'
                      }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-2xl leading-none">{lang.icon}</span>
                      <span className={`font-bold ${isActive ? 'text-text-main' : 'text-text-main'}`}>
                        {lang.label}
                      </span>
                    </div>
                    {isActive && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-background">
                        <Check size={14} strokeWidth={4} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-12 p-6 rounded-2xl bg-primary/5 border border-primary/10 flex items-center gap-4 shadow-inner">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                <Globe size={24} />
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                {t("translationsApplied")}
              </p>
            </div>
          </motion.div>
        )}

        {activeTab === "display" && (
          <motion.div
            key="display"
            initial={{ opacity: 0, x: isMobile ? 0 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isMobile ? 0 : -20 }}
            className="glass-card max-w-lg relative"
          >
            {isMobile && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white"
              >
                <ChevronRight className="rotate-180" size={20} />
              </button>
            )}
            <h2 className="text-base font-bold text-text-main mb-1">
              {t("displaySettings")}
            </h2>
            <p className="text-text-muted text-[11px] mb-5">
              {language === 'th' ? "ปรับแต่งหน้าตาของแอปพลิเคชันตามที่คุณต้องการ" : "Personalize the appearance of the application"}
            </p>

            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">{t("theme")}</h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { id: 'dark', label: t("darkMode"), icon: <Moon size={20} />, colors: "bg-slate-900" },
                  { id: 'light', label: t("lightMode"), icon: <Sun size={20} />, colors: "bg-slate-50 border border-slate-200" },
                  { id: 'liquid-glass', label: t("liquidGlass"), icon: <Sparkles size={20} />, colors: "bg-gradient-to-br from-primary/30 to-accent/30 backdrop-blur-md border border-white/20" },
                ].map((mode) => {
                  const { theme, setTheme } = useTheme();
                  const isActive = theme === mode.id;

                  return (
                    <button
                      key={mode.id}
                      onClick={() => setTheme(mode.id as any)}
                      className={`relative group flex flex-col items-center gap-3 p-5 rounded-2xl border transition-all duration-300 ${isActive
                        ? 'bg-primary/10 border-primary/50 ring-1 ring-primary/20'
                        : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                        }`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110 shadow-inner ${mode.colors} ${isActive ? 'text-primary' : 'text-text-muted'}`}>
                        {mode.icon}
                      </div>
                      <span className={`text-[11px] font-bold uppercase tracking-widest ${isActive ? 'text-text-main' : 'text-text-muted'}`}>
                        {mode.label}
                      </span>
                      {isActive && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center text-background">
                          <Check size={12} strokeWidth={4} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-8 p-5 rounded-2xl bg-card-header/50 border border-border shadow-inner">
                 <div className="flex items-center gap-3 mb-3">
                   <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                     <Zap size={16} />
                   </div>
                   <h4 className="text-xs font-bold text-text-main uppercase tracking-tight">{language === 'th' ? "ประสิทธิภาพ" : "Performance"}</h4>
                 </div>
                 <p className="text-[11px] text-text-muted leading-relaxed">
                   {language === 'th' 
                     ? "การสลับธีมจะเปลี่ยนรูปแบบการแสดงผลทันทีโดยไม่ต้องรีโหลดหน้าเว็บ และระบบจะจำค่าที่คุณเลือกไว้ในเครื่องนี้" 
                     : "Theme switching happens instantly without page reload, and your preference is saved locally on this device."}
                 </p>
              </div>
            </div>
          </motion.div>
        )}
        {activeTab === "reports" && (
          <motion.div
            key="reports"
            initial={{ opacity: 0, x: isMobile ? 0 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isMobile ? 0 : -20 }}
            className="flex flex-col gap-6"
          >
            {/* Report Form */}
            <div className="glass-card relative">
              {isMobile && (
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white"
                >
                  <ChevronRight className="rotate-180" size={20} />
                </button>
              )}
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center text-primary shrink-0 shadow-inner">
                  <MessageSquare size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-text-main leading-tight">{language === 'th' ? "แจ้งรายงานปัญหา" : "Report an Issue"}</h2>
                  <p className="text-text-muted text-[11px]">{language === 'th' ? "แจ้งปัญหาที่คุณพบเพื่อรับการช่วยเหลือ" : "Let us know about any issues you encounter"}</p>
                </div>
              </div>

              <form onSubmit={handleSubmitReport} className="mt-6 space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">{language === 'th' ? "หัวข้อปัญหา" : "Issue Topic"}</label>
                  <div className="flex flex-wrap gap-2">
                    {["#Deposit", "#Withdraw", "#Trade", "#Security", "#Other"].map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setReportForm(prev => ({ ...prev, category: cat }))}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border shadow-sm ${
                          reportForm.category === cat 
                            ? "bg-primary/20 border-primary/40 text-primary" 
                            : "bg-transparent border-border text-text-muted hover:bg-card-header/50"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <SettingsInput
                    label={language === 'th' ? "ชื่อเรื่อง" : "Subject"}
                    placeholder={language === 'th' ? "ระบุหัวข้อสั้นๆ" : "Enter a brief subject"}
                    value={reportForm.subject}
                    onChange={(e) => setReportForm(prev => ({ ...prev, subject: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1">{language === 'th' ? "รายละเอียดปัญหา" : "Problem Details"}</label>
                  <textarea
                    value={reportForm.message}
                    onChange={(e) => setReportForm(prev => ({ ...prev, message: e.target.value }))}
                    placeholder={language === 'th' ? "อธิบายรายละเอียดปัญหาที่คุณพบ..." : "Describe the problem in detail..."}
                    className="w-full bg-transparent border border-border rounded-2xl p-4 text-xs text-text-main focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all min-h-[120px] resize-none"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={reportSubmitting}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-primary text-white font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-primary/20"
                  >
                    {reportSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    {language === 'th' ? "ส่งรายงาน" : "Submit Report"}
                  </button>
                </div>
              </form>
            </div>

            {/* Reports History */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-text-main uppercase tracking-widest flex items-center gap-2 px-1">
                <History size={14} className="text-text-muted" />
                {language === 'th' ? "ประวัติการรายงาน" : "Report History"}
              </h3>

              <div className="space-y-3">
                {reportsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 size={24} className="animate-spin text-primary" />
                  </div>
                ) : reports.length === 0 ? (
                  <div className="glass-card py-10 flex flex-col items-center justify-center text-slate-500">
                    <MessageSquare size={32} className="opacity-20 mb-3" />
                    <p className="text-[10px] font-bold uppercase tracking-widest">{language === 'th' ? "ไม่มีประวัติการแจ้งปัญหา" : "No reports found"}</p>
                  </div>
                ) : (
                  reports.map(report => (
                    <div key={report.id} className="glass-card bg-card border border-border p-4 space-y-3 group hover:border-primary/30 transition-all shadow-sm">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shadow-inner ${
                            report.status === 'resolved' ? "bg-green-500/10 text-green-600" : "bg-orange-500/10 text-orange-600"
                          }`}>
                            #{report.smart_id}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black text-primary uppercase tracking-tighter bg-primary/10 px-1.5 py-0.5 rounded-md shadow-sm">
                                {report.category}
                              </span>
                              <h4 className="text-xs font-bold text-text-main truncate max-w-[150px] sm:max-w-none">{report.subject}</h4>
                            </div>
                            <p className="text-[9px] text-text-muted font-bold mt-0.5 uppercase tracking-widest">
                              {new Date(report.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                          report.status === 'resolved' ? "bg-green-500 text-white" : "bg-orange-500 text-white"
                        }`}>
                          {report.status}
                        </div>
                      </div>

                      <div className="p-3 bg-card-header/50 rounded-xl border border-border shadow-inner">
                        <p className="text-[11px] text-text-main leading-relaxed italic">"{report.message}"</p>
                      </div>

                      {report.admin_response && (
                        <div className="p-3 bg-primary/5 rounded-xl border border-primary/10 relative overflow-hidden shadow-sm">
                          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                          <div className="flex items-center gap-2 mb-1.5">
                            <ShieldCheck size={12} className="text-primary" />
                            <span className="text-[9px] font-black text-primary uppercase tracking-widest">{language === 'th' ? "แอดมินตอบกลับ" : "Admin Response"}</span>
                          </div>
                          <p className="text-[11px] text-text-main font-medium leading-relaxed">{report.admin_response}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
