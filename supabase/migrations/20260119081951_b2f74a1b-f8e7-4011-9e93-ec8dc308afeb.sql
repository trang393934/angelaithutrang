-- Create table to store user light agreement status
CREATE TABLE public.user_light_agreements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  agreed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_light_agreements ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own agreement" 
ON public.user_light_agreements 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own agreement" 
ON public.user_light_agreements 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add index for faster lookups
CREATE INDEX idx_user_light_agreements_user_id ON public.user_light_agreements(user_id);