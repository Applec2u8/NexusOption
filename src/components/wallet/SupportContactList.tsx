import React from "react";
import {
  Phone,
  MessageCircle,
  Send,
  ChevronRight,
  MessageSquare,
  Globe,
  Mail,
  Hash,
} from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import type { GlobalSettings } from "../../types";

interface SupportContactListProps {
  settings: Partial<GlobalSettings>;
}

export const SupportContactList: React.FC<SupportContactListProps> = ({ settings }) => {
  const { t } = useLanguage();

  const channels = [
    {
      key: "phone",
      enabled: settings.phone_enabled,
      value: settings.contact_phone,
      label: "Call Support",
      icon: <Phone size={20} />,
      href: `tel:${settings.contact_phone}`,
      color: "bg-primary/20 text-primary",
      hover: "hover:border-primary/30",
    },
    {
      key: "line",
      enabled: settings.line_enabled,
      value: settings.contact_line,
      label: "Line Official",
      icon: <MessageCircle size={20} />,
      href: `https://line.me/ti/p/${settings.contact_line?.replace("@", "")}`,
      color: "bg-green-500/20 text-green-500",
      hover: "hover:border-green-500/30",
    },
    {
      key: "telegram",
      enabled: settings.telegram_enabled,
      value: settings.contact_telegram,
      label: "Telegram",
      icon: <Send size={20} />,
      href: `https://t.me/${settings.contact_telegram?.replace("@", "")}`,
      color: "bg-blue-500/20 text-blue-500",
      hover: "hover:border-blue-500/30",
    },
    {
      key: "whatsapp",
      enabled: settings.whatsapp_enabled,
      value: settings.contact_whatsapp,
      label: "WhatsApp",
      icon: <MessageSquare size={20} />,
      href: `https://wa.me/${settings.contact_whatsapp?.replace(/[@\s+]/g, "")}`,
      color: "bg-emerald-500/20 text-emerald-500",
      hover: "hover:border-emerald-500/30",
    },
    {
      key: "facebook",
      enabled: settings.facebook_enabled,
      value: settings.contact_facebook,
      label: "Facebook Messenger",
      icon: <Globe size={20} />,
      href: `https://m.me/${settings.contact_facebook}`,
      color: "bg-blue-600/20 text-blue-600",
      hover: "hover:border-blue-600/30",
    },
    {
      key: "email",
      enabled: settings.email_enabled,
      value: settings.contact_email,
      label: "Email Support",
      icon: <Mail size={20} />,
      href: `mailto:${settings.contact_email}`,
      color: "bg-amber-500/20 text-amber-500",
      hover: "hover:border-amber-500/30",
    },
    {
      key: "discord",
      enabled: settings.discord_enabled,
      value: settings.contact_discord,
      label: "Discord",
      icon: <Hash size={20} />,
      href: settings.contact_discord?.startsWith("http")
        ? settings.contact_discord
        : `https://${settings.contact_discord}`,
      color: "bg-violet-500/20 text-violet-500",
      hover: "hover:border-violet-500/30",
    },
  ];

  const enabledChannels = channels.filter((ch) => ch.enabled && ch.value);

  if (enabledChannels.length === 0) return null;

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
        <Phone size={12} /> {t('contactSupport')}
      </p>
      {enabledChannels.map((ch) => (
        <a
          key={ch.key}
          href={ch.href}
          target={ch.key !== "phone" && ch.key !== "email" ? "_blank" : undefined}
          rel="noreferrer"
          className={`flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 ${ch.hover} hover:bg-white/10 transition-all group`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${ch.color}`}
            >
              {ch.icon}
            </div>
            <div>
              <p className="text-white text-sm font-bold">{ch.label}</p>
              <p className="text-slate-400 text-xs">{ch.value}</p>
            </div>
          </div>
          <ChevronRight
            size={16}
            className="text-slate-500 group-hover:text-white transition-all"
          />
        </a>
      ))}
    </div>
  );
};
