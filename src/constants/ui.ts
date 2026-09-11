/**
 * UI-Related Constants and Navigation Structures
 */

export const NAV_ITEMS = [
  { path: "/trade", labelKey: "trade", icon: "terminal" },
  { path: "/wallet", labelKey: "wallet", icon: "wallet" },
  { path: "/history", labelKey: "history", icon: "clock" },
  { path: "/news", labelKey: "news", icon: "newspaper" },
  { path: "/settings", labelKey: "settings", icon: "settings" },
] as const;

export const THEME_COLORS = {
  PRIMARY: "#3b82f6",
  ACCENT: "#8b5cf6",
  SUCCESS: "#10b981",
  DANGER: "#ef4444",
  WARNING: "#f59e0b",
} as const;

export const CATEGORY_COLORS = {
  crypto: "text-blue-500",
  stock: "text-emerald-500",
  commodity: "text-yellow-500",
} as const;
