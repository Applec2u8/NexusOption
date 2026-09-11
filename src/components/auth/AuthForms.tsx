import React, { useState, useEffect } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Globe,
  Activity,
  ArrowLeft,
  CheckCircle2,
  Sun,
  Moon
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth, type Profile } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { generateOTP } from "../../utils/otp";
import { emailService } from "../../services/emailService";
import { encryptPassword, comparePassword } from "../../utils/security";
import { generateUserCode } from "../../utils/userUtils";
import { maskEmail } from "../../utils/format";
import logoImg from "../../assets/Logo-url.png";
import btcLogo from "../../assets/icon/Bitcoin.png";
import ethLogo from "../../assets/icon/Ethereum.png";
import goldLogo from "../../assets/icon/Gold.png";

// Dummy market data for the right side
const MARKET_DATA = [
  { symbol: "BTC/USD", name: "Bitcoin", icon: btcLogo, price: "68,432.10", change: "+4.2%", isUp: true, points: "0,50 10,40 20,45 30,30 40,35 50,20 60,25 70,10 80,15 90,5 100,0" },
  { symbol: "ETH/USD", name: "Ethereum", icon: ethLogo, price: "3,840.50", change: "-1.1%", isUp: false, points: "0,10 10,15 20,8 30,12 40,20 50,18 60,30 70,25 80,35 90,40 100,50" },
  { symbol: "XAU/USD", name: "Gold", icon: goldLogo, price: "2,340.20", change: "+0.8%", isUp: true, points: "0,30 10,25 20,28 30,22 40,15 50,18 60,10 70,12 80,5 90,8 100,0" },
];

