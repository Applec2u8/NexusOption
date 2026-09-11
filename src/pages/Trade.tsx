import React, { useState, useEffect, useRef } from "react";
import { useClickOutside } from "../hooks/useClickOutside";
import { useWallet } from "../contexts/WalletContext";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, Search, X } from "lucide-react";
import TradingChart from "../components/trade/TradingChart";
import { assets } from "../data/marketData";
import { TradingPanel } from "../components/trade/TradingPanel";
import { NotificationList } from "../components/trade/NotificationList";
import { marketService } from "../services/marketService";
import { getInitialTradeSymbol } from "../utils/trade";
import { formatCurrency, formatPercentage } from "../utils/format";
import { TIMEFRAMES, MIN_TRADE_AMOUNT } from "../constants/trade";
import { useLanguage } from "../contexts/LanguageContext";
import { TradeSkeleton } from "../components/shared/PageSkeletons";

export const Trade: React.FC = () => {
  const { balance, createBinaryTrade, transactions, activeBinaryTrades, loading, totalDeposited, tierThresholds } = useWallet();
  const { t } = useLanguage();
  const location = useLocation();

  const targetSymbol = getInitialTradeSymbol(location.state);
  const initialAsset =
    assets.find((a) => a.symbol === targetSymbol) ||
    assets.find((a) => a.symbol === "BTC") ||
    assets[0];

  const [selectedAsset, setSelectedAsset] = useState<any>(initialAsset);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showMarketDetails, setShowMarketDetails] = useState(false);

  // Sync to localStorage when selection changes
  useEffect(() => {
    if (selectedAsset.symbol) {
      localStorage.setItem("lastTradeSymbol", selectedAsset.symbol);
    }
  }, [selectedAsset.symbol]);
  const [livePrice, setLivePrice] = useState(initialAsset.price);
  const [amount, setAmount] = useState("");
  const [orderType, setOrderType] = useState<"up" | "down">("up");
  const [timeframe, setTimeframe] = useState<any>(TIMEFRAMES[0]);
  const [notifications, setNotifications] = useState<
    {
      id: number;
      type: "success" | "error" | "warning" | "info";
      message: string;
    }[]
  >([]);
  const [tradeLoading, setTradeLoading] = useState(false);

  // Real-time price fetch from market API
  useEffect(() => {
    const fetchLatest = async () => {
      const result = await marketService.fetchSymbolPrice(selectedAsset.symbol);
      if (result && typeof result.price === "number") {
        const newPrice = result.price;
        setLivePrice(newPrice);
        setSelectedAsset((prev: any) => ({
          ...prev,
          ...result,
        }));
      }
    };

    fetchLatest();
    const interval = setInterval(fetchLatest, 3000); // 3 seconds refresh for near real-time feel
    return () => clearInterval(interval);
  }, [selectedAsset.symbol]);

  // Close search/market detail panels on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showSearch) setShowSearch(false);
        else if (showMarketDetails) setShowMarketDetails(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showSearch, showMarketDetails]);

  const onTrade = async () => {
    const tradeAmount = Number(amount);

    if (tradeAmount < MIN_TRADE_AMOUNT) {
      const errorNotif = {
        id: Date.now(),
        type: "error" as const,
        message: `${t('minTradeAmountError')}${formatCurrency(MIN_TRADE_AMOUNT)}`,
      };
      setNotifications((prev) => [errorNotif, ...prev]);
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== errorNotif.id));
      }, 3000);
      return;
    }

    setTradeLoading(true);
    const res = await createBinaryTrade(
      orderType,
      selectedAsset,
      tradeAmount,
      timeframe.minutes,
      timeframe.payout
    );
    setTradeLoading(false);

    if (!res.success) {
      const newNotif = {
        id: Date.now() + 1,
        type: "error" as const,
        message: res.message,
      };
      setNotifications((prev) => [newNotif, ...prev]);
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== newNotif.id));
      }, 4000);
    } else {
      setAmount("");
      const startNotif = {
        id: Date.now() + 2,
        type: "info" as const, // Indigo/Blue for "Started"
        message: `🚀 ${t('predictionStarted')}: ${selectedAsset.symbol} | ${formatCurrency(tradeAmount)}`,
      };
      setNotifications((prev) => [startNotif, ...prev]);
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== startNotif.id));
      }, 5000);
    }
  };

  const searchRef = useRef<HTMLDivElement>(null);
  useClickOutside(searchRef, () => {
    if (showSearch) setShowSearch(false);
  });

  const filteredAssets = React.useMemo(() => {
    return assets.filter(
      (a) =>
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.symbol.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [searchTerm]);

  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  useEffect(() => {
    if (!loading && !hasLoadedOnce) {
      setHasLoadedOnce(true);
    }
  }, [loading, hasLoadedOnce]);

  // Only show full page skeleton on the very first visit
  if (loading && !hasLoadedOnce) {
    return <TradeSkeleton />;
  }

  return (
    <div className="pt-24 pb-32 px-4 md:px-6 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8 relative">
      <NotificationList notifications={notifications} />

      {/* Chart & Asset Info */}
      <div className="lg:col-span-2 space-y-4 w-full">
        <div className="w-full relative z-30">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card relative w-full bg-card border-border shadow-xl"
          >
            {/* Background Accent Gradient */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] pointer-events-none" />

            <div className="relative p-3 md:p-4 space-y-2 z-50">
              {/* Top Row: Identity & Price */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 md:w-14 md:h-14 rounded-2xl bg-card border border-border flex items-center justify-center shadow-lg relative flex-shrink-0 overflow-hidden group cursor-pointer hover:scale-105 transition-all"
                    onClick={() => setShowMarketDetails(true)}
                    title={t("viewMarketDetails")}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {selectedAsset.iconUrl ? (
                      <img
                        src={selectedAsset.iconUrl}
                        alt={selectedAsset.name}
                        className="w-full h-full object-cover relative z-10"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                          const fallback = (
                            e.target as HTMLImageElement
                          ).parentElement?.querySelector(".fallback-letter");
                          if (fallback) fallback.classList.remove("hidden");
                        }}
                      />
                    ) : null}
                    <span
                      className={`fallback-letter text-text-main font-black text-2xl tracking-tighter relative z-10 ${selectedAsset.iconUrl ? "hidden" : ""}`}
                    >
                      {selectedAsset.symbol[0]}
                    </span>
                    <div className="absolute -inset-1 bg-gradient-to-tr from-primary to-accent opacity-10 blur-md rounded-2xl" />
                  </div>
                  <div className="relative" ref={searchRef}>
                    <div className="flex items-center gap-2 md:gap-3">
                      <h2
                        className="text-xl md:text-3xl font-black text-text-main tracking-tight leading-none mb-1 cursor-pointer hover:text-primary transition-colors"
                        onClick={() => setShowMarketDetails(true)}
                        title={t("viewMarketDetails")}
                      >
                        {selectedAsset.name}
                      </h2>
                      <button
                        onClick={() => setShowSearch(!showSearch)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all shadow-sm ${showSearch ? "bg-primary/20 border-primary/30 text-primary" : "bg-card-header/50 border-border text-text-muted hover:bg-card-header hover:text-text-main"}`}
                      >
                        {showSearch ? <X size={14} /> : <Search size={14} />}
                        <span className="text-xs font-black uppercase tracking-wider">
                          {showSearch ? t('close') : t('search')}
                        </span>
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-text-muted tracking-wider">
                        {selectedAsset.symbol} / USD
                      </span>
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-green-500/10 border border-green-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] font-black text-green-600 uppercase tracking-widest leading-none">
                          Live
                        </span>
                      </div>
                    </div>

                    {/* Asset Search Dropdown */}
                    <AnimatePresence>
                      {showSearch && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute md:left-0 left-[-50%] top-full mt-4 w-80 md:w-96 glass-menu z-50 p-4 space-y-4"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="relative">
                            <Search
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                              size={14}
                            />
                            <input
                              type="text"
                              placeholder={t('searchAssets') + "..."}
                              className="w-full bg-transparent border border-border rounded-xl py-2 pl-9 pr-4 text-sm text-text-main font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                            />
                          </div>
                          <div className="max-h-72 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                            {filteredAssets.map((asset) => (
                              <button
                                key={asset.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedAsset(asset);
                                  setShowSearch(false);
                                  setSearchTerm("");
                                }}
                                className={`group w-full flex items-center justify-between p-3 rounded-xl transition-all border border-transparent ${
                                  selectedAsset.symbol === asset.symbol
                                    ? "bg-primary/10 border-primary/20 shadow-sm"
                                    : "hover:bg-card-header/50 hover:border-border"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-card-header border border-border flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                                    <img
                                      src={asset.iconUrl}
                                      className="w-full h-full object-cover relative z-10"
                                      alt=""
                                      onError={(e) => {
                                        (
                                          e.target as HTMLImageElement
                                        ).style.display = "none";
                                        const fallback = (
                                          e.target as HTMLImageElement
                                        ).parentElement?.querySelector(
                                          ".dropdown-fallback",
                                        );
                                        if (fallback)
                                          fallback.classList.remove("hidden");
                                      }}
                                    />
                                    <span className="dropdown-fallback hidden text-[10px] font-black text-text-main relative z-10 uppercase">
                                      {asset.symbol[0]}
                                    </span>
                                  </div>
                                  <div className="text-left flex flex-col items-start">
                                    <p
                                      className={`text-xs font-bold ${selectedAsset.symbol === asset.symbol ? "text-primary" : "text-text-main"}`}
                                    >
                                      {asset.name}
                                    </p>
                                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-0.5">
                                      {asset.symbol}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 md:gap-4">
                                  <div className="text-right flex flex-col justify-center items-end">
                                    <span className="text-xs font-bold text-text-main tabular-nums">
                                      {formatCurrency(asset.price || 0)}
                                    </span>
                                    <span
                                      className={`text-[10px] font-black tabular-nums mt-0.5 ${asset.change && asset.change >= 0 ? "text-green-500" : "text-red-500"}`}
                                    >
                                      {formatPercentage(asset.change || 0, true)}
                                    </span>
                                  </div>
                                  <div
                                    className={`px-2.5 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${
                                      selectedAsset.symbol === asset.symbol
                                        ? "bg-primary text-white shadow-lg shadow-primary/20"
                                        : "bg-card-header text-text-muted group-hover:bg-primary group-hover:text-white"
                                    }`}
                                  >
                                    {selectedAsset.symbol === asset.symbol
                                      ? t('active')
                                      : t('trade')}
                                  </div>
                                </div>
                              </button>
                            ))}
                            {filteredAssets.length === 0 && (
                              <div className="text-center py-6">
                                <p className="text-sm font-bold text-text-muted">
                                  {t('noRecordsFound')}
                                </p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Main Price Display */}
                <div className="flex flex-col items-start md:items-end">
                  <div className="text-2xl md:text-4xl font-black text-text-main tracking-tighter tabular-nums leading-none">
                    {formatCurrency(livePrice)}
                  </div>
                  <div
                    className={`flex items-center gap-1.5 font-black text-xs md:text-sm mt-1 md:mt-1.5 ${
                      (selectedAsset.change ?? 0) >= 0
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  >
                    {(selectedAsset.change ?? 0) >= 0 ? (
                      <TrendingUp
                        className="w-3.5 h-3.5 md:w-4 md:h-4"
                        strokeWidth={3}
                      />
                    ) : (
                      <TrendingDown
                        className="w-3.5 h-3.5 md:w-4 md:h-4"
                        strokeWidth={3}
                      />
                    )}
                    {formatPercentage(Math.abs(selectedAsset.change ?? 0))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 p-2.5 md:p-3.5 rounded-2xl bg-card-header/50 border border-border shadow-inner">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                    {t('high24h')}
                  </p>
                  <p className="text-base font-bold text-text-main tabular-nums">
                    {formatCurrency(selectedAsset.high || 0)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                    {t('low24h')}
                  </p>
                  <p className="text-base font-bold text-text-main tabular-nums">
                    {formatCurrency(selectedAsset.low || 0)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                    {t('vol24h')}
                  </p>
                  <p className="text-base font-bold text-text-main tabular-nums">
                    {selectedAsset.volume ? `$${(selectedAsset.volume / 1000000).toFixed(2)}M` : '---'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                    {t('sentiment')}
                  </p>
                  <p
                    className={`text-base font-bold capitalize tabular-nums ${
                      (selectedAsset.change ?? 0) >= 0
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  >
                    {(selectedAsset.change ?? 0) >= 0 ? t('bullish') : t('bearish')}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Chart Area */}
        <div className="glass-card h-[400px] md:h-[500px] p-0 overflow-hidden relative z-0 w-full bg-card border-border shadow-xl">
          <TradingChart symbol={selectedAsset.symbol} interval={timeframe.minutes.toString()} />
        </div>
      </div>

      {/* Trading Panel */}
      <div className="lg:col-span-1 w-full">
        <TradingPanel
          balance={balance}
          amount={amount}
          setAmount={setAmount}
          orderType={orderType as any}
          setOrderType={setOrderType as any}
          onTrade={onTrade}
          tradeLoading={tradeLoading}
          selectedAsset={selectedAsset}
          transactions={transactions as any[]}
          timeframe={timeframe}
          setTimeframe={setTimeframe}
          activeBinaryTrades={activeBinaryTrades}
          loading={loading}
          totalDeposited={totalDeposited}
          tierThresholds={tierThresholds}
        />
      </div>
      {/* Market Details Modal */}
      <AnimatePresence>
        {showMarketDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-6"
            onClick={() => setShowMarketDetails(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="glass-menu rounded-[2.5rem] w-full max-w-2xl overflow-hidden relative mb-16 md:mb-0"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Decorative Blur */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

              {/* Header */}
              <div className="p-6 md:p-8 border-b border-border flex items-start justify-between relative z-10 bg-card-header/50">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center shadow-lg overflow-hidden shrink-0">
                    {selectedAsset.iconUrl ? (
                      <img
                        src={selectedAsset.iconUrl}
                        alt={selectedAsset.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-text-main font-black text-2xl uppercase">
                        {selectedAsset.symbol[0]}
                      </span>
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-black text-text-main tracking-tight">
                      {selectedAsset.name} {t('assetInfo')}
                    </h2>
                    <p className="text-text-muted font-bold uppercase tracking-widest text-xs mt-1">
                      {selectedAsset.symbol} / USD
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowMarketDetails(false)}
                  className="p-2 rounded-full hover:bg-card-header transition-colors text-text-muted hover:text-text-main"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Data Grid content */}
              <div className="p-6 md:p-8 space-y-8 relative z-10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-card-header/50 border border-border rounded-2xl p-4 shadow-sm">
                    <p className="text-[10px] uppercase font-black text-text-muted tracking-widest mb-1">
                      {t('livePrice')}
                    </p>
                    <p className="text-lg font-bold text-text-main">
                      {formatCurrency(livePrice)}
                    </p>
                  </div>
                  <div className="bg-card-header/50 border border-border rounded-2xl p-4 shadow-sm">
                    <p className="text-[10px] uppercase font-black text-text-muted tracking-widest mb-1">
                      {t('change24h')}
                    </p>
                    <p
                      className={`text-lg font-bold flex items-center gap-1 ${(selectedAsset.change ?? 0) >= 0 ? "text-green-500" : "text-red-500"}`}
                    >
                      {formatPercentage(selectedAsset.change ?? 0, true)}
                    </p>
                  </div>
                  <div className="bg-card-header/50 border border-border rounded-2xl p-4 shadow-sm">
                    <p className="text-[10px] uppercase font-black text-text-muted tracking-widest mb-1">
                      24h High
                    </p>
                    <p className="text-lg font-bold text-text-main">
                      {formatCurrency(selectedAsset.high || 0)}
                    </p>
                  </div>
                  <div className="bg-card-header/50 border border-border rounded-2xl p-4 shadow-sm">
                    <p className="text-[10px] uppercase font-black text-text-muted tracking-widest mb-1">
                      24h Low
                    </p>
                    <p className="text-lg font-bold text-text-main">
                      {formatCurrency(selectedAsset.low || 0)}
                    </p>
                  </div>
                </div>

                <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6 shadow-inner">
                  <h3 className="text-sm font-black text-primary uppercase tracking-widest mb-3">
                    {t('marketOverview')}
                  </h3>
                  <p className="text-text-muted text-sm leading-relaxed">
                    Trade{" "}
                    <span className="font-bold text-text-main">
                      {selectedAsset.name}
                    </span>{" "}
                    with ultra-low latency execution and deep liquidity.
                    Capitalize on market volatility and secure exact pricing
                    through our proprietary order-matching engine.
                  </p>
                </div>

                {/* Trade Button Full Width Action */}
                <button
                  onClick={() => {
                    setShowMarketDetails(false);
                  }}
                  className="w-full relative group overflow-hidden py-4 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-black hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center justify-center gap-2"
                >
                  <span className="relative z-10 text-lg tracking-tight">
                    {t('tradeNow')} {selectedAsset.symbol}
                  </span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
