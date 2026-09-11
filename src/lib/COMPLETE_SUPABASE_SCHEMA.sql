-- ==============================================================================
-- NEXUS OPTION SUPER SCHEMA (MASTER PRODUCTION RELEASE)
-- Version: 5.0 — Comprehensive Reverse-Engineered Schema
-- Generated: 2026-09-12
-- Compatible with: Supabase / PostgreSQL 14+ / Supabase Edge Functions / Realtime
-- ==============================================================================

-- ==============================================================================
-- STEP 1: EXTENSIONS & SCHEMAS
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- STEP 2: SEQUENCES
-- ==============================================================================
-- Sequence for Customer Support Issue Reports (Smart ID format starting from 1001)
CREATE SEQUENCE IF NOT EXISTS public.issue_report_smart_id_seq START WITH 1001;

-- ==============================================================================
-- STEP 3: HELPER FUNCTIONS & TRIGGERS
-- ==============================================================================

-- 1. Helper function: Generate random uppercase alphanumeric code (e.g. User Referral/Identity code)
CREATE OR REPLACE FUNCTION public.generate_random_code(length INT) 
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INT := 0;
BEGIN
  WHILE i < length LOOP
    result := result || substr(chars, floor(random() * char_length(chars) + 1)::INT, 1);
    i := i + 1;
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 2. Trigger function: Auto-update updated_at timestamp column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- STEP 4: CORE TABLES (ORDERED BY FOREIGN KEY DEPENDENCIES)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. PROFILES (Custom User & Trader Master Table)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  email TEXT UNIQUE,
  password TEXT,
  code TEXT DEFAULT public.generate_random_code(6),
  balance DECIMAL(20, 2) DEFAULT 0.00,
  total_deposited DECIMAL(20, 2) DEFAULT 0.00,
  trade_control TEXT DEFAULT 'normal' CHECK (trade_control IN ('normal', 'always_win', 'always_loss', 'low_win_rate')),
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  phone_number TEXT,
  address TEXT,
  kyc_status TEXT DEFAULT 'unverified',
  bank_network TEXT,
  bank_account TEXT,
  bank_name TEXT,
  avatar_url TEXT,
  language TEXT DEFAULT 'en',
  is_admin BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  otp_code TEXT,
  otp_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- ------------------------------------------------------------------------------
-- 2. GLOBAL SETTINGS (Platform Controls, Contact Info, OTP & Tier Thresholds)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.global_settings (
  id TEXT PRIMARY KEY DEFAULT 'main',
  -- Contact Channels
  contact_phone TEXT DEFAULT '',
  contact_line TEXT DEFAULT '',
  contact_telegram TEXT DEFAULT '',
  contact_whatsapp TEXT DEFAULT '',
  contact_facebook TEXT DEFAULT '',
  contact_email TEXT DEFAULT '',
  contact_discord TEXT DEFAULT '',
  -- Channel Visibility Toggles
  phone_enabled BOOLEAN DEFAULT TRUE,
  line_enabled BOOLEAN DEFAULT TRUE,
  telegram_enabled BOOLEAN DEFAULT TRUE,
  whatsapp_enabled BOOLEAN DEFAULT TRUE,
  facebook_enabled BOOLEAN DEFAULT TRUE,
  email_enabled BOOLEAN DEFAULT TRUE,
  discord_enabled BOOLEAN DEFAULT TRUE,
  -- Security & OTP Policy Toggles
  registration_otp_enabled BOOLEAN DEFAULT TRUE,
  change_email_otp_enabled BOOLEAN DEFAULT TRUE,
  change_password_otp_enabled BOOLEAN DEFAULT TRUE,
  recovery_otp_enabled BOOLEAN DEFAULT TRUE,
  winner_email_enabled BOOLEAN DEFAULT TRUE,
  -- Telemetry & Reset Controls
  last_email_reset_month TEXT,
  -- Wallet Credit Tier Thresholds (Cumulative Deposit Required to Unlock Timeframes)
  tier_1m_threshold DECIMAL(20, 2) DEFAULT 0.00,
  tier_3m_threshold DECIMAL(20, 2) DEFAULT 0.00,
  tier_5m_threshold DECIMAL(20, 2) DEFAULT 0.00,
  tier_15m_threshold DECIMAL(20, 2) DEFAULT 0.00,
  tier_20m_threshold DECIMAL(20, 2) DEFAULT 0.00,
  tier_30m_threshold DECIMAL(20, 2) DEFAULT 0.00,
  -- Legacy / Fallback EmailJS Credentials
  emailjs_public_key TEXT DEFAULT '',
  emailjs_service_id TEXT DEFAULT '',
  emailjs_template_otp TEXT DEFAULT '',
  emailjs_template_win TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure Default Global Settings Row exists
INSERT INTO public.global_settings (id, last_email_reset_month)
VALUES ('main', TO_CHAR(NOW(), 'YYYY-MM'))
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 3. EMAIL PROVIDERS (EmailJS Account Pool with Auto-Failover & Telemetry)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.email_providers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  public_key TEXT NOT NULL,
  service_id TEXT NOT NULL,
  template_otp TEXT NOT NULL DEFAULT '',
  template_win TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN DEFAULT TRUE,
  error_count INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  priority INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4. BINARY TRADES (Binary Options Contract Ledger)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.binary_trades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('up', 'down')),
  asset_symbol TEXT NOT NULL,
  amount DECIMAL(36, 18) NOT NULL,
  entry_price DECIMAL(20, 8) NOT NULL,
  payout_percent INTEGER NOT NULL,
  expiry_time BIGINT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost', 'refunded')),
  result_price DECIMAL(20, 8),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  settled_at TIMESTAMPTZ
);

