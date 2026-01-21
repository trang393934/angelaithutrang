-- Create community_stories table for 24h expiring stories
CREATE TABLE public.community_stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'image', -- 'image' or 'video'
  caption TEXT,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours')
);

-- Create story_views table to track who viewed which story
CREATE TABLE public.community_story_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.community_stories(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(story_id, viewer_id)
);

-- Enable RLS
ALTER TABLE public.community_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_story_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stories
CREATE POLICY "Anyone can view active stories"
ON public.community_stories
FOR SELECT
USING (expires_at > now());

CREATE POLICY "Users can create their own stories"
ON public.community_stories
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stories"
ON public.community_stories
FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for story views
CREATE POLICY "Story owners can see who viewed"
ON public.community_story_views
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.community_stories 
    WHERE id = story_id AND user_id = auth.uid()
  )
  OR viewer_id = auth.uid()
);

CREATE POLICY "Users can record their views"
ON public.community_story_views
FOR INSERT
WITH CHECK (auth.uid() = viewer_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_stories;

-- Create storage bucket for stories
INSERT INTO storage.buckets (id, name, public)
VALUES ('stories', 'stories', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for stories bucket
CREATE POLICY "Anyone can view stories media"
ON storage.objects FOR SELECT
USING (bucket_id = 'stories');

CREATE POLICY "Authenticated users can upload stories"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'stories' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own story media"
ON storage.objects FOR DELETE
USING (bucket_id = 'stories' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Function to clean up expired stories (can be called by a cron job)
CREATE OR REPLACE FUNCTION public.cleanup_expired_stories()
RETURNS void AS $$
BEGIN
  DELETE FROM public.community_stories WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;