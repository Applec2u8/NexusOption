import React from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import logoImg from "../../assets/Logo-url.png";
import { useAuth } from "../../contexts/AuthContext";
import { Globe, Newspaper } from "lucide-react";

export const Navbar: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { user } = useAuth();

  const displayName = profile
    ? profile.first_name && profile.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : profile.username || user?.email?.split("@")[0] || "User"
    : user?.email?.split("@")[0] || "User";

  const initials =
    profile?.first_name && profile?.last_name
      ? `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase()
      : displayName.slice(0, 2).toUpperCase();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass py-4 px-6 md:px-12 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* User avatar & name */}
        <div
          className="md:hidden flex items-center gap-2"
          onClick={() => navigate("/settings")}
        >
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-7 h-7 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center text-[9px] font-black border border-white/20 text-white"
          >
            {initials}
          </motion.div>
          <motion.span
            initial={{ opacity: 0, x: 4 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-base font-bold text-text-main max-w-[100px] truncate"
          >
            {displayName}
          </motion.span>
        </div>

        {/* Icone Logo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate("/")}
          className="hidden md:flex items-center gap-2 group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl overflow-hidden group-hover:scale-110 transition-transform duration-300 shadow-lg">
            <img
              src={logoImg}
              alt="Nexus Option Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-2xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent tracking-tighter">
            Nexus Option
          </span>
        </motion.div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/news")}
            className="flex items-center gap-2 glass px-3 py-1.5 rounded-full text-xs font-medium hover:bg-primary/10 transition-colors border-none group text-text-main"
          >
            <Newspaper
              size={14}
              className="group-hover:rotate-180 transition-transform duration-700 text-primary"
            />
            <span className="hidden sm:inline">{t("news")}</span>
          </button>

          <button
            onClick={() => setLanguage(language === "th" ? "en" : "th")}
            className="flex items-center gap-2 glass px-3 py-1.5 rounded-full text-xs font-medium hover:bg-primary/10 transition-colors border-none group text-text-main"
          >
            <Globe
              size={14}
              className="group-hover:rotate-180 transition-transform duration-700 text-primary"
            />
            <span className="hidden sm:inline">{language === "th" ? "EN" : "ไทย"}</span>
            <span className="sm:hidden">{language === "th" ? "EN" : "TH"}</span>
          </button>

          {/* User avatar & name */}
          <div className="hidden md:flex items-center gap-2">
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center text-[10px] font-black border-2 border-white/20 text-white"
            >
              {initials}
            </motion.div>
            <motion.span
              initial={{ opacity: 0, x: 4 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-sm font-medium text-text-main max-w-[120px] truncate"
            >
              {displayName}
            </motion.span>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
