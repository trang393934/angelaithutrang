-- Create AI usage tracking table
CREATE TABLE public.ai_usage_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  usage_type TEXT NOT NULL, -- 'chat', 'generate_image', 'analyze_image', 'edit_image'
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, usage_type, usage_date)
);

-- Enable RLS
ALTER TABLE public.ai_usage_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own usage"
ON public.ai_usage_tracking
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can manage usage tracking"
ON public.ai_usage_tracking
FOR ALL
USING ((auth.uid() = user_id) OR is_admin());

CREATE POLICY "Admins can view all usage"
ON public.ai_usage_tracking
FOR SELECT
USING (is_admin());

-- Function to increment usage and check limits
CREATE OR REPLACE FUNCTION public.check_and_increment_ai_usage(
  _user_id UUID,
  _usage_type TEXT,
  _daily_limit INTEGER DEFAULT NULL
)
RETURNS TABLE(allowed BOOLEAN, current_count INTEGER, daily_limit INTEGER, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _current_count INTEGER;
BEGIN
  -- Get or create today's usage record
  INSERT INTO public.ai_usage_tracking (user_id, usage_type, usage_date, usage_count)
  VALUES (_user_id, _usage_type, CURRENT_DATE, 0)
  ON CONFLICT (user_id, usage_type, usage_date) DO NOTHING;
  
  -- Get current count
  SELECT usage_count INTO _current_count
  FROM public.ai_usage_tracking
  WHERE user_id = _user_id 
    AND usage_type = _usage_type 
    AND usage_date = CURRENT_DATE;
  
  -- Check limit if specified
  IF _daily_limit IS NOT NULL AND _current_count >= _daily_limit THEN
    RETURN QUERY SELECT 
      FALSE AS allowed,
      _current_count AS current_count,
      _daily_limit AS daily_limit,
      'Đã đạt giới hạn ' || _daily_limit || ' lần/ngày cho tính năng này'::TEXT AS message;
    RETURN;
  END IF;
  
  -- Increment usage
  UPDATE public.ai_usage_tracking
  SET usage_count = usage_count + 1, updated_at = now()
  WHERE user_id = _user_id 
    AND usage_type = _usage_type 
    AND usage_date = CURRENT_DATE;
  
  RETURN QUERY SELECT 
    TRUE AS allowed,
    (_current_count + 1) AS current_count,
    _daily_limit AS daily_limit,
    'OK'::TEXT AS message;
END;
$$;

-- Function to get user's daily AI usage summary
CREATE OR REPLACE FUNCTION public.get_daily_ai_usage(_user_id UUID)
RETURNS TABLE(
  usage_type TEXT,
  usage_count INTEGER,
  daily_limit INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.usage_type,
    COALESCE(a.usage_count, 0) AS usage_count,
    CASE t.usage_type
      WHEN 'generate_image' THEN 5
      WHEN 'edit_image' THEN 5
      ELSE NULL::INTEGER
    END AS daily_limit
  FROM (
    VALUES ('chat'), ('generate_image'), ('analyze_image'), ('edit_image')
  ) AS t(usage_type)
  LEFT JOIN public.ai_usage_tracking a 
    ON a.user_id = _user_id 
    AND a.usage_type = t.usage_type 
    AND a.usage_date = CURRENT_DATE;
END;
$$;