-- Add new transaction types to enum
ALTER TYPE coin_transaction_type ADD VALUE IF NOT EXISTS 'gift_sent';
ALTER TYPE coin_transaction_type ADD VALUE IF NOT EXISTS 'gift_received';
ALTER TYPE coin_transaction_type ADD VALUE IF NOT EXISTS 'project_donation';

-- Create coin_gifts table (user-to-user gifting)
CREATE TABLE public.coin_gifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  amount bigint NOT NULL CHECK (amount > 0),
  message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create project_donations table (donate to Angel AI project)
CREATE TABLE public.project_donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id uuid NOT NULL,
  amount bigint NOT NULL CHECK (amount > 0),
  message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_coin_gifts_sender ON public.coin_gifts(sender_id);
CREATE INDEX idx_coin_gifts_receiver ON public.coin_gifts(receiver_id);
CREATE INDEX idx_coin_gifts_created ON public.coin_gifts(created_at DESC);
CREATE INDEX idx_project_donations_donor ON public.project_donations(donor_id);
CREATE INDEX idx_project_donations_created ON public.project_donations(created_at DESC);

-- Enable RLS
ALTER TABLE public.coin_gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_donations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for coin_gifts
-- Public can view for honor board
CREATE POLICY "Public can view gifts for honor board"
ON public.coin_gifts FOR SELECT
USING (true);

-- Users can create gifts where they are the sender
CREATE POLICY "Users can send gifts"
ON public.coin_gifts FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- RLS Policies for project_donations
-- Public can view for honor board
CREATE POLICY "Public can view donations for honor board"
ON public.project_donations FOR SELECT
USING (true);

-- Users can create donations
CREATE POLICY "Users can donate"
ON public.project_donations FOR INSERT
WITH CHECK (auth.uid() = donor_id);

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.coin_gifts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_donations;