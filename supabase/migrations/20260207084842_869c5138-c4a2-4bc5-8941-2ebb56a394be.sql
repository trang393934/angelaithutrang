-- 1. Profiles: allow public read
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
CREATE POLICY "Anyone can view profiles"
  ON public.profiles FOR SELECT
  TO public
  USING (true);

-- 2. Online status: allow public read
DROP POLICY IF EXISTS "Authenticated users can view online status" ON public.user_online_status;
CREATE POLICY "Anyone can view online status"
  ON public.user_online_status FOR SELECT
  TO public
  USING (true);