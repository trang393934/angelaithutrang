-- Create coin withdrawals table
CREATE TABLE public.coin_withdrawals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  wallet_address TEXT NOT NULL,
  amount BIGINT NOT NULL CHECK (amount >= 200000),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'rejected')),
  tx_hash TEXT,
  admin_notes TEXT,
  processed_by UUID,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coin_withdrawals ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_coin_withdrawals_user_id ON public.coin_withdrawals(user_id);
CREATE INDEX idx_coin_withdrawals_status ON public.coin_withdrawals(status);
CREATE INDEX idx_coin_withdrawals_created_at ON public.coin_withdrawals(created_at);

-- RLS Policies: Users can view their own withdrawals
CREATE POLICY "Users can view their own withdrawals"
ON public.coin_withdrawals
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create withdrawal requests
CREATE POLICY "Users can create withdrawal requests"
ON public.coin_withdrawals
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can manage all withdrawals
CREATE POLICY "Admins can manage all withdrawals"
ON public.coin_withdrawals
FOR ALL
USING (is_admin());

-- Create user withdrawal stats table
CREATE TABLE public.user_withdrawal_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  total_withdrawn BIGINT NOT NULL DEFAULT 0,
  total_requests INTEGER NOT NULL DEFAULT 0,
  successful_withdrawals INTEGER NOT NULL DEFAULT 0,
  last_withdrawal_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_withdrawal_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can view their own stats
CREATE POLICY "Users can view their own withdrawal stats"
ON public.user_withdrawal_stats
FOR SELECT
USING (auth.uid() = user_id);

-- System can update stats
CREATE POLICY "System can manage withdrawal stats"
ON public.user_withdrawal_stats
FOR ALL
USING (auth.uid() = user_id OR is_admin());

-- Admins can view all stats
CREATE POLICY "Admins can view all withdrawal stats"
ON public.user_withdrawal_stats
FOR SELECT
USING (is_admin());

-- Function to check daily withdrawal limit
CREATE OR REPLACE FUNCTION public.get_user_withdrawal_status(_user_id UUID)
RETURNS TABLE (
  can_withdraw BOOLEAN,
  available_balance BIGINT,
  withdrawn_today BIGINT,
  remaining_daily_limit BIGINT,
  total_withdrawn BIGINT,
  pending_amount BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _balance BIGINT;
  _withdrawn_today BIGINT;
  _total_withdrawn BIGINT;
  _pending_amount BIGINT;
  _daily_limit BIGINT := 500000;
  _min_withdrawal BIGINT := 200000;
BEGIN
  -- Get current balance
  SELECT COALESCE(balance, 0) INTO _balance
  FROM camly_coin_balances
  WHERE user_id = _user_id;

  -- Get amount withdrawn today (completed only)
  SELECT COALESCE(SUM(amount), 0) INTO _withdrawn_today
  FROM coin_withdrawals
  WHERE user_id = _user_id
    AND status = 'completed'
    AND DATE(created_at AT TIME ZONE 'Asia/Ho_Chi_Minh') = DATE(NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh');

  -- Get total withdrawn (completed)
  SELECT COALESCE(SUM(amount), 0) INTO _total_withdrawn
  FROM coin_withdrawals
  WHERE user_id = _user_id
    AND status = 'completed';

  -- Get pending withdrawal amount
  SELECT COALESCE(SUM(amount), 0) INTO _pending_amount
  FROM coin_withdrawals
  WHERE user_id = _user_id
    AND status IN ('pending', 'processing');

  RETURN QUERY SELECT
    (_balance >= _min_withdrawal AND (_daily_limit - _withdrawn_today) >= _min_withdrawal) AS can_withdraw,
    _balance AS available_balance,
    _withdrawn_today AS withdrawn_today,
    GREATEST(0, _daily_limit - _withdrawn_today) AS remaining_daily_limit,
    _total_withdrawn AS total_withdrawn,
    _pending_amount AS pending_amount;
END;
$$;

-- Function to process withdrawal request
CREATE OR REPLACE FUNCTION public.request_coin_withdrawal(
  _user_id UUID,
  _wallet_address TEXT,
  _amount BIGINT
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  withdrawal_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _balance BIGINT;
  _withdrawn_today BIGINT;
  _pending_amount BIGINT;
  _daily_limit BIGINT := 500000;
  _min_withdrawal BIGINT := 200000;
  _new_withdrawal_id UUID;
BEGIN
  -- Validate amount
  IF _amount < _min_withdrawal THEN
    RETURN QUERY SELECT FALSE, 'Số lượng rút tối thiểu là 200,000 Camly Coin', NULL::UUID;
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
$$;

-- Function to update withdrawal stats when completed
CREATE OR REPLACE FUNCTION public.update_withdrawal_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    INSERT INTO user_withdrawal_stats (user_id, total_withdrawn, total_requests, successful_withdrawals, last_withdrawal_at)
    VALUES (NEW.user_id, NEW.amount, 1, 1, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      total_withdrawn = user_withdrawal_stats.total_withdrawn + NEW.amount,
      successful_withdrawals = user_withdrawal_stats.successful_withdrawals + 1,
      last_withdrawal_at = NOW(),
      updated_at = NOW();
  ELSIF NEW.status = 'failed' AND OLD.status IN ('pending', 'processing') THEN
    -- Refund the amount back to user
    UPDATE camly_coin_balances
    SET balance = balance + NEW.amount,
        lifetime_spent = lifetime_spent - NEW.amount,
        updated_at = NOW()
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for withdrawal status changes
CREATE TRIGGER on_withdrawal_status_change
AFTER UPDATE ON public.coin_withdrawals
FOR EACH ROW
EXECUTE FUNCTION public.update_withdrawal_stats();

-- Enable realtime for withdrawals
ALTER PUBLICATION supabase_realtime ADD TABLE public.coin_withdrawals;