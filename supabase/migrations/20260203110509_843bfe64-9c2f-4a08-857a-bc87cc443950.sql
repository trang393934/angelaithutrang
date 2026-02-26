-- ============================================
-- PPLP Reward Caps & Rate Limiting Tables
-- ============================================

-- User reward caps tracking (daily/epoch)
CREATE TABLE IF NOT EXISTS public.pplp_user_caps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  epoch_date DATE NOT NULL DEFAULT CURRENT_DATE,
  epoch_type TEXT NOT NULL DEFAULT 'daily', -- 'daily', 'weekly', 'monthly'
  total_minted BIGINT NOT NULL DEFAULT 0,
  action_counts JSONB NOT NULL DEFAULT '{}', -- {"LEARN_COMPLETE": 3, "DONATE": 1}
  last_action_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, epoch_date, epoch_type)
);

-- Global epoch caps tracking
CREATE TABLE IF NOT EXISTS public.pplp_epoch_caps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  epoch_date DATE NOT NULL DEFAULT CURRENT_DATE,
  epoch_type TEXT NOT NULL DEFAULT 'daily',
  total_minted BIGINT NOT NULL DEFAULT 0,
  action_counts JSONB NOT NULL DEFAULT '{}',
  unique_users INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(epoch_date, epoch_type)
);

-- Action type specific caps configuration
CREATE TABLE IF NOT EXISTS public.pplp_action_caps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL,
  platform_id TEXT NOT NULL DEFAULT 'ALL',
  base_reward INTEGER NOT NULL DEFAULT 100,
  max_per_user_daily INTEGER DEFAULT 10,
  max_per_user_weekly INTEGER DEFAULT 50,
  max_global_daily BIGINT DEFAULT NULL, -- NULL = unlimited
  cooldown_seconds INTEGER DEFAULT 0, -- minimum time between same action
  diminishing_threshold INTEGER DEFAULT 5, -- after N actions, apply diminishing
  diminishing_factor NUMERIC(3,2) DEFAULT 0.8, -- multiply by this each time
  min_quality_score NUMERIC(3,2) DEFAULT 0.5,
  thresholds JSONB NOT NULL DEFAULT '{"T": 70, "LightScore": 60}',
  multiplier_ranges JSONB NOT NULL DEFAULT '{"Q": [0.5, 3.0], "I": [0.5, 5.0], "K": [0.0, 1.0]}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(action_type, platform_id)
);

-- Insert default action caps configurations
INSERT INTO public.pplp_action_caps (action_type, platform_id, base_reward, max_per_user_daily, thresholds, multiplier_ranges) VALUES
  -- Learning
  ('LEARN_COMPLETE', 'FUN_ACADEMY', 200, 5, '{"T": 70, "LightScore": 60}', '{"Q": [0.8, 2.0], "I": [0.8, 1.5], "K": [0.6, 1.0]}'),
  ('PROJECT_SUBMIT', 'FUN_ACADEMY', 500, 3, '{"T": 75, "C": 70, "LightScore": 65}', '{"Q": [1.0, 3.0], "I": [1.0, 2.5], "K": [0.65, 1.0]}'),
  ('PEER_REVIEW', 'FUN_ACADEMY', 150, 10, '{"T": 75, "LightScore": 60}', '{"Q": [0.8, 2.0], "I": [0.8, 1.5], "K": [0.6, 1.0]}'),
  
  -- Mentorship
  ('MENTOR_HELP', 'FUN_PROFILE', 300, 5, '{"T": 75, "H": 70, "U": 70, "LightScore": 70}', '{"Q": [1.0, 3.0], "I": [1.0, 2.5], "K": [0.7, 1.0]}'),
  
  -- Content
  ('CONTENT_CREATE', 'FUN_PROFILE', 150, 5, '{"T": 70, "U": 65, "LightScore": 65}', '{"Q": [0.8, 2.5], "I": [0.8, 2.0], "K": [0.6, 1.0]}'),
  ('COMMUNITY_POST', 'FUN_PROFILE', 100, 3, '{"T": 70, "LightScore": 60}', '{"Q": [0.8, 2.0], "I": [0.8, 1.5], "K": [0.6, 1.0]}'),
  ('CONTENT_REVIEW', 'FUN_PROFILE', 100, 10, '{"T": 80, "LightScore": 65}', '{"Q": [0.8, 2.0], "I": [0.8, 1.5], "K": [0.6, 1.0]}'),
  
  -- Charity
  ('DONATE', 'FUN_CHARITY', 500, 5, '{"T": 85, "S": 75, "LightScore": 65}', '{"Q": [1.0, 2.0], "I": [1.0, 5.0], "K": [0.8, 1.0]}'),
  ('VOLUNTEER', 'FUN_CHARITY', 400, 3, '{"T": 80, "H": 75, "LightScore": 70}', '{"Q": [1.0, 2.5], "I": [1.0, 3.0], "K": [0.7, 1.0]}'),
  
  -- Environment
  ('TREE_PLANT', 'FUN_EARTH', 300, 5, '{"T": 80, "S": 70, "LightScore": 65}', '{"Q": [1.0, 2.0], "I": [1.0, 3.0], "K": [0.7, 1.0]}'),
  ('CLEANUP_EVENT', 'FUN_EARTH', 400, 2, '{"T": 80, "S": 75, "U": 70, "LightScore": 70}', '{"Q": [1.0, 2.5], "I": [1.0, 3.0], "K": [0.7, 1.0]}'),
  
  -- AI Interactions
  ('QUESTION_ASK', 'ANGEL_AI', 100, 10, '{"T": 70, "LightScore": 55}', '{"Q": [0.8, 2.0], "I": [0.8, 1.5], "K": [0.6, 1.0]}'),
  ('AI_REVIEW_HELPFUL', 'ANGEL_AI', 150, 10, '{"T": 80, "LightScore": 60}', '{"Q": [1.0, 2.5], "I": [1.0, 2.0], "K": [0.7, 1.0]}'),
  ('FRAUD_REPORT_VALID', 'ANGEL_AI', 300, 3, '{"T": 85, "LightScore": 70}', '{"Q": [1.0, 3.0], "I": [1.0, 3.0], "K": [0.8, 1.0]}'),
  
  -- Governance
  ('GOV_PROPOSAL', 'FUN_LEGAL', 500, 2, '{"T": 85, "U": 80, "LightScore": 75}', '{"Q": [1.0, 3.0], "I": [1.0, 4.0], "K": [0.8, 1.0]}'),
  ('DISPUTE_RESOLVE', 'FUN_LEGAL', 400, 5, '{"T": 90, "H": 75, "LightScore": 75}', '{"Q": [1.0, 2.5], "I": [1.0, 3.0], "K": [0.8, 1.0]}'),
  
  -- Rituals
  ('DAILY_RITUAL', 'FUNLIFE', 50, 3, '{"T": 60, "LightScore": 50}', '{"Q": [0.8, 1.5], "I": [0.8, 1.2], "K": [0.6, 1.0]}'),
  
  -- Commerce
  ('FARM_DELIVERY', 'FUN_FARM', 200, 10, '{"T": 75, "S": 70, "LightScore": 60}', '{"Q": [0.8, 2.0], "I": [0.8, 2.5], "K": [0.7, 1.0]}'),
  ('MARKET_FAIR_TRADE', 'FUN_MARKET', 250, 5, '{"T": 80, "S": 70, "LightScore": 65}', '{"Q": [1.0, 2.5], "I": [1.0, 3.0], "K": [0.7, 1.0]}'),
  
  -- Security
  ('BUG_BOUNTY', 'ALL', 1000, 3, '{"T": 90, "LightScore": 75}', '{"Q": [1.0, 3.0], "I": [1.0, 5.0], "K": [0.8, 1.0]}')
