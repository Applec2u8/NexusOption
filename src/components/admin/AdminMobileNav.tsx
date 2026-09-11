import React from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { Users, Activity, History, MessageSquare, Settings2 } from "lucide-react";
import { motion } from "framer-motion";

interface AdminMobileNavProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  pendingIssuesCount?: number;
}

export const AdminMobileNav: React.FC<AdminMobileNavProps> = ({ 
  activeTab, 
  setActiveTab,
  pendingIssuesCount = 0 
}) => {
  const { t, language } = useLanguage();

  const navItems = [
    { id: "users", icon: <Users size={24} />, label: t("users") },
    { id: "activity", icon: <Activity size={24} />, label: t("activity") },
    { id: "logs", icon: <History size={24} />, label: t("auditLogs") },
    { 
      id: "issues", 
      icon: <MessageSquare size={24} />, 
      label: language === 'th' ? "รายงาน" : "Reports",
      badge: pendingIssuesCount 
    },
    { id: "settings", icon: <Settings2 size={24} />, label: t("settings") },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[1000] glass border-t border-border px-2 pb-safe pt-2 backdrop-blur-xl pointer-events-auto lg:hidden">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`flex flex-col items-center gap-1 py-2 flex-1 transition-all duration-300 relative ${
                isActive ? "text-primary" : "text-text-muted"
              }`}
            >
              <motion.div
                whileTap={{ scale: 0.8 }}
                className={`${isActive ? "scale-110" : ""} relative`}
              >
                {item.icon}
                {item.badge ? item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border border-background animate-pulse">
                    {item.badge}
                  </span>
                ) : null}
              </motion.div>
              <span className={`text-[9px] font-bold uppercase tracking-tight ${isActive ? "text-primary" : "text-text-muted"}`}>
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="adminActiveTab"
                  className="absolute bottom-0 w-8 h-0.5 bg-primary rounded-full"
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
