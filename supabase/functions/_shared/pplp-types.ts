/**
 * PPLP Data Model Types
 * 
 * Chuẩn hóa dữ liệu theo đặc tả PPLP Engine Spec v1.0
 * Implements: LightAction Object, Evidence Anchoring, Action Types
 */

// ============================================
// ACTION TYPES ENUM
// ============================================

export const PPLP_ACTION_TYPES = {
  // Learning & Education (FUN Academy)
  LEARN_COMPLETE: 'LEARN_COMPLETE',
  PROJECT_SUBMIT: 'PROJECT_SUBMIT',
  MENTOR_HELP: 'MENTOR_HELP',
  COURSE_CREATE: 'COURSE_CREATE',
  QUIZ_PASS: 'QUIZ_PASS',
  
  // Content & Community
  CONTENT_CREATE: 'CONTENT_CREATE',
  CONTENT_REVIEW: 'CONTENT_REVIEW',
  CONTENT_SHARE: 'CONTENT_SHARE',
  COMMENT_CREATE: 'COMMENT_CREATE',
  POST_ENGAGEMENT: 'POST_ENGAGEMENT',
  
  // Charity & Volunteer (FUN Charity)
  DONATE: 'DONATE',
  VOLUNTEER: 'VOLUNTEER',
  CAMPAIGN_CREATE: 'CAMPAIGN_CREATE',
  CAMPAIGN_SUPPORT: 'CAMPAIGN_SUPPORT',
  
  // Environment (FUN Earth)
  TREE_PLANT: 'TREE_PLANT',
  CLEANUP_EVENT: 'CLEANUP_EVENT',
  CARBON_OFFSET: 'CARBON_OFFSET',
  ECO_ACTION: 'ECO_ACTION',
  
  // Commerce (FUN Farm, FUN Market)
  FARM_DELIVERY: 'FARM_DELIVERY',
  MARKET_FAIR_TRADE: 'MARKET_FAIR_TRADE',
  PRODUCT_REVIEW: 'PRODUCT_REVIEW',
  SELLER_VERIFY: 'SELLER_VERIFY',
  
  // Governance & Legal
  BUG_BOUNTY: 'BUG_BOUNTY',
  GOV_PROPOSAL: 'GOV_PROPOSAL',
  GOV_VOTE: 'GOV_VOTE',
  DISPUTE_RESOLVE: 'DISPUTE_RESOLVE',
  POLICY_REVIEW: 'POLICY_REVIEW',
  
  // Daily Life (FUNLife, Angel AI)
  DAILY_RITUAL: 'DAILY_RITUAL',
  GRATITUDE_PRACTICE: 'GRATITUDE_PRACTICE',
  JOURNAL_WRITE: 'JOURNAL_WRITE',
  QUESTION_ASK: 'QUESTION_ASK',
  DAILY_LOGIN: 'DAILY_LOGIN',
  VISION_CREATE: 'VISION_CREATE',
  
  // Investment & Trading
  STAKE_LOCK: 'STAKE_LOCK',
  LIQUIDITY_PROVIDE: 'LIQUIDITY_PROVIDE',
  REFERRAL_INVITE: 'REFERRAL_INVITE',
  
  // Identity & Profile
  PROFILE_COMPLETE: 'PROFILE_COMPLETE',
  KYC_VERIFY: 'KYC_VERIFY',
  REPUTATION_EARN: 'REPUTATION_EARN',
} as const;

export type PPLPActionType = typeof PPLP_ACTION_TYPES[keyof typeof PPLP_ACTION_TYPES];

// ============================================
// EVIDENCE TYPES ENUM
// ============================================

export const PPLP_EVIDENCE_TYPES = {
  QUIZ_SCORE: 'QUIZ_SCORE',
  CERTIFICATE: 'CERTIFICATE',
  SCREENSHOT: 'SCREENSHOT',
  TRANSACTION_HASH: 'TRANSACTION_HASH',
  GPS_LOCATION: 'GPS_LOCATION',
  PHOTO_PROOF: 'PHOTO_PROOF',
  VIDEO_PROOF: 'VIDEO_PROOF',
  DOCUMENT: 'DOCUMENT',
  API_RESPONSE: 'API_RESPONSE',
  DEVICE_SIGNATURE: 'DEVICE_SIGNATURE',
  USER_ATTESTATION: 'USER_ATTESTATION',
  THIRD_PARTY_VERIFY: 'THIRD_PARTY_VERIFY',
  IPFS_HASH: 'IPFS_HASH',
  CONTENT_HASH: 'CONTENT_HASH',
} as const;

export type PPLPEvidenceType = typeof PPLP_EVIDENCE_TYPES[keyof typeof PPLP_EVIDENCE_TYPES];

// ============================================
// PLATFORM IDS
// ============================================

