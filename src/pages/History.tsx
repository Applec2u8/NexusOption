import React, { useState, useMemo } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { useWallet } from "../contexts/WalletContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Filter,
  Trophy,
  TrendingDown,
  TrendingUp,
  Zap,
  Search,
  CheckCircle2,
  XCircle,
  LayoutGrid,
  LogOut,
  Monitor,
  Wifi,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { HistorySkeleton } from "../components/shared/PageSkeletons";
import {
  getDaysInMonth,
  getFirstDayOfMonth,
  formatDate,
  formatTime,
} from "../utils/date";
import { Skeleton } from "../components/shared/Skeleton";
import { formatCurrency, formatUnits } from "../utils/format";
import { useAuth } from "../contexts/AuthContext";
import { activityService, type ActivityItem } from "../services/activityService";

export const History: React.FC = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { transactions, hasMoreTransactions, loadMoreTransactions, loadingMore, loading } = useWallet();

  const [view, setView] = useState<'trading' | 'security'>('trading');
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'win' | 'loss'>('all');

  const isth = language === 'th';

  // Fetch Login History / Security Activities
  React.useEffect(() => {
    if (view === 'security' && user?.id) {
      activityService.fetchActivities({ userId: user.id, type: 'login' })
        .then(setActivities);
    }
  }, [view, user?.id]);

  const handleKick = async (sid: string) => {
    if (window.confirm(isth ? 'ต้องการสั่งออกจากระบบบนเครื่องนี้ใช่หรือไม่?' : 'Logout from this device?')) {
      const ok = await activityService.kickSession(sid);
      if (ok) {
        setActivities(prev => prev.map(a => a.sessionId === sid ? { ...a, isActive: false, sessionId: undefined } : a));
      }
    }
  };

  const tradeTransactions = useMemo(() => transactions.filter(
    (tx) =>
      tx.type === "buy" ||
      tx.type === "sell" ||
      tx.type === "deposit" ||
      tx.type === "withdraw" ||
      tx.type === "win" ||
      tx.type === "loss",
  ), [transactions]);

  const uniqueAssets = useMemo(() => {
    const assets = new Set<string>();
    tradeTransactions.forEach((tx) => {
      if (tx.asset) assets.add(tx.asset);
    });
    return Array.from(assets).sort();
  }, [tradeTransactions]);

  // Calendar setup
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  // Map dates that have transactions for indicators
  const transactionDates = useMemo(() => {
    const dates = new Set<string>();
    tradeTransactions.forEach((tx) => {
      const d = new Date(tx.timestamp);
      dates.add(
        new Date(d.getFullYear(), d.getMonth(), d.getDate()).toDateString(),
      );
    });
    return dates;
  }, [tradeTransactions]);

  // Filter transactions up to the selected day and asset (Cumulative)
  const filteredTransactions = useMemo(() => {
    return tradeTransactions.filter((tx) => {
      const txDate = new Date(tx.timestamp);
      // Create a date object for the very end of the selected day (23:59:59.999)
      const endOfSelectedDay = new Date(selectedDate);
      endOfSelectedDay.setHours(23, 59, 59, 999);

      const isUpToDate = txDate.getTime() <= endOfSelectedDay.getTime();
      const matchesAsset =
        selectedAsset === "all" || tx.asset === selectedAsset;

      // Status Filter Logic
      const resLower = tx.binary_result?.toLowerCase() || "";
      const isWin = resLower.includes('win') || resLower.includes('won') || !!tx.is_win;
      const isLoss = resLower.includes('loss') || !!tx.is_loss;

      let matchesStatus = true;
      if (statusFilter === 'win') matchesStatus = isWin;
      if (statusFilter === 'loss') matchesStatus = isLoss;

      // Search Query Logic
      let matchesSearch = true;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const smartId = (tx.smart_id || tx.id.slice(-4)).toLowerCase();
        matchesSearch =
          tx.asset?.toLowerCase().includes(query) ||
          tx.type?.toLowerCase().includes(query) ||
          tx.id.toLowerCase().includes(query) ||
          smartId.includes(query);
      }

      return isUpToDate && matchesAsset && matchesStatus && matchesSearch;
    });
  }, [tradeTransactions, selectedDate, selectedAsset, statusFilter, searchQuery]);

  // Month names for display
  const monthNames = [
    t("january"), t("february"), t("march"), t("april"), t("mayFull"), t("june"),
    t("july"), t("august"), t("september"), t("october"), t("november"), t("december")
  ];

  const dayNames = [t("sun"), t("mon"), t("tue"), t("wed"), t("thu"), t("fri"), t("sat")];
  
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  React.useEffect(() => {
    if (!loading && !hasLoadedOnce) {
      setHasLoadedOnce(true);
    }
  }, [loading, hasLoadedOnce]);

  if (loading && !hasLoadedOnce) {
    return <HistorySkeleton />;
  }


  return (
    <div className="pt-24 pb-32 px-6 max-w-4xl mx-auto space-y-8">
      {/* Calendar Header */}
      <div className="flex items-center justify-between border-l-4 border-primary pl-4">
        <div>
          <h1 className="text-2xl font-black text-text-main flex items-center gap-2">
            <CalendarIcon size={24} className="text-primary" />
            {t("history") || "History"}
          </h1>
          <p className="text-sm font-semibold text-text-muted mt-1">
            {t("calendarView")}
          </p>
        </div>
      </div>

      {/* Calendar Component */}
      <div className="glass-card bg-card border border-border rounded-3xl p-6 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />

        {/* Calendar Nav */}
        <div className="flex items-center justify-between mb-6 relative z-10">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-card-header rounded-xl transition-colors text-text-muted hover:text-text-main"
          >
            <ChevronLeft size={24} />
          </button>

          <h2 className="text-xl font-black text-text-main tracking-tight">
            {monthNames[currentMonth]} {currentYear}
          </h2>

          <button
            onClick={nextMonth}
            className="p-2 hover:bg-card-header rounded-xl transition-colors text-text-muted hover:text-text-main"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="relative z-10">
          {/* Days of Week */}
          <div className="grid grid-cols-7 mb-4">
            {dayNames.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-bold text-text-muted uppercase"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Dates Grid */}
          <div className="grid grid-cols-7 gap-y-4 gap-x-2">
            {/* Empty slots before first day */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {/* Actual Days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateObj = new Date(currentYear, currentMonth, day);
              const isSelected =
                selectedDate.getDate() === day &&
                selectedDate.getMonth() === currentMonth &&
                selectedDate.getFullYear() === currentYear;

              const today = new Date();
              const isToday =
                today.getDate() === day &&
                today.getMonth() === currentMonth &&
                today.getFullYear() === currentYear;

              const hasTransaction = transactionDates.has(
                dateObj.toDateString(),
              );

              const handleDateClick = (date: Date) => {
                setSelectedDate(date);

                // Enhanced Scroll to the specific date header in the list
                setTimeout(() => {
                  const targetId = `date-header-${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
                  const element = document.getElementById(targetId);
                  if (element) {
                    const navbarOffset = 72; // App Navbar height
                    const stickyHeaderHeight = 48; // Our sticky header height
                    const totalOffset = navbarOffset + stickyHeaderHeight - 10;

                    const elementPosition = element.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - totalOffset;

                    window.scrollTo({
                      top: offsetPosition,
                      behavior: "smooth"
                    });
                  }
                }, 100);
              };

              return (
                <div key={day} className="flex justify-center">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleDateClick(dateObj)}
                    className={`relative w-10 h-10 flex flex-col items-center justify-center rounded-2xl text-sm font-bold transition-all duration-300
                      ${isSelected
                        ? "bg-gradient-to-tr from-primary to-accent text-white shadow-lg shadow-primary/30"
                        : isToday
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "text-text-muted hover:text-text-main hover:bg-card-header/50"
                      }
                    `}
                  >
                    <span className="relative z-10">{day}</span>

                    {/* Transaction Dot Indicator */}
                    {hasTransaction && (
                      <span
                        className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : "bg-primary"}`}
                      />
                    )}
                  </motion.button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* View Switcher */}
      <div className="flex p-1 bg-card-header/50 border border-border rounded-2xl mb-6 shadow-inner">
        <button
          onClick={() => setView('trading')}
          className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-3 rounded-xl text-[10px] sm:text-xs font-bold sm:font-black uppercase tracking-wider sm:tracking-widest transition-all ${view === 'trading' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-text-muted hover:text-text-main"
            }`}
        >
          <ClipboardList size={16} className="sm:w-[18px] sm:h-[18px]" />
          <span className="text-center leading-tight whitespace-nowrap sm:whitespace-normal">{t("tradingActivity")}</span>
        </button>
        <button
          onClick={() => setView('security')}
          className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-3 rounded-xl text-[10px] sm:text-xs font-bold sm:font-black uppercase tracking-wider sm:tracking-widest transition-all ${view === 'security' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-text-muted hover:text-text-main"
            }`}
        >
          <ShieldCheck size={16} className="sm:w-[18px] sm:h-[18px]" />
          <span className="text-center leading-tight whitespace-nowrap sm:whitespace-normal">{isth ? 'ความปลอดภัย' : 'Security'}</span>
        </button>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {view === 'trading' ? (
          <motion.div
            key="trading-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Advanced Filter Panel */}
            <div className="glass-card bg-card-header/40 border border-border rounded-3xl p-3 sm:p-4 space-y-3 shadow-xl">
              <div className="flex flex-col lg:flex-row gap-3">
                <div className="relative group flex-grow">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors">
                    <Search size={16} />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t("searchHistory") === "searchHistory" ? "ค้นหา Order ID, สินทรัพย์..." : t("searchHistory")}
                    className="w-full bg-transparent border border-border rounded-2xl py-2.5 pl-11 pr-4 text-text-main font-bold text-xs outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all placeholder:text-text-muted/30"
                  />
                </div>

                <div className="flex items-center gap-1 p-1 bg-transparent border border-border rounded-2xl flex-shrink-0">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${statusFilter === 'all' ? "bg-card-header text-text-main shadow-sm border border-border" : "text-text-muted hover:text-text-main"}`}
                  >
                    <LayoutGrid size={12} />
                    {t("all") || "All"}
                  </button>
                  <button
                    onClick={() => setStatusFilter('win')}
                    className={`flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${statusFilter === 'win' ? "bg-green-500/20 text-green-600 shadow-sm border border-green-500/20" : "text-text-muted hover:text-text-main"}`}
                  >
                    <CheckCircle2 size={12} />
                    {t("win") || "Win"}
                  </button>
                  <button
                    onClick={() => setStatusFilter('loss')}
                    className={`flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${statusFilter === 'loss' ? "bg-red-500/20 text-red-600 shadow-sm border border-red-500/20" : "text-text-muted hover:text-text-main"}`}
                  >
                    <XCircle size={12} />
                    {t("loss") || "Loss"}
                  </button>
                </div>

                <div className="relative group lg:w-48">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none group-focus-within:text-primary transition-colors">
                    <Filter size={14} />
                  </div>
                  <select
                    value={selectedAsset}
                    onChange={(e) => setSelectedAsset(e.target.value)}
                    className="w-full bg-transparent border border-border rounded-2xl py-2.5 pl-10 pr-10 text-xs font-bold text-text-main outline-none focus:ring-2 focus:ring-primary/40 appearance-none cursor-pointer transition-all"
                  >
                    <option value="all" className="bg-card text-text-main"> {t("allAssets") || "All Assets"} </option>
                    {uniqueAssets.map((asset) => (
                      <option key={asset} value={asset} className="bg-card text-text-main">{asset}</option>
                    ))}
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
                    <ChevronRight size={14} className="rotate-90" />
                  </div>
                </div>
              </div>
            </div>


            {filteredTransactions.length === 0 ? (
              loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="glass-card bg-card border border-border p-4 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Skeleton variant="rect" width={48} height={48} className="rounded-2xl" />
                        <div className="space-y-2">
                          <Skeleton variant="text" width={120} height={16} />
                          <Skeleton variant="text" width={80} height={10} />
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <Skeleton variant="text" width={80} height={20} className="ml-auto" />
                        <Skeleton variant="text" width={40} height={10} className="ml-auto" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center glass-card bg-card-header/30 rounded-3xl border border-border border-dashed">
                  <div className="w-16 h-16 rounded-full bg-card-header flex items-center justify-center text-text-muted shadow-inner">
                    <ClipboardList size={32} />
                  </div>
                  <p className="text-text-muted font-medium tracking-wide text-sm">No trading activity found.</p>
                </div>
              )
            ) : (
              <div className="space-y-2.5">
                {filteredTransactions.map((tx, index) => {
                  const txDateStr = new Date(tx.timestamp).toLocaleDateString();
                  const prevTxDateStr = index > 0 ? new Date(filteredTransactions[index - 1].timestamp).toLocaleDateString() : null;
                  const showDateHeader = txDateStr !== prevTxDateStr;

                  return (
                    <React.Fragment key={tx.id}>
                      {showDateHeader && (
                        <div
                          id={`date-header-${new Date(tx.timestamp).getFullYear()}-${new Date(tx.timestamp).getMonth()}-${new Date(tx.timestamp).getDate()}`}
                          className={`sticky md:top-[74px] top-[64px] z-10 ${index === 0 ? "mt-0" : "mt-4"} bg-background/95 backdrop-blur-md -mx-6`}
                        >
                          <div className="flex items-center gap-3 py-2 px-6">
                            <div className="h-px bg-border flex-grow" />
                            <span className="text-[7px] text-primary font-black uppercase tracking-[0.2em] px-2.5 py-1 bg-primary/10 rounded-full border border-primary/20 shadow-sm leading-none">
                              {(() => {
                                const todayStr = new Date().toLocaleDateString();
                                if (txDateStr === todayStr) return language === 'th' ? 'วันนี้' : 'Today';
                                return formatDate(new Date(tx.timestamp), { weekday: "short", month: "short", day: "numeric", year: "numeric" });
                              })()}
                            </span>
                            <div className="h-px bg-border flex-grow" />
                          </div>
                        </div>
                      )}
                      <TransactionItem 
                        tx={tx} 
                        t={t} 
                        isExpanded={expandedId === tx.id} 
                        onToggle={() => setExpandedId(expandedId === tx.id ? null : tx.id)} 
                      />
                    </React.Fragment>
                  );
                })}

                {hasMoreTransactions && (
                  <div className="pt-6 pb-10 flex justify-center">
                    <button onClick={loadMoreTransactions} disabled={loadingMore} className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-card border border-border hover:border-primary/30 text-text-main font-black text-sm uppercase tracking-widest transition-all active:scale-95 shadow-lg">
                      {loadingMore ? <div className="w-4 h-4 border-2 border-text-muted border-t-primary rounded-full animate-spin" /> : <Zap size={18} className="text-primary" />}
                      {loadingMore ? t("loading") : t("loadMore")}
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="security-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2">
              <h3 className="text-text-main text-sm font-bold uppercase tracking-widest">
                {isth ? 'ประวัติการเข้าใช้งาน' : 'Login History'}
              </h3>
              <div className="h-px flex-1 bg-border" />
            </div>

            {activities.length === 0 ? (
              <div className="text-center py-20 bg-card-header/40 rounded-3xl border border-border border-dashed shadow-inner">
                <p className="text-text-muted text-sm font-medium">No history found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {activities.map((act) => {
                  const isCurrent = act.sessionId === (user as any)?.session_id;
                  return (
                    <motion.div
                      key={act.id}
                      className={`bg-card border border-border rounded-2xl p-4 flex items-center justify-between group relative overflow-hidden shadow-sm transition-all ${isCurrent ? 'ring-1 ring-primary/40 shadow-lg' : 'hover:border-primary/20'}`}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${act.isActive ? 'bg-green-500/10 text-green-600' : 'bg-card-header text-text-muted'}`}>
                          <Monitor size={20} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-text-main text-[13px] font-bold truncate">
                              {act.device || 'Unknown Device'}
                            </span>
                            {isCurrent && (
                              <span className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[8px] font-black text-primary uppercase shadow-sm">
                                {isth ? 'เซสชันปัจจุบัน' : 'Current Session'}
                              </span>
                            )}
                            {!isCurrent && act.isActive && (
                              <span className="inline-flex items-center gap-1 text-[8px] font-black text-green-600 uppercase">
                                <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                                {isth ? 'กำลังออนไลน์' : 'Active'}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="flex items-center gap-1.5 text-[10px] text-text-muted font-mono">
                              <Wifi size={10} /> {act.ip}
                            </span>
                            <span className="flex items-center gap-1.5 text-[10px] text-text-muted font-mono">
                              <Clock size={10} /> {new Date(act.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {!isCurrent && act.isActive && act.sessionId && (
                        <button
                          onClick={() => handleKick(act.sessionId!)}
                          className="p-2.5 rounded-xl text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                          title={isth ? 'เตะออกจากระบบ' : 'Kick Out'}
                        >
                          <LogOut size={16} />
                        </button>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const TransactionItem: React.FC<{ tx: any; t: any; isExpanded: boolean; onToggle: () => void }> = React.memo(({ tx, t, isExpanded, onToggle }) => {
  const isWin = tx.binary_result?.toLowerCase() === "win" || !!tx.is_win;
  const isDeposit = tx.type === 'deposit';
  const isPositive = isWin || isDeposit;
  const isBinaryBet = !!tx.binary_type && !tx.binary_result;

  return (
    <div
      onClick={onToggle}
      className={`glass-card bg-card border border-border hover:border-primary/30 transition-all flex flex-col p-4 rounded-2xl cursor-pointer relative overflow-hidden shadow-sm ${isExpanded ? "border-primary/40 ring-1 ring-primary/20 shadow-xl" : ""}`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="relative flex-shrink-0">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 shadow-sm ${isPositive ? "bg-green-500/10 text-green-600 border-green-500/20" : isBinaryBet ? "bg-primary/10 text-primary border-primary/20" : "bg-red-500/10 text-red-600 border-red-500/20"}`}>
              {isWin ? <Trophy size={20} /> : isDeposit ? <TrendingUp size={20} /> : isBinaryBet ? <Zap size={20} /> : <TrendingDown size={20} />}
            </div>
            <span className="absolute -top-1.5 -left-1.5 min-w-[20px] h-[18px] flex items-center justify-center px-1.5 rounded-full bg-card-header border border-border text-[8px] font-black text-text-muted tabular-nums uppercase shadow-md z-10">
              #{tx.smart_id || tx.id.slice(-4)}
            </span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-text-main text-sm uppercase truncate">{tx.asset || t("transaction")}</h3>
              {tx.binary_type && (
                <span className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[7px] font-black uppercase tracking-tighter shadow-sm ${tx.binary_type === 'up'
                  ? 'bg-green-500/10 text-green-600 border border-green-500/20'
                  : 'bg-red-500/10 text-red-600 border border-red-500/20'
                  }`}>
                  {tx.binary_type === 'up' ? '▲ UP' : '▼ DOWN'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-text-muted font-bold whitespace-nowrap">{formatTime(tx.timestamp)}</span>
              {tx.binary_result && <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase whitespace-nowrap shadow-sm ${isWin ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>{tx.binary_result}</span>}
            </div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className={`text-base font-black tabular-nums ${isPositive ? "text-green-600" : isBinaryBet ? "text-primary" : "text-red-600"}`}>{isPositive ? "+" : "-"}{formatCurrency(tx.total)}</p>
          <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1 whitespace-nowrap">{tx.amount && formatUnits(tx.amount)} {tx.asset}</p>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="pt-4 mt-4 border-t border-border grid grid-cols-2 gap-4 overflow-hidden">
            <div>
              <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">{t("transactionId")}</p>
              <p className="text-[9px] text-text-main font-mono break-all leading-tight mt-1">#{tx.id}</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">{t("dateTime")}</p>
              <p className="text-[10px] text-text-main font-bold mt-1">{new Date(tx.timestamp).toLocaleString()}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
