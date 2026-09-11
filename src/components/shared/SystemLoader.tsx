import React from 'react';
import { motion } from 'framer-motion';
import logo from '../../assets/Logo.png';

interface SystemLoaderProps {
  message?: string;
}

export const SystemLoader: React.FC<SystemLoaderProps> = ({ message }) => {
  return (
    <div className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center p-6 overflow-hidden transition-colors duration-500">
      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 blur-[120px] rounded-full animate-pulse [animation-delay:2s]" />
      </div>

      <div className="relative flex flex-col items-center">
        {/* Rotating Outer Ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute inset-[-40px] border border-primary/20 rounded-full border-dashed"
        />
        
        {/* Rotating Inner Ring */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          className="absolute inset-[-20px] border border-accent/20 rounded-full"
        />

        {/* Glow effect behind logo */}
        <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full animate-pulse" />
        
        <motion.div
          animate={{ 
            scale: [1, 1.05, 1],
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="relative z-10"
        >
          <img 
            src={logo} 
            alt="Nexus Option Logo" 
            className="w-32 h-32 md:w-40 md:h-40 object-contain drop-shadow-[0_0_30px_rgba(14,165,233,0.4)]"
          />
        </motion.div>
      </div>

      <div className="mt-20 flex flex-col items-center gap-6 max-w-sm relative z-20">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
          <p className="text-[11px] font-black text-primary uppercase tracking-[0.4em] drop-shadow-sm">
            {message || "Initializing System"}
          </p>
        </div>
        
        <div className="h-[1px] w-32 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] leading-relaxed text-center opacity-80">
          Establishing secure connection to<br/>
          <span className="text-slate-400">Nexus Option core servers</span>
        </p>
      </div>
    </div>
  );
};
