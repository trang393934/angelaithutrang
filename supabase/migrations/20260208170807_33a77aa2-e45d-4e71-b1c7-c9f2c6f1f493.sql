
-- Allow admins to view ALL mint requests from all users
CREATE POLICY "Admins can view all mint requests"
ON public.pplp_mint_requests
FOR SELECT
TO authenticated
USING (is_admin());

-- Allow admins to update (approve/reject) any mint request
CREATE POLICY "Admins can manage all mint requests"
ON public.pplp_mint_requests
FOR UPDATE
TO authenticated
USING (is_admin());