export const FUN_PLATFORMS = {
  FUN_PROFILE: 'FUN_PROFILE',
  FUN_ACADEMY: 'FUN_ACADEMY',
  FUN_CHARITY: 'FUN_CHARITY',
  FUN_EARTH: 'FUN_EARTH',
  FUN_PLAY: 'FUN_PLAY',
  FUN_FARM: 'FUN_FARM',
  FUN_MARKET: 'FUN_MARKET',
  FUN_WALLET: 'FUN_WALLET',
  FUN_LIFE: 'FUN_LIFE',
  FUN_TRADING: 'FUN_TRADING',
  FUN_INVEST: 'FUN_INVEST',
  FUN_LEGAL: 'FUN_LEGAL',
  FUN_PLANET: 'FUN_PLANET',
  ANGEL_AI: 'ANGEL_AI',
} as const;

export type FUNPlatformId = typeof FUN_PLATFORMS[keyof typeof FUN_PLATFORMS];

// ============================================
// LIGHT ACTION OBJECT (Off-chain Canonical)
// ============================================

export interface LightActionEvidence {
  type: PPLPEvidenceType;
  value?: number | string;
  uri?: string;
  content_hash?: string;
  metadata?: Record<string, unknown>;
}

export interface LightActionImpact {
  beneficiaries?: number;
  measurable_outcome?: string;
  impact_uri?: string;
  scope?: 'individual' | 'group' | 'platform' | 'ecosystem';
  reach_count?: number;
  quality_indicators?: string[];
}

export interface LightActionIntegrity {
  device_hash?: string;
  session_signals?: string;
  anti_sybil_score?: number;
  ip_hash?: string;
  behavioral_score?: number;
  source_verified?: boolean;
  duplicate_check?: boolean;
}

export interface LightActionMetadata {
  // Academy
  course_id?: string;
  lesson_count?: number;
  duration_sec?: number;
  language?: string;
  quiz_score?: number;
  
  // Community
  post_id?: string;
  content_length?: number;
  engagement_count?: number;
  
  // Charity
  donation_amount?: number;
  campaign_id?: string;
  volunteer_hours?: number;
  
  // Earth
  trees_planted?: number;
  carbon_kg?: number;
  event_id?: string;
  
  // Commerce
  order_id?: string;
  fair_trade_certified?: boolean;
  
  // Governance
  proposal_id?: string;
  vote_weight?: number;
  dispute_id?: string;
  
  // Generic
  reward_amount?: number;
  purity_score?: number;
  [key: string]: unknown;
}

export interface LightAction {
  action_id: string;
  platform_id: FUNPlatformId;
  action_type: PPLPActionType;
  actor: string; // User ID or wallet address
  timestamp: number; // Unix timestamp
  metadata: LightActionMetadata;
  evidence: LightActionEvidence[];
  impact: LightActionImpact;
  integrity: LightActionIntegrity;
}

// ============================================
// MINT REQUEST OBJECT
// ============================================

export interface MintRequest {
  action_id: string;
  evidence_hash: string; // keccak256 of canonical evidence JSON
  policy_version: string;
  actor: string;
  reward_amount: number;
  mint_request_hash: string; // keccak256(evidence_hash + policy_version + action_id)
  timestamp: number;
  signature?: string; // PPLP Signer signature for on-chain verification
}

// ============================================
// SCORING CONTEXT
// ============================================

export interface ScoringContext {
  action: LightAction;
  policy_version: string;
  pillar_weights: {
    S: number; // Serving
    T: number; // Truth
    H: number; // Healing
    C: number; // Continuity
    U: number; // Unity
  };
  reputation_tier?: 'bronze' | 'silver' | 'gold' | 'diamond' | 'light';
  daily_action_count?: number;
  weekly_action_count?: number;
}

export interface ScoringResult {
  light_score: number;
  pillar_scores: {
    S: number;
    T: number;
    H: number;
    C: number;
    U: number;
  };
  multipliers: {
    Q: number; // Quality
    I: number; // Impact
    K: number; // Streak/Karma
  };
  base_reward: number;
  final_reward: number;
  decision: 'APPROVE' | 'REJECT' | 'PENDING_REVIEW' | 'FRAUD_FLAG';
  decision_reason?: string;
}

// ============================================
// ACTION TYPE TO PLATFORM MAPPING
// ============================================

