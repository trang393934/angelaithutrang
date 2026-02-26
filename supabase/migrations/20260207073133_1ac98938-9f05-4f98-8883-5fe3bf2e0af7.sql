
-- Fix overly permissive INSERT policy - restrict to service role only by removing the policy
-- Service role bypasses RLS anyway, so we don't need an INSERT policy for regular users
DROP POLICY "Service role can insert notifications" ON public.notifications;
