-- Create chat_feedback table for storing like/dislike feedback on AI responses
CREATE TABLE public.chat_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  question_text TEXT NOT NULL,
  answer_text TEXT NOT NULL,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('like', 'dislike')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, question_text)
);

-- Enable RLS
ALTER TABLE public.chat_feedback ENABLE ROW LEVEL SECURITY;

-- Users can insert their own feedback
CREATE POLICY "Users can insert own feedback"
ON public.chat_feedback
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own feedback
CREATE POLICY "Users can update own feedback"
ON public.chat_feedback
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can view their own feedback
CREATE POLICY "Users can view own feedback"
ON public.chat_feedback
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all feedback for AI improvement
CREATE POLICY "Admins can view all feedback"
ON public.chat_feedback
FOR SELECT
USING (is_admin());

-- Create updated_at trigger
CREATE TRIGGER update_chat_feedback_updated_at
BEFORE UPDATE ON public.chat_feedback
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();