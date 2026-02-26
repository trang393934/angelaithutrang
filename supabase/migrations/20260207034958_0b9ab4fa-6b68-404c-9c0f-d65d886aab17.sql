
-- Add receipt_public_id, context tracking columns to coin_gifts
ALTER TABLE public.coin_gifts 
  ADD COLUMN IF NOT EXISTS receipt_public_id TEXT UNIQUE DEFAULT gen_random_uuid()::text,
  ADD COLUMN IF NOT EXISTS context_type TEXT NOT NULL DEFAULT 'global',
  ADD COLUMN IF NOT EXISTS context_id UUID;

-- Add tip_gift_id to direct_messages for linking tip messages
ALTER TABLE public.direct_messages 
  ADD COLUMN IF NOT EXISTS tip_gift_id UUID REFERENCES public.coin_gifts(id);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_coin_gifts_receipt ON public.coin_gifts(receipt_public_id);
CREATE INDEX IF NOT EXISTS idx_coin_gifts_sender_date ON public.coin_gifts(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coin_gifts_receiver_date ON public.coin_gifts(receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coin_gifts_context ON public.coin_gifts(context_type, context_id);

-- RLS policy for public receipt viewing
CREATE POLICY "Anyone can view gift receipts by public id"
ON public.coin_gifts
FOR SELECT
USING (receipt_public_id IS NOT NULL);
