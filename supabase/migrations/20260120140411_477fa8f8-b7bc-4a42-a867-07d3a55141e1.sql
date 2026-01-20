-- Add cover_photo_url column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS cover_photo_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.cover_photo_url IS 'URL to user cover photo stored in avatars bucket';