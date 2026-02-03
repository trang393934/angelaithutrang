-- =============================================
-- PPLP Technical Spec v1.0 - Database Schema
-- Phase 1: Core Tables for Light Action Framework
-- =============================================

-- Create enum types for PPLP system
CREATE TYPE public.pplp_action_status AS ENUM ('pending', 'scoring', 'scored', 'minted', 'rejected', 'disputed');
CREATE TYPE public.pplp_decision AS ENUM ('pass', 'fail', 'pending', 'manual_review');
CREATE TYPE public.pplp_dispute_status AS ENUM ('open', 'investigating', 'resolved', 'rejected');

-- =============================================
-- 1. PPLP Actions Table - Light Actions with Canonical Structure
-- =============================================
CREATE TABLE public.pplp_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_id TEXT NOT NULL DEFAULT 'angel_ai',
  action_type TEXT NOT NULL,
  actor_id UUID NOT NULL,
  target_id UUID NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  impact JSONB NOT NULL DEFAULT '{"reach": 0, "depth": 0, "duration": 0}',
  integrity JSONB NOT NULL DEFAULT '{"source_verified": false, "content_hash": null}',
  status public.pplp_action_status NOT NULL DEFAULT 'pending',
  evidence_hash TEXT NULL,
  policy_version TEXT NOT NULL DEFAULT '1.0.0',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  scored_at TIMESTAMP WITH TIME ZONE NULL,
  minted_at TIMESTAMP WITH TIME ZONE NULL
);

-- Indexes for performance
CREATE INDEX idx_pplp_actions_actor ON public.pplp_actions(actor_id);
CREATE INDEX idx_pplp_actions_status ON public.pplp_actions(status);
CREATE INDEX idx_pplp_actions_type ON public.pplp_actions(action_type);
CREATE INDEX idx_pplp_actions_created ON public.pplp_actions(created_at DESC);
CREATE INDEX idx_pplp_actions_platform ON public.pplp_actions(platform_id);

-- Enable RLS
ALTER TABLE public.pplp_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own actions"
  ON public.pplp_actions FOR SELECT
  USING (actor_id = auth.uid());

CREATE POLICY "Users can insert own actions"
  ON public.pplp_actions FOR INSERT
  WITH CHECK (actor_id = auth.uid());

CREATE POLICY "Admins can view all actions"
  ON public.pplp_actions FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update all actions"
  ON public.pplp_actions FOR UPDATE
  USING (public.is_admin());

-- =============================================
-- 2. PPLP Evidences Table - Evidence Bundles per Action
-- =============================================
CREATE TABLE public.pplp_evidences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id UUID NOT NULL REFERENCES public.pplp_actions(id) ON DELETE CASCADE,
  evidence_type TEXT NOT NULL,
  uri TEXT NULL,
  content_hash TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_pplp_evidences_action ON public.pplp_evidences(action_id);
CREATE INDEX idx_pplp_evidences_hash ON public.pplp_evidences(content_hash);

-- Enable RLS
ALTER TABLE public.pplp_evidences ENABLE ROW LEVEL SECURITY;

-- RLS Policies (inherit from action ownership)
CREATE POLICY "Users can view evidences of own actions"
  ON public.pplp_evidences FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pplp_actions a 
      WHERE a.id = action_id AND a.actor_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert evidences for own actions"
  ON public.pplp_evidences FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pplp_actions a 
      WHERE a.id = action_id AND a.actor_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all evidences"
  ON public.pplp_evidences FOR SELECT
  USING (public.is_admin());

-- =============================================
-- 3. PPLP Scores Table - 5-Pillar Scoring Results
-- =============================================
CREATE TABLE public.pplp_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id UUID NOT NULL UNIQUE REFERENCES public.pplp_actions(id) ON DELETE CASCADE,
  pillar_s NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (pillar_s >= 0 AND pillar_s <= 100),
  pillar_t NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (pillar_t >= 0 AND pillar_t <= 100),
  pillar_h NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (pillar_h >= 0 AND pillar_h <= 100),
  pillar_c NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (pillar_c >= 0 AND pillar_c <= 100),
  pillar_u NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (pillar_u >= 0 AND pillar_u <= 100),
  light_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  multiplier_q NUMERIC(4,2) NOT NULL DEFAULT 1.0 CHECK (multiplier_q >= 1.0 AND multiplier_q <= 3.0),
  multiplier_i NUMERIC(4,2) NOT NULL DEFAULT 1.0 CHECK (multiplier_i >= 1.0 AND multiplier_i <= 5.0),
  multiplier_k NUMERIC(4,2) NOT NULL DEFAULT 1.0 CHECK (multiplier_k >= 0.0 AND multiplier_k <= 1.0),
  base_reward BIGINT NOT NULL DEFAULT 0,
  final_reward BIGINT NOT NULL DEFAULT 0,
  decision public.pplp_decision NOT NULL DEFAULT 'pending',
  decision_reason TEXT NULL,
  scored_by TEXT NOT NULL DEFAULT 'system',
  policy_version TEXT NOT NULL DEFAULT '1.0.0',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_pplp_scores_action ON public.pplp_scores(action_id);