ON CONFLICT (action_type, platform_id) DO NOTHING;

-- Enable RLS
ALTER TABLE public.pplp_user_caps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pplp_epoch_caps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pplp_action_caps ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user caps
CREATE POLICY "Users can view their own caps" ON public.pplp_user_caps
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage user caps" ON public.pplp_user_caps
  FOR ALL USING (auth.uid() = user_id OR is_admin());

-- RLS Policies for epoch caps (admin only for write, public read)
CREATE POLICY "Anyone can view epoch caps" ON public.pplp_epoch_caps
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage epoch caps" ON public.pplp_epoch_caps
  FOR ALL USING (is_admin());

-- RLS Policies for action caps (public read, admin write)
CREATE POLICY "Anyone can view action caps config" ON public.pplp_action_caps
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage action caps" ON public.pplp_action_caps
  FOR ALL USING (is_admin());

-- Function to check and update user caps with diminishing returns
CREATE OR REPLACE FUNCTION public.check_user_cap_and_update(
  _user_id UUID,
  _action_type TEXT,
  _reward_amount BIGINT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_cap RECORD;
  v_action_config RECORD;
  v_action_count INTEGER;
  v_diminishing_multiplier NUMERIC := 1.0;
  v_adjusted_reward BIGINT;
  v_can_mint BOOLEAN := true;
  v_reason TEXT := NULL;
BEGIN
  -- Get action configuration
  SELECT * INTO v_action_config
  FROM pplp_action_caps
  WHERE action_type = _action_type AND is_active = true
  LIMIT 1;
  
  -- Get or create user cap for today
  INSERT INTO pplp_user_caps (user_id, epoch_date, epoch_type, action_counts)
  VALUES (_user_id, CURRENT_DATE, 'daily', '{}')
  ON CONFLICT (user_id, epoch_date, epoch_type) DO NOTHING;
  
  SELECT * INTO v_user_cap
  FROM pplp_user_caps
  WHERE user_id = _user_id AND epoch_date = CURRENT_DATE AND epoch_type = 'daily';
  
  -- Get current action count
  v_action_count := COALESCE((v_user_cap.action_counts->>_action_type)::INTEGER, 0);
  
  -- Check max per user daily
  IF v_action_config IS NOT NULL AND v_action_config.max_per_user_daily IS NOT NULL THEN
    IF v_action_count >= v_action_config.max_per_user_daily THEN
      v_can_mint := false;
      v_reason := 'DAILY_CAP_REACHED';
    END IF;
  END IF;
  
  -- Check cooldown
  IF v_action_config IS NOT NULL AND v_action_config.cooldown_seconds > 0 AND v_user_cap.last_action_at IS NOT NULL THEN
    IF EXTRACT(EPOCH FROM (now() - v_user_cap.last_action_at)) < v_action_config.cooldown_seconds THEN
      v_can_mint := false;
      v_reason := 'COOLDOWN_ACTIVE';
    END IF;
  END IF;
  
  -- Calculate diminishing returns
  IF v_action_config IS NOT NULL AND v_action_count >= COALESCE(v_action_config.diminishing_threshold, 5) THEN
    v_diminishing_multiplier := POWER(
      COALESCE(v_action_config.diminishing_factor, 0.8),
      v_action_count - COALESCE(v_action_config.diminishing_threshold, 5) + 1
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
    'max_daily', v_action_config.max_per_user_daily
  );
END;
$$;