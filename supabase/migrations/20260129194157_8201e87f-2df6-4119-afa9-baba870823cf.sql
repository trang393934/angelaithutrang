-- Drop the existing policy
DROP POLICY IF EXISTS "Anyone can view public or official circles" ON public.community_circles;

-- Create new policy with explicit TO clause for anon and authenticated
CREATE POLICY "Anyone can view public or official circles" 
ON public.community_circles 
AS PERMISSIVE
FOR SELECT 
TO anon, authenticated
USING (
  circle_type = 'public' 
  OR is_official = true 
  OR is_admin() 
  OR (EXISTS (
    SELECT 1 FROM circle_members 
    WHERE circle_members.circle_id = community_circles.id 
    AND circle_members.user_id = auth.uid()
  ))
);