-- Fix RLS policy for community_circles to allow viewing official circles
DROP POLICY IF EXISTS "Anyone can view public circles" ON public.community_circles;

CREATE POLICY "Anyone can view public or official circles" 
ON public.community_circles 
FOR SELECT 
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