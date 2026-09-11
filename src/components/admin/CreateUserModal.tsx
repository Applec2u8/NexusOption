import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Shield } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { AdminInput } from "./AdminInput";
import { encryptPassword } from "../../utils/security";
import { generateUserCode } from "../../utils/userUtils";
import { useLanguage } from "../../contexts/LanguageContext";
import { auditService } from "../../services/auditService";
import { useAuth } from "../../contexts/AuthContext";

interface CreateUserModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const { t } = useLanguage();
  const { profile: currentAdmin } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
    first_name: "",
    last_name: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const { data: _data, error: registerError } = await supabase
        .from("profiles")
        .insert([{
          id: crypto.randomUUID(),
          username: formData.username,
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          password: encryptPassword(formData.password),
          is_verified: true,
          balance: 0,
          is_admin: false,
          code: generateUserCode(),
          updated_at: new Date().toISOString(),
        }])
        .select().single();

      if (registerError) throw registerError;
      
      if (currentAdmin && currentAdmin.id) {
        try {
          await auditService.logAction({
            adminId: currentAdmin.id,
            adminEmail: currentAdmin.email || 'unknown',
            targetUserEmail: formData.email,
            actionType: 'CREATE_USER',
            description: `Created new user account for ${formData.username}`,
            details: { email: formData.email, username: formData.username }
          });
        } catch (e) {
          console.error("Failed to log user creation action", e);
        }
      }

      alert(t("createUserSuccess"));
      onSuccess();
    } catch (err: any) {
      setError(err.message || t("createUserError"));
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-background/80 backdrop-blur-md"
      />
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-card w-full max-w-lg relative z-10 p-4 sm:p-6 max-h-[90vh] md:max-h-[95vh] overflow-y-auto scrollbar-hide mb-16 md:mb-0 bg-card border-border shadow-2xl"
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex flex-col">
            <h3 className="text-lg font-bold text-text-main">
              {t("registerNewUser")}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-muted hover:text-text-main transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Maintenance Alert */}
        <div className="mb-6 p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-3 items-center">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
            <Shield size={18} className="animate-pulse" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">{t("maintenanceTitle")}</p>
            <p className="text-[10px] text-amber-600/80 leading-tight">{t("maintenanceDesc")}</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3.5 bg-red-500/10 border border-red-500/20 text-red-600 text-[11px] font-bold rounded-xl text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pointer-events-none opacity-50 selection:none">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AdminInput
              label={t("firstName")}
              value={formData.first_name}
              onChange={(v) => setFormData({ ...formData, first_name: v })}
              placeholder={t("firstNamePlaceholder") || "Somchai"}
              disabled={true}
            />
            <AdminInput
              label={t("lastName")}
              value={formData.last_name}
              onChange={(v) => setFormData({ ...formData, last_name: v })}
              placeholder={t("lastNamePlaceholder") || "Jaidee"}
              disabled={true}
            />
          </div>
          <AdminInput
            label={t("username")}
            value={formData.username}
            onChange={(v) => setFormData({ ...formData, username: v })}
            placeholder={t("usernamePlaceholder") || "somchai123"}
            disabled={true}
          />
          <AdminInput
            label={t("email")}
            type="email"
            value={formData.email}
            onChange={(v) => setFormData({ ...formData, email: v })}
            placeholder={t("emailPlaceholder") || "somchai@example.com"}
            disabled={true}
          />
          <AdminInput
            label={t("password")}
            type="password"
            value={formData.password}
            onChange={(v) => setFormData({ ...formData, password: v })}
            placeholder="••••••••"
            disabled={true}
          />

          <div className="pt-3 flex gap-2.5 text-[10px] text-text-muted leading-relaxed italic">
            <Shield size={18} className="shrink-0 text-text-muted/40" />
            <p>
              {t("registerNewUserDesc") || "Creating a user through this form will save the information directly to the system and the user can log in immediately without OTP verification."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-5 py-2.5 rounded-xl bg-card-header text-text-muted font-bold hover:text-text-main transition-all text-xs pointer-events-auto border border-border shadow-sm"
            >
              {t("cancel")}
            </button>
            <button
              type="button"
              disabled={true}
              className="flex-[2] bg-card-header text-text-muted/50 flex items-center justify-center gap-2 text-xs font-bold rounded-xl py-2.5 cursor-not-allowed border border-border"
            >
              {t("systemTemporarilyClosed")}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
