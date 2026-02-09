
-- Allow authenticated users to read any user's wallet address (needed for gifting feature)
CREATE POLICY "Authenticated users can view wallet addresses for gifting"
ON public.user_wallet_addresses
FOR SELECT
USING (auth.uid() IS NOT NULL);
