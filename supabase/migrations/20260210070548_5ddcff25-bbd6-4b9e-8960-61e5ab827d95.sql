
-- Add social_links JSONB column to profiles table
ALTER TABLE public.profiles ADD COLUMN social_links JSONB DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.social_links IS 'Stores social media links as JSON: {facebook: "url", instagram: "url", tiktok: "url", youtube: "url", linkedin: "url", twitter: "url", website: "url", telegram: "url", discord: "url"}';
