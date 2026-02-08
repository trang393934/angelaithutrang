
-- Create lixi_claims table
CREATE TABLE public.lixi_claims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  notification_id UUID NOT NULL REFERENCES public.notifications(id),
  camly_amount BIGINT NOT NULL,
  fun_amount BIGINT NOT NULL,
  wallet_address TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  tx_hash TEXT,
  claimed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID,
  error_message TEXT
);

-- Enable RLS
ALTER TABLE public.lixi_claims ENABLE ROW LEVEL SECURITY;

-- Users can view their own claims
CREATE POLICY "Users can view their own claims"
ON public.lixi_claims
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own claims
CREATE POLICY "Users can create their own claims"
ON public.lixi_claims
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can manage all claims
CREATE POLICY "Admins can manage all claims"
ON public.lixi_claims
FOR ALL
USING (public.is_admin());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.lixi_claims;
