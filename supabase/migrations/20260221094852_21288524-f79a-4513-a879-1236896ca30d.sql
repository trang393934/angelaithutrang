
-- ============================================================
-- CHỐNG SYBIL: Bước 1 - Cổng thời gian tài khoản
-- ============================================================

-- Hàm lấy tuổi tài khoản (tính theo ngày)
CREATE OR REPLACE FUNCTION public.get_account_age_days(_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _agreed_at TIMESTAMPTZ;
  _age_days INTEGER;
BEGIN
  SELECT agreed_at INTO _agreed_at
  FROM user_light_agreements
  WHERE user_id = _user_id;
  
  IF _agreed_at IS NULL THEN
    RETURN 0;
  END IF;
  
  _age_days := EXTRACT(DAY FROM (now() - _agreed_at))::INTEGER;
  RETURN COALESCE(_age_days, 0);
END;
$function$;

-- Hàm lấy hệ số phần thưởng theo tuổi tài khoản
-- Trả về: reward_multiplier (0.5, 0.75, 1.0) và max_actions_per_day
CREATE OR REPLACE FUNCTION public.get_account_age_gate(_user_id uuid)
RETURNS TABLE(
  account_age_days integer,
  reward_multiplier numeric,
  max_actions_per_day integer,
  gate_level text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _age INTEGER;
BEGIN
  _age := public.get_account_age_days(_user_id);
  
  IF _age < 3 THEN
    -- Tài khoản dưới 3 ngày: giới hạn mạnh
    RETURN QUERY SELECT _age, 0.50::NUMERIC, 3, 'new'::TEXT;
  ELSIF _age < 7 THEN
    -- Tài khoản 3-7 ngày: giới hạn trung bình
    RETURN QUERY SELECT _age, 0.75::NUMERIC, 5, 'probation'::TEXT;
  ELSE
    -- Tài khoản trên 7 ngày: bình thường
    RETURN QUERY SELECT _age, 1.00::NUMERIC, 100, 'verified'::TEXT;
  END IF;
END;
$function$;

-- ============================================================
-- CHỐNG SYBIL: Bước 4 - Tự động đình chỉ khi rủi ro cao
-- ============================================================

CREATE OR REPLACE FUNCTION public.auto_suspend_high_risk(
  _user_id uuid,
  _risk_score integer,
  _signals jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _existing_suspension RECORD;
  _suspension_id UUID;
  _action_taken TEXT;
BEGIN
  -- Kiểm tra đã bị đình chỉ chưa
  SELECT * INTO _existing_suspension
  FROM user_suspensions
  WHERE user_id = _user_id
    AND lifted_at IS NULL
    AND (suspended_until IS NULL OR suspended_until > now())
  LIMIT 1;
  
  IF _existing_suspension IS NOT NULL THEN
    RETURN jsonb_build_object(
      'action', 'already_suspended',
      'suspension_id', _existing_suspension.id,
      'risk_score', _risk_score
    );
  END IF;
  
  IF _risk_score > 70 THEN
    -- Rủi ro cao: Đình chỉ tạm thời 24h
    INSERT INTO user_suspensions (
      user_id,
      reason,
      suspended_by,
      suspended_until
    ) VALUES (
      _user_id,
      'Tự động đình chỉ: Điểm rủi ro ' || _risk_score || '/100. Phát hiện hành vi bất thường bởi hệ thống chống gian lận PPLP.',
      _user_id, -- system-generated, use user_id as placeholder
      now() + interval '24 hours'
    )
    RETURNING id INTO _suspension_id;
    
    _action_taken := 'suspended_24h';
    
    -- Gửi healing message
    INSERT INTO healing_messages (
      user_id,
      title,
      content,
      message_type,
      triggered_by
    ) VALUES (
      _user_id,
      '⚠️ Tài khoản tạm thời bị giới hạn',
      'Hệ thống phát hiện hoạt động bất thường từ tài khoản của bạn (điểm rủi ro: ' || _risk_score || '/100). Tài khoản sẽ được mở lại sau 24 giờ. Nếu bạn cho rằng đây là nhầm lẫn, vui lòng liên hệ admin để được hỗ trợ.',
      'warning',
      'anti_fraud_system'
    );
    
    -- Tạo fraud alert cho admin
    INSERT INTO fraud_alerts (
      user_id,
      alert_type,
      severity,
      details
    ) VALUES (
      _user_id,
      'auto_suspension',
      'critical',
      jsonb_build_object(
        'risk_score', _risk_score,
        'signals', _signals,
        'action', 'auto_suspended_24h',
        'suspended_at', now()
      )
    );
    
  ELSIF _risk_score > 50 THEN
    -- Rủi ro trung bình: Đóng băng phần thưởng, đánh dấu theo dõi
    _action_taken := 'rewards_frozen';
    
    INSERT INTO fraud_alerts (
      user_id,
      alert_type,
      severity,
      details
    ) VALUES (
      _user_id,
      'high_risk_detected',
      'high',
      jsonb_build_object(
        'risk_score', _risk_score,
        'signals', _signals,
        'action', 'rewards_frozen'
      )
    );
    
    -- Gửi healing message nhẹ hơn
    INSERT INTO healing_messages (
      user_id,
      title,
      content,
      message_type,
      triggered_by
    ) VALUES (
      _user_id,
      '🔍 Thông báo bảo mật',
      'Hệ thống đang xác minh một số hoạt động trên tài khoản của bạn. Phần thưởng có thể bị trì hoãn trong quá trình kiểm tra. Vui lòng tiếp tục sử dụng bình thường.',
      'info',
      'anti_fraud_system'
    );
    
  ELSIF _risk_score > 25 THEN
    _action_taken := 'monitoring';
  ELSE
    _action_taken := 'clear';
  END IF;
  
  RETURN jsonb_build_object(
    'action', _action_taken,
    'suspension_id', _suspension_id,
    'risk_score', _risk_score,
    'signals_count', jsonb_array_length(COALESCE(_signals, '[]'::jsonb))
  );
END;
$function$;
