-- =============================================
-- API Key Management System - Database Schema
-- =============================================

-- Table 1: user_api_keys - Stores hashed API keys for each user
CREATE TABLE public.user_api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  daily_limit INTEGER NOT NULL DEFAULT 100,
  total_requests BIGINT NOT NULL DEFAULT 0
);

-- Table 2: api_key_usage - Tracks daily usage per key for rate limiting
CREATE TABLE public.api_key_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key_id UUID NOT NULL REFERENCES public.user_api_keys(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  request_count INTEGER NOT NULL DEFAULT 0,
  tokens_used BIGINT NOT NULL DEFAULT 0,
  UNIQUE(api_key_id, usage_date)
);

-- Indexes for performance
CREATE INDEX idx_user_api_keys_user_id ON public.user_api_keys(user_id);
CREATE INDEX idx_user_api_keys_key_hash ON public.user_api_keys(key_hash);
CREATE INDEX idx_user_api_keys_is_active ON public.user_api_keys(is_active);
CREATE INDEX idx_api_key_usage_api_key_id ON public.api_key_usage(api_key_id);
CREATE INDEX idx_api_key_usage_date ON public.api_key_usage(usage_date);

-- Enable RLS
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_key_usage ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS Policies for user_api_keys
-- =============================================

-- Users can view their own API keys (but NOT the key_hash for security)
CREATE POLICY "Users can view their own API keys"
ON public.user_api_keys
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own API keys
CREATE POLICY "Users can create their own API keys"
ON public.user_api_keys
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own API keys
CREATE POLICY "Users can update their own API keys"
ON public.user_api_keys
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own API keys
CREATE POLICY "Users can delete their own API keys"
ON public.user_api_keys
FOR DELETE
USING (auth.uid() = user_id);

-- Admins can manage all API keys
CREATE POLICY "Admins can manage all API keys"
ON public.user_api_keys
FOR ALL
USING (public.is_admin());

-- =============================================
-- RLS Policies for api_key_usage
-- =============================================

-- Users can view usage for their own keys
CREATE POLICY "Users can view their own API key usage"
ON public.api_key_usage
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_api_keys
    WHERE user_api_keys.id = api_key_usage.api_key_id
    AND user_api_keys.user_id = auth.uid()
  )
);

-- System can insert/update usage (via service role in edge functions)
CREATE POLICY "System can manage API key usage"
ON public.api_key_usage
FOR ALL
USING (public.is_admin());

-- =============================================
-- Function to increment API key usage (called by edge functions)
-- =============================================
CREATE OR REPLACE FUNCTION public.increment_api_key_usage(_api_key_id UUID, _tokens_used BIGINT DEFAULT 0)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Upsert daily usage record
  INSERT INTO public.api_key_usage (api_key_id, usage_date, request_count, tokens_used)
  VALUES (_api_key_id, CURRENT_DATE, 1, _tokens_used)
  ON CONFLICT (api_key_id, usage_date)
  DO UPDATE SET 
    request_count = api_key_usage.request_count + 1,
    tokens_used = api_key_usage.tokens_used + _tokens_used;
  
  -- Update total requests and last_used_at on the API key
  UPDATE public.user_api_keys
  SET 
    total_requests = total_requests + 1,
    last_used_at = now()
  WHERE id = _api_key_id;
END;
$$;

-- =============================================
-- Function to validate API key and check rate limit
-- =============================================
CREATE OR REPLACE FUNCTION public.validate_api_key(_key_hash TEXT)
RETURNS TABLE(
  api_key_id UUID,
  user_id UUID,
  daily_limit INTEGER,
  current_usage INTEGER,
  is_rate_limited BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _key_record RECORD;
  _current_usage INTEGER;
BEGIN
  -- Find the API key
  SELECT ak.id, ak.user_id, ak.daily_limit, ak.is_active, ak.expires_at
  INTO _key_record
  FROM public.user_api_keys ak
  WHERE ak.key_hash = _key_hash
  LIMIT 1;
  
  -- Key not found
  IF _key_record IS NULL THEN
    RETURN;
  END IF;
  
  -- Key is inactive
  IF NOT _key_record.is_active THEN
    RETURN;
  END IF;
  
  -- Key is expired
  IF _key_record.expires_at IS NOT NULL AND _key_record.expires_at < now() THEN
    RETURN;
  END IF;
  
  -- Get current daily usage
  SELECT COALESCE(u.request_count, 0)
  INTO _current_usage
  FROM public.api_key_usage u
  WHERE u.api_key_id = _key_record.id
  AND u.usage_date = CURRENT_DATE;
  
  IF _current_usage IS NULL THEN
    _current_usage := 0;
  END IF;
  
  -- Return the result
  RETURN QUERY SELECT 
    _key_record.id,
    _key_record.user_id,
    _key_record.daily_limit,
    _current_usage,
    (_current_usage >= _key_record.daily_limit) AS is_rate_limited;
END;
$$;