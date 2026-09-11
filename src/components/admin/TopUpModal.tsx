import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, X, Loader2, Plus, ClipboardPaste, CheckCircle2 } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { supabase } from "../../lib/supabase";
import { AdminInput } from "./AdminInput";
import { auditService } from "../../services/auditService";
import type { Profile } from "../../types";
import { emailService } from "../../services/emailService";
import { useAuth } from "../../contexts/AuthContext";

interface TopUpModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const TopUpModal: React.FC<TopUpModalProps> = ({ onClose, onSuccess }) => {
  const { language, t } = useLanguage();
  const { profile: currentAdmin } = useAuth();
  const [userCode, setUserCode] = useState("");
  const [topUpAmount, setTopUpAmount] = useState<number>(0);
  const [matchedUser, setMatchedUser] = useState<Profile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [codePasted, setCodePasted] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handlePasteCode = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUserCode(text.trim().toUpperCase());
      setCodePasted(true);
      setTimeout(() => setCodePasted(false), 2000);
    } catch {
      // fallback — user can paste manually
    }
  };

  const handleSearchUser = async () => {
    if (!userCode.trim()) return;
    setError("");
    const { data, error: searchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("code", userCode.toUpperCase().trim())
      .single();

    if (searchError || !data) {
      setMatchedUser(null);
      setError(t("userNotFound"));
    } else {
      setMatchedUser(data as Profile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchedUser || topUpAmount <= 0) return;
    setIsSubmitting(true);
    setError("");

    try {
      const newBalance = matchedUser.balance + topUpAmount;
      const newTotalDeposited = (matchedUser.total_deposited ?? 0) + topUpAmount;
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          balance: newBalance,
          total_deposited: newTotalDeposited,
          updated_at: new Date().toISOString(),
        })
        .eq("id", matchedUser.id);

      if (updateError) throw updateError;

      await supabase.from("transactions").insert({
        user_id: matchedUser.id,
        type: "deposit",
        asset_symbol: "USD",
        amount: topUpAmount,
        price: 1,
        total: topUpAmount,
        status: "success",
      });

      alert(t("topUpSuccess"));

      emailService.sendDepositNotification({
        email: matchedUser.email,
        userName: `${matchedUser.first_name} ${matchedUser.last_name}`,
        amount: topUpAmount,
        lang: language,
      });

      if (currentAdmin && currentAdmin.id) {
        try {
          await auditService.logAction({
            adminId: currentAdmin.id,
            adminEmail: currentAdmin.email || 'unknown',
            targetUserId: matchedUser.id,
            targetUserEmail: matchedUser.email,
            actionType: 'TOP_UP',
            description: `Refilled balance for user ${matchedUser.username}`,
            details: { amount: topUpAmount }
          });
        } catch (e) {
          console.error("Failed to log top-up action", e);
        }
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || t("topUpError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 md:px-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-background/80 backdrop-blur-md"
      />
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-card w-full max-w-lg relative z-10 p-0 overflow-hidden max-h-[90vh] md:max-h-[95vh] flex flex-col mb-16 md:mb-0 shadow-2xl bg-card border-border"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between relative bg-card-header/50">
          <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
            <TrendingUp className="text-primary" size={20} />
            {t("topUp") + " " + t("users")}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-card-header transition-colors text-text-muted hover:text-text-main"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto scrollbar-hide space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1 block">
              {t("searchByPrivateCode")}
            </label>
            <div className="flex gap-2">
                <input
                  type="text"
                  value={userCode}
                  onChange={(e) => setUserCode(e.target.value)}
                  placeholder="USERCODE123"
                  className="flex-1 bg-transparent border border-border rounded-xl py-2 px-4 text-text-main font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-text-muted/40 uppercase"
                />
              <button
                type="button"
                onClick={handlePasteCode}
                className={`shrink-0 flex items-center gap-1.5 px-3 rounded-xl font-bold text-xs transition-all border shadow-sm ${
                  codePasted
                    ? 'bg-green-500/20 text-green-600 border-green-500/30'
                    : 'bg-card-header text-text-muted hover:text-primary border-border hover:border-primary/30'
                }`}
              >
                {codePasted ? <CheckCircle2 size={15} /> : <ClipboardPaste size={15} />}
                {codePasted ? t("pasted") : t("paste")}
              </button>
            </div>
            <button
              onClick={handleSearchUser}
              className="w-full py-2.5 bg-primary/10 text-primary rounded-xl font-bold hover:bg-primary hover:text-white transition-all border border-primary/20 text-xs shadow-sm"
            >
              {t("search")}
            </button>
          </div>

          {error ? (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 text-xs md:text-sm font-bold rounded-xl text-center shadow-sm">
              {error}
            </div>
          ) : matchedUser ? (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-card-header/30 border border-border space-y-5 shadow-inner"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">
                    {t("confirmIdentity")}
                  </p>
                  <p className="text-base font-bold text-text-main leading-tight">
                    {matchedUser.first_name} {matchedUser.last_name}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    @{matchedUser.username}
                  </p>
                </div>
                <div className="sm:text-right border-l sm:border-l-0 sm:border-t-0 border-border pl-4 sm:pl-0 pt-1 sm:pt-0">
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">
                    {t("currentBalance")}
                  </p>
                  <p className="text-lg md:text-xl font-bold text-primary tabular-nums">
                    $
                    {matchedUser.balance.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>

              <form
                onSubmit={handleSubmit}
                className="space-y-5 pt-6 border-t border-border"
              >
                 <AdminInput
                  label={t("topUpAmountLabel")}
                  type="number"
                  step="0.01"
                  value={topUpAmount.toString()}
                  onChange={(v) => setTopUpAmount(parseFloat(v) || 0)}
                  placeholder="0.00"
                />

                <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest text-center shadow-inner">
                  {t("newBalanceIndicator")}
                  <span className="text-text-main ml-2 text-sm tabular-nums">
                    $
                    {(matchedUser.balance + topUpAmount).toLocaleString(
                      undefined,
                      { minimumFractionDigits: 2, maximumFractionDigits: 2 },
                    )}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setMatchedUser(null)}
                    className="flex-1 px-5 py-2.5 rounded-xl bg-card-header text-text-muted font-bold hover:text-text-main transition-all text-xs border border-border shadow-sm"
                  >
                    {t("clearData")}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || topUpAmount <= 0}
                    className="flex-[2] py-2.5 bg-primary hover:bg-primary/90 text-white border border-primary/30 rounded-xl flex items-center justify-center gap-2 text-xs font-bold shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Plus size={16} />
                    )}
                    <span className="whitespace-nowrap uppercase tracking-tight">{t("confirmTopUp")}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-text-muted border-2 border-dashed border-border rounded-3xl bg-card-header/10">
               <TrendingUp size={48} className="opacity-10 mb-2" />
               <p className="text-xs font-bold uppercase tracking-widest">{t("waitingForUserSearch")}</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
