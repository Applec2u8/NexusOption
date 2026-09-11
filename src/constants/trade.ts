/**
 * Trading Related Constants
 */

export const TIMEFRAMES = [
  { label: "1m", minutes: 1, payout: 10 },
  { label: "3m", minutes: 3, payout: 15 },
  { label: "5m", minutes: 5, payout: 20 },
  { label: "15m", minutes: 15, payout: 25 },
  { label: "20m", minutes: 20, payout: 30 },
  { label: "30m", minutes: 30, payout: 35 },
] as const;

export const MIN_TRADE_AMOUNT = 1.0;

export const DEFAULT_ASSET_SYMBOL = "BTC";

export const ASSET_CATEGORIES = {
  CRYPTO: "crypto",
  COMMODITY: "commodity",
  STOCK: "stock",
} as const;
