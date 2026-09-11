import React from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";

export const NewsAnalysis: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass-card p-8 border-l-4 border-l-primary"
    >
      <h2 className="text-2xl font-black text-primary mb-6 flex items-center gap-2">
        <Star size={24} fill="currentColor" />
        {t("newsAnalysisTitle")}
      </h2>
      <p className="text-text-muted leading-relaxed">
        {t("newsAnalysisDesc")}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-primary flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            {t("marketOverviewNews")}
          </h3>
          <p className="text-sm text-text-muted leading-relaxed">
            {t("marketOverviewDesc")}
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold text-primary flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            {t("goldFactors")}
          </h3>
          <p className="text-sm text-text-muted leading-relaxed">
            {t("goldFactorsDesc")}
          </p>
        </div>
      </div>
    </motion.div>
  );
};
