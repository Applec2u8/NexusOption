import React from "react";
import { Shield, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../contexts/LanguageContext";

interface AdminHeaderProps {
  language: string;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ language }) => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10">
      <div className="flex items-center justify-between w-full lg:w-auto gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-text-main flex items-center gap-2">
            <Shield className="text-primary" size={24} />
            {t("adminDashboard")}
          </h1>
          <p className="text-text-muted text-[11px] md:text-xs mt-1">
            {t("adminDashboardDesc")}
          </p>
        </div>
        
        <Link 
          to="/" 
          className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border text-text-main text-[10px] font-black uppercase tracking-widest hover:bg-card-header transition-all active:scale-95 shadow-lg"
        >
          <LogOut size={14} className="text-red-500" />
          {language === 'th' ? "ออก" : "Exit"}
        </Link>
      </div>

      <Link 
        to="/" 
        className="hidden lg:flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-card border border-border text-text-main text-xs font-bold hover:bg-card-header transition-all shadow-xl group"
      >
        <LogOut size={16} className="text-red-500 group-hover:rotate-180 transition-transform duration-500" />
        {language === 'th' ? "กลับหน้าหลัก" : "Back to User View"}
      </Link>
    </div>
  );
};
