-- Create function to get accurate activity history stats
CREATE OR REPLACE FUNCTION public.get_activity_history_stats()
RETURNS TABLE(
  total_chats bigint,
  rewarded_chats bigint,
  total_rewards bigint,
  unique_users bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM chat_history)::bigint AS total_chats,
    (SELECT COUNT(*) FROM chat_history WHERE is_rewarded = true)::bigint AS rewarded_chats,
    (SELECT COALESCE(SUM(reward_amount), 0) FROM chat_history WHERE is_rewarded = true)::bigint AS total_rewards,
    (SELECT COUNT(*) FROM user_light_agreements)::bigint AS unique_users;
END;
$$;