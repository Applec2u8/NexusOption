import React, { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, 
  Shield, 
  Search, 
  UserPlus, 
  Loader2, 
  Activity, 
  ArrowUp, 
  ArrowDown, 
  Save, 
  X, 
  Edit2 
} from "lucide-react";
import { UserTable } from "../UserTable";
import { CreateUserModal } from "../CreateUserModal";
import { TopUpModal } from "../TopUpModal";
import { emailService } from "../../../services/emailService";
import { encryptPassword, decryptPassword, isHashed } from "../../../utils/security";
import type { Profile } from "../../../types";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useAuth } from "../../../contexts/AuthContext";
import { useWallet } from "../../../contexts/WalletContext";

interface UsersTabProps {
  fadeProps: any;
  logAdminAction: (actionType: string, description: string, extra: object, targetProfile?: Profile) => Promise<void>;
}

export const UsersTab: React.FC<UsersTabProps> = ({ fadeProps, logAdminAction }) => {
  const { t, language } = useLanguage();
  const { refreshProfile, user } = useAuth();
  const { refreshWallet } = useWallet();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [editingWalletProfile, setEditingWalletProfile] = useState<Profile | null>(null);
  const [editingControlProfile, setEditingControlProfile] = useState<Profile | null>(null);
  const [walletAmount, setWalletAmount] = useState<string>("");
  const [walletReason, setWalletReason] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setEditingProfile(null);
        setEditingWalletProfile(null);
        setEditingControlProfile(null);
        setWalletAmount("");
        setWalletReason("");
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("updated_at", { ascending: false });
    if (!error && data) setProfiles(data as Profile[]);
    setLoading(false);
  };

  const handleUpdateWallet = async (type: 'deposit' | 'withdraw') => {
    if (!editingWalletProfile) return;
    const amount = parseFloat(walletAmount);
    if (isNaN(amount) || amount <= 0) return;

    if (type === 'withdraw' && amount > editingWalletProfile.balance) {
      alert(language === 'th' 
        ? "ยอดถอน/หักเงิน ต้องไม่เกินยอดเงินคงเหลือปัจจุบัน" 
        : "Withdraw amount cannot exceed the current balance.");
      return;
    }

    if (!window.confirm(t("confirmWalletAdjustment"))) return;

    setIsSaving(true);
    const newBalance = type === 'deposit' 
      ? editingWalletProfile.balance + amount 
      : editingWalletProfile.balance - amount;

    const { error: balanceError } = await supabase
      .from("profiles")
      .update({ balance: newBalance })
      .eq("id", editingWalletProfile.id);

    if (balanceError) {
      console.error("Failed to update wallet balance:", balanceError);
    } else {
      await supabase.from("transactions").insert({
        user_id: editingWalletProfile.id,
        type: type,
        asset_symbol: 'USD',
        amount: amount,
        price: 1,
        total: amount,
        status: 'success',
        description: walletReason || (type === 'deposit' ? t("depositAction") : t("withdrawAction"))
      });

      if (type === 'deposit') {
        emailService.sendDepositNotification({
          email: editingWalletProfile.email,
          userName: `${editingWalletProfile.first_name} ${editingWalletProfile.last_name}`,
          amount: amount,
          lang: language as any,
        });
      } else {
        emailService.sendWithdrawNotification({
          email: editingWalletProfile.email,
          userName: `${editingWalletProfile.first_name} ${editingWalletProfile.last_name}`,
          amount: amount,
          lang: language as any,
        });
      }

      await logAdminAction(
        type === 'deposit' ? "WALLET_DEPOSIT" : "WALLET_WITHDRAW",
        type === 'deposit' ? `Refilled balance for user ${editingWalletProfile.username}` : `Withdrew balance from user ${editingWalletProfile.username}`,
        { amount, reason: walletReason || 'None', oldBalance: editingWalletProfile.balance, newBalance },
        editingWalletProfile
      );

      alert(type === 'deposit' ? t("topUpSuccess") : t("withdrawSuccess"));
      if (editingWalletProfile.id === user?.id) {
        await refreshProfile();
        await refreshWallet();
      }
      fetchProfiles();
      setEditingWalletProfile(null);
      setWalletAmount("");
      setWalletReason("");
    }
    setIsSaving(false);
  };

  const handleUpdateControl = async () => {
    if (!editingControlProfile) return;
    setIsSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ trade_control: editingControlProfile.trade_control })
      .eq("id", editingControlProfile.id);

    if (!error) {
      await logAdminAction("TRADE_CONTROL_UPDATE", `Updated trade control for ${editingControlProfile.username}`, { trade_control: editingControlProfile.trade_control }, editingControlProfile);
      fetchProfiles();
      setEditingControlProfile(null);
    }
    setIsSaving(false);
  };

  const handleUpdateProfile = async (profile: Profile) => {
    setIsSaving(true);
    const updateData: any = {
      first_name: profile.first_name,
      last_name: profile.last_name,
      email: profile.email,
      phone_number: profile.phone_number,
      balance: profile.balance,
      trade_control: profile.trade_control,
    };
    if (profile.password) {
      updateData.password = (!isHashed(profile.password) && !profile.password.startsWith("enc:"))
        ? encryptPassword(profile.password)
        : profile.password;
    }
    const { error } = await supabase.from("profiles").update(updateData).eq("id", profile.id);
    if (!error) {
      setProfiles((prev) => prev.map((p) => (p.id === profile.id ? profile : p)));
      await logAdminAction("EDIT_PROFILE", `Updated profile for user ${profile.username}`, { updated_fields: updateData }, profile);
      setEditingProfile(null);
    }
    setIsSaving(false);
  };

  const handleToggleRole = async (profile: Profile) => {
    const newRole = !profile.is_admin ? t("adminLabel") : t("userLabel");
    if (!window.confirm(language === "th" ? `ยืนยันเปลี่ยนบทบาทของ ${profile.username} เป็น ${newRole}?` : `Confirm role change for ${profile.username} to ${newRole}?`)) return;

    const { error } = await supabase.from("profiles").update({ is_admin: !profile.is_admin }).eq("id", profile.id);
    if (!error) {
      setProfiles((prev) => prev.map((p) => (p.id === profile.id ? { ...p, is_admin: !p.is_admin } : p)));
      await logAdminAction("TOGGLE_ROLE", `Changed role for user ${profile.username} to ${newRole}`, { new_role: newRole, is_admin: !profile.is_admin }, profile);
    }
  };

  const handleVerifyUser = async (profile: Profile) => {
    if (!window.confirm(t("confirmManualVerify"))) return;
    const { error } = await supabase.from("profiles").update({ is_verified: true, otp_code: null }).eq("id", profile.id);
    if (!error) {
      setProfiles((prev) => prev.map((p) => (p.id === profile.id ? { ...p, is_verified: true } : p)));
      await logAdminAction("MANUAL_VERIFY", `Manually verified user ${profile.username}`, {}, profile);
      alert(t("success"));
    }
  };

  const handleDeleteUser = async (profile: Profile) => {
    if (!window.confirm(language === "th" ? `คำเตือน: คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้ ${profile.username}? การกระทำนี้ไม่สามารถย้อนกลับได้!` : `WARNING: Are you sure you want to delete user ${profile.username}? This action CANNOT be undone!`)) return;

    const { error } = await supabase.from("profiles").delete().eq("id", profile.id);
    if (!error) {
      setProfiles((prev) => prev.filter((p) => p.id !== profile.id));
      await logAdminAction("DELETE_USER", `Deleted user account ${profile.username}`, { deleted_profile: profile }, profile);
      alert(t("success"));
    } else {
      alert("Error deleting user: " + error.message);
    }
  };

  const handleResetStats = async (profile: Profile) => {
    if (!window.confirm(language === 'th' ? `ยืนยันล้างประวัติการเทรดของ ${profile.username}?` : `Reset trading history for ${profile.username}?`)) return;
    const { error } = await supabase.from("trades").delete().eq("user_id", profile.id);
    if (!error) {
      await logAdminAction("RESET_USER_STATS", `Reset trading stats/history for ${profile.username}`, {}, profile);
      alert(t("success"));
    }
  };

  const filteredProfiles = profiles.filter((p) => {
    const search = searchQuery.toLowerCase();
    return (
      p.username.toLowerCase().includes(search) ||
      p.email.toLowerCase().includes(search) ||
      p.first_name?.toLowerCase().includes(search) ||
      p.last_name?.toLowerCase().includes(search)
    );
  });

  return (
    <motion.div key="users" {...fadeProps} className="space-y-10">
      {/* Search & Actions */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        <div className="relative flex-1 max-w-lg group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={18} />
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent backdrop-blur-md border border-border rounded-2xl py-3.5 pl-12 pr-4 text-text-main focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all text-sm"
          />
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowTopUpModal(true)} className="flex-1 md:flex-none px-6 py-3.5 rounded-2xl bg-card border border-border text-text-main text-xs font-black uppercase tracking-widest hover:bg-card-header transition-all active:scale-95 flex items-center justify-center gap-2">
            <ArrowUp size={16} className="text-green-500" /> {t("topUp")}
          </button>
          <button onClick={() => setShowCreateModal(true)} className="flex-1 md:flex-none px-6 py-3.5 rounded-2xl bg-primary text-white text-xs font-black uppercase tracking-widest hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2">
            <UserPlus size={18} /> {t("createUser")}
          </button>
        </div>
      </div>

      {/* Tables Section */}
      <div className="space-y-12">
        {/* ADMINS */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Shield size={18} className="text-primary" />
            <h2 className="text-lg font-bold text-text-main tracking-tight">{t("adminAccounts")}</h2>
            <span className="ml-2 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-black uppercase">
              {profiles.filter((p) => p.is_admin).length}
            </span>
          </div>
          <UserTable
            profiles={filteredProfiles.filter((p) => p.is_admin)}
            loading={loading}
            onEdit={(p) => setEditingProfile({ ...p, password: decryptPassword(p.password || "") })}
            onEditWallet={setEditingWalletProfile}
            onEditControl={setEditingControlProfile}
            onToggleRole={handleToggleRole}
            emptyMessage={t("noAdminFound")}
          />
        </div>

        {/* REGULAR USERS */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <TrendingUp size={18} className="text-accent" />
            <h2 className="text-lg font-bold text-text-main tracking-tight">{t("regularAccounts")}</h2>
            <span className="ml-2 px-2 py-0.5 rounded-md bg-card-header text-text-muted text-[10px] font-black uppercase border border-border">
              {profiles.filter((p) => !p.is_admin && p.is_verified).length}
            </span>
          </div>
          <UserTable
            profiles={filteredProfiles.filter((p) => !p.is_admin && p.is_verified)}
            loading={loading}
            onEdit={(p) => setEditingProfile({ ...p, password: decryptPassword(p.password || "") })}
            onEditWallet={setEditingWalletProfile}
            onEditControl={setEditingControlProfile}
            onToggleRole={handleToggleRole}
            emptyMessage={t("noUserFound")}
          />
        </div>

        {/* UNVERIFIED */}
        {profiles.some(p => !p.is_verified && !p.is_admin) && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Activity size={18} className="text-orange-500" />
              <h2 className="text-lg font-bold text-text-main tracking-tight">{t("pendingVerification")}</h2>
              <span className="ml-2 px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-500 text-[10px] font-black uppercase">
                {profiles.filter((p) => !p.is_verified && !p.is_admin).length}
              </span>
            </div>
            <UserTable
              profiles={filteredProfiles.filter((p) => !p.is_verified && !p.is_admin)}
              loading={loading}
              onEdit={(p) => setEditingProfile({ ...p, password: decryptPassword(p.password || "") })}
              onEditWallet={setEditingWalletProfile}
              onEditControl={setEditingControlProfile}
              onToggleRole={handleToggleRole}
              onVerify={handleVerifyUser}
              onDelete={handleDeleteUser}
              onResetStats={handleResetStats}
              emptyMessage={t("noUserFound")}
            />
          </div>
        )}
      </div>

      {/* Modals for Editing (User specific) */}
      {/* EDIT PROFILE MODAL */}
      {editingProfile && (
        <div 
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md cursor-pointer"
          onClick={() => setEditingProfile(null)}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="w-full max-w-xl glass-card p-0 overflow-hidden shadow-2xl cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-border flex items-center justify-between bg-card-header/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary"><Edit2 size={20} /></div>
                <h3 className="text-lg font-bold text-text-main">{t("editUser")}: {editingProfile.username}</h3>
              </div>
              <button onClick={() => setEditingProfile(null)} className="p-2 hover:bg-card-header rounded-xl text-text-muted transition-all"><X size={24} /></button>
            </div>
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">{t("firstNameLabel")}</label>
                  <input type="text" value={editingProfile.first_name || ""} onChange={(e) => setEditingProfile({ ...editingProfile, first_name: e.target.value })} className="w-full bg-transparent border border-border rounded-xl p-3 text-sm text-text-main focus:border-primary/50 outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">{t("lastNameLabel")}</label>
                  <input type="text" value={editingProfile.last_name || ""} onChange={(e) => setEditingProfile({ ...editingProfile, last_name: e.target.value })} className="w-full bg-transparent border border-border rounded-xl p-3 text-sm text-text-main focus:border-primary/50 outline-none transition-all" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">{t("emailAddressLabel")}</label>
                <input type="email" value={editingProfile.email} onChange={(e) => setEditingProfile({ ...editingProfile, email: e.target.value })} className="w-full bg-transparent border border-border rounded-xl p-3 text-sm text-text-main focus:border-primary/50 outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">{t("newPasswordOptional")}</label>
                <input type="password" placeholder="Leave blank to keep current" onChange={(e) => setEditingProfile({ ...editingProfile, password: e.target.value })} className="w-full bg-transparent border border-border rounded-xl p-3 text-sm text-text-main focus:border-primary/50 outline-none transition-all" />
              </div>
              <button onClick={() => handleUpdateProfile(editingProfile)} disabled={isSaving} className="w-full py-4 rounded-xl bg-primary text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-50">
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} {t("saveChanges")}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* WALLET ADJUST MODAL */}
      {editingWalletProfile && (
        <div 
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md cursor-pointer"
          onClick={() => { setEditingWalletProfile(null); setWalletAmount(""); setWalletReason(""); }}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="w-full max-w-md glass-card p-0 overflow-hidden shadow-2xl cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-border flex items-center justify-between bg-card-header/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center text-accent"><ArrowUp size={20} /></div>
                <h3 className="text-lg font-bold text-text-main">{t("adjustWallet")}: {editingWalletProfile.username}</h3>
              </div>
              <button onClick={() => setEditingWalletProfile(null)} className="p-2 hover:bg-card-header rounded-xl text-text-muted transition-all"><X size={24} /></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="p-4 rounded-xl bg-card-header border border-border flex justify-between items-center shadow-inner">
                <span className="text-xs text-text-muted font-bold uppercase">{t("currentBalance")}</span>
                <span className="text-xl font-black text-text-main">${editingWalletProfile.balance.toLocaleString()}</span>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1">{t("amount")} (USD)</label>
                <input type="number" value={walletAmount} onChange={(e) => setWalletAmount(e.target.value)} placeholder="0.00" className="w-full bg-transparent border border-border rounded-xl p-4 text-xl font-black text-text-main focus:border-primary/50 outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1">{t("reason")} / Memo</label>
                <input type="text" value={walletReason} onChange={(e) => setWalletReason(e.target.value)} placeholder="..." className="w-full bg-transparent border border-border rounded-xl p-3 text-sm text-text-main focus:border-primary/50 outline-none transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <button onClick={() => handleUpdateWallet('withdraw')} disabled={isSaving || !walletAmount} className="py-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 font-black text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all disabled:opacity-30 flex items-center justify-center gap-2">
                  <ArrowDown size={14} /> {t("withdrawOut")}
                </button>
                <button onClick={() => handleUpdateWallet('deposit')} disabled={isSaving || !walletAmount} className="py-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 font-black text-[10px] uppercase tracking-widest hover:bg-green-500 hover:text-white transition-all disabled:opacity-30 flex items-center justify-center gap-2">
                  <ArrowUp size={14} /> {t("depositIn")}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* TRADE CONTROL MODAL */}
      {editingControlProfile && (
        <div 
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md cursor-pointer"
          onClick={() => setEditingControlProfile(null)}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="w-full max-w-md glass-card p-0 overflow-hidden shadow-2xl cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-border flex items-center justify-between bg-card-header/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary"><Activity size={20} /></div>
                <h3 className="text-lg font-bold text-text-main">{t("tradeControlTitle")}: {editingControlProfile.username}</h3>
              </div>
              <button onClick={() => setEditingControlProfile(null)} className="p-2 hover:bg-card-header rounded-xl text-text-muted transition-all"><X size={24} /></button>
            </div>
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-1 gap-4">
                {(['normal', 'always_win', 'always_loss'] as const).map((mode) => {
                  const isActive = editingControlProfile.trade_control === mode;
                  const bgClass = isActive 
                    ? (mode === 'always_win' ? "bg-green-500 border-green-500 shadow-green-500/20" : mode === 'always_loss' ? "bg-red-500 border-red-500 shadow-red-500/20" : "bg-primary border-primary shadow-primary/20")
                    : "bg-card-header border-border hover:border-primary/40 shadow-sm";

                  return (
                    <button 
                      key={mode} 
                      onClick={() => setEditingControlProfile({ ...editingControlProfile, trade_control: mode })} 
                      className={`p-5 rounded-2xl border transition-all text-left group shadow-lg ${bgClass}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-black uppercase tracking-widest ${isActive ? "text-white" : "text-text-main"}`}>
                          {mode.replace('_', ' ')}
                        </span>
                        {isActive && <Save size={16} className="text-white animate-pulse" />}
                      </div>
                      <p className={`text-[10px] mt-1 font-bold ${isActive ? "text-white/70" : "text-text-muted"}`}>
                        {mode === 'normal' ? 'Random market behavior' : mode === 'always_win' ? 'User will win every trade' : 'User will lose every trade'}
                      </p>
                    </button>
                  );
                })}
              </div>
              <button onClick={handleUpdateControl} disabled={isSaving} className="w-full py-4 rounded-xl bg-primary text-white font-black text-xs uppercase tracking-widest hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2">
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} {t("saveChanges")}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Global Modals */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateUserModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => { setShowCreateModal(false); fetchProfiles(); }}
          />
        )}
        {showTopUpModal && (
          <TopUpModal
            onClose={() => setShowTopUpModal(false)}
            onSuccess={() => { setShowTopUpModal(false); fetchProfiles(); }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};
