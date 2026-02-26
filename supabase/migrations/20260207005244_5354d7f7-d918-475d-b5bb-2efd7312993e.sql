
-- Add tx_hash and gift_type columns to coin_gifts table
ALTER TABLE public.coin_gifts 
ADD COLUMN IF NOT EXISTS tx_hash text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS gift_type text NOT NULL DEFAULT 'internal';

-- Add comment for clarity
COMMENT ON COLUMN public.coin_gifts.tx_hash IS 'Blockchain transaction hash for Web3 gifts';
COMMENT ON COLUMN public.coin_gifts.gift_type IS 'Type of gift: internal (in-app) or web3 (on-chain CAMLY transfer)';
