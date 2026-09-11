import React, { useState, useEffect } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useWallet } from "../contexts/WalletContext";
import { HomeSkeleton } from "../components/shared/PageSkeletons";
import { mockStocks } from "../data/mockStocks";
import { MarketTable } from "../components/home/MarketTable";
import { marketService } from "../services/marketService";
import type { StockData } from "../services/marketService";
import {
  TrendingUp,
  Star,
  ArrowRight,
  Wallet,
  BarChart2,
  Zap,
  Globe,
  ShieldCheck,
  Lightbulb,
  Clock
} from "lucide-react";

export const Home: React.FC = () => {
  const { t } = useLanguage();
  const { loading } = useWallet();
  const navigate = useNavigate();
  const [stocks, setStocks] = useState<StockData[]>(mockStocks as StockData[]);
  const goldStock = stocks.find((s: StockData) => s.symbol === "GOLD");

  const topGainer = [...stocks].sort((a, b) => b.change - a.change)[0];
  const marketSentiment = stocks.filter(s => s.change > 0).length / stocks.length > 0.5 ? "Bullish" : "Bearish";

  // Real-time updates from market API
  useEffect(() => {
    const updateMarketData = async () => {
      const updated = await marketService.updateStocks(stocks);
      setStocks(updated);
    };

    updateMarketData(); // Initial fetch
    const interval = setInterval(updateMarketData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  useEffect(() => {
    if (!loading && !hasLoadedOnce) {
      setHasLoadedOnce(true);
    }
  }, [loading, hasLoadedOnce]);

  if (loading && !hasLoadedOnce) {
    return <HomeSkeleton />;
  }

  return (
    <div className="pt-24 pb-32 px-6 max-w-7xl mx-auto space-y-12">
      {/* Market Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t('marketsActive'), value: stocks.length, icon: <Globe size={18} />, color: "blue", glow: "rgba(59, 130, 246, 0.4)" },
          { label: t('topGainer'), value: topGainer?.symbol, subValue: `+${topGainer?.change}%`, icon: <TrendingUp size={18} />, color: "green", glow: "rgba(34, 197, 94, 0.4)" },
          { label: t('globalVol'), value: "$4.2B", icon: <BarChart2 size={18} />, color: "purple", glow: "rgba(168, 85, 247, 0.4)" },
          { label: t('marketStatus'), value: t(marketSentiment.toLowerCase()), icon: <Zap size={18} />, color: marketSentiment === "Bullish" ? "green" : "red", glow: marketSentiment === "Bullish" ? "rgba(74, 222, 128, 0.4)" : "rgba(248, 113, 113, 0.4)" },
        ].map((stat, idx) => (
          <motion.div 
            key={idx} 
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            className="glass-card group relative flex flex-col gap-3 p-4 overflow-hidden transition-all bg-card border-border shadow-lg"
          >
            {/* Background Glow Decor */}
            <div 
              className="absolute -right-4 -bottom-4 w-20 h-20 blur-[35px] opacity-0 group-hover:opacity-15 transition-opacity pointer-events-none"
              style={{ backgroundColor: stat.glow }}
            />
            
            <div className="flex items-center justify-between">
              <div 
                className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-transform group-hover:scale-105 ${
                  stat.color === 'blue' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                  stat.color === 'green' ? "bg-green-500/10 text-green-500 border-green-500/20" :
                  stat.color === 'purple' ? "bg-purple-500/10 text-purple-500 border-purple-500/20" :
                  "bg-red-500/10 text-red-500 border-red-500/20"
                }`}
              >
                {stat.icon}
              </div>
              {stat.subValue && (
                <div className="px-1.5 py-0.5 rounded-md bg-green-500/10 border border-green-500/20 text-[8px] font-black text-green-500">
                  {stat.subValue}
                </div>
              )}
            </div>
            
            <div className="space-y-0.5 relative z-10">
              <p className="text-[9px] font-black uppercase text-text-muted tracking-[0.15em]">{stat.label}</p>
              <h3 className="text-lg font-black text-text-main tracking-tight">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Hero Section - Gold Price */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden group cursor-pointer"
        onClick={() => navigate("/trade", { state: { symbol: "GOLD" } })}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-yellow-500/10 to-orange-600/10 blur-[120px] pointer-events-none opacity-50" />
        <div className="glass-card border-yellow-500/20 bg-card/60 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-6 p-8 md:p-12 relative overflow-hidden shadow-2xl">
          {/* Subtle Graphic Decor */}
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-yellow-500/5 rounded-full blur-[80px]" />
          
          <div className="space-y-6 text-center md:text-left relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 text-xs font-black tracking-widest uppercase">
              <Star size={14} fill="currentColor" />
              {t('latestGoldPrice')}
            </div>
            <div className="space-y-1">
              <h2 className="text-6xl md:text-7xl font-black text-text-main tracking-tighter tabular-nums">
                ${goldStock?.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h2>
              <div className={`flex items-center justify-center md:justify-start gap-2 font-black text-xl ${(goldStock?.change ?? 0) >= 0 ? "text-green-500" : "text-red-500"}`}>
                <TrendingUp size={24} className={(goldStock?.change ?? 0) < 0 ? "rotate-180" : ""} />
                <span>{(goldStock?.change ?? 0) >= 0 ? "+" : ""}{(goldStock?.change ?? 0).toFixed(2)}% {t('all').toUpperCase()}</span>
              </div>
            </div>
            <p className="text-text-muted text-sm md:text-base max-w-md font-medium leading-relaxed">
              {t('goldHeroDesc')}
            </p>
          </div>
          <div className="relative">
            <div className="w-56 h-56 bg-yellow-500/20 rounded-full blur-[60px] animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="w-40 h-40 bg-white/5 border border-yellow-500/20 rounded-full flex items-center justify-center backdrop-blur-3xl shadow-2xl">
                  <Star size={64} className="text-yellow-500 drop-shadow-lg" fill="currentColor" />
               </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Recommended & Market Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recommended Assets (Smart Picks) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-text-main uppercase tracking-tight flex items-center gap-2">
              <Lightbulb className="text-yellow-500" size={20} />
              {t('recommendedAssets')}
            </h3>
            <span className="text-xs font-bold text-text-muted uppercase tracking-widest">{t('smartAiSelection')}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stocks.sort((a, b) => Math.abs(b.change) - Math.abs(a.change)).slice(0, 4).map((asset) => (
              <motion.div
                key={asset.id}
                whileHover={{ y: -4 }}
                onClick={() => navigate("/trade", { state: { symbol: asset.symbol } })}
                className="glass-card p-5 flex items-center justify-between group cursor-pointer border-border hover:border-primary/30 transition-all bg-card shadow-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-card-header border border-border flex items-center justify-center overflow-hidden flex-shrink-0 group-hover:scale-110 transition-transform shadow-md">
                    {asset.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-text-main group-hover:text-primary transition-colors">{asset.name}</h4>
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{asset.symbol}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-base font-bold text-text-main">${asset.price.toLocaleString()}</p>
                  <p className={`text-[10px] font-black ${asset.change >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {asset.change >= 0 ? "+" : ""}{asset.change}%
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Market Insights / News */}
        <div className="space-y-6">
          <h3 className="text-xl font-black text-text-main uppercase tracking-tight flex items-center gap-2">
            <ShieldCheck className="text-primary" size={20} />
            {t('marketInsights')}
          </h3>
          <div className="glass-card bg-card border-border p-6 space-y-6 shadow-xl">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest">
                <Clock size={12} /> {t('justNow')}
              </div>
              <h4 className="text-lg font-bold text-text-main leading-tight">{t('insightTitle1')}</h4>
              <p className="text-xs text-text-muted leading-relaxed">{t('insightDesc1')}</p>
            </div>
            <div className="pt-6 border-t border-border space-y-4">
               <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <p className="text-xs font-bold text-text-muted">{t('insightNews1')}</p>
               </div>
               <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <p className="text-xs font-bold text-text-muted">{t('insightNews2')}</p>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Onboarding / How it Works */}
      <div className="py-12 border-y border-border">
        <div className="text-center space-y-2 mb-12">
          <h3 className="text-2xl md:text-3xl font-black text-text-main uppercase">{t('howItWorks')}</h3>
          <p className="text-text-muted text-sm max-w-lg mx-auto font-medium">{t('howItWorksDesc')}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: "01", title: t('step1Title'), desc: t('step1Desc'), icon: <Wallet className="text-blue-500" size={32} /> },
            { step: "02", title: t('step2Title'), desc: t('step2Desc'), icon: <BarChart2 className="text-primary" size={32} /> },
            { step: "03", title: t('step3Title'), desc: t('step3Desc'), icon: <ArrowRight className="text-green-500" size={32} /> },
          ].map((item, idx) => (
            <div key={idx} className="relative group p-8 rounded-3xl bg-card border border-border hover:border-primary/30 transition-all text-center shadow-lg">
              <div className="absolute -top-4 -left-4 w-12 h-12 rounded-2xl bg-card-header border border-border flex items-center justify-center text-xs font-black text-text-muted tracking-tighter transition-all group-hover:text-primary shadow-md">
                {item.step}
              </div>
              <div className="mb-6 flex justify-center">{item.icon}</div>
              <h4 className="text-xl font-bold text-text-main mb-3">{item.title}</h4>
              <p className="text-sm text-text-muted leading-relaxed font-medium">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Global Market Table */}
      <MarketTable stocks={stocks} t={t} loading={loading} />
    </div>
  );
};
