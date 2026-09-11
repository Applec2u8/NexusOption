import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface AdminInputProps {
  label?: string;
  value: string;
  onChange: (val: string) => void;
  icon?: React.ReactNode;
  placeholder?: string;
  type?: string;
  step?: string;
  disabled?: boolean;
  isPhone?: boolean;
  enabled?: boolean;
  onToggle?: () => void;
}

const COUNTRY_CODES = [
  { code: "+66", country: "TH" },
  { code: "+1", country: "US" },
  { code: "+44", country: "GB" },
  { code: "+81", country: "JP" },
  { code: "+82", country: "KR" },
  { code: "+84", country: "VN" },
  { code: "+855", country: "KH" },
  { code: "+856", country: "LA" },
  { code: "+60", country: "MY" },
  { code: "+65", country: "SG" },
  { code: "+62", country: "ID" },
  { code: "+63", country: "PH" },
  { code: "+95", country: "MM" },
  { code: "+86", country: "CN" },
  { code: "+886", country: "TW" },
  { code: "+91", country: "IN" },
  { code: "+971", country: "AE" },
  { code: "+61", country: "AU" },
  { code: "+852", country: "HK" },
  { code: "+853", country: "MO" },
  { code: "+33", country: "FR" },
  { code: "+49", country: "DE" },
  { code: "+39", country: "IT" },
  { code: "+34", country: "ES" },
  { code: "+7", country: "RU" },
  { code: "+1", country: "CA" },
  { code: "+55", country: "BR" },
  { code: "+41", country: "CH" },
  { code: "+31", country: "NL" },
  { code: "+46", country: "SE" },
  { code: "+64", country: "NZ" },
  { code: "+90", country: "TR" },
  { code: "+966", country: "SA" },
  { code: "+20", country: "EG" },
  { code: "+27", country: "ZA" },
];

export const AdminInput: React.FC<AdminInputProps> = ({
  label,
  value,
  onChange,
  icon,
  placeholder,
  type = "text",
  step,
  disabled = false,
  isPhone = false,
  enabled,
  onToggle,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  let phonePrefix = "+66";
  let phoneBody = value || "";

  if (isPhone && value) {
    const sortedCodes = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
    const match = sortedCodes.find(c => value.startsWith(c.code));
    if (match) {
      phonePrefix = match.code;
      phoneBody = value.substring(match.code.length);
      if (phoneBody.startsWith(" ")) phoneBody = phoneBody.substring(1);
    }
  }

  const handlePhonePrefixChange = (newPrefix: string) => {
    onChange(`${newPrefix}${phoneBody}`);
  };

  const handlePhoneBodyChange = (newBody: string) => {
    onChange(`${phonePrefix}${newBody}`);
  };

  const inputId = React.useId();

  return (
    <div className={`space-y-3 w-full p-5 rounded-2xl bg-card border border-border transition-all hover:border-primary/20 shadow-sm ${!enabled && onToggle !== undefined ? "opacity-60" : "opacity-100"}`}>
      <div className="flex items-center justify-between px-1">
        {label && (
          <label htmlFor={inputId} className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">
            {label}
          </label>
        )}
        {onToggle !== undefined && (
          <button
            onClick={onToggle}
            className={`shrink-0 w-10 h-5 rounded-full transition-all relative ${
              enabled ? "bg-primary shadow-lg shadow-primary/20" : "bg-card-header border border-border shadow-inner"
            }`}
          >
            <div
              className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all shadow-md ${
                enabled ? "left-6" : "left-1"
              }`}
            />
          </button>
        )}
      </div>

      <div
        className={`relative group/input flex items-stretch overflow-hidden transition-all duration-300 bg-transparent border border-border rounded-xl focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary/50 ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-primary/20"}`}
      >
        {isPhone && (
          <div className="relative flex items-center bg-card-header/50 border-r border-border hover:bg-card-header transition-colors shrink-0">
            <select
              value={phonePrefix}
              onChange={(e) => handlePhonePrefixChange(e.target.value)}
              disabled={disabled}
              className="w-full h-full bg-transparent border-none text-text-main text-xs pl-3 pr-7 py-2.5 focus:outline-none appearance-none cursor-pointer z-10 font-bold"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='rgba(156, 163, 175, 1)'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 0.4rem center",
                backgroundSize: "0.8em",
              }}
            >
              {COUNTRY_CODES.map(c => (
                <option key={c.code} value={c.code} className="bg-card text-text-main py-1">
                  {c.code}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="relative flex-1 flex items-center min-w-0">
          {icon && !isPhone && (
            <div className={`absolute left-3.5 z-10 text-text-muted pointer-events-none transition-colors group-focus-within/input:text-primary`}>
              {icon}
            </div>
          )}
          <input
            id={inputId}
            type={isPassword ? (showPassword ? "text" : "password") : type}
            step={step}
            inputMode={type === "number" || isPhone ? "decimal" : undefined}
            value={isPhone ? phoneBody : value}
            onChange={(e) => {
              if (isPhone) {
                handlePhoneBodyChange(e.target.value);
              } else {
                onChange(e.target.value);
              }
            }}
            placeholder={placeholder}
            disabled={disabled}
            autoComplete="new-password"
            className={`w-full h-full text-text-main text-xs focus:outline-none placeholder:text-text-muted/40 transition-all bg-transparent border-none py-3 ${icon && !isPhone ? "pl-10" : "pl-4"} ${isPassword ? "pr-10" : "pr-4"}`}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 p-1.5 text-text-muted hover:text-text-main transition-colors hover:bg-card-header rounded-lg focus:outline-none"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
