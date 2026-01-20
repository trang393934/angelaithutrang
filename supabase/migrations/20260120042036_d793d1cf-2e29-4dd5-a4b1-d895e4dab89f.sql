-- Drop the public policy that allows anyone to view profiles
DROP POLICY IF EXISTS "Public can view profiles for leaderboard" ON public.profiles;

-- Create new policy: Only authenticated users can view profiles
CREATE POLICY "Authenticated users can view profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (true);