CREATE INDEX idx_pplp_scores_decision ON public.pplp_scores(decision);
CREATE INDEX idx_pplp_scores_light ON public.pplp_scores(light_score DESC);

-- Enable RLS
ALTER TABLE public.pplp_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view scores of own actions"
  ON public.pplp_scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pplp_actions a 
      WHERE a.id = action_id AND a.actor_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all scores"
  ON public.pplp_scores FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can insert scores"
  ON public.pplp_scores FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update scores"
  ON public.pplp_scores FOR UPDATE
  USING (public.is_admin());

-- =============================================
-- 4. PPLP Policies Table - Versioned Scoring Policies
-- =============================================
CREATE TABLE public.pplp_policies (
  version TEXT PRIMARY KEY,
  policy_json JSONB NOT NULL,
  description TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  activated_at TIMESTAMP WITH TIME ZONE NULL
);

-- Index
CREATE INDEX idx_pplp_policies_active ON public.pplp_policies(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.pplp_policies ENABLE ROW LEVEL SECURITY;

-- RLS Policies (public read, admin write)
CREATE POLICY "Anyone can view active policies"
  ON public.pplp_policies FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can view all policies"
  ON public.pplp_policies FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can manage policies"
  ON public.pplp_policies FOR ALL
  USING (public.is_admin());

-- =============================================
-- 5. PPLP Fraud Signals Table - Anti-Fraud Detection
-- =============================================
CREATE TABLE public.pplp_fraud_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL,
  action_id UUID NULL REFERENCES public.pplp_actions(id) ON DELETE SET NULL,
  signal_type TEXT NOT NULL,
  severity INTEGER NOT NULL DEFAULT 1 CHECK (severity >= 1 AND severity <= 5),
  source TEXT NOT NULL DEFAULT 'system',
  details JSONB NOT NULL DEFAULT '{}',
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_by UUID NULL,
  resolved_at TIMESTAMP WITH TIME ZONE NULL,
  resolution_notes TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_pplp_fraud_actor ON public.pplp_fraud_signals(actor_id);
CREATE INDEX idx_pplp_fraud_type ON public.pplp_fraud_signals(signal_type);
CREATE INDEX idx_pplp_fraud_severity ON public.pplp_fraud_signals(severity DESC);
CREATE INDEX idx_pplp_fraud_unresolved ON public.pplp_fraud_signals(is_resolved) WHERE is_resolved = false;

-- Enable RLS
ALTER TABLE public.pplp_fraud_signals ENABLE ROW LEVEL SECURITY;

-- RLS Policies (admin only - users should not see fraud signals)
CREATE POLICY "Admins can view all fraud signals"
  ON public.pplp_fraud_signals FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can manage fraud signals"
  ON public.pplp_fraud_signals FOR ALL
  USING (public.is_admin());

-- =============================================
-- 6. PPLP Disputes Table - Governance/Audit
-- =============================================
CREATE TABLE public.pplp_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id UUID NOT NULL REFERENCES public.pplp_actions(id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL,
  reason TEXT NOT NULL,
  evidence JSONB NOT NULL DEFAULT '{}',
  status public.pplp_dispute_status NOT NULL DEFAULT 'open',
  assigned_to UUID NULL,
  resolution TEXT NULL,
  resolved_by UUID NULL,
  resolved_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_pplp_disputes_action ON public.pplp_disputes(action_id);
CREATE INDEX idx_pplp_disputes_status ON public.pplp_disputes(status);
CREATE INDEX idx_pplp_disputes_submitter ON public.pplp_disputes(submitted_by);

-- Enable RLS
ALTER TABLE public.pplp_disputes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own disputes"
  ON public.pplp_disputes FOR SELECT
  USING (submitted_by = auth.uid());

CREATE POLICY "Users can submit disputes for actions they're involved in"
  ON public.pplp_disputes FOR INSERT
  WITH CHECK (
    submitted_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.pplp_actions a 
      WHERE a.id = action_id AND (a.actor_id = auth.uid() OR a.target_id = auth.uid())
    )
  );

CREATE POLICY "Admins can view all disputes"
  ON public.pplp_disputes FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can manage disputes"
  ON public.pplp_disputes FOR ALL
  USING (public.is_admin());

-- Trigger for updated_at
CREATE TRIGGER update_pplp_disputes_updated_at
  BEFORE UPDATE ON public.pplp_disputes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- Helper Functions for PPLP Scoring
-- =============================================

-- Calculate Light Score from 5 pillars
CREATE OR REPLACE FUNCTION public.calculate_light_score(
  _s NUMERIC, _t NUMERIC, _h NUMERIC, _c NUMERIC, _u NUMERIC
) RETURNS NUMERIC
LANGUAGE sql IMMUTABLE
AS $$
  SELECT ROUND((_s * 0.25) + (_t * 0.20) + (_h * 0.20) + (_c * 0.20) + (_u * 0.15), 2)
$$;

-- Calculate final reward with multipliers
CREATE OR REPLACE FUNCTION public.calculate_pplp_reward(
  _base_reward BIGINT, _q NUMERIC, _i NUMERIC, _k NUMERIC
) RETURNS BIGINT
LANGUAGE sql IMMUTABLE
AS $$
  SELECT ROUND(_base_reward * _q * _i * _k)::BIGINT
$$;

-- Get user's aggregate PPLP stats
CREATE OR REPLACE FUNCTION public.get_user_pplp_stats(_user_id UUID)
RETURNS TABLE(
  total_actions BIGINT,
  scored_actions BIGINT,
  minted_actions BIGINT,
  avg_light_score NUMERIC,
  avg_pillar_s NUMERIC,
  avg_pillar_t NUMERIC,
  avg_pillar_h NUMERIC,
  avg_pillar_c NUMERIC,
  avg_pillar_u NUMERIC,
  total_rewards BIGINT
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(a.id)::BIGINT AS total_actions,
    COUNT(CASE WHEN a.status IN ('scored', 'minted') THEN 1 END)::BIGINT AS scored_actions,
    COUNT(CASE WHEN a.status = 'minted' THEN 1 END)::BIGINT AS minted_actions,
    COALESCE(AVG(s.light_score), 0)::NUMERIC AS avg_light_score,
    COALESCE(AVG(s.pillar_s), 0)::NUMERIC AS avg_pillar_s,
    COALESCE(AVG(s.pillar_t), 0)::NUMERIC AS avg_pillar_t,
    COALESCE(AVG(s.pillar_h), 0)::NUMERIC AS avg_pillar_h,
    COALESCE(AVG(s.pillar_c), 0)::NUMERIC AS avg_pillar_c,
    COALESCE(AVG(s.pillar_u), 0)::NUMERIC AS avg_pillar_u,
    COALESCE(SUM(s.final_reward), 0)::BIGINT AS total_rewards
  FROM pplp_actions a
  LEFT JOIN pplp_scores s ON a.id = s.action_id
  WHERE a.actor_id = _user_id;
END;
$$;

-- Insert default policy v1.0.0
INSERT INTO public.pplp_policies (version, policy_json, description, is_active, activated_at)
VALUES (
  '1.0.0',
  '{
    "name": "PPLP Default Policy",
    "pillars": {
      "S": {"weight": 0.25, "name": "Service to Life"},
      "T": {"weight": 0.20, "name": "Truth/Transparency"},
      "H": {"weight": 0.20, "name": "Healing/Compassion"},
      "C": {"weight": 0.20, "name": "Contribution Durability"},
      "U": {"weight": 0.15, "name": "Unity Alignment"}
    },
    "multipliers": {
      "Q": {"min": 1.0, "max": 3.0, "name": "Quality"},
      "I": {"min": 1.0, "max": 5.0, "name": "Impact"},
      "K": {"min": 0.0, "max": 1.0, "name": "Integrity"}
    },
    "platforms": {
      "angel_ai": {"T_min": 80, "K_min": 0.75},
      "fun_profile": {"T_min": 70, "U_min": 65, "K_min": 0.70},
      "fun_charity": {"T_min": 85, "S_min": 75, "K_min": 0.80},
      "fun_academy": {"T_min": 70, "light_score_min": 60}
    },
    "action_types": {
      "QUESTION_ASK": {"base_reward": 100, "category": "engagement"},
      "JOURNAL_WRITE": {"base_reward": 200, "category": "reflection"},
      "CONTENT_SHARE": {"base_reward": 150, "category": "contribution"},
      "ENGAGEMENT_LIKE": {"base_reward": 50, "category": "engagement"},
      "COMMUNITY_HELP": {"base_reward": 500, "category": "service"},
      "DONATION": {"base_reward": 1000, "category": "service"}
    }
  }'::JSONB,
  'Initial PPLP policy with 5-pillar scoring and platform thresholds',
  true,
  now()
);