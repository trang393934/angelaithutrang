-- Add columns for tracking withdrawal processing
ALTER TABLE public.coin_withdrawals 
ADD COLUMN IF NOT EXISTS retry_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS error_message text;