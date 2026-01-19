
-- Add public read access for leaderboard functionality
-- Profiles: Allow everyone to see display_name and avatar_url for leaderboard
CREATE POLICY "Public can view profiles for leaderboard" 
ON public.profiles 
FOR SELECT 
USING (true);

-- Camly coin balances: Allow everyone to see balances for leaderboard
CREATE POLICY "Public can view balances for leaderboard" 
ON public.camly_coin_balances 
FOR SELECT 
USING (true);

-- Knowledge documents: Allow everyone to view documents (public knowledge base)
CREATE POLICY "Public can view knowledge documents" 
ON public.knowledge_documents 
FOR SELECT 
USING (true);

-- Knowledge folders: Allow everyone to view folders
CREATE POLICY "Public can view knowledge folders" 
ON public.knowledge_folders 
FOR SELECT 
USING (true);
