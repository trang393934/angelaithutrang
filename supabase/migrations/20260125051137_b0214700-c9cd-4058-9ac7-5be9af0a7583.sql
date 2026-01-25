-- Add image_urls column to support multiple images (up to 30)
ALTER TABLE public.community_posts 
ADD COLUMN image_urls text[] DEFAULT '{}';

-- Migrate existing single image_url to image_urls array
UPDATE public.community_posts 
SET image_urls = ARRAY[image_url] 
WHERE image_url IS NOT NULL AND image_url != '';

-- Add comment for clarity
COMMENT ON COLUMN public.community_posts.image_urls IS 'Array of image URLs, max 30 images per post';