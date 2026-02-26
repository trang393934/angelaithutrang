-- Add slug column to community_posts
ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS slug text;

-- Create unique constraint per user (user_id + slug)
CREATE UNIQUE INDEX IF NOT EXISTS idx_community_posts_user_slug 
ON public.community_posts (user_id, slug) WHERE slug IS NOT NULL;

-- Backfill existing posts with auto-generated slugs (post_1, post_2, etc.)
WITH numbered AS (
  SELECT id, user_id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) AS rn
  FROM public.community_posts
  WHERE slug IS NULL
)
UPDATE public.community_posts cp
SET slug = 'post_' || n.rn
FROM numbered n
WHERE cp.id = n.id;