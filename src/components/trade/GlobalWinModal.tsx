import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Sparkles } from "lucide-react";
import { formatCurrency } from "../../utils/format";
import { useLanguage } from "../../contexts/LanguageContext";
import { useTheme } from "../../contexts/ThemeContext";
import { playSuccessSound } from "../../utils/audio";
import { sendWinnerNotification } from "../../utils/notifications";
import { supabase } from "../../lib/supabase";
import { emailService } from "../../services/emailService";
import { useAuth } from "../../contexts/AuthContext";

const Particles = () => {
  return (
    <>
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
          animate={{
            opacity: 0,
            scale: Math.random() * 1.5 + 0.5,
            x: (Math.random() - 0.5) * 400,
            y: (Math.random() - 0.5) * 400 - 50,
          }}
          transition={{ duration: 1 + Math.random(), ease: "easeOut" }}
          className="absolute left-1/2 top-1/2 w-3 h-3 rounded-full z-0 pointer-events-none"
          style={{
            backgroundColor: [
              "#4ade80",
              "#facc15",
              "#60a5fa",
              "#f472b6",
              "#c084fc",
            ][Math.floor(Math.random() * 5)],
            marginLeft: "-0.375rem",
            marginTop: "-0.375rem",
          }}
        />
      ))}
    </>
  );
};

export const GlobalWinModal: React.FC = () => {
  const { t, language } = useLanguage();
  const { profile } = useAuth();
  const { theme } = useTheme();
  const [winModalData, setWinModalData] = useState<{
    assetSymbol: string;
    amount: number;
    payout: number;
  } | null>(null);

  useEffect(() => {
    const handler = async (e: any) => {
      if (e.detail?.won) {
        setWinModalData({
          assetSymbol: e.detail.assetSymbol,
          amount: e.detail.amount,
          payout: e.detail.payout,
        });
        playSuccessSound();
        
        // Trigger system notification
        await sendWinnerNotification(
          e.detail.assetSymbol, 
          e.detail.payout,
          t("wonNotificationTitle"),
          t("predictionCorrect"),
          t("wasCorrect")
        );

        // Send Email Notification if enabled
        (async () => {
          try {
            const { data: settings } = await supabase
              .from("global_settings")
              .select("winner_email_enabled")
              .eq("id", "main")
              .single();

            if (settings?.winner_email_enabled && profile?.email) {
              await emailService.sendWinNotification({
                email: profile.email,
                userName: profile.first_name || profile.username || "Trader",
                amount: e.detail.amount,
                payout: e.detail.payout,
                assetSymbol: e.detail.assetSymbol,
                lang: (profile.language || language) as any
              });
            }
          } catch (err) {
            console.error("[GlobalWinModal] Error sending win email:", err);
          }
        })();
      }
    };
    window.addEventListener("binary-trade-result", handler);
    return () => window.removeEventListener("binary-trade-result", handler);
  }, [t]);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && winModalData) {
        setWinModalData(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [winModalData]);

  const isLight = theme === 'light';
  const isLiquid = theme === 'liquid-glass';

  return (
    <AnimatePresence>
      {winModalData && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4 md:p-6"
          onClick={() => setWinModalData(null)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className={`relative w-full max-w-sm rounded-[2.5rem] overflow-hidden border p-6 sm:p-10 text-center shadow-2xl transition-all duration-500 mb-16 md:mb-0 ${
              isLight 
                ? "bg-white border-green-100 shadow-green-500/10" 
                : isLiquid
                ? "bg-slate-950/40 backdrop-blur-2xl border-white/10 shadow-green-400/20"
                : "bg-slate-900 border-green-500/30 shadow-green-500/20"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Background Accent */}
            <div className={`absolute top-0 inset-x-0 h-32 bg-gradient-to-b opacity-20 pointer-events-none ${
              isLight ? "from-green-500/40" : isLiquid ? "from-green-400/50" : "from-green-500/30"
            } to-transparent`} />
            
            <Particles />

            <div className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-8 relative transition-colors ${
              isLight ? "bg-green-50 text-green-500 shadow-inner" : isLiquid ? "bg-green-400/30 text-green-300 shadow-lg shadow-green-400/40" : "bg-green-500/20 text-green-400 shadow-lg shadow-green-500/30"
            }`}>
              <Trophy size={48} className="drop-shadow-lg" />
              <Sparkles
                size={28}
                className="text-yellow-400 absolute -top-1 -right-1 animate-pulse"
              />
            </div>

            <h2 className={`text-3xl font-black mb-3 tracking-tight transition-colors ${
              isLight ? "text-slate-900" : "text-white"
            }`}>
              {t("congratulations")}
            </h2>
            <p className={`text-sm font-bold mb-8 transition-colors ${
              isLight ? "text-slate-500" : isLiquid ? "text-slate-200" : "text-slate-400"
            }`}>
              {t("predictionCorrect")}{" "}
              <span className={`uppercase font-black ${isLight ? "text-primary" : "text-white"}`}>
                {winModalData.assetSymbol}
              </span>{" "}
              {t("wasCorrect")}
            </p>

            <div className={`rounded-3xl p-5 sm:p-7 border mb-10 overflow-hidden transition-all ${
              isLight 
                ? "bg-slate-50 border-slate-100 shadow-inner" 
                : isLiquid
                ? "bg-white/[0.05] border-white/10 shadow-inner"
                : "bg-slate-950/50 border-white/5 shadow-inner"
            }`}>
              <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2 ${
                isLight ? "text-slate-400" : isLiquid ? "text-slate-300" : "text-slate-500"
              }`}>
                {t("totalPayout")}
              </p>
              <p
                className={`font-black tabular-nums drop-shadow-sm whitespace-nowrap leading-none transition-all duration-300 w-full overflow-hidden text-ellipsis ${
                  isLight ? "text-green-600" : isLiquid ? "text-green-300" : "text-green-400"
                } ${
                  (() => {
                    const len = `+${formatCurrency(winModalData.payout)}`.length;
                    if (len > 14) return "text-lg sm:text-xl md:text-2xl";
                    if (len > 11) return "text-xl sm:text-2xl md:text-3xl";
                    if (len > 8) return "text-2xl sm:text-3xl md:text-4xl";
                    return "text-3xl sm:text-4xl md:text-5xl";
                  })()
                }`}
              >
                +{formatCurrency(winModalData.payout)}
              </p>
            </div>

            <button
              onClick={() => setWinModalData(null)}
              className={`w-full py-5 rounded-2xl font-black text-xl transition-all active:scale-95 shadow-xl ${
                isLight 
                  ? "bg-primary text-white hover:bg-primary/90 shadow-primary/20" 
                  : isLiquid
                  ? "bg-gradient-to-r from-green-400 to-emerald-500 text-slate-950 hover:brightness-110 shadow-green-500/30"
                  : "bg-green-500 text-slate-950 hover:bg-green-400 shadow-green-500/30"
              }`}
            >
              {t("collectProfit")}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
