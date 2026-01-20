-- Create chat_history table to store full Q&A for activity history
CREATE TABLE public.chat_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  question_text TEXT NOT NULL,
  answer_text TEXT NOT NULL,
  question_id UUID REFERENCES public.chat_questions(id) ON DELETE SET NULL,
  purity_score NUMERIC(3,2),
  reward_amount BIGINT DEFAULT 0,
  is_rewarded BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_chat_history_user_id ON public.chat_history(user_id);
CREATE INDEX idx_chat_history_created_at ON public.chat_history(created_at DESC);

-- Enable RLS
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;

-- Only users can view their own history
CREATE POLICY "Users can view their own chat history"
  ON public.chat_history FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all history
CREATE POLICY "Admins can view all chat history"
  ON public.chat_history FOR SELECT
  USING (public.is_admin());

-- System/Edge functions can insert (via service role)
CREATE POLICY "Users can insert their own chat history"
  ON public.chat_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can manage all
CREATE POLICY "Admins can manage chat history"
  ON public.chat_history FOR ALL
  USING (public.is_admin());

-- Add comment
COMMENT ON TABLE public.chat_history IS 'Stores complete chat Q&A history for user activity tracking. Only visible to the user and admins.';