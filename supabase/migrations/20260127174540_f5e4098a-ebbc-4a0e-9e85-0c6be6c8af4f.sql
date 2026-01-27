
-- Update the request_coin_withdrawal function to require community activity
CREATE OR REPLACE FUNCTION public.request_coin_withdrawal(_user_id uuid, _wallet_address text, _amount bigint)
 RETURNS TABLE(success boolean, message text, withdrawal_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _balance BIGINT;
  _withdrawn_today BIGINT;
  _pending_amount BIGINT;
  _daily_limit BIGINT := 500000;
  _min_withdrawal BIGINT := 200000;
  _new_withdrawal_id UUID;
  _has_post BOOLEAN;
  _has_journal BOOLEAN;
BEGIN
  -- Validate amount
  IF _amount < _min_withdrawal THEN
    RETURN QUERY SELECT FALSE, 'Số lượng rút tối thiểu là 200,000 Camly Coin', NULL::UUID;
    RETURN;
  END IF;

  -- Check for community activity today (post or journal)
  SELECT EXISTS (
    SELECT 1 FROM community_posts 
    WHERE user_id = _user_id 
    AND DATE(created_at AT TIME ZONE 'Asia/Ho_Chi_Minh') = DATE(NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')
  ) INTO _has_post;

  SELECT EXISTS (
    SELECT 1 FROM gratitude_journal 
    WHERE user_id = _user_id 
    AND DATE(created_at AT TIME ZONE 'Asia/Ho_Chi_Minh') = DATE(NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')
  ) INTO _has_journal;

  IF NOT _has_post AND NOT _has_journal THEN
    RETURN QUERY SELECT FALSE, 'Bạn cần đăng ít nhất 1 bài viết cộng đồng hoặc 1 nhật ký trong ngày hôm nay trước khi rút tiền', NULL::UUID;
    RETURN;
  END IF;

  -- Get current balance
  SELECT COALESCE(balance, 0) INTO _balance
  FROM camly_coin_balances
  WHERE user_id = _user_id;

  IF _balance < _amount THEN
    RETURN QUERY SELECT FALSE, 'Số dư không đủ để rút', NULL::UUID;
    RETURN;
  END IF;

  -- Check daily limit
  SELECT COALESCE(SUM(amount), 0) INTO _withdrawn_today
  FROM coin_withdrawals
  WHERE user_id = _user_id
    AND status = 'completed'
    AND DATE(created_at AT TIME ZONE 'Asia/Ho_Chi_Minh') = DATE(NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh');

  IF (_withdrawn_today + _amount) > _daily_limit THEN
    RETURN QUERY SELECT FALSE, 'Đã vượt quá giới hạn rút 500,000 Camly Coin/ngày', NULL::UUID;
    RETURN;
  END IF;

  -- Check pending withdrawals
  SELECT COALESCE(SUM(amount), 0) INTO _pending_amount
  FROM coin_withdrawals
  WHERE user_id = _user_id
    AND status IN ('pending', 'processing');

  IF _pending_amount > 0 THEN
    RETURN QUERY SELECT FALSE, 'Bạn đang có yêu cầu rút đang chờ xử lý', NULL::UUID;
    RETURN;
  END IF;

  -- Create withdrawal request
  INSERT INTO coin_withdrawals (user_id, wallet_address, amount, status)
  VALUES (_user_id, _wallet_address, _amount, 'pending')
  RETURNING id INTO _new_withdrawal_id;

  -- Deduct from balance immediately (hold)
  UPDATE camly_coin_balances
  SET balance = balance - _amount,
      lifetime_spent = lifetime_spent + _amount,
      updated_at = NOW()
  WHERE user_id = _user_id;

  -- Create transaction record
  INSERT INTO camly_coin_transactions (user_id, amount, transaction_type, description, metadata)
  VALUES (
    _user_id,
    -_amount,
    'spending',
    'Yêu cầu rút về ví ' || SUBSTRING(_wallet_address, 1, 6) || '...' || SUBSTRING(_wallet_address, LENGTH(_wallet_address) - 3),
    jsonb_build_object('withdrawal_id', _new_withdrawal_id, 'wallet_address', _wallet_address)
  );

  RETURN QUERY SELECT TRUE, 'Yêu cầu rút đã được gửi thành công', _new_withdrawal_id;
END;
$function$;

-- Also create a function to check community activity status for frontend
CREATE OR REPLACE FUNCTION public.check_withdrawal_eligibility(_user_id uuid)
 RETURNS TABLE(
   can_withdraw boolean,
   has_post_today boolean,
   has_journal_today boolean,
   message text
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _has_post BOOLEAN;
  _has_journal BOOLEAN;
BEGIN
  -- Check for community post today
  SELECT EXISTS (
    SELECT 1 FROM community_posts 
    WHERE user_id = _user_id 
    AND DATE(created_at AT TIME ZONE 'Asia/Ho_Chi_Minh') = DATE(NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')
  ) INTO _has_post;

  -- Check for journal today
  SELECT EXISTS (
    SELECT 1 FROM gratitude_journal 
    WHERE user_id = _user_id 
    AND DATE(created_at AT TIME ZONE 'Asia/Ho_Chi_Minh') = DATE(NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')
  ) INTO _has_journal;

  RETURN QUERY SELECT
    (_has_post OR _has_journal) AS can_withdraw,
    _has_post AS has_post_today,
    _has_journal AS has_journal_today,
    CASE 
      WHEN _has_post OR _has_journal THEN 'Đủ điều kiện rút tiền'
      ELSE 'Cần đăng 1 bài viết hoặc 1 nhật ký trong ngày hôm nay'
    END AS message;
END;
$function$;
