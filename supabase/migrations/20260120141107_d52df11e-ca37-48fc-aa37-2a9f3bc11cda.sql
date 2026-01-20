-- Add columns for enhanced messaging features
ALTER TABLE public.direct_messages 
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text',
ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES public.direct_messages(id),
ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Create typing indicators table
CREATE TABLE IF NOT EXISTS public.typing_indicators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  conversation_partner_id UUID NOT NULL,
  is_typing BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, conversation_partner_id)
);

-- Create user online status table
CREATE TABLE IF NOT EXISTS public.user_online_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  is_online BOOLEAN DEFAULT false,
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_online_status ENABLE ROW LEVEL SECURITY;

-- RLS policies for typing indicators
CREATE POLICY "Users can view typing indicators for their conversations"
ON public.typing_indicators FOR SELECT
USING (auth.uid() = user_id OR auth.uid() = conversation_partner_id);

CREATE POLICY "Users can manage their own typing status"
ON public.typing_indicators FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own typing status"
ON public.typing_indicators FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own typing status"
ON public.typing_indicators FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for online status
CREATE POLICY "Anyone can view online status"
ON public.user_online_status FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own online status"
ON public.user_online_status FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own online status"
ON public.user_online_status FOR UPDATE
USING (auth.uid() = user_id);

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.typing_indicators;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_online_status;

-- Policy for users to delete their own messages
CREATE POLICY "Users can delete their own messages"
ON public.direct_messages FOR UPDATE
USING (auth.uid() = sender_id);