export const ACTION_PLATFORM_MAP: Record<PPLPActionType, FUNPlatformId[]> = {
  // Academy actions
  LEARN_COMPLETE: ['FUN_ACADEMY'],
  PROJECT_SUBMIT: ['FUN_ACADEMY'],
  MENTOR_HELP: ['FUN_ACADEMY'],
  COURSE_CREATE: ['FUN_ACADEMY'],
  QUIZ_PASS: ['FUN_ACADEMY'],
  
  // Community actions - can come from multiple platforms
  CONTENT_CREATE: ['ANGEL_AI', 'FUN_LIFE', 'FUN_ACADEMY'],
  CONTENT_REVIEW: ['ANGEL_AI', 'FUN_ACADEMY', 'FUN_MARKET'],
  CONTENT_SHARE: ['ANGEL_AI', 'FUN_LIFE'],
  COMMENT_CREATE: ['ANGEL_AI', 'FUN_LIFE'],
  POST_ENGAGEMENT: ['ANGEL_AI', 'FUN_LIFE'],
  
  // Charity actions
  DONATE: ['FUN_CHARITY', 'FUN_WALLET'],
  VOLUNTEER: ['FUN_CHARITY', 'FUN_EARTH'],
  CAMPAIGN_CREATE: ['FUN_CHARITY'],
  CAMPAIGN_SUPPORT: ['FUN_CHARITY'],
  
  // Earth actions
  TREE_PLANT: ['FUN_EARTH'],
  CLEANUP_EVENT: ['FUN_EARTH'],
  CARBON_OFFSET: ['FUN_EARTH', 'FUN_WALLET'],
  ECO_ACTION: ['FUN_EARTH', 'FUN_LIFE'],
  
  // Commerce actions
  FARM_DELIVERY: ['FUN_FARM'],
  MARKET_FAIR_TRADE: ['FUN_MARKET'],
  PRODUCT_REVIEW: ['FUN_MARKET', 'FUN_FARM'],
  SELLER_VERIFY: ['FUN_MARKET'],
  
  // Governance actions
  BUG_BOUNTY: ['FUN_LEGAL', 'ANGEL_AI'],
  GOV_PROPOSAL: ['FUN_LEGAL'],
  GOV_VOTE: ['FUN_LEGAL', 'FUN_WALLET'],
  DISPUTE_RESOLVE: ['FUN_LEGAL'],
  POLICY_REVIEW: ['FUN_LEGAL'],
  
  // Daily life actions
  DAILY_RITUAL: ['FUN_LIFE', 'ANGEL_AI'],
  GRATITUDE_PRACTICE: ['ANGEL_AI', 'FUN_LIFE'],
  JOURNAL_WRITE: ['ANGEL_AI', 'FUN_LIFE'],
  QUESTION_ASK: ['ANGEL_AI'],
  DAILY_LOGIN: ['ANGEL_AI', 'FUN_LIFE', 'FUN_WALLET'],
  VISION_CREATE: ['ANGEL_AI', 'FUN_LIFE'],
  
  // Investment actions
  STAKE_LOCK: ['FUN_INVEST', 'FUN_WALLET'],
  LIQUIDITY_PROVIDE: ['FUN_TRADING', 'FUN_WALLET'],
  REFERRAL_INVITE: ['FUN_PROFILE', 'ANGEL_AI'],
  
  // Identity actions
  PROFILE_COMPLETE: ['FUN_PROFILE', 'ANGEL_AI'],
  KYC_VERIFY: ['FUN_PROFILE', 'FUN_LEGAL'],
  REPUTATION_EARN: ['FUN_PROFILE'],
};

// ============================================
// BASE REWARDS BY ACTION TYPE
// ============================================

export const BASE_REWARDS: Record<PPLPActionType, number> = {
  // High value actions
  PROJECT_SUBMIT: 5000,
  COURSE_CREATE: 10000,
  MENTOR_HELP: 3000,
  DONATE: 2000, // + matching
  VOLUNTEER: 3000,
  CAMPAIGN_CREATE: 5000,
  TREE_PLANT: 2000,
  CLEANUP_EVENT: 2500,
  GOV_PROPOSAL: 5000,
  DISPUTE_RESOLVE: 3000,
  BUG_BOUNTY: 10000,
  KYC_VERIFY: 5000,
  
  // Medium value actions
  LEARN_COMPLETE: 2000,
  QUIZ_PASS: 1000,
  CONTENT_CREATE: 1500,
  CONTENT_REVIEW: 1000,
  FARM_DELIVERY: 2000,
  MARKET_FAIR_TRADE: 1500,
  PRODUCT_REVIEW: 800,
  CARBON_OFFSET: 1500,
  CAMPAIGN_SUPPORT: 1000,
  GOV_VOTE: 500,
  POLICY_REVIEW: 1500,
  SELLER_VERIFY: 2000,
  
  // Lower value actions (daily/frequent)
  CONTENT_SHARE: 500,
  COMMENT_CREATE: 500,
  POST_ENGAGEMENT: 300,
  DAILY_RITUAL: 500,
  GRATITUDE_PRACTICE: 1000,
  JOURNAL_WRITE: 2000,
  QUESTION_ASK: 1500,
  DAILY_LOGIN: 100,
  VISION_CREATE: 1000,
  ECO_ACTION: 500,
  REFERRAL_INVITE: 1000,
  
  // Investment actions (separate economics)
  STAKE_LOCK: 0, // Calculated separately
  LIQUIDITY_PROVIDE: 0,
  
  // Identity actions
  PROFILE_COMPLETE: 2000,
  REPUTATION_EARN: 1000,
};