-- ------------------------------------------------------------------------------
-- 5. TRANSACTIONS (Financial Ledger: Deposits, Withdrawals, Spot & Binary Trades)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('buy', 'sell', 'deposit', 'withdraw', 'win', 'loss', 'refund')),
  asset_symbol TEXT NOT NULL,
  amount DECIMAL(36, 18) NOT NULL,
  price DECIMAL(20, 8) NOT NULL,
  total DECIMAL(20, 2) NOT NULL,
  status TEXT DEFAULT 'pending',
  binary_type TEXT, 
  binary_result TEXT, 
  binary_trade_id UUID REFERENCES public.binary_trades(id) ON DELETE SET NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 6. PORTFOLIO (Spot Asset Holdings per User)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.portfolio (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  asset_symbol TEXT NOT NULL,
  units DECIMAL(36, 18) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, asset_symbol)
);

-- ------------------------------------------------------------------------------
-- 7. USER SESSIONS (Server-Side Active Device Tracking & Kick Session Support)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id TEXT,
  device_name TEXT,
  os_name TEXT,
  browser_name TEXT,
  ip_address TEXT,
  device_info JSONB,
  is_revoked BOOLEAN DEFAULT FALSE,
  last_active TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 8. USER LOGIN HISTORY (Security Log of All Device Authentications)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_login_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  device_name TEXT,
  os_name TEXT,
  browser_name TEXT,
  ip_address TEXT,
  location TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  session_id TEXT,
  last_active TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 9. ISSUE REPORTS (Customer Support Tickets with Smart Sequence ID)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.issue_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  smart_id BIGINT DEFAULT nextval('public.issue_report_smart_id_seq'),
  category TEXT NOT NULL, -- e.g. #Deposit, #Withdraw, #Trade, #Security, #Other
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  admin_response TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 10. PUSH SUBSCRIPTIONS (Web Push Notification Device Tokens)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  subscription_json JSONB,
  endpoint TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, endpoint)
);

-- ------------------------------------------------------------------------------
-- 11. ADMIN AUDIT LOGS (Immutable Activity Log of Admin Changes)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  admin_email TEXT,
  target_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  target_user_email TEXT,
  action_type TEXT NOT NULL, -- e.g. TOP_UP, WALLET_DEPOSIT, WALLET_WITHDRAW, TRADE_CONTROL_UPDATE
  description TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- STEP 5: BACKWARD COMPATIBILITY VIEWS & RULES
-- ==============================================================================
-- Provides full compatibility with legacy code calling .from('trades')
CREATE OR REPLACE VIEW public.trades AS 
  SELECT * FROM public.binary_trades;

CREATE OR REPLACE RULE trades_delete AS 
  ON DELETE TO public.trades 
  DO INSTEAD 
    DELETE FROM public.binary_trades WHERE id = OLD.id;

-- ==============================================================================
-- STEP 6: ATOMIC DATABASE RPC FUNCTIONS
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- RPC 1: PLACE_BINARY_TRADE (Atomic Validation, Balance Deduction & Ledger Insert)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.place_binary_trade(
  p_user_id UUID,
  p_type TEXT,
  p_asset_symbol TEXT,
  p_amount DECIMAL,
  p_entry_price DECIMAL,
  p_payout_percent INTEGER,
  p_expiry_time BIGINT
) RETURNS JSONB AS $$
DECLARE
  v_current_balance DECIMAL;
  v_trade_id UUID;
