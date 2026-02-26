
-- Add columns for celebration posts
ALTER TABLE community_posts 
  ADD COLUMN IF NOT EXISTS post_type TEXT DEFAULT 'user' NOT NULL,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT NULL;

-- Index for querying celebration posts
CREATE INDEX IF NOT EXISTS idx_community_posts_post_type 
  ON community_posts(post_type) WHERE post_type = 'celebration';

-- Index for cleanup of expired posts
CREATE INDEX IF NOT EXISTS idx_community_posts_expires 
  ON community_posts(expires_at) WHERE expires_at IS NOT NULL;

-- Function to cleanup expired posts
CREATE OR REPLACE FUNCTION public.cleanup_expired_posts() 
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM community_posts WHERE expires_at IS NOT NULL AND expires_at < now();
END;
$$;
