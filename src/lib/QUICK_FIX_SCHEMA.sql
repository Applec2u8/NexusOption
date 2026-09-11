-- ============================================================
-- QUICK FIX: BINARY TRADES SCHEMA & TRANSACTION LOGGING
-- Version: 4.1 — Updated 2026-04-12
-- Run this in your Supabase SQL Editor to fix missing history data
-- ============================================================

-- 1. Ensure columns exist in transactions table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='binary_type') THEN
        ALTER TABLE public.transactions ADD COLUMN binary_type TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='binary_result') THEN
        ALTER TABLE public.transactions ADD COLUMN binary_result TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='binary_trade_id') THEN
        ALTER TABLE public.transactions ADD COLUMN binary_trade_id UUID;
    END IF;
END $$;

-- 2. Update type constraint to include 'win' and 'loss'
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_type_check 
  CHECK (type IN ('buy', 'sell', 'deposit', 'withdraw', 'win', 'loss'));

-- 3. Ensure binary_trades table exists with correct schema
CREATE TABLE IF NOT EXISTS public.binary_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  asset_symbol TEXT NOT NULL,
  amount DECIMAL(20, 2) NOT NULL,
  entry_price DECIMAL(20, 8) NOT NULL,
  payout_percent INTEGER NOT NULL,
  expiry_time BIGINT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost', 'refunded')),
  result_price DECIMAL(20, 8),
  created_at TIMESTAMPTZ DEFAULT now(),
  settled_at TIMESTAMPTZ
);

-- 4. Improved PLACE_BINARY_TRADE with Transaction Logging
CREATE OR REPLACE FUNCTION place_binary_trade(
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
  -- 1. Check Balance
  SELECT balance INTO v_current_balance FROM profiles WHERE id = p_user_id FOR UPDATE;
  IF v_current_balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'message', 'Insufficient balance');
  END IF;

  -- 2. Deduct funds
  UPDATE profiles SET balance = balance - p_amount WHERE id = p_user_id;

  -- 3. Insert Binary Trade Record
  INSERT INTO binary_trades (user_id, type, asset_symbol, amount, entry_price, payout_percent, expiry_time, status)
  VALUES (p_user_id, p_type, p_asset_symbol, p_amount, p_entry_price, p_payout_percent, p_expiry_time, 'pending')
  RETURNING id INTO v_trade_id;

  -- 4. LOG TRANSACTION (The Missing Step)
  INSERT INTO transactions (user_id, type, asset_symbol, amount, price, total, status, binary_type, binary_trade_id)
  VALUES (p_user_id, 'buy', p_asset_symbol, p_amount / p_entry_price, p_entry_price, p_amount, 'success', p_type, v_trade_id);

  RETURN jsonb_build_object('success', true, 'message', 'Trade placed successfully', 'trade_id', v_trade_id);
END;
$$ LANGUAGE plpgsql;

-- 5. Improved RESOLVE_BINARY_TRADE with Transaction Logging
CREATE OR REPLACE FUNCTION resolve_binary_trade(
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
BEGIN
  -- 1. Lock and Check Status
  SELECT user_id, status, asset_symbol, amount, type 
  INTO v_user_id, v_current_status, v_asset_symbol, v_amount, v_binary_type 
  FROM binary_trades WHERE id = p_trade_id FOR UPDATE;
  
  IF v_current_status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Trade already resolved');
  END IF;

  -- 2. Update Trade Status
  UPDATE binary_trades 
  SET status = p_new_status, result_price = p_result_price, settled_at = now()
  WHERE id = p_trade_id;

  -- 3. If Won, add funds back
  IF p_payout_amount > 0 THEN
    UPDATE profiles SET balance = balance + p_payout_amount WHERE id = v_user_id;
  END IF;

  -- 4. LOG RESULT TRANSACTION (The Missing Step)
  INSERT INTO transactions (user_id, type, asset_symbol, amount, price, total, status, binary_type, binary_result, binary_trade_id)
  VALUES (
    v_user_id, 
    CASE WHEN p_new_status = 'won' THEN 'win' ELSE 'loss' END, 
    v_asset_symbol, 
    v_amount, -- Reference amount
    p_result_price, 
    p_payout_amount, 
    'success', 
    v_binary_type, 
    p_new_status, 
    p_trade_id
  );

  RETURN jsonb_build_object('success', true, 'message', 'Trade resolved successfully');
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- PATCH 4.1: Language column + Activity Dashboard Indexes
-- Run this block if upgrading from Schema 4.0 to 4.1
-- ============================================================

-- Add language preference column to profiles (if missing)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS language text DEFAULT 'en';

-- Performance indexes for Admin Activity Dashboard date-range queries
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
CREATE INDEX IF NOT EXISTS idx_binary_trades_created_at ON public.binary_trades(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_history_created_at ON public.user_login_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_login_history_user_id ON public.user_login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_code ON public.profiles(code);

-- ============================================================
-- PATCH 4.1b: Admin Audit Logs Table (new table)
-- Run this block if admin_audit_logs table is missing
-- ============================================================

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  admin_email text,
  target_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  target_user_email text,
  action_type text NOT NULL,
  description text,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- Disable RLS (consistent with project policy)
ALTER TABLE public.admin_audit_logs DISABLE ROW LEVEL SECURITY;

-- Grant access
GRANT ALL ON public.admin_audit_logs TO anon;
GRANT ALL ON public.admin_audit_logs TO authenticated;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON public.admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);