BEGIN
  -- 1. Validate inputs
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'message', 'Invalid trade amount');
  END IF;

  -- 2. Lock profile row & check balance
  SELECT balance INTO v_current_balance 
  FROM public.profiles 
  WHERE id = p_user_id FOR UPDATE;

  IF v_current_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'User account not found');
  END IF;

  IF v_current_balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'message', 'Insufficient balance');
  END IF;

  -- 3. Deduct balance
  UPDATE public.profiles 
  SET balance = balance - p_amount, updated_at = NOW() 
  WHERE id = p_user_id;

  -- 4. Create pending binary trade
  INSERT INTO public.binary_trades (
    user_id, type, asset_symbol, amount, entry_price, payout_percent, expiry_time, status
  )
  VALUES (
    p_user_id, p_type, p_asset_symbol, p_amount, p_entry_price, p_payout_percent, p_expiry_time, 'pending'
  )
  RETURNING id INTO v_trade_id;

  -- 5. Record initial trade transaction in ledger
  INSERT INTO public.transactions (
    user_id, type, asset_symbol, amount, price, total, status, binary_type, binary_trade_id, description
  )
  VALUES (
    p_user_id, 
    'buy', 
    p_asset_symbol, 
    CASE WHEN p_entry_price > 0 THEN p_amount / p_entry_price ELSE 0 END, 
    p_entry_price, 
    p_amount, 
    'success', 
    p_type, 
    v_trade_id,
    'Binary Trade: ' || p_asset_symbol || ' (' || UPPER(p_type) || ')'
  );

  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Trade placed successfully', 
    'trade_id', v_trade_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- RPC 2: RESOLVE_BINARY_TRADE (Server Settlement with Trade Control Override)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.resolve_binary_trade(
  p_trade_id UUID,
  p_new_status TEXT,
  p_result_price DECIMAL,
  p_payout_amount DECIMAL
) RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_current_status TEXT;
  v_asset_symbol TEXT;
  v_amount DECIMAL;
  v_binary_type TEXT;
  v_payout_percent INTEGER;
  v_trade_control TEXT;
  v_final_status TEXT;
  v_final_payout DECIMAL;
