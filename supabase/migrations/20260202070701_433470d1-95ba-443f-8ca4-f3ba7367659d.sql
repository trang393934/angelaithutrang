
-- First drop the existing function
DROP FUNCTION IF EXISTS public.get_activity_history_stats();

-- Recreate with correct return types and proper stats calculation
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
    (SELECT COUNT(*) FROM camly_coin_transactions WHERE transaction_type = 'chat_reward'::coin_transaction_type)::bigint AS rewarded_chats,
    (SELECT COALESCE(SUM(lifetime_earned), 0) FROM camly_coin_balances)::bigint AS total_rewards,
    (SELECT COUNT(*) FROM user_light_agreements)::bigint AS unique_users;
END;
$$;
