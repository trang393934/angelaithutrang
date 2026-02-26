-- =====================================================
-- PPLP ANTI-FRAUD SYSTEM - Phase 5
-- =====================================================

-- 1. Fraud Signals Table (lưu các tín hiệu gian lận phát hiện được)
CREATE TABLE IF NOT EXISTS public.pplp_fraud_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL,
  action_id UUID REFERENCES public.pplp_actions(id),
  signal_type TEXT NOT NULL, -- SYBIL, BOT, COLLUSION, SPAM, ANOMALY
  severity INTEGER NOT NULL DEFAULT 1, -- 1-5 scale
  details JSONB NOT NULL DEFAULT '{}',
  source TEXT NOT NULL DEFAULT 'ANGEL_AI', -- ANGEL_AI, COMMUNITY, SYSTEM, AUDIT
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. User Reputation/Trust Tiers
CREATE TABLE IF NOT EXISTS public.pplp_user_tiers (
  user_id UUID PRIMARY KEY,
  tier INTEGER NOT NULL DEFAULT 0, -- 0-4 tiers
  trust_score NUMERIC(5,2) NOT NULL DEFAULT 50.00, -- 0-100
  total_actions_scored INTEGER NOT NULL DEFAULT 0,
  passed_actions INTEGER NOT NULL DEFAULT 0,
  failed_actions INTEGER NOT NULL DEFAULT 0,
  fraud_flags INTEGER NOT NULL DEFAULT 0,
  last_tier_change TIMESTAMPTZ,
  tier_change_reason TEXT,
  -- Cap multipliers based on tier
  cap_multiplier NUMERIC(3,2) NOT NULL DEFAULT 1.00,
  -- Device tracking
  known_device_hashes TEXT[] DEFAULT '{}',
  last_device_hash TEXT,
  -- Social graph signals
  verified_connections INTEGER NOT NULL DEFAULT 0,
  community_vouches INTEGER NOT NULL DEFAULT 0,
  -- Stake for trust (future)
  staked_amount BIGINT NOT NULL DEFAULT 0,
  stake_locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Audit Trail for random audits
CREATE TABLE IF NOT EXISTS public.pplp_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id UUID REFERENCES public.pplp_actions(id),
  actor_id UUID NOT NULL,
  audit_type TEXT NOT NULL, -- RANDOM, FLAGGED, DISPUTE, MANUAL
  auditor_id UUID,
  audit_status TEXT NOT NULL DEFAULT 'pending', -- pending, in_progress, completed
  original_score JSONB,
  audited_score JSONB,
  finding TEXT,
  action_taken TEXT, -- NONE, WARNING, PENALTY, BAN
  penalty_amount BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- 4. Device Fingerprints Registry (for cross-account detection)
CREATE TABLE IF NOT EXISTS public.pplp_device_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_hash TEXT NOT NULL,
  user_id UUID NOT NULL,
  first_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  usage_count INTEGER NOT NULL DEFAULT 1,
  is_flagged BOOLEAN NOT NULL DEFAULT false,
  flag_reason TEXT,
  UNIQUE(device_hash, user_id)
);

-- 5. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_pplp_fraud_signals_actor ON public.pplp_fraud_signals(actor_id);
CREATE INDEX IF NOT EXISTS idx_pplp_fraud_signals_action ON public.pplp_fraud_signals(action_id);
CREATE INDEX IF NOT EXISTS idx_pplp_fraud_signals_unresolved ON public.pplp_fraud_signals(is_resolved) WHERE is_resolved = false;
CREATE INDEX IF NOT EXISTS idx_pplp_device_registry_hash ON public.pplp_device_registry(device_hash);
CREATE INDEX IF NOT EXISTS idx_pplp_device_registry_user ON public.pplp_device_registry(user_id);
CREATE INDEX IF NOT EXISTS idx_pplp_audits_actor ON public.pplp_audits(actor_id);
CREATE INDEX IF NOT EXISTS idx_pplp_audits_pending ON public.pplp_audits(audit_status) WHERE audit_status = 'pending';

-- 6. RLS Policies
ALTER TABLE public.pplp_fraud_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pplp_user_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pplp_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pplp_device_registry ENABLE ROW LEVEL SECURITY;

-- Users can view their own tier
CREATE POLICY "Users can view own tier" ON public.pplp_user_tiers
  FOR SELECT USING (auth.uid() = user_id);

-- Users can view their own audits
CREATE POLICY "Users can view own audits" ON public.pplp_audits
  FOR SELECT USING (auth.uid() = actor_id);

-- Admins full access
CREATE POLICY "Admins full access fraud_signals" ON public.pplp_fraud_signals
  FOR ALL USING (public.is_admin());

CREATE POLICY "Admins full access user_tiers" ON public.pplp_user_tiers
  FOR ALL USING (public.is_admin());

CREATE POLICY "Admins full access audits" ON public.pplp_audits
  FOR ALL USING (public.is_admin());

CREATE POLICY "Admins full access device_registry" ON public.pplp_device_registry
  FOR ALL USING (public.is_admin());

