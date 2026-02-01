-- ============================================
-- SECURITY FIX 1: Add MIME type restrictions to storage buckets
-- ============================================

-- Add MIME restrictions to image buckets (community, avatars, stories)
UPDATE storage.buckets
SET 
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  file_size_limit = 5242880 -- 5MB
WHERE id IN ('community', 'avatars', 'stories');

-- Add MIME restrictions to AI images bucket (allow slightly larger)
UPDATE storage.buckets
SET 
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  file_size_limit = 10485760 -- 10MB
WHERE id = 'ai-images';

-- ============================================
-- SECURITY FIX 2: Add RLS policy for users to view their own roles
-- ============================================
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- ============================================
-- SECURITY FIX 3: Add database constraints to prevent duplicate rewards
-- ============================================

-- Prevent duplicate vision board first rewards
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_first_board_per_user
ON public.vision_boards (user_id)
WHERE is_first_board = true;

-- Add amount validation constraint on transactions (reasonable bounds)
ALTER TABLE public.camly_coin_transactions
ADD CONSTRAINT check_reasonable_amounts
CHECK (amount BETWEEN -1000000 AND 1000000);