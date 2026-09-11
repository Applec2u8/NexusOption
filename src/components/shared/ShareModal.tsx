import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  LayoutGrid, 
  ArrowRight,
  Monitor
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstall: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, onInstall }) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    const shareData = {
      title: "Nexus Option Trading",
      text: "Premium Binary Options Trading Platform",
      url: window.location.origin,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log("Share failed or cancelled");
      }
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95, y: 30 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 300,
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 30,
      transition: { duration: 0.2 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-full max-w-sm glass-card p-6 sm:p-8 relative overflow-hidden ring-1 ring-white/10 mb-20 md:mb-0"
          >
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[60px] -z-10" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 blur-[60px] -z-10" />

            <div className="flex justify-between items-center mb-6">
              <motion.h3 variants={itemVariants} className="text-lg font-black text-white uppercase tracking-widest">
                {t('shareAndInstall') || 'Share & Install'}
              </motion.h3>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-full transition-colors group"
              >
                <X size={20} className="text-slate-500 group-hover:text-white" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Install Action */}
              <motion.button
                variants={itemVariants}
                onClick={() => {
                  onInstall();
                  onClose();
                }}
                className="w-full group flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-primary/20 to-blue-500/10 border border-primary/20 hover:border-primary/40 transition-all shadow-lg shadow-primary/5"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <LayoutGrid size={20} className="text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-0.5">{t('recommended') || 'RECOMMENDED'}</p>
                    <p className="text-sm font-bold text-white">{t('createShortcut')}</p>
                  </div>
                </div>
                <ArrowRight size={18} className="text-primary/60 group-hover:translate-x-1 transition-transform" />
              </motion.button>

              <div className="grid grid-cols-2 gap-4">
                {/* Copy Link */}
                <motion.button
                  variants={itemVariants}
                  onClick={handleCopyLink}
                  className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} className="text-slate-400" />}
                  </div>
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                    {copied ? (t('linkCopied') || 'Copied!') : (t('copyLink') || 'Copy Link')}
                  </span>
                </motion.button>

                {/* Native Share */}
                <motion.button
                  variants={itemVariants}
                  onClick={handleNativeShare}
                  className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Share2 size={18} className="text-slate-400" />
                  </div>
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                    {t('socialShare') || 'Social Share'}
                  </span>
                </motion.button>
              </div>

              {/* Tips Section */}
              <motion.div
                variants={itemVariants}
                className="pt-4 border-t border-white/5"
              >
                <div className="flex items-center gap-2 text-slate-500">
                  <Monitor size={14} />
                  <p className="text-[10px] font-bold uppercase tracking-wider">{t('appExperience') || 'Best App Experience'}</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
