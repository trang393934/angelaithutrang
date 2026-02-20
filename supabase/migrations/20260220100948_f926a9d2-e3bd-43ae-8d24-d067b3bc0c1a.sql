
-- Allow public (unauthenticated) users to read active suspensions
-- This is needed so the leaderboard can filter out suspended users for all visitors
CREATE POLICY "Public can view active suspensions for leaderboard"
ON public.user_suspensions
FOR SELECT
USING (true);
