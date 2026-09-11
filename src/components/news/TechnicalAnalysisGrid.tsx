import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, Info } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";

export const TechnicalAnalysisGrid: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card"
      >
        <h3 className="text-xl font-black text-primary mb-4 flex items-center gap-2">
          <TrendingUp size={20} />
          {t("technicalAnalysis")}
        </h3>
        <p className="text-sm text-text-muted leading-relaxed">
          {t("technicalAnalysisDesc")}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card border-slate-700/50"
      >
        <h3 className="text-xl font-black text-primary mb-4 flex items-center gap-2">
          <Info size={20} />
          {t("investmentAdvice")}
        </h3>
        <p className="text-sm text-text-muted leading-relaxed">
          {t("investmentAdviceDesc")}
        </p>
      </motion.div>
    </div>
  );
};
