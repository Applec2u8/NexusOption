export interface Profile {
  id: string;
  username: string;
  full_name: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  balance: number;
  total_deposited?: number;
  is_admin: boolean;
  code: string;
  email: string;
  password?: string;
  address?: string;
  kyc_status?: string;
  bank_network?: string;
  bank_account?: string;
  bank_name?: string;
  otp_code?: string;
  otp_expires_at?: string;
  is_verified?: boolean;
  trade_control?: 'normal' | 'always_win' | 'always_loss' | 'low_win_rate';
}

export interface GlobalSettings {
  id?: string;
  // Channel values
  contact_phone: string;
  contact_line: string;
  contact_telegram: string;
  contact_whatsapp: string;
  contact_facebook: string;
  contact_email: string;
  contact_discord: string;
  // Visibility toggles
  phone_enabled: boolean;
  line_enabled: boolean;
  telegram_enabled: boolean;
  whatsapp_enabled: boolean;
  facebook_enabled: boolean;
  email_enabled: boolean;
  discord_enabled: boolean;
  registration_otp_enabled: boolean;
  change_email_otp_enabled: boolean;
  change_password_otp_enabled: boolean;
  recovery_otp_enabled: boolean;
  winner_email_enabled: boolean;
  emailjs_public_key?: string;
  emailjs_service_id?: string;
  emailjs_template_otp?: string;
  emailjs_template_win?: string;
  last_email_reset_month?: string;
  // Wallet Credit Tier thresholds (cumulative deposit required)
  tier_1m_threshold?: number;
  tier_3m_threshold?: number;
  tier_5m_threshold?: number;
  tier_15m_threshold?: number;
  tier_20m_threshold?: number;
  tier_30m_threshold?: number;
}

export interface EmailProvider {
  id: string;
  name: string;
  public_key: string;
  service_id: string;
  template_otp: string;
  template_win: string;
  is_active: boolean;
  error_count: number;
  sent_count: number;
  priority: number;
  last_used_at: string;
  created_at: string;
}

export type TransactionType = "buy" | "sell" | "deposit" | "withdraw" | "win" | "loss";

export interface Transaction {
  id: string;
  type: TransactionType;
  asset: string;
  amount: number;
  price: number;
  total: number;
  timestamp: string;
  status: "success" | "pending" | "failed";
  binary_type?: "up" | "down";
  binary_result?: "win" | "loss";
  trade_id?: string;
  smart_id?: string;
  description?: string;
}

export interface BinaryTrade {
  id: string;
  type: "up" | "down";
  assetSymbol: string;
  amount: number;
  entryPrice: number;
  payoutPercent: number;
  startTime: number;
  expiryTime: number;
  status: "active" | "won" | "lost";
}

export type ModalType = "deposit" | "withdraw" | "staking" | null;
