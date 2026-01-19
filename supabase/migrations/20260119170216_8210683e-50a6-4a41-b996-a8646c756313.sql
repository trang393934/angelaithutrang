-- Create table to store user wallet addresses with change tracking
CREATE TABLE public.user_wallet_addresses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  wallet_address TEXT,
  change_count_this_month INTEGER NOT NULL DEFAULT 0,
  last_change_month TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_wallet_addresses ENABLE ROW LEVEL SECURITY;

-- Users can view their own wallet address
CREATE POLICY "Users can view their own wallet address"
ON public.user_wallet_addresses
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own wallet address
CREATE POLICY "Users can insert their own wallet address"
ON public.user_wallet_addresses
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own wallet address
CREATE POLICY "Users can update their own wallet address"
ON public.user_wallet_addresses
FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can manage all wallet addresses
CREATE POLICY "Admins can manage all wallet addresses"
ON public.user_wallet_addresses
FOR ALL
USING (is_admin());

-- Create trigger to update updated_at
CREATE TRIGGER update_user_wallet_addresses_updated_at
BEFORE UPDATE ON public.user_wallet_addresses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();