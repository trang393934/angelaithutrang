-- ============================================
-- EXTEND PPLP POLICIES FOR FULL VERSIONING
-- ============================================

-- Add missing columns to pplp_policies
ALTER TABLE pplp_policies 
  ADD COLUMN IF NOT EXISTS policy_hash TEXT,
  ADD COLUMN IF NOT EXISTS ipfs_cid TEXT,
  ADD COLUMN IF NOT EXISTS arweave_tx TEXT,
  ADD COLUMN IF NOT EXISTS version_int INT,
  ADD COLUMN IF NOT EXISTS thresholds JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS caps JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS formulas JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS action_configs JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS deprecated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deprecation_reason TEXT,
  ADD COLUMN IF NOT EXISTS approved_by UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS required_approvals INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS changelog TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Create policy change history table
CREATE TABLE IF NOT EXISTS public.pplp_policy_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_version TEXT NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('created', 'updated', 'activated', 'deprecated', 'approved')),
  field_changed TEXT,
  old_value JSONB,
  new_value JSONB,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  tx_hash TEXT,
  block_number BIGINT,
  reason TEXT
);

-- Create on-chain registry table
CREATE TABLE IF NOT EXISTS public.pplp_policy_onchain (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_version TEXT NOT NULL,
  chain_id INT NOT NULL DEFAULT 56,
  contract_address TEXT NOT NULL,
  policy_hash TEXT NOT NULL,
  tx_hash TEXT NOT NULL,
  block_number BIGINT NOT NULL,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  signer_address TEXT NOT NULL,
  UNIQUE(chain_id, contract_address, policy_version)
);

-- Enable RLS
ALTER TABLE pplp_policy_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pplp_policy_onchain ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Anyone can view policy changes" ON pplp_policy_changes;
DROP POLICY IF EXISTS "System can insert policy changes" ON pplp_policy_changes;
DROP POLICY IF EXISTS "Anyone can view on-chain registrations" ON pplp_policy_onchain;
DROP POLICY IF EXISTS "Admins can manage on-chain registrations" ON pplp_policy_onchain;

CREATE POLICY "Anyone can view policy changes"
  ON pplp_policy_changes FOR SELECT
  USING (true);

CREATE POLICY "System can insert policy changes"
  ON pplp_policy_changes FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Anyone can view on-chain registrations"
  ON pplp_policy_onchain FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage on-chain registrations"
  ON pplp_policy_onchain FOR ALL
  USING (is_admin());

-- Function to get current active policy
CREATE OR REPLACE FUNCTION public.get_active_policy()
RETURNS pplp_policies
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM pplp_policies 
  WHERE is_active = true 
  ORDER BY created_at DESC 
  LIMIT 1;
$$;

-- Function to compute policy hash
CREATE OR REPLACE FUNCTION public.compute_policy_hash(_policy_json JSONB)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN '0x' || encode(sha256(_policy_json::text::bytea), 'hex');
END;
$$;

-- Function to validate policy version match
CREATE OR REPLACE FUNCTION public.validate_policy_version(_version TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _policy RECORD;
BEGIN
  SELECT * INTO _policy FROM pplp_policies 
  WHERE version = _version AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Policy version not found or not active'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'valid', true,
    'version', _policy.version,
    'policy_hash', _policy.policy_hash,
    'thresholds', _policy.thresholds,
    'caps', _policy.caps
  );
END;
$$;

-- Update existing policy with hash
UPDATE pplp_policies 
SET policy_hash = compute_policy_hash(policy_json),
    thresholds = COALESCE(policy_json->'thresholds', '{
      "min_light_score": 0.6,
      "pillar_min": { "S": 0.1, "T": 0.1, "H": 0.1, "C": 0.1, "U": 0.1 }
    }'::jsonb),
    caps = '{
      "epoch_mint_cap": 100000000,
      "user_epoch_cap": 10000,
      "min_mint_amount": 1,
      "max_mint_amount": 1000000
    }'::jsonb,
    formulas = '{
      "reward": "BaseReward × Q × I × K",
      "light_score": "(S + T + H + C + U) / 5"
    }'::jsonb,
    action_configs = COALESCE(policy_json->'action_configs', '{}'::jsonb)
WHERE policy_hash IS NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pplp_policy_changes_version ON pplp_policy_changes(policy_version);
CREATE INDEX IF NOT EXISTS idx_pplp_policy_onchain_chain ON pplp_policy_onchain(chain_id, contract_address);