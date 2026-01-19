-- Update the get_extended_daily_reward_status function to use 5 shares limit instead of 3
CREATE OR REPLACE FUNCTION public.get_extended_daily_reward_status(_user_id uuid)
 RETURNS TABLE(questions_rewarded integer, questions_remaining integer, journals_rewarded integer, journals_remaining integer, can_write_journal boolean, logins_rewarded integer, shares_rewarded integer, shares_remaining integer, feedbacks_rewarded integer, feedbacks_remaining integer, ideas_submitted integer, ideas_remaining integer, community_helps_rewarded integer, community_helps_remaining integer, knowledge_uploads integer, knowledge_uploads_remaining integer, total_coins_today bigint, current_streak integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _tracking RECORD;
  _current_hour INTEGER;
  _streak INTEGER;
BEGIN
  -- Get current hour in Vietnam timezone (UTC+7)
  _current_hour := EXTRACT(HOUR FROM (now() AT TIME ZONE 'Asia/Ho_Chi_Minh'));
  
  -- Get or create today's tracking
  SELECT * INTO _tracking
  FROM public.daily_reward_tracking
  WHERE user_id = _user_id AND reward_date = CURRENT_DATE;
  
  IF NOT FOUND THEN
    INSERT INTO public.daily_reward_tracking (user_id, reward_date)
    VALUES (_user_id, CURRENT_DATE)
    RETURNING * INTO _tracking;
  END IF;
  
  -- Get current login streak
  SELECT COALESCE(streak_count, 0) INTO _streak
  FROM public.daily_login_tracking
  WHERE user_id = _user_id AND login_date = CURRENT_DATE;
  
  IF _streak IS NULL THEN
    _streak := 0;
  END IF;
  
  RETURN QUERY SELECT
    _tracking.questions_rewarded,
    GREATEST(0, 10 - _tracking.questions_rewarded)::INTEGER,
    _tracking.journals_rewarded,
    GREATEST(0, 3 - _tracking.journals_rewarded)::INTEGER,
    (_current_hour >= 20)::BOOLEAN,
    _tracking.logins_rewarded,
    _tracking.shares_rewarded,
    GREATEST(0, 5 - _tracking.shares_rewarded)::INTEGER,  -- Changed from 3 to 5
    _tracking.feedbacks_rewarded,
    GREATEST(0, 2 - _tracking.feedbacks_rewarded)::INTEGER,
    _tracking.ideas_submitted,
    GREATEST(0, 2 - _tracking.ideas_submitted)::INTEGER,
    _tracking.community_helps_rewarded,
    GREATEST(0, 5 - _tracking.community_helps_rewarded)::INTEGER,
    _tracking.knowledge_uploads,
    GREATEST(0, 2 - _tracking.knowledge_uploads)::INTEGER,
    _tracking.total_coins_today,
    _streak;
END;
$function$;