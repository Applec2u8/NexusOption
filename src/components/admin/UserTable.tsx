import React, { useState } from "react";
import { Loader2, Copy, Edit2, Eye, EyeOff, ShieldCheck, Wallet, Settings2 } from "lucide-react";
import type { Profile } from "../../types";
import { decryptPassword } from "../../utils/security";
import { useLanguage } from "../../contexts/LanguageContext";

interface UserTableProps {
  profiles: Profile[];
  loading: boolean;
  onEdit: (profile: Profile) => void;
  onToggleRole: (profile: Profile) => void;
  onVerify?: (profile: Profile) => void;
  onEditWallet?: (profile: Profile) => void;
  onEditControl?: (profile: Profile) => void;
  onDelete?: (profile: Profile) => void;
  onResetStats?: (profile: Profile) => void;
  emptyMessage: string;
}

const PasswordCell: React.FC<{ password?: string }> = ({ password }) => {
  const [show, setShow] = useState(false);
  if (!password) return <span className="text-text-muted">---</span>;

  return (
    <div 
      className="flex items-center gap-2 group/pass cursor-pointer"
      onClick={() => setShow(!show)}
    >
      <div className="text-xs opacity-50 font-mono truncate max-w-[120px] transition-colors group-hover/pass:opacity-100 group-hover/pass:text-text-main">
        {show ? decryptPassword(password) : "••••••••"}
      </div>
      <div className="p-1 hover:bg-card-header rounded-lg text-text-muted hover:text-text-main transition-all opacity-0 group-hover/pass:opacity-100 shrink-0">
        {show ? <EyeOff size={14} /> : <Eye size={14} />}
      </div>
    </div>
  );
};

export const UserTable: React.FC<UserTableProps> = ({
  profiles,
  loading,
  onEdit,
  onToggleRole,
  onVerify,
  onEditWallet,
  onEditControl,
  emptyMessage,
}) => {
  const { t } = useLanguage();
  return (
    <div className="glass-card overflow-hidden p-0 border-border">
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-border text-[9px] font-bold text-text-muted uppercase tracking-widest">
            <th className="sticky left-0 z-20 px-3 py-3 bg-card border-r border-border shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)] max-w-[100px]">{t("users")}</th>
            <th className="px-4 py-3">{t("codeLabel") || t("code")}</th>
            <th className="px-4 py-3">{t("email") + " & " + t("password")}</th>
            <th className="px-4 py-3 text-right">{t("balance")}</th>
            <th className="px-4 py-3">{t("type")}</th>
            <th className="px-4 py-3 text-right">{t("manage")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {loading ? (
            <tr>
              <td
                colSpan={6}
                className="px-6 py-12 text-center text-text-muted text-sm"
              >
                <Loader2 className="animate-spin inline-block mr-2" />
                {t("loading") || "Loading..."}
              </td>
            </tr>
          ) : profiles.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                className="px-6 py-12 text-center text-text-muted text-sm"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            profiles.map((profile) => (
              <tr
                key={profile.id}
                className="group hover:bg-card-header/30 transition-colors"
              >
                <td className="sticky left-0 z-10 px-3 py-2 whitespace-nowrap bg-card group-hover:bg-card-header/50 transition-colors border-r border-border shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)] max-w-[130px]">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center font-bold text-white text-[9px] shrink-0">
                      {profile.first_name?.[0]}
                      {profile.last_name?.[0]}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-text-main truncate">
                        {profile.first_name} {profile.last_name}
                      </div>
                      <div className="text-[9px] text-text-muted truncate">
                        @{profile.username}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2.5 font-mono text-primary font-bold whitespace-nowrap text-xs">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(profile.code || "");
                      const btn = document.getElementById(
                        `copy-btn-${profile.id}`,
                      );
                      if (btn) {
                        btn.classList.add("text-green-500");
                        setTimeout(
                          () => btn.classList.remove("text-primary"),
                          2000,
                        );
                      }
                    }}
                    id={`copy-btn-${profile.id}`}
                    className="flex items-center gap-2 hover:text-text-main transition-all active:scale-95 group"
                    title="Copy to clipboard"
                  >
                    {profile.code}
                    <Copy
                      size={12}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </button>
                </td>
                <td className="px-4 py-2.5 text-text-muted text-[11px] min-w-[200px]">
                  <div className="truncate max-w-[180px] mb-0.5">{profile.email}</div>
                  <PasswordCell password={profile.password} />
                </td>
                <td className="px-4 py-2.5 text-right text-text-main font-bold font-mono whitespace-nowrap text-xs">
                  $
                  {profile.balance.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap">
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => onToggleRole(profile)}
                      className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase transition-all active:scale-95 ${profile.is_admin ? "bg-primary/10 text-primary hover:bg-primary/20" : "bg-card-header text-text-muted hover:bg-card-header/80 border border-border"}`}
                    >
                      {profile.is_admin ? t("adminLabel") : t("userLabel")}
                    </button>
                    {profile.trade_control && profile.trade_control !== 'normal' && (
                      <span className={`text-[7px] font-black uppercase px-1 rounded-sm w-fit border ${
                        profile.trade_control === 'always_win' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                        profile.trade_control === 'always_loss' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                        'bg-orange-500/10 text-orange-500 border-orange-500/20'
                      }`}>
                        {profile.trade_control.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2.5 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1">
                    {!profile.is_verified && onVerify && (
                      <button
                        onClick={() => onVerify(profile)}
                        className="p-1.5 text-orange-500 hover:text-orange-400 hover:bg-orange-500/10 rounded-lg transition-all"
                        title={t("verifyUser")}
                      >
                        <ShieldCheck size={14} />
                      </button>
                    )}
                    {onEditControl && (
                      <button
                        onClick={() => onEditControl(profile)}
                        className="p-1.5 text-indigo-400 hover:text-indigo-600 dark:hover:text-white hover:bg-indigo-500/10 rounded-lg transition-all"
                        title={t("tradeControl") || "Trade Control"}
                      >
                        <Settings2 size={14} />
                      </button>
                    )}
                    {onEditWallet && (
                      <button
                        onClick={() => onEditWallet(profile)}
                        className="p-1.5 text-emerald-400 hover:text-emerald-600 dark:hover:text-white hover:bg-emerald-500/10 rounded-lg transition-all"
                        title={t("walletBalanceEdit") || "Wallet"}
                      >
                        <Wallet size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => onEdit(profile)}
                      className="p-1.5 text-text-muted hover:text-text-main hover:bg-card-header rounded-lg transition-all"
                      title={t("editUserTitle") || "Edit"}
                    >
                      <Edit2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
);
};
