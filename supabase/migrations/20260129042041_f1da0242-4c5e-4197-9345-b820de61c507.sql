-- Add RLS policy to allow public reading of profiles for leaderboard
CREATE POLICY "Public can view profiles for leaderboard"
ON public.profiles
FOR SELECT
USING (true);