import React, {
  useState, useMemo, useCallback, useTransition, memo,
  useEffect,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, RefreshCw, Calendar, ChevronDown,
  ArrowDownCircle, ArrowUpCircle, TrendingUp, TrendingDown,
  Trophy, XCircle, LogIn, User, Monitor, Wifi, DollarSign,
  Info, X, Hash, Copy, Check, LogOut,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { activityService } from '../../services/activityService';
import type { ActivityItem, ActivityType, ActivityFilters } from '../../services/activityService';
import { useLanguage } from '../../contexts/LanguageContext';

/* ─── Constants ────────────────────────────────────────── */
const TYPE_OPTIONS: { value: ActivityType | 'all'; labelTH: string; labelEN: string }[] = [
  { value: 'all', labelTH: 'ทั้งหมด', labelEN: 'All' },
  { value: 'deposit', labelTH: 'ฝากเงิน', labelEN: 'Deposit' },
  { value: 'withdraw', labelTH: 'ถอนเงิน', labelEN: 'Withdraw' },
  { value: 'buy', labelTH: 'ซื้อ', labelEN: 'Buy' },
  { value: 'win', labelTH: 'ชนะ', labelEN: 'Win' },
  { value: 'loss', labelTH: 'แพ้', labelEN: 'Loss' },
  { value: 'login', labelTH: 'Login', labelEN: 'Login' },
];

const PAGE_SIZE = 50;

function getTypeInfo(type: ActivityType) {
  switch (type) {
    case 'deposit': return { color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', accent: 'border-l-emerald-500', icon: <ArrowDownCircle size={13} /> };
    case 'withdraw': return { color: 'text-rose-500 bg-rose-500/10 border-rose-500/20', accent: 'border-l-rose-500', icon: <ArrowUpCircle size={13} /> };
    case 'buy': return { color: 'text-blue-500 bg-blue-500/10 border-blue-500/20', accent: 'border-l-blue-500', icon: <TrendingUp size={13} /> };
    case 'sell': return { color: 'text-orange-500 bg-orange-500/10 border-orange-500/20', accent: 'border-l-orange-500', icon: <TrendingDown size={13} /> };
    case 'win': return { color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', accent: 'border-l-emerald-500', icon: <Trophy size={13} /> };
    case 'loss': return { color: 'text-text-muted bg-card-header border-border', accent: 'border-l-border', icon: <XCircle size={13} /> };
    case 'login': return { color: 'text-purple-500 bg-purple-500/10 border-purple-500/20', accent: 'border-l-purple-500', icon: <LogIn size={13} /> };
    default: return { color: 'text-text-muted bg-card-header border-border', accent: 'border-l-border', icon: <Info size={13} /> };
  }
}

function labelType(type: ActivityType, lang: string) {
  return lang === 'th'
    ? TYPE_OPTIONS.find(o => o.value === type)?.labelTH ?? type
    : TYPE_OPTIONS.find(o => o.value === type)?.labelEN ?? type;
}

function fmtDate(iso: string, lang: string) {
  const d = new Date(iso);
  return {
    date: new Intl.DateTimeFormat(lang === 'th' ? 'th-TH' : 'en-US', { day: '2-digit', month: 'short' }).format(d),
    time: new Intl.DateTimeFormat(lang === 'th' ? 'th-TH' : 'en-US', { hour: '2-digit', minute: '2-digit', hour12: false }).format(d),
    compact: new Intl.DateTimeFormat(lang === 'th' ? 'th-TH' : 'en-US', { month: 'numeric', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(d),
  };
}

/* ─── Memoized Row Components ─────────────────────────── */
const CopyableID = ({ label, id }: { label: string; id: string }) => {
  const [copied, setCopied] = useState(false);
  const onCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group/copy flex items-center justify-between bg-card-header/30 border border-border rounded-xl px-3 py-2 transition-all hover:bg-card-header/50">
      <div className="min-w-0">
        <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider block mb-0.5">{label}</span>
        <span className="text-[11px] font-mono text-text-main/80 truncate block max-w-[200px]">{id}</span>
      </div>
      <button onClick={onCopy} className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-all shrink-0">
        {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
      </button>
    </div>
  );
};

const ExpandedDetail = memo(({ item, isth }: { item: ActivityItem; isth: boolean }) => {
  const mainDetails: { label: string; value: React.ReactNode; icon?: React.ReactNode; color?: string }[] = [];
  if (item.asset) mainDetails.push({ label: isth ? 'สินทรัพย์' : 'Asset', value: item.asset, icon: <Hash size={12} />, color: 'text-sky-500' });
  if (item.amount != null) mainDetails.push({ label: isth ? 'มูลค่า' : 'Value', value: `$${Number(item.amount).toLocaleString()}`, icon: <DollarSign size={12} />, color: 'text-emerald-500' });
  if (item.ticketId) mainDetails.push({ label: isth ? 'Order ID' : 'Order ID', value: item.ticketId, icon: <Info size={12} />, color: 'text-primary' });

  return (
    <div className="space-y-5">
      {/* ── Main Highlight Info ── */}
      {mainDetails.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {mainDetails.map((det, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              className="bg-gradient-to-br from-card-header to-card border border-border rounded-2xl p-4 relative overflow-hidden group shadow-lg"
            >
              <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-20 transition-all duration-500 scale-150">{det.icon}</div>
              <span className="text-[10px] text-text-muted uppercase font-black tracking-widest block mb-1.5 opacity-60">{det.label}</span>
              <span className={`text-lg font-black font-mono tracking-tight ${det.color}`}>{det.value}</span>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Metadata & technical details ── */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border"
      >
        {/* Connection & Device */}
        <div className="space-y-3">
          <span className="text-[10px] text-text-muted uppercase font-black tracking-widest px-1 opacity-80">{isth ? 'ข้อมูลการเชื่อมต่อ' : 'Connectivity'}</span>
          <div className="grid grid-cols-1 gap-2.5">
            {item.device && (
              <div className="flex items-center gap-4 bg-card-header/20 border border-border rounded-xl px-4 py-3 group/item hover:bg-card-header/40 transition-all">
                <div className="w-8 h-8 rounded-lg bg-card flex items-center justify-center text-text-muted group-hover/item:text-primary transition-colors">
                  <Monitor size={15} />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] text-text-muted uppercase font-bold block mb-0.5">{isth ? 'อุปกรณ์' : 'Device'}</span>
                  <span className="text-xs text-text-main font-semibold truncate block">{item.device}</span>
                </div>
              </div>
            )}
            {item.ip && (
              <div className="flex items-center gap-4 bg-card-header/20 border border-border rounded-xl px-4 py-3 group/item hover:bg-card-header/40 transition-all">
                <div className="w-8 h-8 rounded-lg bg-card flex items-center justify-center text-text-muted group-hover/item:text-emerald-500 transition-colors">
                  <Wifi size={15} />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] text-text-muted uppercase font-bold block mb-0.5">IP Address</span>
                  <span className="text-xs text-text-muted font-mono block">{item.ip}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* System IDs with Copy feature */}
        <div className="space-y-3">
          <span className="text-[10px] text-text-muted uppercase font-black tracking-widest px-1 opacity-80">{isth ? 'รหัสระบบ' : 'System Identifiers'}</span>
          <div className="grid grid-cols-1 gap-2.5">
            <CopyableID label="System ID" id={item.id} />
            <CopyableID label="User ID" id={item.userId} />
            {item.sessionId && (
              <CopyableID label="Session ID" id={item.sessionId} />
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
});

const DesktopRow = memo(({
  item, language, isExpanded, onToggle,
}: {
  item: ActivityItem;
  language: string;
  isExpanded: boolean;
  onToggle: (id: string) => void;
}) => {
  const info = getTypeInfo(item.type);
  const { date, time } = fmtDate(item.createdAt, language);
  const isth = language === 'th';
  return (
    <React.Fragment>
      <motion.tr
        layout="position"
        onClick={() => onToggle(item.id)}
        className={`cursor-pointer transition-colors duration-300 group ${isExpanded ? 'bg-card-header/40' : 'bg-transparent hover:bg-card-header/20'}`}
      >
        <td className="px-5 py-2.5 align-middle w-[150px]">
          <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase px-2.5 py-1 rounded-full border whitespace-nowrap ${info.color}`}>
            {info.icon}
            {labelType(item.type, language)}
          </span>
        </td>
        <td className="px-4 py-2.5 align-middle">
          <div className="flex flex-col min-w-0">
            <span className="text-text-main text-xs font-semibold group-hover:text-primary transition-colors line-clamp-1">
              {item.description}
            </span>
            {item.ticketId && (
              <span className="text-[9px] font-mono text-text-muted flex items-center gap-1 mt-0.5">
                <Hash size={9} /> {item.ticketId}
              </span>
            )}
          </div>
        </td>
        <td className="px-4 py-2.5 align-middle w-[170px]">
          <p className="text-text-main text-[11px] font-bold truncate">{item.username}</p>
          <p className="text-text-muted text-[10px] font-mono truncate">{item.email}</p>
        </td>
        <td className="px-4 py-2.5 align-middle w-[150px]">
          {item.type === 'login' ? (
            <div className="flex flex-col gap-1">
              <span className="text-text-muted text-[10px] line-clamp-1">{item.device}</span>
              {item.isActive && (
                <span className="inline-flex items-center gap-1 text-[8px] font-black text-emerald-500 uppercase tracking-tighter">
                  <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                  {isth ? 'กำลังออนไลน์' : 'Active Now'}
                </span>
              )}
            </div>
          ) : item.amount != null ? (
            <span className={`text-xs font-black font-mono ${['win', 'deposit'].includes(item.type) ? 'text-emerald-500' : ['withdraw', 'loss'].includes(item.type) ? 'text-rose-500' : 'text-text-main'}`}>
              {['win', 'deposit'].includes(item.type) ? '+' : ['withdraw', 'loss'].includes(item.type) ? '-' : ''}
              ${Number(item.amount).toLocaleString()}
            </span>
          ) : <span className="text-text-muted">—</span>}
        </td>
        <td className="px-4 py-2.5 align-middle w-[110px]">
          <p className="text-text-muted text-[10px] font-mono whitespace-nowrap">{date}</p>
          <p className="text-text-muted/60 text-[10px] tabular-nums">{time}</p>
        </td>
        <td className="pr-4 py-2.5 align-middle text-center w-10 relative">
          <div className="flex items-center gap-2">
            {item.type === 'login' && item.isActive && item.sessionId && (
               <button 
                 onClick={(e) => {
                   e.stopPropagation();
                   if (window.confirm(isth ? 'ต้องการเตะผู้ใช้รายนี้ออกจากระบบใช่หรือไม่?' : 'Kick this user out?')) {
                     activityService.kickSession(item.sessionId!).then(() => {
                       window.location.reload(); 
                     }).catch(err => {
                       alert('Error kicking user: ' + err.message);
                     });
                   }
                 }}
                 className="p-1.5 rounded-lg text-text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                 title={isth ? 'เตะออก' : 'Kick Out'}
               >
                 <LogOut size={13} />
               </button>
            )}
            <ChevronDown size={13} className={`text-text-muted transition-transform duration-200 mx-auto ${isExpanded ? 'rotate-180 text-primary' : ''}`} />
          </div>
        </td>
      </motion.tr>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.tr
            initial={{ opacity: 0, height: 0 }}
            animate={{ 
              opacity: 1, 
              height: 'auto',
              transition: {
                height: { duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] },
                opacity: { duration: 0.25, delay: 0.1 }
              }
            }}
            exit={{ 
              opacity: 0, 
              height: 0,
              transition: {
                height: { duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] },
                opacity: { duration: 0.15 }
              }
            }}
            className="bg-card-header/50 border-b border-primary/10 overflow-hidden"
          >
            <td colSpan={6} className="px-0">
              <div className="px-6 py-7">
                <ExpandedDetail item={item} isth={isth} />
              </div>
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </React.Fragment>
  );
});

const MobileCard = memo(({
  item, language, isExpanded, onToggle,
}: {
  item: ActivityItem;
  language: string;
  isExpanded: boolean;
  onToggle: (id: string) => void;
}) => {
  const info = getTypeInfo(item.type);
  const { compact } = fmtDate(item.createdAt, language);
  const isth = language === 'th';
  return (
    <motion.div
      layout="position"
      onClick={() => onToggle(item.id)}
      className={`border-l-[3px] ${info.accent} rounded-r-xl cursor-pointer transition-all duration-300 ${isExpanded ? 'bg-card-header/60 shadow-xl' : 'bg-card hover:bg-card-header/20'}`}
    >
      <div className="px-3.5 py-3">
        <div className="flex items-center gap-2 mb-2 min-w-0">
          <div className={`p-1.5 rounded-lg border shrink-0 ${info.color}`}>{info.icon}</div>
          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border leading-none shrink-0 whitespace-nowrap ${info.color}`}>
            {labelType(item.type, language)}
          </span>
          <div className="flex-1" />
          <span className="text-text-muted text-[9px] font-mono whitespace-nowrap shrink-0 tabular-nums">{compact}</span>
          <ChevronDown size={12} className={`text-text-muted transition-transform duration-200 shrink-0 ${isExpanded ? 'rotate-180 text-primary' : ''}`} />
        </div>
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex flex-col min-w-0">
            <p className="text-text-main text-[13px] font-semibold leading-snug">{item.description}</p>
            {item.ticketId && (
              <p className="text-[10px] font-mono text-text-muted flex items-center gap-1 mt-0.5">
                <Hash size={10} /> {item.ticketId}
              </p>
            )}
          </div>
          {item.amount != null && (
            <span className={`text-xs font-black font-mono shrink-0 ${['win', 'deposit'].includes(item.type) ? 'text-emerald-500' : ['withdraw', 'loss'].includes(item.type) ? 'text-rose-500' : 'text-text-main'}`}>
              {['win', 'deposit'].includes(item.type) ? '+' : ['withdraw', 'loss'].includes(item.type) ? '-' : ''}${Number(item.amount).toLocaleString()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 min-w-0">
          <User size={9} className="text-text-muted shrink-0" />
          <span className="text-[10px] text-text-muted font-bold truncate">{item.username}</span>
          <span className="text-text-muted/40">·</span>
          <span className="text-[10px] text-text-muted/60 font-mono truncate">{item.email}</span>
        </div>
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ 
                height: "auto", 
                opacity: 1,
                transition: {
                  height: { duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] },
                  opacity: { duration: 0.25, delay: 0.1 }
                }
              }}
              exit={{ 
                height: 0, 
                opacity: 0,
                transition: {
                  height: { duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] },
                  opacity: { duration: 0.15 }
                }
              }}
              className="overflow-hidden mt-3 pt-4 border-t border-border"
            >
              <ExpandedDetail item={item} isth={isth} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});

/* ─── Main Component ───────────────────────────────────── */
export const UserActivityLog: React.FC = () => {
  const { language } = useLanguage();
  const isth = language === 'th';
  const [isPending, startTransition] = useTransition();

  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

  const [startDate, setStartDate] = useState(weekAgo);
  const [endDate, setEndDate] = useState(today);
  const [typeFilter, setTypeFilter] = useState<ActivityType | 'all'>('all');
  const [userIdFilter, setUserIdFilter] = useState('');

  const [codeInput, setCodeInput] = useState('');
  const [codeUser, setCodeUser] = useState<{ id: string; username: string; email: string } | null>(null);
  const [codeStatus, setCodeStatus] = useState<'idle' | 'loading' | 'found' | 'notfound'>('idle');

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  /* ── Code lookup ─────────────────────────────────────── */
  const lookupCode = useCallback(async (): Promise<string | null> => {
    const code = codeInput.trim().toUpperCase();
    if (!code) return null;
    setCodeStatus('loading');
    const { data } = await supabase.from('profiles').select('id, username, email').eq('code', code).single();
    if (data) {
      setCodeUser(data);
      setUserIdFilter(data.id);
      setCodeStatus('found');
      return data.id;
    } else {
      setCodeUser(null);
      setUserIdFilter('');
      setCodeStatus('notfound');
      return null;
    }
  }, [codeInput]);

  const clearCode = useCallback(() => {
    setCodeInput('');
    setCodeUser(null);
    setUserIdFilter('');
    setCodeStatus('idle');
  }, []);

  /* ── Main Search ────────────────────────────── */
  const fetchData = useCallback(async () => {
    let resolvedUserId = userIdFilter;
    if (codeInput.trim() && !codeUser) {
      resolvedUserId = (await lookupCode()) ?? '';
    }
    setLoading(true);
    setSearched(true);
    setPage(1);
    setExpandedId(null);

    const filters: ActivityFilters = {
      startDate,
      endDate,
      type: typeFilter,
      userId: resolvedUserId || undefined,
    };
    const data = await activityService.fetchActivities(filters);
    setActivities(data);
    setLoading(false);
  }, [startDate, endDate, typeFilter, userIdFilter, codeInput, codeUser, lookupCode]);

  const clearAll = useCallback(() => {
    setStartDate(weekAgo);
    setEndDate(today);
    setTypeFilter('all');
    clearCode();
    setActivities([]);
    setSearched(false);
    setPage(1);
  }, [clearCode, today, weekAgo]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  }, []);

  const totalPages = Math.max(1, Math.ceil(activities.length / PAGE_SIZE));
  const paginated = useMemo(
    () => activities.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [activities, page]
  );
  const filtered = activities;

  const handleTypeFilter = useCallback((val: ActivityType | 'all') => {
    startTransition(() => setTypeFilter(val));
  }, []);

  const th = isth
    ? ['ประเภท', 'รายละเอียด', 'ผู้ใช้งาน', 'เพิ่มเติม', 'เวลา', '']
    : ['Type', 'Description', 'User', 'Detail', 'Time', ''];

  useEffect(() => {
    if (searched) {
      window.scrollTo({
        top: 150,
        behavior: 'smooth'
      });
    }
  }, [page, searched]);

  return (
    <div className="space-y-5">
      {/* ── Filter Card ─────────────────────────────────── */}
      <div className="bg-card backdrop-blur rounded-2xl border border-border p-4 md:p-5 space-y-4 shadow-xl">
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-primary" />
          <h2 className="text-text-main text-sm font-bold">{isth ? 'กรองข้อมูล' : 'Filter Activity'}</h2>
        </div>

        {/* Date range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5 min-w-0">
            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-1.5">
              <Calendar size={10} /> {isth ? 'วันเริ่มต้น' : 'Start Date'}
            </label>
            <input type="date" value={startDate} max={endDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full bg-transparent border border-border rounded-xl px-3 py-2 text-text-main text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 overflow-hidden" />
          </div>
          <div className="space-y-1.5 min-w-0">
            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-1.5">
              <Calendar size={10} /> {isth ? 'วันสิ้นสุด' : 'End Date'}
            </label>
            <input type="date" value={endDate} min={startDate} max={today}
              onChange={e => setEndDate(e.target.value)}
              className="w-full bg-transparent border border-border rounded-xl px-3 py-2 text-text-main text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 overflow-hidden" />
          </div>
        </div>

        {/* Code search — input + paste button */}
        <div className="space-y-1.5 min-w-0">
          <label className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-1.5">
            <Hash size={10} /> {isth ? 'ค้นหาด้วยรหัสลูกค้า' : 'Search by Code'}
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                value={codeInput}
                onChange={e => { setCodeInput(e.target.value.toUpperCase()); setCodeStatus('idle'); if (!e.target.value) clearCode(); }}
                placeholder={isth ? 'เช่น ABC123...' : 'e.g. ABC123...'}
                maxLength={8}
                className="w-full bg-transparent border border-border rounded-xl px-3 py-2 text-text-main text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/40 uppercase"
              />
              {codeUser && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  <span className="text-[9px] text-emerald-500 font-bold truncate max-w-[100px]">{codeUser.username}</span>
                  <button onClick={clearCode} className="text-text-muted hover:text-rose-500 transition-colors shrink-0"><X size={12} /></button>
                </div>
              )}
            </div>
            <button
              onClick={async () => {
                try {
                  const text = await navigator.clipboard.readText();
                  const code = text.trim().toUpperCase().slice(0, 8);
                  setCodeInput(code);
                  setCodeStatus('idle');
                  setCodeUser(null);
                  setUserIdFilter('');
                } catch { /* clipboard denied */ }
              }}
              title={isth ? 'วาง' : 'Paste'}
              className="px-3 py-2 bg-card-header hover:bg-card-header/80 text-text-muted hover:text-text-main rounded-xl text-[10px] font-bold transition-colors shrink-0 border border-border shadow-sm"
            >
              {isth ? 'วาง' : 'Paste'}
            </button>
          </div>
          {codeStatus === 'found' && codeUser && (
            <p className="text-[10px] text-emerald-500 flex items-center gap-1.5">
              <User size={10} /> {codeUser.username} · {codeUser.email}
            </p>
          )}
          {codeStatus === 'notfound' && (
            <p className="text-[10px] text-rose-500">{isth ? 'ไม่พบรหัสนี้' : 'Code not found'}</p>
          )}
        </div>

        {/* Type chips */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">{isth ? 'ประเภท' : 'Type'}</label>
          <div className="flex flex-wrap gap-2">
            {TYPE_OPTIONS.map(opt => (
              <button key={opt.value} onClick={() => handleTypeFilter(opt.value)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all duration-100 ${typeFilter === opt.value
                  ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                  : 'bg-card-header text-text-muted border-border hover:text-text-main hover:bg-card-header/80'
                  }`}>
                {isth ? opt.labelTH : opt.labelEN}
              </button>
            ))}
          </div>
        </div>

        {/* Search / Clear */}
        <div className="flex flex-wrap gap-3">
          <button onClick={fetchData} disabled={loading}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-colors active:scale-95 shadow-lg shadow-primary/20">
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
            {isth ? 'ค้นหา' : 'Search'}
          </button>
          {searched && (
            <button onClick={clearAll}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-card-header hover:bg-card-header/80 text-text-muted hover:text-text-main rounded-xl text-xs font-bold transition-colors border border-border shadow-sm">
              <X size={13} /> {isth ? 'ล้าง' : 'Clear'}
            </button>
          )}
        </div>
      </div>

      {/* ── Loading ─────────────────────────────────────── */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
          <p className="text-text-muted text-xs font-bold uppercase tracking-widest animate-pulse">
            {isth ? 'กำลังโหลด...' : 'Loading...'}
          </p>
        </div>
      )}

      {/* ── Results ─────────────────────────────────────── */}
      {!loading && searched && (
        <>
          <div className="flex items-center gap-2 flex-wrap px-1">
            <span className="text-text-main text-sm font-bold">
              {isth ? 'พบ' : 'Found'} <span className="text-primary">{activities.length.toLocaleString()}</span> {isth ? 'รายการ' : 'records'}
            </span>
            {isPending && <RefreshCw size={12} className="text-text-muted animate-spin" />}
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-card rounded-3xl border-2 border-border border-dashed shadow-inner">
              <div className="w-16 h-16 bg-card-header rounded-2xl flex items-center justify-center mb-4 border border-border">
                <Info className="text-text-muted" size={32} />
              </div>
              <p className="text-text-muted text-sm font-medium">{isth ? 'ไม่พบรายการ' : 'No activity found'}</p>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE */}
              <div className="hidden md:block rounded-2xl overflow-hidden border border-border shadow-2xl bg-card">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-card-header/50 border-b border-border">
                      {th.map((h, i) => (
                        <th key={i} className="text-left px-5 py-3 text-[10px] font-black text-text-muted uppercase tracking-widest last:w-10">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paginated.map(item => (
                      <DesktopRow
                        key={item.id}
                        item={item}
                        language={language}
                        isExpanded={expandedId === item.id}
                        onToggle={toggleExpand}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARDS */}
              <div className="md:hidden space-y-2">
                {paginated.map(item => (
                  <MobileCard
                    key={item.id}
                    item={item}
                    language={language}
                    isExpanded={expandedId === item.id}
                    onToggle={toggleExpand}
                  />
                ))}
              </div>

              {/* Pagination: Prev / Next */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    disabled={page === 1}
                    onClick={() => startTransition(() => {
                      setPage(p => p - 1);
                      setExpandedId(null);
                    })}
                    className="px-4 py-2 bg-card border border-border hover:bg-card-header disabled:opacity-30 disabled:cursor-not-allowed text-text-muted hover:text-text-main rounded-xl text-xs font-bold transition-all shadow-sm">
                    {isth ? '← ก่อนหน้า' : '← Prev'}
                  </button>
                  <span className="text-text-muted text-xs font-mono">
                    {isth ? `หน้า ${page} / ${totalPages}` : `Page ${page} / ${totalPages}`}
                  </span>
                  <button
                    disabled={page === totalPages}
                    onClick={() => startTransition(() => {
                      setPage(p => p + 1);
                      setExpandedId(null);
                    })}
                    className="px-4 py-2 bg-card border border-border hover:bg-card-header disabled:opacity-30 disabled:cursor-not-allowed text-text-muted hover:text-text-main rounded-xl text-xs font-bold transition-all shadow-sm">
                    {isth ? 'ถัดไป →' : 'Next →'}
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ── Placeholder ─────────────────────────────────── */}
      {!loading && !searched && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-20 h-20 bg-card rounded-3xl flex items-center justify-center border border-border shadow-xl">
            <DollarSign size={36} className="text-text-muted/40" />
          </div>
          <p className="text-text-muted text-sm font-medium">
            {isth ? 'เลือกวันที่แล้วกด "ค้นหา"' : 'Select date range and press Search'}
          </p>
        </div>
      )}
    </div>
  );
};
