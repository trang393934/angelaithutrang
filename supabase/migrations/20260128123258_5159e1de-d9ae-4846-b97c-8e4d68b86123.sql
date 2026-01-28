-- Create image history table for storing generated and analyzed images
CREATE TABLE public.image_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  image_type TEXT NOT NULL CHECK (image_type IN ('generated', 'analyzed')),
  prompt TEXT NOT NULL,
  response_text TEXT,
  image_url TEXT NOT NULL,
  style TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_image_history_user_id ON public.image_history(user_id);
CREATE INDEX idx_image_history_created_at ON public.image_history(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.image_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own image history"
  ON public.image_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own image history"
  ON public.image_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own image history"
  ON public.image_history FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all image history"
  ON public.image_history FOR ALL
  USING (public.is_admin());