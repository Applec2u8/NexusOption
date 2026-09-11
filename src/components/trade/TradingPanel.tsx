import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  ArrowDownLeft,
  X,
  Clock,
  History as HistoryIcon,
  Trophy,
  TrendingDown,
  Zap,
  Lock
} from "lucide-react";
import { formatCurrency } from "../../utils/format";
import { calculateProfit } from "../../utils/trade";
import { TIMEFRAMES } from "../../constants/trade";
import type { Transaction } from "../../types";
import { useWallet, type BinaryTrade } from "../../contexts/WalletContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { Skeleton } from "../shared/Skeleton";

interface TradingPanelProps {
  balance: number;
  amount: string;
  setAmount: (val: string) => void;
  orderType: "up" | "down";
  setOrderType: (val: "up" | "down") => void;
  onTrade: () => void;
  tradeLoading: boolean;
  selectedAsset: { symbol: string };
  transactions: Transaction[];
  timeframe: { label: string; minutes: number; payout: number };
  setTimeframe: (val: {
    label: string;
    minutes: number;
    payout: number;
  }) => void;
  activeBinaryTrades: BinaryTrade[];
  loading: boolean;
  totalDeposited: number;
  tierThresholds: {
    tier_1m: number;
    tier_3m: number;
    tier_5m: number;
    tier_15m: number;
    tier_20m: number;
    tier_30m: number;
  };
}

