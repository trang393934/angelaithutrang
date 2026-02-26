
-- =============================================
-- BƯỚC 3: Giới hạn hành động theo cấp bậc tin cậy
-- Sửa hàm check_user_cap_and_update() để áp dụng tier-based rate limits
-- =============================================

CREATE OR REPLACE FUNCTION public.check_user_cap_and_update(_user_id uuid, _action_type text, _reward_amount bigint)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_cap RECORD;
  v_action_config RECORD;
  v_action_count INTEGER;
  v_diminishing_multiplier NUMERIC := 1.0;
  v_adjusted_reward BIGINT;
  v_can_mint BOOLEAN := true;
  v_reason TEXT := NULL;
  v_user_tier INTEGER;
  v_tier_multiplier NUMERIC := 1.0;
  v_effective_max_daily INTEGER;
BEGIN
  -- Get action configuration
  SELECT * INTO v_action_config
  FROM pplp_action_caps
  WHERE action_type = _action_type AND is_active = true
  LIMIT 1;
  
  -- ========== MỚI: Lấy tier của user ==========
  SELECT COALESCE(tier, 0) INTO v_user_tier
  FROM pplp_user_tiers
  WHERE user_id = _user_id;
  
  -- Nếu chưa có tier record, mặc định tier 0
  IF v_user_tier IS NULL THEN
    v_user_tier := 0;
  END IF;
  
  -- Tính hệ số giới hạn theo tier
  -- Tier 0 (Mới): giảm 60% giới hạn → chỉ được 40% max_daily
  -- Tier 1 (7d+): giảm 30% giới hạn → được 70% max_daily
  -- Tier 2 (30d+): giữ nguyên 100%
  -- Tier 3-4: tăng 50% giới hạn
  v_tier_multiplier := CASE v_user_tier
    WHEN 0 THEN 0.40
    WHEN 1 THEN 0.70
    WHEN 2 THEN 1.00
    WHEN 3 THEN 1.50
    WHEN 4 THEN 2.00
    ELSE 1.00
  END;
  -- ========== HẾT PHẦN MỚI ==========
  
  -- Get or create user cap for today
  INSERT INTO pplp_user_caps (user_id, epoch_date, epoch_type, action_counts)
  VALUES (_user_id, CURRENT_DATE, 'daily', '{}')
  ON CONFLICT (user_id, epoch_date, epoch_type) DO NOTHING;
  
  SELECT * INTO v_user_cap
  FROM pplp_user_caps
  WHERE user_id = _user_id AND epoch_date = CURRENT_DATE AND epoch_type = 'daily';
  
  -- Get current action count
  v_action_count := COALESCE((v_user_cap.action_counts->>_action_type)::INTEGER, 0);
  
  -- Check max per user daily (ÁP DỤNG TIER MULTIPLIER)
  IF v_action_config IS NOT NULL AND v_action_config.max_per_user_daily IS NOT NULL THEN
    v_effective_max_daily := GREATEST(1, (v_action_config.max_per_user_daily * v_tier_multiplier)::INTEGER);
    
    IF v_action_count >= v_effective_max_daily THEN
      v_can_mint := false;
      v_reason := 'DAILY_CAP_REACHED';
    END IF;
  ELSE
    v_effective_max_daily := NULL;
  END IF;
  
  -- Check cooldown
  IF v_action_config IS NOT NULL AND v_action_config.cooldown_seconds > 0 AND v_user_cap.last_action_at IS NOT NULL THEN
    IF EXTRACT(EPOCH FROM (now() - v_user_cap.last_action_at)) < v_action_config.cooldown_seconds THEN
      v_can_mint := false;
      v_reason := 'COOLDOWN_ACTIVE';
    END IF;
  END IF;
  
  -- Calculate diminishing returns (threshold cũng giảm cho tier thấp)
  IF v_action_config IS NOT NULL AND v_action_count >= GREATEST(1, (COALESCE(v_action_config.diminishing_threshold, 5) * v_tier_multiplier)::INTEGER) THEN
    v_diminishing_multiplier := POWER(
      COALESCE(v_action_config.diminishing_factor, 0.8),
      v_action_count - GREATEST(1, (COALESCE(v_action_config.diminishing_threshold, 5) * v_tier_multiplier)::INTEGER) + 1
    );
  END IF;
  
  v_adjusted_reward := GREATEST(1, (_reward_amount * v_diminishing_multiplier)::BIGINT);
  
  -- Update caps if can mint
  IF v_can_mint THEN
    UPDATE pplp_user_caps
    SET 
      total_minted = total_minted + v_adjusted_reward,
      action_counts = action_counts || jsonb_build_object(_action_type, v_action_count + 1),
      last_action_at = now(),
      updated_at = now()
    WHERE user_id = _user_id AND epoch_date = CURRENT_DATE AND epoch_type = 'daily';
    
    -- Update global epoch caps
    INSERT INTO pplp_epoch_caps (epoch_date, epoch_type, total_minted, action_counts, unique_users)
    VALUES (CURRENT_DATE, 'daily', v_adjusted_reward, jsonb_build_object(_action_type, 1), 1)
    ON CONFLICT (epoch_date, epoch_type) DO UPDATE SET
      total_minted = pplp_epoch_caps.total_minted + v_adjusted_reward,
      action_counts = pplp_epoch_caps.action_counts || 
        jsonb_build_object(_action_type, COALESCE((pplp_epoch_caps.action_counts->>_action_type)::INTEGER, 0) + 1),
      updated_at = now();
  END IF;
  
  RETURN jsonb_build_object(
    'can_mint', v_can_mint,
    'reason', v_reason,
    'original_reward', _reward_amount,
    'adjusted_reward', v_adjusted_reward,
    'diminishing_multiplier', v_diminishing_multiplier,
    'action_count_today', v_action_count + 1,
    'max_daily', v_effective_max_daily,
    'user_tier', v_user_tier,
    'tier_multiplier', v_tier_multiplier
  );
END;
$function$;

-- =============================================
-- BƯỚC 5: Kích hoạt pg_cron extensions
-- =============================================

-- Bật pg_cron và pg_net extensions (cần cho cron job)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
