import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ArrowUpCircle,
  ChevronRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
  UserX
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { depositMethods } from "../../data/depositMethods";
import { SupportContactList } from "./SupportContactList";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import type { GlobalSettings } from "../../types";

type WithdrawStep = "select" | "form" | "result" | "kyc_required";

interface WithdrawModalProps {
  balance: number;
  onClose: () => void;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  balance,
  onClose,
}) => {
  const { t, language } = useLanguage();
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState<WithdrawStep>(() => {
    return profile?.kyc_status === 'verified' ? "select" : "kyc_required";
  });
  const [selected, setSelected] = useState<(typeof depositMethods)[0] | null>(
    null,
  );
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [amountError, setAmountError] = useState("");
  const [settings, setSettings] = useState<Partial<GlobalSettings>>({});

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from("global_settings")
        .select("*")
        .eq("id", "main")
        .single();
      if (data) {
        setSettings(data);
      }
    };
    fetchSettings();
  }, []);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSubmit = async () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) {
      setAmountError(language === 'th' ? "กรุณาระบุจำนวนเงินที่ถูกต้อง" : "Please enter a valid amount");
      return;
    }
    if (num > balance) {
      setAmountError(language === 'th' ? "จํานวนเงินเกินยอดคงเหลือ" : "Amount exceeds balance");
      return;
    }
    
    setAmountError("");
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 15000));
    setSubmitting(false);
    setStep("result");
  };

  return (
    <AnimatePresence mode="wait">
      {/* ── Step 0: KYC Required ── */}
      {step === "kyc_required" && (
        <motion.div
          key="kyc_required"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-col"
        >
          <div className="p-6 border-b border-border flex items-center justify-between relative bg-card-header/50">
            <h2 className="text-lg font-black text-text-main flex items-center gap-2">
               <UserX size={20} className="text-amber-500" />
               {language === 'th' ? "ต้องยืนยันตัวตน (KYC)" : "KYC Verification Required"}
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-card-header transition-colors text-text-muted hover:text-text-main"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-6">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 shadow-sm">
                <AlertCircle size={32} className="text-amber-500" />
              </div>
              <p className="text-text-main text-sm leading-relaxed mb-4">
                {language === 'th' 
                  ? (<>เพื่อความปลอดภัยของบัญชี กรุณายืนยันตัวตน{" "}
                      <button
                        onClick={() => { onClose(); sessionStorage.setItem("settings_active_tab", "profile"); navigate("/settings"); }}
                        className="text-amber-600 underline underline-offset-2 hover:text-amber-700 font-bold transition-colors cursor-pointer"
                      >(KYC)</button>{" "}
                      ให้เสร็จสมบูรณ์ก่อนทำรายการฝาก-ถอนเงินครับ</>) 
                  : (<>For account security, please complete{" "}
                      <button
                        onClick={() => { onClose(); sessionStorage.setItem("settings_active_tab", "profile"); navigate("/settings"); }}
                        className="text-amber-600 underline underline-offset-2 hover:text-amber-700 font-bold transition-colors cursor-pointer"
                      >KYC verification</button>{" "}
                      before depositing or withdrawing funds.</>)}
              </p>
              <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest">
                {language === 'th' ? "สถานะปัจจุบัน:" : "Current Status:"} <span className="text-amber-600">{profile?.kyc_status?.toUpperCase() || 'UNVERIFIED'}</span>
              </p>
            </div>

            <div className="mb-6">
              <SupportContactList settings={settings} />
            </div>

            <button
              onClick={onClose}
              className="w-full py-4 rounded-xl bg-card-header hover:bg-card-header/80 text-text-main font-black text-sm transition-all border border-border"
            >
              {t('closeLabel')}
            </button>
          </div>
        </motion.div>
      )}

      {/* ── Step 1: Select Method ── */}
      {step === "select" && (
        <motion.div
          key="select"
          initial={false}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          className="flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-border flex items-center justify-between relative bg-card-header/50">
            <div>
              <h2 className="text-lg font-black text-text-main flex items-center gap-2">
                <ArrowUpCircle size={20} className="text-red-500" />
                {t('withdraw')}
              </h2>
              <p className="text-text-muted text-[10px] font-bold uppercase tracking-wider mt-0.5">
                {t('selectWithdrawMethod')}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-card-header transition-colors text-text-muted hover:text-text-main"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            {/* Balance badge */}
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 mb-6 flex items-center justify-between shadow-inner">
              <span className="text-text-muted text-xs font-bold uppercase tracking-wider">{t('availableBalanceLabel')}</span>
              <span className="text-text-main font-black text-lg tabular-nums">
                ${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="space-y-3">
              {depositMethods.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setSelected(m);
                    setStep("form");
                  }}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all group shadow-sm`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{m.flag}</span>
                    <div className="text-left">
                      <p className="text-text-main font-bold text-sm">{m.label}</p>
                      <p className="text-text-muted text-xs">{m.bank}</p>
                    </div>
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-text-muted group-hover:text-primary group-hover:translate-x-1 transition-all"
                  />
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Step 2: Enter Bank Details ── */}
      {step === "form" && selected && (
        <motion.div
          key="form"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          className="flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-border flex items-center justify-between relative bg-card-header/50">
            <button
              onClick={() => setStep("select")}
              className="text-text-muted hover:text-text-main text-xs font-bold flex items-center gap-1 transition-colors"
            >
              <ChevronRight size={14} className="rotate-180" /> {t('back')}
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-card-header transition-colors text-text-muted hover:text-text-main"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            <div className="text-center mb-6">
              <span className="text-3xl">{selected.flag}</span>
              <h2 className="text-lg font-black text-text-main mt-1">
                {selected.label}
              </h2>
              <p className="text-text-muted text-xs">{selected.bank}</p>
            </div>

            <div className="space-y-4 mb-6">
              {/* Verified Bank Details */}
              <div className="bg-card-header/50 border border-border rounded-xl p-4 flex items-center justify-between shadow-inner">
                <div>
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">{selected.id === "usdt" ? t('network') : t('bankName')}</p>
                  <p className="text-text-main font-bold text-sm">{profile?.bank_network || 'N/A'}</p>
                  <p className="text-text-muted text-xs mt-0.5 max-w-[120px] truncate">{profile?.bank_name || ''}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">{selected.id === "usdt" ? t('walletAddress') : t('accountNumberLabel')}</p>
                  <p className="text-text-main font-mono text-sm tracking-widest">{profile?.bank_account ? `${profile.bank_account.substring(0, 4)}...${profile.bank_account.slice(-4)}` : 'N/A'}</p>
                  <div className="flex justify-end mt-1">
                    <span className="text-[9px] bg-green-500/10 text-green-600 px-1.5 py-0.5 rounded border border-green-500/20 font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
                      <CheckCircle2 size={10} /> Verified
                    </span>
                  </div>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5 block ml-1">
                  {t('amountToWithdraw')}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-bold">
                    $
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val) {
                        setAmount("");
                        setAmountError("");
                        return;
                      }
                      const num = parseFloat(val);
                      if (num > balance) {
                        setAmount(balance.toFixed(2));
                        setAmountError(language === 'th' ? "จํานวนเงินเกินยอดคงเหลือ" : "Amount exceeds balance");
                      } else {
                        setAmount(val);
                        setAmountError("");
                      }
                    }}
                    placeholder="0.00"
                    className="w-full bg-transparent border border-border rounded-xl py-4 pl-8 pr-20 text-xl font-black text-text-main focus:outline-none focus:ring-2 focus:ring-red-500/40 transition-all placeholder:text-text-muted/30"
                  />
                  <button
                    onClick={() => setAmount(balance.toFixed(2))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-red-500 hover:text-red-600 transition-colors"
                  >
                    MAX
                  </button>
                </div>
                <div className="flex gap-2 mt-3">
                  {[100, 500, 1000, 5000].map((v) => (
                    <button
                      key={v}
                      onClick={() => {
                        if (v > balance) {
                          setAmount(balance.toFixed(2));
                          setAmountError(language === 'th' ? "จํานวนเงินเกินยอดคงเหลือ" : "Amount exceeds balance");
                        } else {
                          setAmount(v.toString());
                          setAmountError("");
                        }
                      }}
                      className="flex-1 py-2 rounded-lg bg-card-header text-text-muted text-[10px] font-black hover:bg-card-header/80 hover:text-text-main transition-all border border-border shadow-sm"
                    >
                      ${v.toLocaleString()}
                    </button>
                  ))}
                </div>
                {amountError && (
                  <p className="text-red-500 text-[11px] font-bold mt-2 flex items-center gap-1">
                    <AlertCircle size={12} /> {amountError}
                  </p>
                )}
              </div>
            </div>

            <div className="text-[10px] font-bold uppercase tracking-wide text-amber-600 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6 leading-relaxed shadow-sm">
              {t('checkDetailsWarning')}
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting || !amount}
              className="w-full py-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black text-lg shadow-xl shadow-red-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <ArrowUpCircle size={20} />
              )}
              {submitting ? t('processingWithdrawal') : t('confirmWithdrawal')}
            </button>
          </div>
        </motion.div>
      )}

      {/* ── Step 3: Problem + Support ── */}
      {step === "result" && (
        <motion.div
          key="result"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-border flex items-center justify-between relative bg-card-header/50">
            <h2 className="text-lg font-black text-text-main flex items-center gap-2">
              <AlertCircle size={20} className="text-red-500" />
              {t('withdrawProblemTitle')}
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-card-header transition-colors text-text-muted hover:text-text-main"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4 shadow-sm">
                <AlertCircle size={32} className="text-red-500" />
              </div>
              <p className="text-text-main text-sm leading-relaxed whitespace-pre-line">
                {t('withdrawProblemDesc')}
              </p>
            </div>

            {/* Withdraw summary */}
            <div className="bg-card-header/30 border border-border rounded-xl p-4 mb-6 space-y-3 shadow-inner">
              <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider">
                <span className="text-text-muted">{t('currency')}</span>
                <span className="text-text-main">{selected?.label}</span>
              </div>
              <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider gap-4">
                <span className="text-text-muted shrink-0">
                  {selected?.id === "usdt" ? "Network" : t('bankName')}
                </span>
                <span className="text-text-main text-right break-words">
                  {selected?.id === "usdt" ? profile?.bank_network : profile?.bank_name || '-'}
                </span>
              </div>
              <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider gap-4">
                <span className="text-text-muted shrink-0">
                  {selected?.id === "usdt" ? "Name" : "Account Name"}
                </span>
                <span className="text-text-main text-right break-words">
                  {profile?.first_name} {profile?.last_name}
                </span>
              </div>
              <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider gap-4">
                <span className="text-text-muted shrink-0">{selected?.id === "usdt" ? "Wallet" : t('accountNumberLabel')}</span>
                <span className="text-text-main font-mono text-right break-all">
                  {profile?.bank_account || '-'}
                </span>
              </div>
              <div className="flex justify-between text-[13px] border-t border-border pt-3 mt-1">
                <span className="text-text-muted font-bold uppercase tracking-wider">{t('amount')}</span>
                <span className="text-red-500 font-black tabular-nums">
                  $
                  {parseFloat(amount).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

            <div className="mb-6">
              <SupportContactList settings={settings} />
            </div>

            <button
              onClick={onClose}
              className="w-full py-4 rounded-xl bg-card-header hover:bg-card-header/80 text-text-main font-black text-base transition-all border border-border"
            >
              {t('closeLabel')}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
