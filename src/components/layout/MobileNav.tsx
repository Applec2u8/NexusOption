import React from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { Home, BarChart2, Wallet, Settings, Calendar } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

export const MobileNav: React.FC = () => {
  const { t } = useLanguage();
  const location = useLocation();

  const handleNavClick = (path: string) => {
    // If we're already on this path, scroll to top
    if (location.pathname === path) {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    }
  };

  const navItems = [
    { icon: <Home size={26} />, label: t("home"), path: "/" },
    { icon: <Wallet size={26} />, label: t("wallet"), path: "/wallet" },
    { icon: <BarChart2 size={26} />, label: t("trade"), path: "/trade" },
    {
      icon: <Calendar size={26} />,
      label: t("history") || "ปฏิทิน",
      path: "/history",
    },
    { icon: <Settings size={26} />, label: t("settings"), path: "/settings" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[1000] glass border-t border-white/5 px-2 pb-safe pt-2 backdrop-blur-xl pointer-events-auto isolate select-none">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => handleNavClick(item.path)}
              className="flex flex-col items-center gap-1 py-2 flex-1 transition-all duration-300 relative"
            >
              <motion.div
                whileTap={{ scale: 0.8 }}
                className={`transition-all duration-300 ${
                  isActive ? "text-primary scale-110 drop-shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]" : "text-text-muted hover:text-text-main"
                }`}
              >
                {item.icon}
              </motion.div>
              <span
                className={`text-[10px] font-bold transition-all duration-300 ${
                  isActive ? "text-primary" : "text-text-muted"
                }`}
              >
                {item.label}
              </span>
              
              {isActive && (
                <div
                  className="absolute bottom-0 w-8 h-0.5 bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)] transition-all duration-300"
                />
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
