-- Add RLS policy for Admins to view all user_light_agreements
CREATE POLICY "Admins can view all agreements"
ON public.user_light_agreements
FOR SELECT
USING (public.is_admin());