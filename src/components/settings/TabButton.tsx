import React from "react";
import { ChevronRight } from "lucide-react";

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

export const TabButton: React.FC<TabButtonProps> = ({
  active,
  onClick,
  icon,
  label,
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${
      active
        ? "bg-primary/20 text-primary border border-primary/20 shadow-lg shadow-primary/10"
        : "text-text-muted hover:text-text-main hover:bg-card-header/50"
    }`}
  >
    {/* Active Glow Effect */}
    {active && (
      <div className="absolute inset-0 bg-primary/10 blur-xl opacity-50 pointer-events-none" />
    )}
    
    <div className="flex items-center gap-3 relative z-10">
      <div className={`transition-colors duration-300 ${active ? "text-primary" : "text-text-muted group-hover:text-text-main"}`}>
        {icon}
      </div>
      <span className="text-sm font-bold tracking-tight">{label}</span>
    </div>
    
    <ChevronRight
      size={14}
      className={`transition-all duration-300 relative z-10 ${
        active ? "rotate-90 text-primary" : "text-text-muted opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5"
      }`}
    />
  </button>
);
