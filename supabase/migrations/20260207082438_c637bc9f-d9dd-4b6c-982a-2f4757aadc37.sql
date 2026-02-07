
-- Fix: Restrict user_online_status to authenticated users only
DROP POLICY IF EXISTS "Anyone can view online status" ON public.user_online_status;

CREATE POLICY "Authenticated users can view online status"
  ON public.user_online_status
  FOR SELECT
  TO authenticated
  USING (true);