export const AuthForms: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [mode, setMode] = useState<"login" | "register" | "forgot" | "verify" | "reset">(() => {
    return sessionStorage.getItem("auth_mode") as any || "login";
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isClient, setIsClient] = useState(false);

  // Form State
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState(() => {
    return sessionStorage.getItem("auth_email") || "";
  });
  const [otp, setOtp] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);
  const [verificationType, setVerificationType] = useState<"login" | "register" | "forgot">(() => {
    return sessionStorage.getItem("auth_verification_type") as any || "login";
  });
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [tempEmail, setTempEmail] = useState("");

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      sessionStorage.setItem("auth_mode", mode);
      sessionStorage.setItem("auth_email", email);
      sessionStorage.setItem("auth_verification_type", verificationType);
    }
  }, [mode, email, verificationType, isClient]);

  // Countdown timer for Resend OTP
  useEffect(() => {
    let timer: any;
    if (resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCountdown]);

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      if (mode === "login") {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .or(`username.eq.${username},email.eq.${username}`)
          .single();

        if (error || !data) throw new Error("Invalid username or password.");

        if (!(await comparePassword(password, data.password))) {
          throw new Error("Invalid username or password.");
        }
        if (data.is_verified === false) {
          setEmail(data.email);
          setFirstName(data.first_name);
          setVerificationType("login");

          // Check if registration/verification OTP is enabled
          const { data: settings } = await supabase
            .from("global_settings")
            .select("registration_otp_enabled")
            .eq("id", "main")
            .single();

          if (settings?.registration_otp_enabled === false) {
            // If OTP is disabled, just verify the user and login
            await supabase.from("profiles").update({ is_verified: true, otp_code: null }).eq("id", data.id);
            sessionStorage.removeItem("auth_mode");
            sessionStorage.removeItem("auth_email");
            sessionStorage.removeItem("auth_verification_type");
            login(data as Profile);
            return;
          }

          // Auto-send OTP when redirecting to verification
          const newOtp = generateOTP();
          await supabase
            .from("profiles")
            .update({
              otp_code: newOtp,
              otp_expires_at: new Date(Date.now() + 10 * 60000).toISOString()
            })
            .eq("id", data.id);

          await emailService.sendOTP({
            email: data.email,
            code: newOtp,
            userName: data.first_name,
            lang: language,
            type: 'verification'
          });

          setMode("verify");
          setSuccessMsg(t("checkEmailForCode") || "Please verify your account. A new code has been sent.");
          return;
        }
        sessionStorage.removeItem("auth_mode");
        sessionStorage.removeItem("auth_email");
        sessionStorage.removeItem("auth_verification_type");
        login(data as Profile);
      } else if (mode === "register") {
        if (password !== confirmPassword) throw new Error("Passwords do not match.");

        // Check duplicates
        const { data: existing } = await supabase
          .from("profiles")
          .select("username, email")
          .or(`username.eq.${username},email.eq.${email}`);

        if (existing && existing.length > 0) {
          throw new Error(existing.some((u: any) => u.username === username) ? "Username taken" : "Email already registered");
        }

        // Get registration settings
        const { data: settings } = await supabase
          .from("global_settings")
          .select("registration_otp_enabled")
          .eq("id", "main")
          .single();

        const otpEnabled = settings?.registration_otp_enabled ?? true;
        const newOtp = otpEnabled ? generateOTP() : null;

        const { data: registeredUser, error } = await supabase
          .from("profiles")
          .insert([{
            id: crypto.randomUUID(),
            username,
            first_name: firstName,
            last_name: lastName,
            email,
            password: encryptPassword(password),
            otp_code: newOtp,
            otp_expires_at: otpEnabled ? new Date(Date.now() + 10 * 60000).toISOString() : null,
            is_verified: !otpEnabled,
            balance: 0,
            is_admin: false,
            code: generateUserCode(),
          }])
          .select().single();

        if (error) throw error;

        if (otpEnabled) {
          const emailResult = await emailService.sendOTP({ email, code: newOtp!, userName: firstName, lang: language, type: 'verification' });
          
          if (!emailResult.success) {
            console.error("[Auth] Detailed email failure:", emailResult.error);
            // Non-technical error for the user
            throw new Error(language === "th" ? "พบปัญหาในการส่งรหัสยืนยัน กรุณาติดต่อฝ่ายสนับสนุน" : "There was a problem sending the verification code. Please contact support.");
          }

          setVerificationType("register");
          setMode("verify");
          setSuccessMsg(t("checkEmailForCode"));
        } else {
          // Auto-login for direct registration
          sessionStorage.removeItem("auth_mode");
          sessionStorage.removeItem("auth_email");
          sessionStorage.removeItem("auth_verification_type");
          login(registeredUser as Profile);
        }
      } else if (mode === "forgot") {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("email", email)
          .single();

        if (error || !data) throw new Error("No account found with this email.");

        // Check if recovery OTP is enabled
        const { data: settings } = await supabase
          .from("global_settings")
          .select("recovery_otp_enabled")
          .eq("id", "main")
          .single();

        if (settings && settings.recovery_otp_enabled === false) {
          throw new Error(language === "th" 
            ? "การกู้คืนบัญชีผ่านอีเมลถูกปิดใช้งานชั่วคราว กรุณาติดต่อฝ่ายสนับสนุน" 
            : "Account recovery via email is currently disabled. Please contact support.");
        }

        const newOtp = generateOTP();
        await supabase
          .from("profiles")
          .update({
            otp_code: newOtp,
            otp_expires_at: new Date(Date.now() + 10 * 60000).toISOString()
          })
          .eq("id", data.id);

        const emailResult = await emailService.sendOTP({ email, code: newOtp, userName: data.first_name, lang: language, type: 'reset' });
        
        if (!emailResult.success) {
          console.error("[Auth] Detailed email failure (reset):", emailResult.error);
          throw new Error(language === "th" ? "พบปัญหาในการส่งรหัสยืนยัน กรุณาติดต่อฝ่ายสนับสนุน" : "There was a problem sending the verification code. Please contact support.");
        }

        setVerificationType("forgot");
        setMode("verify");
        setSuccessMsg(t("checkEmailForCode"));
      } else if (mode === "verify") {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("email", email)
          .eq("otp_code", otp)
          .single();

        if (error || !data) throw new Error(t("invalidOtp"));

        // Check expiry
        if (new Date(data.otp_expires_at) < new Date()) throw new Error(t("invalidOtp"));

        if (verificationType === "forgot") {
          setMode("reset");
        } else {
          // Verify and login
          await supabase.from("profiles").update({ is_verified: true, otp_code: null }).eq("id", data.id);
          sessionStorage.removeItem("auth_mode");
          sessionStorage.removeItem("auth_email");
          sessionStorage.removeItem("auth_verification_type");
          login(data as Profile);
        }
      } else if (mode === "reset") {
        if (password !== confirmPassword) throw new Error("Passwords do not match.");
        const { error } = await supabase
          .from("profiles")
          .update({ password: encryptPassword(password), otp_code: null })
          .eq("email", email);

        if (error) throw error;
        setSuccessMsg(t("passwordChanged"));
        setMode("login");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCountdown > 0 || !email) return;
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      // Check global settings based on verification type
      const { data: settings } = await supabase
        .from("global_settings")
        .select("registration_otp_enabled, recovery_otp_enabled")
        .eq("id", "main")
        .single();

      if (verificationType === 'forgot' && settings?.recovery_otp_enabled === false) {
        throw new Error(language === "th" 
          ? "การกู้คืนบัญชีถูกปิดใช้งาน" 
          : "Account recovery is disabled.");
      }
      if ((verificationType === 'register' || verificationType === 'login') && settings?.registration_otp_enabled === false) {
        throw new Error(language === "th" 
          ? "การยืนยันตัวตนผ่านอีเมลถูกปิดใช้งาน" 
          : "Email verification is disabled.");
      }

      const newOtp = generateOTP();
      const { error } = await supabase
        .from("profiles")
        .update({
          otp_code: newOtp,
          otp_expires_at: new Date(Date.now() + 10 * 60000).toISOString()
        })
        .eq("email", email);

      if (error) throw error;

      await emailService.sendOTP({
        email,
        code: newOtp,
        userName: firstName || "User",
        lang: language,
        type: verificationType === 'forgot' ? 'reset' : 'verification'
      });
      setSuccessMsg(t("codeResent") || "Verification code resent!");
      setResendCountdown(60);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to resend code.");
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpdateEmail = async () => {
    if (!tempEmail || tempEmail === email) {
      setIsEditingEmail(false);
      return;
    }
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      // Check if new email already exists
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", tempEmail)
        .single();

      if (existing) {
        throw new Error(language === "th" ? "อีเมลนี้ถูกใช้งานแล้ว" : "Email already registered");
      }

      // Update email in database
      const { error } = await supabase
        .from("profiles")
        .update({ email: tempEmail })
        .eq("email", email)
        .eq("is_verified", false);

      if (error) throw error;

      setEmail(tempEmail);
      setIsEditingEmail(false);
      
      // Resend OTP to new email
      const newOtp = generateOTP();
      await supabase
        .from("profiles")
        .update({
          otp_code: newOtp,
          otp_expires_at: new Date(Date.now() + 10 * 60000).toISOString()
        })
        .eq("email", tempEmail);

      await emailService.sendOTP({
        email: tempEmail,
        code: newOtp,
        userName: firstName || "User",
        lang: language,
        type: verificationType === 'forgot' ? 'reset' : 'verification'
      });

      setSuccessMsg(language === "th" ? "อัปเดตอีเมลและส่งรหัสใหม่แล้ว" : "Email updated and new code sent!");
      setResendCountdown(60);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden font-sans text-text-main transition-colors duration-500">
      {/* Background Ambience */}
      <div className="fixed top-[-10%] right-[-5%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[150px] animate-pulse pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-accent/20 rounded-full blur-[150px] animate-pulse pointer-events-none" style={{ animationDelay: '2s' }} />

      {/* Header Navbar */}
      <header className="relative z-50 w-full px-4 sm:px-8 py-6 flex items-center justify-between border-b border-white/5 bg-background/50 backdrop-blur-xl">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl overflow-hidden shadow-lg shadow-primary/30">
            <img src={logoImg} alt="Nexus Option Logo" className="w-full h-full object-cover" />
          </div>
          <span className="text-lg sm:text-xl font-black tracking-tight text-text-main">Nexus Option</span>
        </div>
        <div className="flex flex-row gap-2 sm:gap-3">
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-card-header/50 border border-border text-text-muted hover:bg-card-header hover:text-text-main transition-all active:scale-95 group shadow-sm"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? (
              <Sun size={18} className="group-hover:rotate-90 transition-transform duration-500" />
            ) : (
              <Moon size={18} className="group-hover:-rotate-12 transition-transform duration-500" />
            )}
          </button>
          <button
            onClick={() => setLanguage(language === "th" ? "en" : "th")}
            className="flex items-center gap-1.5 sm:gap-2 justify-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-card-header/50 border border-border text-text-muted hover:bg-card-header hover:text-text-main transition-all active:scale-95 shadow-sm group"
          >
            <Globe size={16} className="group-hover:rotate-180 transition-transform duration-700" />
            <span className="text-[11px] sm:text-xs font-bold tracking-wider uppercase">{language === "th" ? "EN" : "ไทย"}</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col sm:flex-row w-full max-w-7xl mx-auto z-10 relative">

        {/* Left Side: Auth Forms */}
        <section className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 ">
          <motion.div
            layout
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 120 }}
            className="w-full max-w-md relative"
          >
            <div className="glass-card shadow-2xl border border-border bg-card p-8 rounded-3xl relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary to-accent" />

              <div className="text-center mb-8">
                <h1 className="text-3xl font-black text-text-main mb-2 tracking-tight">
                  {mode === "login" && (t("login") || "Welcome Back")}
                  {mode === "register" && (t("register") || "Create Account")}
                  {mode === "forgot" && (t("forgotPassword") || "Reset Password")}
                  {mode === "verify" && (t("verificationCode") || "Verification Code")}
                  {mode === "reset" && (t("resetPassword") || "New Password")}
                </h1>
                <p className="text-text-muted text-sm font-medium">
                  {mode === "login" && "Enter your credentials to access the terminal"}
                  {mode === "register" && "Join the next generation of professional trading"}
                  {mode === "forgot" && (t("checkEmailForCode") || "Enter your email to receive a reset code")}
                  {mode === "verify" && `${t("enterCodeSentTo") || "Enter the 6-digit code sent to"} ${maskEmail(email)}`}
                  {mode === "reset" && "Set your new secure access password"}
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                <AnimatePresence mode="wait">
                  {errorMsg && (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-semibold flex items-center gap-2">
                        <AlertCircle size={16} />
                        <span>{errorMsg}</span>
                      </div>
                    </motion.div>
                  )}
                  {successMsg && (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-3 mb-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 text-sm font-semibold flex items-center gap-2">
                        <CheckCircle2 size={16} />
                        <span>{successMsg}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-4">
                  {(mode === "login" || mode === "register") && (
                    <AuthInput
                      icon={<User size={18} />}
                      placeholder={t("usernameOrEmail") || "Username or Email"}
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  )}

                  {mode === "register" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-4 overflow-hidden"
                    >
                      <div className="flex gap-4">
                        <AuthInput
                          icon={<User size={18} />}
                          placeholder={t("firstName") || "First Name"}
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                        />
                        <AuthInput
                          icon={<User size={18} />}
                          placeholder={t("lastName") || "Last Name"}
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                        />
                      </div>
                    </motion.div>
                  )}

                  {(mode === "register" || mode === "forgot") && (
                    <AuthInput
                      icon={<Mail size={18} />}
                      placeholder={t("email") || "Email"}
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  )}

                  {mode === "verify" && (
                    <div className="space-y-4">
                      <AuthInput
                        icon={<ShieldCheck size={18} />}
                        placeholder={t("otpPlaceholder")}
                        type="text"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                      />
                      <div className="flex flex-col items-center gap-3 mt-2">
                        {!isEditingEmail ? (
                          <>
                            <button
                              type="button"
                              onClick={handleResendOTP}
                              disabled={resendCountdown > 0 || loading}
                              className="text-xs font-bold text-primary hover:text-accent transition-colors disabled:text-slate-600 flex items-center gap-2"
                            >
                              {resendCountdown > 0
                                ? `${t("resendIn") || "Resend in"} ${resendCountdown}s`
                                : (t("resendCode") || "Didn't receive code? Resend")}
                            </button>
                            {verificationType !== 'forgot' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setIsEditingEmail(true);
                                  setTempEmail(email);
                                }}
                                className="text-[10px] font-bold text-text-muted hover:text-primary transition-colors underline underline-offset-4"
                              >
                                {language === 'th' ? 'กรอกอีเมลผิด? แก้ไขที่นี่' : 'Wrong email? Edit here'}
                              </button>
                            )}
                          </>
                        ) : (
                          <div className="w-full space-y-3 p-4 rounded-2xl bg-card-header/30 border border-border">
                            <p className="text-[10px] font-black uppercase text-text-muted tracking-widest">{language === 'th' ? 'แก้ไขอีเมลของคุณ' : 'Edit your email'}</p>
                            <AuthInput
                              icon={<Mail size={16} />}
                              placeholder={t("email") || "Email"}
                              type="email"
                              value={tempEmail}
                              onChange={(e) => setTempEmail(e.target.value)}
                              required
                            />
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setIsEditingEmail(false)}
                                className="flex-1 py-2 rounded-lg bg-card-header text-text-main text-xs font-bold hover:bg-border transition-all"
                              >
                                {language === 'th' ? 'ยกเลิก' : 'Cancel'}
                              </button>
                              <button
                                type="button"
                                onClick={handleUpdateEmail}
                                disabled={loading}
                                className="flex-1 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                              >
                                {language === 'th' ? 'อัปเดตและส่งใหม่' : 'Update & Resend'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {(mode === "login" || mode === "register" || mode === "reset") && (
                    <div className="relative">
                      <AuthInput
                        icon={<Lock size={18} />}
                        placeholder={mode === "reset" ? (t("newPassword") || "New Password") : (t("password") || "Password")}
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main transition-colors"
                        style={{ height: '100%', alignContent: 'center', backgroundColor: 'transparent' }}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  )}

                  {(mode === "register" || mode === "reset") && (
                    <div className="relative">
                      <AuthInput
                        icon={<ShieldCheck size={18} />}
                        placeholder={mode === "reset" ? (t("confirmNewPassword") || "Confirm New Password") : (t("confirmPassword") || "Confirm Password")}
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main transition-colors"
                        style={{ height: '100%', alignContent: 'center', backgroundColor: 'transparent' }}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  )}

                  {mode === "login" && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => { setMode("forgot"); setErrorMsg(""); setSuccessMsg(""); }}
                        className="text-xs font-bold text-text-muted hover:text-primary transition-colors"
                      >
                        {t("forgotPassword") || "Forgot Password?"}
                      </button>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full relative group overflow-hidden py-3.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-black hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <span className="relative z-10">
                      {loading ? "Processing..." : (
                        mode === "login" ? (t("login") || "Login") :
                          mode === "register" ? (t("register") || "Register") :
                            mode === "forgot" ? "Send Reset Code" :
                              mode === "verify" ? "Verify Code" :
                                (t("save") || "Save")
                      )}
                    </span>
                    {!loading && (
                      <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                    )}
                  </button>
                </div>
              </form>

              <div className="mt-8 text-center border-t border-border pt-6">
                {mode === "login" ? (
                  <p className="text-text-muted text-sm font-medium">
                    Don't have an account?{" "}
                    <button
                      onClick={() => { setMode("register"); setErrorMsg(""); setSuccessMsg(""); }}
                      className="text-primary font-bold hover:underline transition-all"
                    >
                      {t("register") || "Register"}
                    </button>
                  </p>
                ) : (
                  <button
                    onClick={() => { setMode("login"); setErrorMsg(""); setSuccessMsg(""); }}
                    className="flex items-center justify-center gap-2 mx-auto text-text-muted text-sm font-bold hover:text-text-main transition-all shadow-none bg-transparent"
                  >
                    <ArrowLeft size={16} />
                    Back to Login
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </section>

        {/* Right Side: Market Showcase */}
        <section className="w-full lg:w-1/2 flex p-6 lg:p-12 flex-col justify-center relative mt-8 lg:mt-0 pb-20 lg:pb-12">
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 120, delay: 0.1 }}
            className="w-full max-w-lg mx-auto"
          >
            <div className="hidden sm:block mb-10 text-center lg:text-left">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-text-main mb-4 leading-tight bg-clip-text text-transparent bg-gradient-to-r from-text-main to-text-muted">
                {t("tradeWithPrecision") || "Trade with"}<br className="sm:block" />{t("unprecedentedPrecision") || "unprecedented precision."}
              </h2>
              <p className="text-text-muted text-sm sm:text-base lg:text-lg max-w-md mx-auto lg:mx-0">
                {t("experienceLowestLatency") || "Experience lowest latency execution, advanced charting tools, and high-frequency capabilities."}
              </p>
            </div>

            {/* Simulated Live Market Cards */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-bold text-text-muted uppercase tracking-widest px-4 mb-2">
                <span>{t("trendingMarkets") || "Trending Markets"}</span>
                <span className="flex items-center gap-1 text-green-500"><Activity size={14} /> {t("live") || "Live"}</span>
              </div>

              {MARKET_DATA.map((market, idx) => (
                <motion.div
                  key={market.symbol}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + (idx * 0.1) }}
                  className="glass-card bg-card border border-border p-4 rounded-2xl flex items-center justify-between hover:bg-card-header transition-colors cursor-default"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white ${market.isUp ? 'bg-green-500/20' : 'bg-red-500/20'} overflow-hidden p-1.5`}>
                      <img src={market.icon} alt={market.symbol} className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <p className="text-text-main font-black">{market.symbol}</p>
                      <p className="text-xs text-text-muted font-semibold">{t(market.name.toLowerCase()) || market.name}</p>
                    </div>
                  </div>

                  {/* Tiny SVG Chart */}
                  <div className="w-24 h-10 opacity-70">
                    <svg viewBox="0 0 100 50" className="w-full h-full preserve-3d overflow-visible">
                      <motion.polyline
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                        fill="none"
                        stroke={market.isUp ? "#22c55e" : "#ef4444"}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={market.points}
                      />
                    </svg>
                  </div>

                  <div className="text-right">
                    <p className="text-text-main font-mono font-bold">${market.price}</p>
                    <p className={`text-xs font-black flex items-center justify-end gap-1 ${market.isUp ? 'text-green-500' : 'text-red-500'}`}>
                      {market.isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {market.change}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-8 flex gap-2 sm:gap-3 text-[10px] sm:text-xs md:text-sm font-bold text-text-muted justify-center w-full flex-wrap max-w-lg mx-auto">
              <span className="flex items-center gap-1 sm:gap-1.5"><ShieldCheck size={14} className="text-primary" /> {t("secure") || "Secure"}</span>
              <span className="hidden sm:inline">•</span>
              <span>{t("fastExecution") || "Fast Execution"}</span>
              <span className="hidden sm:inline">•</span>
              <span>{t("support247") || "24/7 Support"}</span>
            </div>

          </motion.div>
        </section>
      </main>
    </div>
  );
};

const AuthInput: React.FC<{
  icon: React.ReactNode;
  placeholder: string;
  type: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  maxLength?: number;
}> = ({ icon, placeholder, type, value, onChange, required, maxLength }) => (
  <div className="relative group w-full">
    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors pointer-events-none z-10">
      {icon}
    </div>
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      maxLength={maxLength}
      className="w-full bg-transparent border border-border rounded-xl py-3.5 pl-12 pr-12 text-text-main text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all placeholder:text-text-muted/50 hover:border-primary/20 hover:bg-card-header/50"
    />
  </div>
);