-- 7. Function to update user tier based on history
CREATE OR REPLACE FUNCTION public.update_user_tier(_user_id UUID)
RETURNS public.pplp_user_tiers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tier RECORD;
  v_new_tier INTEGER;
  v_cap_multiplier NUMERIC;
  v_trust_score NUMERIC;
BEGIN
  -- Get or create tier record
  INSERT INTO pplp_user_tiers (user_id)
  VALUES (_user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  SELECT * INTO v_tier FROM pplp_user_tiers WHERE user_id = _user_id;
  
  -- Calculate trust score based on history
  v_trust_score := CASE
    WHEN v_tier.total_actions_scored = 0 THEN 50
    ELSE LEAST(100, GREATEST(0,
      50 + 
      (v_tier.passed_actions::NUMERIC / GREATEST(1, v_tier.total_actions_scored) * 30) -
      (v_tier.fraud_flags * 10)
    ))
  END;
  
  -- Determine tier based on trust score and history
  v_new_tier := CASE
    WHEN v_trust_score >= 90 AND v_tier.passed_actions >= 100 THEN 4
    WHEN v_trust_score >= 80 AND v_tier.passed_actions >= 50 THEN 3
    WHEN v_trust_score >= 70 AND v_tier.passed_actions >= 20 THEN 2
    WHEN v_trust_score >= 60 AND v_tier.passed_actions >= 5 THEN 1
    ELSE 0
  END;
  
  -- Cap multiplier based on tier
  v_cap_multiplier := CASE v_new_tier
    WHEN 4 THEN 3.00
    WHEN 3 THEN 2.00
    WHEN 2 THEN 1.50
    WHEN 1 THEN 1.20
    ELSE 1.00
  END;
  
  -- Update tier if changed
  UPDATE pplp_user_tiers
  SET 
    tier = v_new_tier,
    trust_score = v_trust_score,
    cap_multiplier = v_cap_multiplier,
    last_tier_change = CASE WHEN tier != v_new_tier THEN now() ELSE last_tier_change END,
    tier_change_reason = CASE WHEN tier != v_new_tier THEN 'Auto-calculated from history' ELSE tier_change_reason END,
    updated_at = now()
  WHERE user_id = _user_id
  RETURNING * INTO v_tier;
  
  RETURN v_tier;
END;
$$;

-- 8. Function to register/update device fingerprint
CREATE OR REPLACE FUNCTION public.register_device_fingerprint(_user_id UUID, _device_hash TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing RECORD;
  v_other_users INTEGER;
  v_is_suspicious BOOLEAN := false;
  v_reason TEXT;
BEGIN
  -- Check if this device hash is used by other users
  SELECT COUNT(DISTINCT user_id) INTO v_other_users
  FROM pplp_device_registry
  WHERE device_hash = _device_hash AND user_id != _user_id;
  
  IF v_other_users > 0 THEN
    v_is_suspicious := true;
    v_reason := 'Device hash matches ' || v_other_users || ' other user(s)';
    
    -- Create fraud signal
    INSERT INTO pplp_fraud_signals (actor_id, signal_type, severity, details, source)
    VALUES (
      _user_id,
      'SYBIL',
      CASE WHEN v_other_users > 2 THEN 4 ELSE 3 END,
      jsonb_build_object(
        'device_hash', _device_hash,
        'other_users_count', v_other_users,
        'reason', v_reason
      ),
      'SYSTEM'
    );
  END IF;
  
  -- Upsert device registry
  INSERT INTO pplp_device_registry (device_hash, user_id, usage_count, is_flagged, flag_reason)
  VALUES (_device_hash, _user_id, 1, v_is_suspicious, v_reason)
  ON CONFLICT (device_hash, user_id) DO UPDATE SET
    last_seen = now(),
    usage_count = pplp_device_registry.usage_count + 1,
    is_flagged = CASE WHEN v_is_suspicious THEN true ELSE pplp_device_registry.is_flagged END,
    flag_reason = CASE WHEN v_is_suspicious THEN v_reason ELSE pplp_device_registry.flag_reason END;
  
  -- Update user tier record with device
  UPDATE pplp_user_tiers
  SET 
    last_device_hash = _device_hash,
    known_device_hashes = CASE 
      WHEN _device_hash = ANY(known_device_hashes) THEN known_device_hashes
      ELSE array_append(known_device_hashes, _device_hash)
    END,
    updated_at = now()
  WHERE user_id = _user_id;
  
  RETURN jsonb_build_object(
    'is_suspicious', v_is_suspicious,
    'reason', v_reason,
    'other_users_count', v_other_users
  );
END;
$$;

-- 9. Function to schedule random audit
CREATE OR REPLACE FUNCTION public.schedule_random_audit()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
  v_action RECORD;
BEGIN
  -- Select random actions from last 24h that haven't been audited
  FOR v_action IN
    SELECT a.id, a.actor_id
    FROM pplp_actions a
    LEFT JOIN pplp_audits au ON a.id = au.action_id
    WHERE a.status = 'minted'
      AND a.minted_at > now() - interval '24 hours'
      AND au.id IS NULL
    ORDER BY random()
    LIMIT 10
  LOOP
    INSERT INTO pplp_audits (action_id, actor_id, audit_type)
    VALUES (v_action.id, v_action.actor_id, 'RANDOM');
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$;