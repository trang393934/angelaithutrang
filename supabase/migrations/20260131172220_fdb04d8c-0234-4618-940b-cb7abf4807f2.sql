-- Create bucket for AI generated images
INSERT INTO storage.buckets (id, name, public)
VALUES ('ai-images', 'ai-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies cho bucket
CREATE POLICY "AI images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'ai-images');

CREATE POLICY "Authenticated users can upload AI images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'ai-images');

CREATE POLICY "Users can delete their own AI images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'ai-images' AND (storage.foldername(name))[1] = auth.uid()::text);