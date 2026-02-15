
-- Function 1: Check only (no increment)
CREATE OR REPLACE FUNCTION public.check_ai_usage_only(
  _user_id uuid,
  _usage_type text,
  _daily_limit integer DEFAULT NULL
)
RETURNS TABLE(allowed boolean, current_count integer, daily_limit integer, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _current_count INTEGER;
BEGIN
  -- Ensure today's record exists
  INSERT INTO public.ai_usage_tracking (user_id, usage_type, usage_date, usage_count)
  VALUES (_user_id, _usage_type, CURRENT_DATE, 0)
  ON CONFLICT (user_id, usage_type, usage_date) DO NOTHING;

  SELECT usage_count INTO _current_count
  FROM public.ai_usage_tracking
  WHERE user_id = _user_id
    AND usage_type = _usage_type
    AND usage_date = CURRENT_DATE;

  IF _daily_limit IS NOT NULL AND _current_count >= _daily_limit THEN
    RETURN QUERY SELECT
      FALSE,
      _current_count,
      _daily_limit,
      'Đã đạt giới hạn ' || _daily_limit || ' lần/ngày cho tính năng này'::TEXT;
    RETURN;
  END IF;

  RETURN QUERY SELECT
    TRUE,
    _current_count,
    _daily_limit,
    'OK'::TEXT;
END;
$$;

-- Function 2: Increment only (called after success)
CREATE OR REPLACE FUNCTION public.increment_ai_usage(
  _user_id uuid,
  _usage_type text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _new_count INTEGER;
BEGIN
  UPDATE public.ai_usage_tracking
  SET usage_count = usage_count + 1, updated_at = now()
  WHERE user_id = _user_id
    AND usage_type = _usage_type
    AND usage_date = CURRENT_DATE
  RETURNING usage_count INTO _new_count;

  RETURN COALESCE(_new_count, 0);
END;
$$;
