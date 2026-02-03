-- Create standardized PPLP Action Types enum
DO $$ BEGIN
  CREATE TYPE pplp_action_type AS ENUM (
    -- Learning & Education (FUN Academy)
    'LEARN_COMPLETE',
    'PROJECT_SUBMIT',
    'MENTOR_HELP',
    'COURSE_CREATE',
    'QUIZ_PASS',
    
    -- Content & Community
    'CONTENT_CREATE',
    'CONTENT_REVIEW',
    'CONTENT_SHARE',
    'COMMENT_CREATE',
    'POST_ENGAGEMENT',
    
    -- Charity & Volunteer (FUN Charity)
    'DONATE',
    'VOLUNTEER',
    'CAMPAIGN_CREATE',
    'CAMPAIGN_SUPPORT',
    
    -- Environment (FUN Earth)
    'TREE_PLANT',
    'CLEANUP_EVENT',
    'CARBON_OFFSET',
    'ECO_ACTION',
    
    -- Commerce (FUN Farm, FUN Market)
    'FARM_DELIVERY',
    'MARKET_FAIR_TRADE',
    'PRODUCT_REVIEW',
    'SELLER_VERIFY',
    
    -- Governance & Legal
    'BUG_BOUNTY',
    'GOV_PROPOSAL',
    'GOV_VOTE',
    'DISPUTE_RESOLVE',
    'POLICY_REVIEW',
    
    -- Daily Life (FUNLife, Angel AI)
    'DAILY_RITUAL',
    'GRATITUDE_PRACTICE',
    'JOURNAL_WRITE',
    'QUESTION_ASK',
    'DAILY_LOGIN',
    
    -- Investment & Trading
    'STAKE_LOCK',
    'LIQUIDITY_PROVIDE',
    'REFERRAL_INVITE',
    
    -- Identity & Profile
    'PROFILE_COMPLETE',
    'KYC_VERIFY',
    'REPUTATION_EARN'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create evidence_type enum
DO $$ BEGIN
  CREATE TYPE pplp_evidence_type AS ENUM (
    'QUIZ_SCORE',
    'CERTIFICATE',
    'SCREENSHOT',
    'TRANSACTION_HASH',
    'GPS_LOCATION',
    'PHOTO_PROOF',
    'VIDEO_PROOF',
    'DOCUMENT',
    'API_RESPONSE',
    'DEVICE_SIGNATURE',
    'USER_ATTESTATION',
    'THIRD_PARTY_VERIFY',
    'IPFS_HASH',
    'CONTENT_HASH'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create integrity_signals type for structured storage
DO $$ BEGIN
  CREATE TYPE pplp_integrity_signal AS ENUM (
    'DEVICE_FINGERPRINT',
    'SESSION_CONTINUITY',
    'IP_CONSISTENCY',
    'BEHAVIORAL_PATTERN',
    'CAPTCHA_PASS',
    'ANTI_SYBIL_CHECK',
    'TIME_PATTERN_VALID',
    'LOCATION_VALID'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add canonical_hash column to pplp_actions for evidence anchoring
ALTER TABLE pplp_actions 
ADD COLUMN IF NOT EXISTS canonical_hash text,
ADD COLUMN IF NOT EXISTS action_type_enum pplp_action_type,
ADD COLUMN IF NOT EXISTS mint_request_hash text,
ADD COLUMN IF NOT EXISTS policy_snapshot jsonb DEFAULT '{}'::jsonb;

-- Add structured columns to pplp_evidences
ALTER TABLE pplp_evidences
ADD COLUMN IF NOT EXISTS evidence_type_enum pplp_evidence_type,
ADD COLUMN IF NOT EXISTS anchor_chain text,
ADD COLUMN IF NOT EXISTS anchor_tx_hash text,
ADD COLUMN IF NOT EXISTS anchored_at timestamptz;

-- Create index for canonical hash lookups
CREATE INDEX IF NOT EXISTS idx_pplp_actions_canonical_hash 
ON pplp_actions(canonical_hash) WHERE canonical_hash IS NOT NULL;

-- Create index for action type enum
CREATE INDEX IF NOT EXISTS idx_pplp_actions_type_enum 
ON pplp_actions(action_type_enum) WHERE action_type_enum IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN pplp_actions.canonical_hash IS 'keccak256 hash of canonical JSON for evidence anchoring';
COMMENT ON COLUMN pplp_actions.mint_request_hash IS 'Hash included in mint request: keccak256(evidenceHash + policyVersion + actionId)';
COMMENT ON COLUMN pplp_evidences.anchor_chain IS 'Blockchain where evidence hash is anchored (e.g., BSC, IPFS)';