export const TradingPanel: React.FC<TradingPanelProps> = ({
  balance,
  amount,
  setAmount,
  orderType,
  setOrderType,
  onTrade,
  tradeLoading,
  selectedAsset,
  transactions,
  timeframe,
  setTimeframe,
  activeBinaryTrades,
  loading,
  totalDeposited,
  tierThresholds,
}) => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Map each timeframe minutes to its required threshold
  const thresholdMap: Record<number, number> = {
    1: tierThresholds.tier_1m,
    3: tierThresholds.tier_3m,
    5: tierThresholds.tier_5m,
    15: tierThresholds.tier_15m,
    20: tierThresholds.tier_20m,
    30: tierThresholds.tier_30m,
  };

  const isLocked = (minutes: number): boolean => {
    const required = thresholdMap[minutes] ?? 0;
    return totalDeposited < required;
  };

  const [showAmountModal, setShowAmountModal] = useState(false);
  const [tempAmount, setTempAmount] = useState(amount);
  const [timeLeftAmount, setTimeLeftAmount] = useState(120);

  const { refreshWallet } = useWallet();

  // Refresh wallet balance whenever the modal is opened
  useEffect(() => {
    if (showAmountModal) {
      refreshWallet();
    }
  }, [showAmountModal, refreshWallet]);

  // Timer logic for Amount Modal
  useEffect(() => {
    let timer: any;
    if (showAmountModal && timeLeftAmount > 0) {
      timer = setInterval(() => setTimeLeftAmount((prev) => prev - 1), 1000);
    } else if (timeLeftAmount === 0 && showAmountModal) {
      setShowAmountModal(false);
    }
    return () => clearInterval(timer);
  }, [showAmountModal, timeLeftAmount]);

  // Close Setup Option modal on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showAmountModal) {
        setShowAmountModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showAmountModal]);

  const handleConfirmAmount = (amt: string) => {
    setAmount(amt);
    setShowAmountModal(false);
  };

  // Memoize filtered transactions to prevent re-filtering on every render
  const filteredTransactions = React.useMemo(() => {
    return transactions.filter((t_tx) => t_tx.asset === selectedAsset.symbol);
  }, [transactions, selectedAsset.symbol]);

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="glass-card bg-card border-border shadow-xl"
      >
        <div className="flex gap-2 p-1 bg-card-header/50 rounded-xl mb-6 shadow-inner">
          <button
            onClick={() => setOrderType("up")}
            className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${
              orderType === "up"
                ? "bg-green-500 text-white shadow-lg shadow-green-500/20"
                : "text-text-muted hover:text-text-main"
            }`}
          >
            {t("upCall")}
          </button>
          <button
            onClick={() => setOrderType("down")}
            className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${
              orderType === "down"
                ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
                : "text-text-muted hover:text-text-main"
            }`}
          >
            {t("downPut")}
          </button>
        </div>

        <div className="space-y-4">
          {/* Consolidated Amount & Time Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-muted uppercase ml-1">
              {t("investmentAndTime")}
            </label>
            <div
              className="relative group cursor-pointer"
              onClick={() => {
                setTempAmount(amount);
                setTimeLeftAmount(120);
                setShowAmountModal(true);
              }}
            >
              <div className="w-full bg-transparent border border-border hover:border-primary/30 rounded-xl p-4 transition-all flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-text-main">
                    {amount || "0.00"}{" "}
                    <span className="text-sm text-text-muted font-bold ml-1">
                      USD
                    </span>
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 rounded-lg border border-primary/20 shadow-sm">
                    <span className="text-sm font-black text-primary">
                      {timeframe.label}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-green-500 mt-1">
                    +{timeframe.payout}% Profit
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between text-[10px] font-bold text-text-muted px-1">
            <div className="flex flex-col gap-0.5">
              <span>
                {t("availableBalance")}: {formatCurrency(balance)}
              </span>
              <span className="text-primary/70 italic">
                {t("minimum")}: $1.00
              </span>
            </div>
            <span
              onClick={() => setAmount(balance.toString())}
              className="text-primary cursor-pointer hover:underline self-end"
            >
              MAX
            </span>
          </div>

          <div className="p-4 rounded-xl bg-card-header/30 border border-border shadow-inner space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-text-muted">
                Profit if Won (+{timeframe.payout}%)
              </span>
              <span className="text-green-500 font-mono font-bold">
                +
                {formatCurrency(
                  calculateProfit(Number(amount), timeframe.payout),
                )}
              </span>
            </div>
          </div>

          <button
            onClick={onTrade}
            disabled={tradeLoading}
            className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60 ${
              orderType === "up"
                ? "bg-green-500 shadow-green-500/20"
                : "bg-red-500 shadow-red-500/20"
            }`}
          >
            {orderType === "up" ? (
              <ArrowUpRight size={20} />
            ) : (
              <ArrowDownLeft size={20} />
            )}
            {orderType === "up" ? t("predictUp") : t("predictDown")}
          </button>
        </div>
      </motion.div>

      {/* Active Binary Trades */}
      {(activeBinaryTrades.length > 0 || tradeLoading) && (
        <div className="glass-card p-6 bg-card border-border shadow-xl">
          <h3 className="text-sm font-bold text-text-main flex items-center gap-2 mb-4">
            <Clock size={16} className="text-primary" />
            {t("activeBinaryTrades")}
          </h3>
          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {tradeLoading && (
              <div className="p-3 bg-card-header/30 rounded-xl border border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton variant="rect" width={32} height={32} className="rounded-lg shrink-0" />
                  <div className="space-y-1.5">
                    <Skeleton variant="text" width={60} height={12} className="rounded" />
                    <Skeleton variant="text" width={40} height={8} className="rounded" />
                  </div>
                </div>
                <div className="text-right flex flex-col items-end space-y-1.5">
                  <Skeleton variant="text" width={40} height={14} className="rounded" />
                  <Skeleton variant="text" width={30} height={8} className="rounded" />
                </div>
              </div>
            )}
            {activeBinaryTrades.map((trade) => (
              <ActiveTradeItem key={trade.id} trade={trade} t={t} />
            ))}
          </div>
        </div>
      )}

      <div className="glass-card p-6 bg-card border-border shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-text-main flex items-center gap-2">
            <HistoryIcon size={16} className="text-primary" />
            {t("recentTransactions")}
          </h3>
          <button
            onClick={() => navigate("/history")}
            className="text-xs text-text-muted hover:text-primary transition-colors"
          >
            {t("viewAll")}
          </button>
        </div>
        <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
          {(loading || transactions.length === 0) && filteredTransactions.length === 0 ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <Skeleton variant="rect" width={36} height={36} className="rounded-xl" />
                    <div className="space-y-2">
                      <Skeleton variant="text" width={80} height={12} />
                      <Skeleton variant="text" width={40} height={8} />
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <Skeleton variant="text" width={50} height={14} className="ml-auto" />
                    <Skeleton variant="text" width={30} height={8} className="ml-auto" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            filteredTransactions.map((tx) => {
              const resLower = tx.binary_result?.toLowerCase();
              const isWin = resLower === "win" || resLower === "won";
              const isPositive =
                tx.type === "sell" ||
                tx.type === "deposit" ||
                tx.type === "win" ||
                isWin;
              const isBinaryBet = tx.binary_type && !tx.binary_result;

              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-3 border-b border-border last:border-0 hover:translate-x-1 transition-transform cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center relative flex-shrink-0 shadow-sm border-2 transition-colors ${
                          isPositive 
                            ? "bg-green-500/10 text-green-600 border-green-500/20" 
                            : isBinaryBet 
                              ? "bg-primary/10 text-primary border-primary/20" 
                              : "bg-red-500/10 text-red-600 border-red-500/20"
                        }`}
                      >
                        {isWin ? (
                          <Trophy size={16} className="stroke-[2.5]" />
                        ) : isBinaryBet ? (
                          <Zap size={16} className="stroke-[2.5]" />
                        ) : tx.type === "sell" || tx.type === "deposit" ? (
                          <ArrowUpRight size={16} strokeWidth={2.5} />
                        ) : tx.binary_result?.toLowerCase().includes("loss") ? (
                          <TrendingDown size={16} strokeWidth={2.5} />
                        ) : (
                          <ArrowDownLeft size={16} strokeWidth={2.5} />
                        )}
                      </div>
                      <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full bg-card-header border border-border text-[8px] font-black text-text-muted tabular-nums uppercase shadow-sm">
                        #{tx.smart_id || tx.id.slice(-4)}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <p className="text-[10px] sm:text-[11px] font-black text-text-main uppercase truncate max-w-[80px] sm:max-w-none">
                          {isBinaryBet ? t('predictionAmount') : tx.asset}
                        </p>
                        {tx.binary_type && (
                          <span className={`text-[8px] font-black px-1 rounded flex-shrink-0 ${tx.binary_type === 'up' ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-600'}`}>
                            {tx.binary_type === 'up' ? "▲" : "▼"} {tx.binary_type.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-[8px] text-text-muted font-bold uppercase tracking-tight">
                          {new Date(tx.timestamp).getHours().toString().padStart(2, '0')}:
                          {new Date(tx.timestamp).getMinutes().toString().padStart(2, '0')}
                        </p>
                        {tx.binary_result && (
                          <span className={`text-[8px] font-black px-1 rounded-full uppercase flex-shrink-0 ${isWin ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
                            {tx.binary_result}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p
                      className={`text-[11px] sm:text-xs font-bold ${
                        isPositive ? "text-green-600" : isBinaryBet ? "text-primary" : "text-red-600"
                      }`}
                    >
                      {isPositive ? "+" : "-"}
                      {formatCurrency(tx.total)}
                    </p>
                    <p className="text-[10px] text-text-muted">
                      {isBinaryBet ? t('active') : t(tx.status)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Custom Amount Selection Modal */}
      <AnimatePresence>
        {showAmountModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-6"
            onClick={() => setShowAmountModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="glass-menu rounded-[2.5rem] w-full max-w-sm relative overflow-hidden flex flex-col mb-16 md:mb-0"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-border flex items-center justify-between relative bg-card-header/50 shadow-sm">
                <h2 className="text-lg font-black text-text-main flex items-center gap-2">
                  <Clock size={20} className="text-primary" />{" "}
                  {t("setupOption")}
                </h2>
                <div className="flex items-center gap-3">
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tabular-nums transition-colors ${timeLeftAmount <= 5 ? "bg-red-500/20 text-red-600 animate-pulse" : "bg-primary/20 text-primary"}`}
                  >
                    <Clock size={12} />
                    {Math.floor(timeLeftAmount / 60)
                      .toString()
                      .padStart(2, "0")}
                    :{(timeLeftAmount % 60).toString().padStart(2, "0")}
                  </div>
                  <button
                    onClick={() => setShowAmountModal(false)}
                    className="p-1 rounded-full hover:bg-card-header transition-colors text-text-muted hover:text-text-main"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Balance View */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-card-header/30 border border-border shadow-inner">
                  <div>
                    <h4 className="text-[10px] font-black uppercase text-text-muted tracking-widest flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {t('availableBalance')}
                    </h4>
                    <p className="text-xl font-black text-text-main tabular-nums">
                      {formatCurrency(balance)}
                    </p>
                  </div>
                  <button
                    onClick={() => setTempAmount(balance.toString())}
                    className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white text-xs font-black uppercase transition-all shadow-sm"
                  >
                    Max
                  </button>
                </div>

                {/* Amount Output */}
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-text-muted">
                    $
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={tempAmount}
                    onChange={(e) => setTempAmount(e.target.value)}
                    placeholder="0.00"
                    autoFocus
                    className="w-full bg-transparent border border-border hover:border-primary/50 focus:border-primary rounded-2xl py-5 pl-10 pr-16 text-3xl font-black text-text-main focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all tabular-nums"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-text-muted">
                    USD
                  </span>
                </div>

                {/* 3x2 Timeframe Grid */}
                <div className="grid grid-cols-3 gap-3">
                  {TIMEFRAMES.map((tf) => {
                    const locked = isLocked(tf.minutes);
                    const required = thresholdMap[tf.minutes] ?? 0;
                    const isSelected = timeframe.minutes === tf.minutes;
                    return (
                      <div key={tf.minutes} className="relative group">
                        <button
                          onClick={() => {
                            if (!locked) {
                              setTimeframe({
                                label: tf.label,
                                minutes: tf.minutes,
                                payout: tf.payout,
                              });
                            }
                          }}
                          disabled={locked}
                          className={`w-full py-3 flex flex-col items-center justify-center rounded-xl border transition-all shadow-sm ${
                            locked
                              ? "bg-card-header/20 border-border/40 cursor-not-allowed opacity-60"
                              : isSelected
                              ? "bg-primary/20 border-primary shadow-md shadow-primary/10 active:scale-95"
                              : "bg-card-header/50 border-border hover:border-primary/30 hover:bg-card-header active:scale-95"
                          }`}
                        >
                          <span className={`font-bold text-lg ${isSelected && !locked ? "text-primary" : locked ? "text-text-muted" : "text-text-main"}`}>
                            {tf.label}
                          </span>
                          <span className={`text-[10px] font-bold ${locked ? "text-text-muted/60" : "text-green-500"}`}>
                            +{tf.payout}% {t("profitIfWon")}
                          </span>
                        </button>

                        {/* Lock overlay */}
                        {locked && (
                          <div className="absolute inset-0 rounded-xl flex flex-col items-center justify-center bg-background/60 backdrop-blur-[2px] pointer-events-none z-10">
                            <Lock size={14} className="text-amber-500 mb-0.5" />
                            <span className="text-[8px] font-black text-amber-500 uppercase tracking-tight text-center leading-tight px-1">
                              ${required.toLocaleString()}+
                            </span>
                          </div>
                        )}

                        {/* Tooltip on hover */}
                        {locked && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 bg-card border border-amber-500/30 rounded-xl p-2.5 text-center shadow-xl z-20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <Lock size={12} className="text-amber-500 mx-auto mb-1" />
                            <p className="text-[9px] font-black text-amber-400 uppercase tracking-wide leading-tight">
                              ต้องเติมเงินสะสม
                            </p>
                            <p className="text-xs font-black text-text-main mt-0.5">
                              ${required.toLocaleString()}+
                            </p>
                            <p className="text-[8px] text-text-muted mt-0.5">
                              ยอดสะสมปัจจุบัน: ${totalDeposited.toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Submit Area */}
                <button
                  onClick={() => handleConfirmAmount(tempAmount)}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-black text-lg shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/40 transition-all active:scale-95 flex items-center justify-center"
                >
                  {t("confirmTradeSetup")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};

// Sub-component to handle its own timer to prevent parent re-renders
const ActiveTradeItem: React.FC<{ trade: BinaryTrade; t: any }> = React.memo(({ trade, t }) => {
  const [now, setNow] = React.useState(Date.now());

  React.useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const remainingSecs = Math.max(
    0,
    Math.floor((trade.expiryTime - now) / 1000),
  );
  
  const isSettling = remainingSecs === 0;
  const m = Math.floor(remainingSecs / 60);
  const s = remainingSecs % 60;
  const timeString = isSettling ? t("settling") || "Settling..." : `${m}:${s.toString().padStart(2, "0")}`;

  return (
    <div
      className="p-3 bg-card-header/50 rounded-xl border border-border flex items-center justify-between shadow-sm"
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm ${trade.type === "up" ? "bg-green-500/10 text-green-600 border border-green-500/20" : "bg-red-500/10 text-red-600 border border-red-500/20"}`}
        >
          {trade.type === "up" ? (
            <ArrowUpRight size={16} />
          ) : (
            <ArrowDownLeft size={16} />
          )}
        </div>
        <div>
          <p className="text-xs font-bold text-text-main uppercase">
            {trade.assetSymbol}
          </p>
          <p className="text-[10px] text-text-muted font-medium">
            Entry: {formatCurrency(trade.entryPrice)}
          </p>
        </div>
      </div>
      <div className="text-right flex flex-col items-end">
        <p className="text-sm font-black text-text-main tabular-nums tracking-wider">
          {timeString}
        </p>
        <p className="text-[10px] text-text-muted font-bold">
          {formatCurrency(trade.amount)}{" "}
          <span className="text-green-500">
            +{trade.payoutPercent}%
          </span>
        </p>
      </div>
    </div>
  );
});
