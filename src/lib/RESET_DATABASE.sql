-- ============================================================
-- NEXUS OPTION: QUICK DATA RESET (for testing)
-- Run this to clear all user data without dropping tables
-- ============================================================

-- Clear all data (order matters due to FK constraints)
DELETE FROM public.portfolio;
DELETE FROM public.transactions;
DELETE FROM public.binary_trades;
DELETE FROM public.profiles;

-- Reset sequences if any (uuid_generate_v4 doesn't use sequences, so none needed)

-- Confirm
SELECT 'Reset complete' as status,
  (SELECT count(*) FROM public.profiles) as profiles_count,
  (SELECT count(*) FROM public.transactions) as transactions_count,
  (SELECT count(*) FROM public.portfolio) as portfolio_count;
