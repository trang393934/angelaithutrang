
-- 1. Performance index for user post listing
CREATE INDEX IF NOT EXISTS ix_community_posts_user_created 
  ON community_posts(user_id, created_at DESC);

-- 2. Unique constraint on slug_history to prevent duplicate old slugs per content
CREATE UNIQUE INDEX IF NOT EXISTS uq_slug_history_content_oldslug 
  ON slug_history(content_id, old_slug);

-- 3. Make slug NOT NULL: first fill missing slugs, then alter column
UPDATE community_posts SET slug = 'post_' || LEFT(id::text, 8) WHERE slug IS NULL;
ALTER TABLE community_posts ALTER COLUMN slug SET NOT NULL;

-- 4. Recreate unique index without the WHERE clause (since slug is now NOT NULL)
DROP INDEX IF EXISTS idx_community_posts_user_slug;
CREATE UNIQUE INDEX idx_community_posts_user_slug ON community_posts(user_id, slug);
