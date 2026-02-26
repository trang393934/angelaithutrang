
-- Allow authenticated users to create their own mint requests
CREATE POLICY "Users can create own mint requests"
ON public.pplp_mint_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = actor_id);

-- Allow users to update their own pending mint requests (e.g. change wallet address)
CREATE POLICY "Users can update own pending mint requests"
ON public.pplp_mint_requests
FOR UPDATE
TO authenticated
USING (auth.uid() = actor_id AND status = 'pending')
WITH CHECK (auth.uid() = actor_id AND status = 'pending');
