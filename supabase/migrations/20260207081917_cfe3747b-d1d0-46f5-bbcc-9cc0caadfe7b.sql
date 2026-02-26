
-- Remove the overly permissive public SELECT policy on profiles
-- The authenticated-only policy already exists
DROP POLICY IF EXISTS "Public can view profiles for leaderboard" ON public.profiles;
