
-- =============================================
-- BƯỚC 2: Trì Hoãn Phần Thưởng (Pending Rewards)
-- =============================================

-- 1. Tạo bảng pending_rewards
CREATE TABLE public.pending_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount BIGINT NOT NULL CHECK (amount > 0),
  transaction_type TEXT NOT NULL,
  description TEXT,
  purity_score NUMERIC,
  metadata JSONB,
  reason TEXT NOT NULL DEFAULT 'age_gate',
  release_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'released', 'frozen', 'cancelled')),
  frozen_reason TEXT,
  released_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index cho việc truy vấn nhanh
CREATE INDEX idx_pending_rewards_status_release ON public.pending_rewards (status, release_at) WHERE status = 'pending';
CREATE INDEX idx_pending_rewards_user_id ON public.pending_rewards (user_id);

-- Enable RLS
ALTER TABLE public.pending_rewards ENABLE ROW LEVEL SECURITY;

-- User chỉ xem được pending rewards của mình
CREATE POLICY "Users can view own pending rewards"
  ON public.pending_rewards FOR SELECT
  USING (auth.uid() = user_id);

-- Chỉ service role mới insert/update (qua edge functions)
CREATE POLICY "Service role manages pending rewards"
  ON public.pending_rewards FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- 2. Hàm release pending rewards (chạy bởi cron)
CREATE OR REPLACE FUNCTION public.release_pending_rewards()
  RETURNS TABLE(released_count INTEGER, total_amount BIGINT, frozen_count INTEGER)
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  _released INTEGER := 0;
  _total BIGINT := 0;
  _frozen INTEGER := 0;
  _reward RECORD;
  _is_suspended BOOLEAN;
BEGIN
  FOR _reward IN
    SELECT * FROM pending_rewards
    WHERE status = 'pending' AND release_at <= now()
    ORDER BY release_at ASC
    LIMIT 200
  LOOP
    -- Kiểm tra user có bị đình chỉ không
    SELECT public.is_user_suspended(_reward.user_id) INTO _is_suspended;
    
    IF _is_suspended THEN
      -- Đóng băng thay vì release
      UPDATE pending_rewards
      SET status = 'frozen', frozen_reason = 'Tài khoản bị đình chỉ', updated_at = now()
      WHERE id = _reward.id;
      _frozen := _frozen + 1;
      CONTINUE;
    END IF;
    
    -- Release: cộng vào balance thật
    PERFORM public.add_camly_coins(
      _reward.user_id,
      _reward.amount,
      _reward.transaction_type::coin_transaction_type,
      _reward.description || ' (đã xác nhận)',
      _reward.purity_score,
      _reward.metadata
    );
    
    UPDATE pending_rewards
    SET status = 'released', released_at = now(), updated_at = now()
    WHERE id = _reward.id;
    
    _released := _released + 1;
    _total := _total + _reward.amount;
  END LOOP;
  
  RETURN QUERY SELECT _released, _total, _frozen;
END;
$function$;

-- 3. Hàm thông minh: tự quyết định pending hay instant
CREATE OR REPLACE FUNCTION public.add_pending_or_instant_reward(
  _user_id UUID,
  _amount BIGINT,
  _transaction_type coin_transaction_type,
  _description TEXT,
  _purity_score NUMERIC DEFAULT NULL,
  _metadata JSONB DEFAULT NULL
)
  RETURNS JSONB
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  _user_tier INTEGER;
  _account_age INTEGER;
  _is_suspended BOOLEAN;
  _pending_id UUID;
  _new_balance BIGINT;
  _delay_hours INTEGER;
BEGIN
  -- Kiểm tra đình chỉ
  SELECT public.is_user_suspended(_user_id) INTO _is_suspended;
  IF _is_suspended THEN
    RETURN jsonb_build_object(
      'success', false,
      'mode', 'blocked',
      'reason', 'Tài khoản đang bị đình chỉ'
    );
  END IF;
  
  -- Lấy tier
  SELECT COALESCE(tier, 0) INTO _user_tier
  FROM pplp_user_tiers WHERE user_id = _user_id;
  IF _user_tier IS NULL THEN _user_tier := 0; END IF;
  
  -- Lấy tuổi tài khoản
  _account_age := public.get_account_age_days(_user_id);
  
  -- Quyết định: tier >= 2 HOẶC tuổi >= 14 ngày → instant
  IF _user_tier >= 2 OR _account_age >= 14 THEN
    _new_balance := public.add_camly_coins(
      _user_id, _amount, _transaction_type, _description, _purity_score, _metadata
    );
    RETURN jsonb_build_object(
      'success', true,
      'mode', 'instant',
      'amount', _amount,
      'new_balance', _new_balance
    );
  END IF;
  
  -- Pending: tính delay theo tier/tuổi
  IF _account_age < 3 THEN
    _delay_hours := 48;
  ELSIF _account_age < 7 THEN
    _delay_hours := 24;
  ELSE
    _delay_hours := 12;
  END IF;
  
  INSERT INTO pending_rewards (
    user_id, amount, transaction_type, description,
    purity_score, metadata, reason, release_at
  ) VALUES (
    _user_id, _amount, _transaction_type::TEXT, _description,
    _purity_score, _metadata,
    'Tài khoản tier ' || _user_tier || ', tuổi ' || _account_age || ' ngày',
    now() + (_delay_hours || ' hours')::INTERVAL
  )
  RETURNING id INTO _pending_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'mode', 'pending',
    'pending_id', _pending_id,
    'amount', _amount,
    'delay_hours', _delay_hours,
    'release_at', (now() + (_delay_hours || ' hours')::INTERVAL)
  );
END;
$function$;

-- 4. Hàm đóng băng tất cả pending rewards của 1 user (dùng khi detect fraud)
CREATE OR REPLACE FUNCTION public.freeze_user_pending_rewards(_user_id UUID, _reason TEXT DEFAULT 'Phát hiện hoạt động bất thường')
  RETURNS INTEGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  _count INTEGER;
BEGIN
  UPDATE pending_rewards
  SET status = 'frozen', frozen_reason = _reason, updated_at = now()
  WHERE user_id = _user_id AND status = 'pending';
  
  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN _count;
END;
$function$;

-- 5. Enable realtime cho pending_rewards (user thấy trạng thái)
ALTER PUBLICATION supabase_realtime ADD TABLE public.pending_rewards;
