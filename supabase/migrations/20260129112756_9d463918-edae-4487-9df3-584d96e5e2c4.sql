
-- Create function to get admin statistics without row limits
CREATE OR REPLACE FUNCTION public.get_admin_statistics(
  _date_filter timestamp with time zone DEFAULT NULL,
  _today_start timestamp with time zone DEFAULT NULL,
  _week_start timestamp with time zone DEFAULT NULL
)
RETURNS TABLE(
  total_coins_distributed bigint,
  total_transactions bigint,
  unique_recipients bigint,
  average_per_transaction bigint,
  today_coins bigint,
  week_coins bigint,
  total_users bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _total_coins BIGINT;
  _total_tx BIGINT;
  _unique_users BIGINT;
  _today_coins BIGINT;
  _week_coins BIGINT;
  _users_count BIGINT;
BEGIN
  -- Total stats with optional date filter
  IF _date_filter IS NOT NULL THEN
    SELECT COALESCE(SUM(amount), 0), COUNT(*), COUNT(DISTINCT user_id)
    INTO _total_coins, _total_tx, _unique_users
    FROM camly_coin_transactions
    WHERE amount > 0 AND created_at >= _date_filter;
  ELSE
    SELECT COALESCE(SUM(amount), 0), COUNT(*), COUNT(DISTINCT user_id)
    INTO _total_coins, _total_tx, _unique_users
    FROM camly_coin_transactions
    WHERE amount > 0;
  END IF;

  -- Today stats
  SELECT COALESCE(SUM(amount), 0)
  INTO _today_coins
  FROM camly_coin_transactions
  WHERE amount > 0 
    AND created_at >= COALESCE(_today_start, CURRENT_DATE::timestamp with time zone);

  -- Week stats
  SELECT COALESCE(SUM(amount), 0)
  INTO _week_coins
  FROM camly_coin_transactions
  WHERE amount > 0 
    AND created_at >= COALESCE(_week_start, NOW() - INTERVAL '7 days');

  -- Total users from light agreements
  SELECT COUNT(*) INTO _users_count FROM user_light_agreements;

  RETURN QUERY SELECT
    _total_coins,
    _total_tx,
    _unique_users,
    CASE WHEN _total_tx > 0 THEN _total_coins / _total_tx ELSE 0 END,
    _today_coins,
    _week_coins,
    _users_count;
END;
$$;

-- Create function to get transaction type statistics
CREATE OR REPLACE FUNCTION public.get_transaction_type_stats(
  _date_filter timestamp with time zone DEFAULT NULL
)
RETURNS TABLE(
  transaction_type text,
  total_amount bigint,
  transaction_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _date_filter IS NOT NULL THEN
    RETURN QUERY
    SELECT 
      t.transaction_type::text,
      COALESCE(SUM(t.amount), 0)::bigint,
      COUNT(*)::bigint
    FROM camly_coin_transactions t
    WHERE t.amount > 0 AND t.created_at >= _date_filter
    GROUP BY t.transaction_type
    ORDER BY SUM(t.amount) DESC;
  ELSE
    RETURN QUERY
    SELECT 
      t.transaction_type::text,
      COALESCE(SUM(t.amount), 0)::bigint,
      COUNT(*)::bigint
    FROM camly_coin_transactions t
    WHERE t.amount > 0
    GROUP BY t.transaction_type
    ORDER BY SUM(t.amount) DESC;
  END IF;
END;
$$;

-- Create function to get top recipients
CREATE OR REPLACE FUNCTION public.get_top_recipients(
  _date_filter timestamp with time zone DEFAULT NULL,
  _limit integer DEFAULT 10
)
RETURNS TABLE(
  user_id uuid,
  display_name text,
  avatar_url text,
  total_earned bigint,
  transaction_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _date_filter IS NOT NULL THEN
    RETURN QUERY
    SELECT 
      t.user_id,
      p.display_name,
      p.avatar_url,
      COALESCE(SUM(t.amount), 0)::bigint as total_earned,
      COUNT(*)::bigint as transaction_count
    FROM camly_coin_transactions t
    LEFT JOIN profiles p ON t.user_id = p.user_id
    WHERE t.amount > 0 AND t.created_at >= _date_filter
    GROUP BY t.user_id, p.display_name, p.avatar_url
    ORDER BY total_earned DESC
    LIMIT _limit;
  ELSE
    RETURN QUERY
    SELECT 
      t.user_id,
      p.display_name,
      p.avatar_url,
      COALESCE(SUM(t.amount), 0)::bigint as total_earned,
      COUNT(*)::bigint as transaction_count
    FROM camly_coin_transactions t
    LEFT JOIN profiles p ON t.user_id = p.user_id
    WHERE t.amount > 0
    GROUP BY t.user_id, p.display_name, p.avatar_url
    ORDER BY total_earned DESC
    LIMIT _limit;
  END IF;
END;
$$;

-- Create function to get daily trends
CREATE OR REPLACE FUNCTION public.get_daily_trends(
  _date_filter timestamp with time zone DEFAULT NULL
)
RETURNS TABLE(
  trend_date date,
  total_coins bigint,
  transaction_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _date_filter IS NOT NULL THEN
    RETURN QUERY
    SELECT 
      DATE(created_at AT TIME ZONE 'Asia/Ho_Chi_Minh') as trend_date,
      COALESCE(SUM(amount), 0)::bigint as total_coins,
      COUNT(*)::bigint as transaction_count
    FROM camly_coin_transactions
    WHERE amount > 0 AND created_at >= _date_filter
    GROUP BY DATE(created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')
    ORDER BY trend_date ASC;
  ELSE
    RETURN QUERY
    SELECT 
      DATE(created_at AT TIME ZONE 'Asia/Ho_Chi_Minh') as trend_date,
      COALESCE(SUM(amount), 0)::bigint as total_coins,
      COUNT(*)::bigint as transaction_count
    FROM camly_coin_transactions
    WHERE amount > 0
    GROUP BY DATE(created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')
    ORDER BY trend_date ASC;
  END IF;
END;
$$;
