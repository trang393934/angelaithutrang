
-- Create slug_history table for tracking slug changes
CREATE TABLE public.slug_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content_type text NOT NULL DEFAULT 'post',
  old_slug text NOT NULL,
  new_slug text NOT NULL,
  content_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookup by (user_id, content_type, old_slug)
CREATE INDEX idx_slug_history_lookup 
  ON public.slug_history (user_id, content_type, old_slug);

-- Enable RLS
ALTER TABLE public.slug_history ENABLE ROW LEVEL SECURITY;

-- Anyone can read (needed for redirect lookups)
CREATE POLICY "Anyone can read slug history"
  ON public.slug_history FOR SELECT
  USING (true);

-- Only authenticated users can insert their own slug history
CREATE POLICY "Users can insert own slug history"
  ON public.slug_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);