BEGIN
  -- 1. Fetch & lock trade record
  SELECT user_id, status, asset_symbol, amount, type, payout_percent 
  INTO v_user_id, v_current_status, v_asset_symbol, v_amount, v_binary_type, v_payout_percent 
  FROM public.binary_trades 
  WHERE id = p_trade_id FOR UPDATE;
  
  IF v_current_status IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Trade not found');
  END IF;

  IF v_current_status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Trade already resolved');
  END IF;

  -- 2. Fetch user trade control configuration
  SELECT trade_control INTO v_trade_control 
  FROM public.profiles 
  WHERE id = v_user_id;
  
  v_trade_control := COALESCE(v_trade_control, 'normal');

  -- 3. Determine final result based on admin strategy
  v_final_status := p_new_status;
  v_final_payout := p_payout_amount;

  IF v_trade_control = 'always_win' THEN
    v_final_status := 'won';
    v_final_payout := v_amount + (v_amount * v_payout_percent / 100);
  ELSIF v_trade_control = 'always_loss' THEN
    v_final_status := 'lost';
    v_final_payout := 0;
  ELSIF v_trade_control = 'low_win_rate' THEN
    -- Low win rate mode (15% win probability)
    IF random() > 0.15 THEN
      v_final_status := 'lost';
      v_final_payout := 0;
    ELSE
      v_final_status := 'won';
      v_final_payout := v_amount + (v_amount * v_payout_percent / 100);
    END IF;
  END IF;

  -- 4. Update binary trade status
  UPDATE public.binary_trades 
  SET status = v_final_status, result_price = p_result_price, settled_at = NOW()
  WHERE id = p_trade_id;

  -- 5. Credit winnings to user balance if applicable
  IF v_final_payout > 0 THEN
    UPDATE public.profiles 
    SET balance = balance + v_final_payout, updated_at = NOW() 
    WHERE id = v_user_id;
  END IF;

  -- 6. Insert audit transaction record
  INSERT INTO public.transactions (
    user_id, type, asset_symbol, amount, price, total, status, binary_type, binary_result, binary_trade_id, description
  )
  VALUES (
    v_user_id, 
    CASE WHEN v_final_status = 'won' THEN 'win' ELSE 'loss' END, 
    v_asset_symbol, 
    v_amount, 
    p_result_price, 
    v_final_payout, 
    'success', 
    v_binary_type, 
    v_final_status, 
    p_trade_id,
    'Trade Result: ' || v_asset_symbol || ' (' || UPPER(v_binary_type) || ')'
  );

  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Trade resolved successfully', 
    'strategy', v_trade_control,
    'result', v_final_status
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- RPC 3: REFUND_BINARY_TRADE (Called by resolve-trades Edge Function for Stale Quotes)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.refund_binary_trade(
  p_trade_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_current_status TEXT;
  v_asset_symbol TEXT;
  v_amount DECIMAL;
  v_binary_type TEXT;
BEGIN
  -- 1. Lock and check status
  SELECT user_id, status, asset_symbol, amount, type
  INTO v_user_id, v_current_status, v_asset_symbol, v_amount, v_binary_type
  FROM public.binary_trades 
  WHERE id = p_trade_id FOR UPDATE;

  IF v_current_status IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Trade not found');
  END IF;

  IF v_current_status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Trade already resolved');
  END IF;

  -- 2. Update status to refunded
  UPDATE public.binary_trades
  SET status = 'refunded', settled_at = NOW()
  WHERE id = p_trade_id;

  -- 3. Return original stake to user
  UPDATE public.profiles
  SET balance = balance + v_amount, updated_at = NOW()
  WHERE id = v_user_id;

  -- 4. Record refund transaction in financial ledger
  INSERT INTO public.transactions (
    user_id, type, asset_symbol, amount, price, total, status, binary_type, binary_result, binary_trade_id, description
  )
  VALUES (
    v_user_id,
    'refund',
    v_asset_symbol,
    v_amount,
    0,
    v_amount,
    'success',
    v_binary_type,
    'refunded',
    p_trade_id,
    'Trade Refunded: ' || v_asset_symbol || ' (' || UPPER(v_binary_type) || ')'
  );

  RETURN jsonb_build_object('success', true, 'message', 'Trade refunded successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- STEP 7: TRIGGERS
-- ==============================================================================

-- Trigger: Update updated_at on profiles
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Update updated_at on issue_reports
DROP TRIGGER IF EXISTS update_issue_reports_updated_at ON public.issue_reports;
CREATE TRIGGER update_issue_reports_updated_at
  BEFORE UPDATE ON public.issue_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ==============================================================================
-- STEP 8: HIGH-PERFORMANCE INDEXES
-- ==============================================================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_code ON public.profiles(code);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Binary trades indexes
CREATE INDEX IF NOT EXISTS idx_binary_trades_user_id ON public.binary_trades(user_id);
CREATE INDEX IF NOT EXISTS idx_binary_trades_status ON public.binary_trades(status);
CREATE INDEX IF NOT EXISTS idx_binary_trades_created_at ON public.binary_trades(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_binary_trades_pending_expiry ON public.binary_trades(status, expiry_time) WHERE status = 'pending';

-- Transactions indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_binary_trade_id ON public.transactions(binary_trade_id);

-- Portfolio indexes
CREATE INDEX IF NOT EXISTS idx_portfolio_user_id ON public.portfolio(user_id);

-- Email Providers indexes
CREATE INDEX IF NOT EXISTS idx_email_providers_priority ON public.email_providers(priority DESC, last_used_at ASC);

-- User Sessions & Login History indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_active ON public.user_sessions(last_active DESC);
CREATE INDEX IF NOT EXISTS idx_user_login_history_user_id ON public.user_login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_created_at ON public.user_login_history(created_at DESC);

-- Issue Reports indexes
CREATE INDEX IF NOT EXISTS idx_issue_reports_user_id ON public.issue_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_issue_reports_smart_id ON public.issue_reports(smart_id);
CREATE INDEX IF NOT EXISTS idx_issue_reports_status ON public.issue_reports(status);

-- Push Subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_push_subs_user_id ON public.push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subs_endpoint ON public.push_subscriptions(endpoint);

-- Admin Audit Logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON public.admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);

-- ==============================================================================
-- STEP 9: REALTIME PUBLICATION SETUP
-- ==============================================================================
-- Ensure binary_trades broadcasts changes to Frontend subscribers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'binary_trades'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.binary_trades;
  END IF;
EXCEPTION
  WHEN OTHERS THEN 
    -- Ignore if publication supabase_realtime doesn't exist in local/custom Postgres
    NULL;
END $$;

-- ==============================================================================
-- STEP 10: PERMISSIONS & ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- In this architecture, authentication is handled at the application level
-- (Custom Auth with Encrypted Passwords & Session tokens via the Supabase Client).
-- Therefore, RLS is disabled by default to enable client operation, with full grants to anon/authenticated.

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.binary_trades DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_providers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_login_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_reports DISABLE ROW LEVEL SECURITY;

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- ==============================================================================
-- [OPTIONAL] STRICT RLS POLICIES (FOR SUPABASE AUTH MIGRATIONS)
-- ==============================================================================
/*
-- If you migrate to native Supabase Auth (auth.uid()), enable RLS and use these policies:

ALTER TABLE public.issue_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reports" 
  ON public.issue_reports FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reports" 
  ON public.issue_reports FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all reports" 
  ON public.issue_reports FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = TRUE OR role = 'admin')));

CREATE POLICY "Admins can update reports" 
  ON public.issue_reports FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = TRUE OR role = 'admin')));
*/
