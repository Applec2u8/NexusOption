import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface SettingsInputProps {
  label: string;
  placeholder?: string;
  disabled?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  maxLength?: number;
}

  export const SettingsInput: React.FC<SettingsInputProps> = ({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  maxLength,
  disabled,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider ml-1">
        {label}
      </label>
      <div className="relative group">
        <input
          type={isPassword ? (showPassword ? "text" : "password") : type}
          value={value === undefined ? "" : value}
          onChange={onChange}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={disabled}
          className="w-full bg-transparent border border-border rounded-xl py-2.5 px-4 text-text-main text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-text-muted/30 pr-12 disabled:opacity-50 disabled:cursor-not-allowed group-hover:border-primary/30"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-text-muted hover:text-text-main transition-colors hover:bg-card-header rounded-lg"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </div>
  );
};
