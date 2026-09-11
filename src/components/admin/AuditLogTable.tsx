import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  User,
  Info,
  ChevronDown,
  Wallet,
  UserCog,
  Key,
  UserPlus,
  Settings as SettingsIcon,
  Shield,
  ArrowRight,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface AuditLog {
  id: string;
  admin_email: string;
  target_user_email?: string;
  action_type: string;
  description: string;
  details?: any;
  created_at: string;
}

interface AuditLogTableProps {
  logs: AuditLog[];
  loading: boolean;
}

export const AuditLogTable: React.FC<AuditLogTableProps> = ({ logs, loading }) => {
  const { language, t } = useLanguage();
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const getLogInfo = (type: string) => {
    switch (type) {
      case 'TOP_UP':          
      case 'WALLET_DEPOSIT':    return { color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', accent: 'border-l-emerald-500', icon: <Wallet size={13} />,       label: t('logTopUp') };
      case 'WALLET_WITHDRAW':   return { color: 'text-rose-500 bg-rose-500/10 border-rose-500/20',          accent: 'border-l-rose-500',    icon: <Wallet size={13} />,       label: t('logWalletWithdraw') };
      case 'TRADE_CONTROL_UPDATE': return { color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',    accent: 'border-l-indigo-500', icon: <SettingsIcon size={13} />, label: t('tradeControl') };
      case 'EDIT_PROFILE':    return { color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',          accent: 'border-l-blue-500',    icon: <UserCog size={13} />,      label: t('logEditProfile') };
      case 'TOGGLE_ROLE':     return { color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',       accent: 'border-l-amber-500',   icon: <Key size={13} />,          label: t('logToggleRole') };
      case 'CREATE_USER':     return { color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',    accent: 'border-l-purple-500',  icon: <UserPlus size={13} />,     label: t('logCreateUser') };
      case 'UPDATE_SETTINGS': return { color: 'text-pink-500 bg-pink-500/10 border-pink-500/20',          accent: 'border-l-pink-500',    icon: <SettingsIcon size={13} />, label: t('logUpdateSettings') };
      default:                return { color: 'text-text-muted bg-card-header border-border',       accent: 'border-l-border',   icon: <Shield size={13} />,       label: t('adminAction') };
    }
  };

  const formatDateCompact = (iso: string) =>
    new Intl.DateTimeFormat(language === 'th' ? 'th-TH' : 'en-US', {
      month: 'numeric', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
    }).format(new Date(iso));

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat(language === 'th' ? 'th-TH' : 'en-US', {
      hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short',
    }).format(new Date(iso));

  const renderDetails = (log: AuditLog) => {
    if (!log.details) return null;
    if (log.action_type === 'TOP_UP' || log.action_type === 'WALLET_DEPOSIT') {
      return (
        <div className="flex items-center justify-between bg-emerald-500/5 px-4 py-3 rounded-xl border border-emerald-500/10 max-w-sm">
          <span className="text-text-muted text-[10px] font-bold uppercase tracking-wider">{t('topUpAmount')}</span>
          <span className="text-emerald-500 font-black font-mono text-lg ml-6">
            +${Number(log.details.amount).toLocaleString()}
          </span>
        </div>
      );
    }
    if (log.action_type === 'WALLET_WITHDRAW') {
      return (
        <div className="flex items-center justify-between bg-rose-500/5 px-4 py-3 rounded-xl border border-rose-500/10 max-w-sm">
          <span className="text-text-muted text-[10px] font-bold uppercase tracking-wider">{t('amount')}</span>
          <span className="text-rose-500 font-black font-mono text-lg ml-6">
            -${Number(log.details.amount).toLocaleString()}
          </span>
        </div>
      );
    }
    if (log.action_type === 'EDIT_PROFILE' && log.details.updated_fields) {
      const fields = log.details.updated_fields;
      return (
        <div className="space-y-2">
          <span className="text-text-muted text-[10px] font-bold uppercase tracking-wider block">{t('updatedFields')}</span>
          <div className="flex flex-wrap gap-2">
            {Object.keys(fields).map(f => (
              <div key={f} className="flex flex-col px-3 py-2 bg-card-header rounded-lg border border-border min-w-[100px]">
                <span className="text-[9px] text-text-muted uppercase font-bold mb-0.5">{f}</span>
                <span className="text-xs text-blue-500 font-semibold truncate max-w-[160px]">{String(fields[f])}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    if (log.action_type === 'TOGGLE_ROLE') {
      return (
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-amber-500/5 rounded-xl border border-amber-500/10">
            <span className="text-[9px] text-text-muted uppercase font-bold block mb-0.5">{t('newRole')}</span>
            <span className="text-sm text-amber-500 font-bold">{log.details.new_role}</span>
          </div>
        </div>
      );
    }
    return (
      <div className="bg-transparent px-4 py-3 rounded-xl border border-border max-w-lg">
        <pre className="text-[10px] text-text-muted font-mono overflow-x-auto">
          {JSON.stringify(log.details, null, 2)}
        </pre>
      </div>
    );
  };

  /* ─── Loading ─── */
  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
      </div>
      <p className="text-text-muted text-xs font-bold uppercase tracking-widest animate-pulse">{t('loading')}</p>
    </div>
  );

  /* ─── Empty ─── */
  if (logs.length === 0) return (
    <div className="flex flex-col items-center justify-center py-20 bg-card rounded-3xl border-2 border-border border-dashed shadow-inner">
      <div className="w-16 h-16 bg-card-header rounded-2xl flex items-center justify-center mb-4 border border-border">
        <Info className="text-text-muted" size={32} />
      </div>
      <p className="text-text-muted text-sm font-medium">{t('noRecordsFound')}</p>
    </div>
  );

  return (
    <>
      {/* ═══════════════════════════════
          DESKTOP TABLE  (md and above)
      ═══════════════════════════════ */}
      <div className="hidden md:block rounded-2xl overflow-hidden border border-border shadow-2xl bg-card">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-card-header/50 border-b border-border">
              <th className="text-left px-5 py-3.5 text-[10px] font-black text-text-muted uppercase tracking-widest w-[180px]">
                {t('type')}
              </th>
              <th className="text-left px-4 py-3.5 text-[10px] font-black text-text-muted uppercase tracking-widest">
                {t('description')}
              </th>
              <th className="text-left px-4 py-3.5 text-[10px] font-black text-text-muted uppercase tracking-widest w-[190px]">
                {t('administrator')}
              </th>
              <th className="text-left px-4 py-3.5 text-[10px] font-black text-text-muted uppercase tracking-widest w-[190px]">
                {t('target')}
              </th>
              <th className="text-left px-4 py-3.5 text-[10px] font-black text-text-muted uppercase tracking-widest w-[120px]">
                {t('time')}
              </th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {logs.map((log, index) => {
              const info = getLogInfo(log.action_type);
              const isExpanded = expandedId === log.id;
              return (
                <React.Fragment key={log.id}>
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.012 }}
                    onClick={() => setExpandedId(isExpanded ? null : log.id)}
                    className={`cursor-pointer transition-all duration-150 group ${
                      isExpanded ? 'bg-card-header/40' : 'bg-transparent hover:bg-card-header/20'
                    }`}
                  >
                    <td className="px-5 py-3 align-middle">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase px-2.5 py-1 rounded-full border whitespace-nowrap ${info.color}`}>
                          {info.icon}
                          {info.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <span className="text-text-main text-xs font-semibold group-hover:text-primary transition-colors line-clamp-1">
                        {log.description}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <div className="flex items-center gap-2 min-w-0">
                        <User size={11} className="text-text-muted shrink-0" />
                        <span className="text-text-muted text-[11px] font-mono truncate">{log.admin_email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      {log.target_user_email
                        ? <div className="flex items-center gap-1.5 min-w-0">
                            <ArrowRight size={10} className="text-primary/30 shrink-0" />
                            <span className="text-primary/70 text-[11px] font-mono truncate">{log.target_user_email}</span>
                          </div>
                        : <span className="text-text-muted/40 text-xs select-none">—</span>
                      }
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <div className="flex items-center gap-1.5 text-text-muted text-[10px] whitespace-nowrap">
                        <Clock size={10} className="shrink-0" />
                        {formatDate(log.created_at)}
                      </div>
                    </td>
                    <td className="pr-4 py-3 align-middle text-center">
                      <ChevronDown
                        size={14}
                        className={`text-text-muted transition-transform duration-300 mx-auto ${isExpanded ? 'rotate-180 text-primary' : ''}`}
                      />
                    </td>
                  </motion.tr>
                  {isExpanded && (
                    <tr className="bg-card-header/30 border-b border-primary/10">
                      <td colSpan={6} className="px-6 py-4">
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          {renderDetails(log)}
                        </motion.div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ═══════════════════════════════
          MOBILE CARDS  (below md)
          Clean left-border accent style
      ═══════════════════════════════ */}
      <div className="md:hidden space-y-2">
        {logs.map((log, index) => {
          const info = getLogInfo(log.action_type);
          const isExpanded = expandedId === log.id;
          return (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.018 }}
              onClick={() => setExpandedId(isExpanded ? null : log.id)}
              className={`border-l-[3px] ${info.accent} rounded-r-xl cursor-pointer transition-all duration-200
                ${isExpanded
                  ? 'bg-card-header/60 shadow-xl'
                  : 'bg-card hover:bg-card-header/30'}`}
            >
              <div className="px-3.5 py-3">
                {/* Row 1: icon + badge + spacer + time + chevron — single line */}
                <div className="flex items-center gap-2 mb-2 min-w-0">
                  <div className={`p-1.5 rounded-lg border shrink-0 ${info.color}`}>
                    {info.icon}
                  </div>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border leading-none shrink-0 whitespace-nowrap ${info.color}`}>
                    {info.label}
                  </span>
                  <div className="flex-1" />
                  <span className="text-text-muted text-[9px] font-mono whitespace-nowrap shrink-0 tabular-nums">
                    {formatDateCompact(log.created_at)}
                  </span>
                  <ChevronDown
                    size={12}
                    className={`text-text-muted transition-transform duration-300 shrink-0 ${isExpanded ? 'rotate-180 text-primary' : ''}`}
                  />
                </div>

                {/* Row 2: Description */}
                <p className="text-text-main text-[13px] font-semibold leading-snug mb-2">
                  {log.description}
                </p>

                {/* Row 3: Emails — simple vertical list */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <User size={9} className="text-text-muted shrink-0" />
                    <span className="text-[10px] text-text-muted font-mono truncate">{log.admin_email}</span>
                  </div>
                  {log.target_user_email && (
                    <div className="flex items-center gap-1.5 min-w-0">
                      <ArrowRight size={9} className="text-primary/40 shrink-0" />
                      <span className="text-[10px] text-primary/60 font-mono truncate">{log.target_user_email}</span>
                    </div>
                  )}
                </div>

                {/* Row 4: Expanded detail */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden mt-3 pt-3 border-t border-border"
                    >
                      {renderDetails(log)}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>
    </>
  );
};
