-- ============================================
-- PPLP MINT REQUESTS TABLE
-- Track signed mint requests for on-chain verification
-- ============================================

CREATE TABLE public.pplp_mint_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id UUID NOT NULL REFERENCES pplp_actions(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL,
  
  -- On-chain payload fields
  recipient_address TEXT NOT NULL,
  amount BIGINT NOT NULL,
  action_hash TEXT NOT NULL, -- bytes32 keccak256
  evidence_hash TEXT NOT NULL, -- bytes32 keccak256
  policy_version INTEGER NOT NULL DEFAULT 1,
  
  -- Validity window
  valid_after TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_before TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
  
  -- Nonce for replay protection
  nonce BIGINT NOT NULL,
  
  -- EIP-712 signature
  signature TEXT,
  signer_address TEXT,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'signed', 'submitted', 'minted', 'expired', 'rejected')),
  tx_hash TEXT,
  minted_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Ensure idempotency - each action can only have one mint request
  CONSTRAINT unique_action_mint UNIQUE (action_id)
);

-- ============================================
-- NONCE TRACKING PER USER
-- ============================================

CREATE TABLE public.pplp_user_nonces (
  user_id UUID PRIMARY KEY,
  current_nonce BIGINT NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- PPLP SIGNERS TABLE
-- Track authorized signers for mint authorization
-- ============================================

CREATE TABLE public.pplp_signers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  weight INTEGER NOT NULL DEFAULT 1, -- For multi-sig
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deactivated_at TIMESTAMPTZ
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_mint_requests_actor ON pplp_mint_requests(actor_id);
CREATE INDEX idx_mint_requests_status ON pplp_mint_requests(status);
CREATE INDEX idx_mint_requests_valid_before ON pplp_mint_requests(valid_before) WHERE status = 'signed';

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE pplp_mint_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE pplp_user_nonces ENABLE ROW LEVEL SECURITY;
ALTER TABLE pplp_signers ENABLE ROW LEVEL SECURITY;

-- Users can view their own mint requests
CREATE POLICY "Users can view own mint requests"
  ON pplp_mint_requests FOR SELECT
  USING (auth.uid() = actor_id);

-- Service role can manage all
CREATE POLICY "Service role manages mint requests"
  ON pplp_mint_requests FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role manages nonces"
  ON pplp_user_nonces FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Public can view active signers"
  ON pplp_signers FOR SELECT
  USING (is_active = true);

CREATE POLICY "Service role manages signers"
  ON pplp_signers FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get and increment nonce atomically
CREATE OR REPLACE FUNCTION public.get_next_nonce(_user_id UUID)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nonce BIGINT;
BEGIN
  INSERT INTO pplp_user_nonces (user_id, current_nonce)
  VALUES (_user_id, 1)
  ON CONFLICT (user_id) DO UPDATE SET
    current_nonce = pplp_user_nonces.current_nonce + 1,
    last_used_at = now()
  RETURNING current_nonce INTO v_nonce;
  
  RETURN v_nonce;
END;
$$;

-- Expire old mint requests
CREATE OR REPLACE FUNCTION public.expire_old_mint_requests()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE pplp_mint_requests
  SET status = 'expired', updated_at = now()
  WHERE status = 'signed' AND valid_before < now();
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Insert default PPLP Signer (Treasury)
INSERT INTO pplp_signers (address, name, weight)
VALUES ('0x0000000000000000000000000000000000000000', 'Treasury Signer', 1)
ON CONFLICT DO NOTHING;