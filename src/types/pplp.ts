/**
 * PPLP Data Model Types (Frontend)
 * 
 * Chuẩn hóa dữ liệu theo đặc tả PPLP Engine Spec v1.0
 * Mirror of backend types for type safety
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
// LIGHT ACTION INTERFACES
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
  actor: string;
  timestamp: number;
  metadata: LightActionMetadata;
  evidence: LightActionEvidence[];
  impact: LightActionImpact;
  integrity: LightActionIntegrity;
}

// ============================================
// MINT REQUEST
// ============================================

export interface MintRequest {
  action_id: string;
  evidence_hash: string;
  policy_version: string;
  actor: string;
  reward_amount: number;
  mint_request_hash: string;
  timestamp: number;
  signature?: string;
}

// ============================================
// SCORING
// ============================================

export interface PillarScores {
  S: number; // Serving
  T: number; // Truth
  H: number; // Healing
  C: number; // Continuity
  U: number; // Unity
}

export interface ScoringMultipliers {
  Q: number; // Quality
  I: number; // Impact
  K: number; // Streak/Karma
}

export interface ScoringResult {
  light_score: number;
  pillar_scores: PillarScores;
  multipliers: ScoringMultipliers;
  base_reward: number;
  final_reward: number;
  decision: 'APPROVE' | 'REJECT' | 'PENDING_REVIEW' | 'FRAUD_FLAG';
  decision_reason?: string;
}

// ============================================
// ACTION TYPE DISPLAY INFO
// ============================================

export const ACTION_TYPE_INFO: Record<PPLPActionType, { label: string; icon: string; category: string }> = {
  // Learning
  LEARN_COMPLETE: { label: 'Hoàn thành khóa học', icon: '📚', category: 'Học tập' },
  PROJECT_SUBMIT: { label: 'Nộp dự án', icon: '🎯', category: 'Học tập' },
  MENTOR_HELP: { label: 'Hỗ trợ mentor', icon: '👨‍🏫', category: 'Học tập' },
  COURSE_CREATE: { label: 'Tạo khóa học', icon: '✍️', category: 'Học tập' },
  QUIZ_PASS: { label: 'Vượt qua bài kiểm tra', icon: '✅', category: 'Học tập' },
  
  // Community
  CONTENT_CREATE: { label: 'Tạo nội dung', icon: '📝', category: 'Cộng đồng' },
  CONTENT_REVIEW: { label: 'Đánh giá nội dung', icon: '👀', category: 'Cộng đồng' },
  CONTENT_SHARE: { label: 'Chia sẻ nội dung', icon: '🔗', category: 'Cộng đồng' },
  COMMENT_CREATE: { label: 'Bình luận', icon: '💬', category: 'Cộng đồng' },
  POST_ENGAGEMENT: { label: 'Tương tác bài viết', icon: '❤️', category: 'Cộng đồng' },
  
  // Charity
  DONATE: { label: 'Quyên góp', icon: '💝', category: 'Từ thiện' },
  VOLUNTEER: { label: 'Tình nguyện', icon: '🤝', category: 'Từ thiện' },
  CAMPAIGN_CREATE: { label: 'Tạo chiến dịch', icon: '📢', category: 'Từ thiện' },
  CAMPAIGN_SUPPORT: { label: 'Ủng hộ chiến dịch', icon: '💪', category: 'Từ thiện' },
  
  // Earth
  TREE_PLANT: { label: 'Trồng cây', icon: '🌳', category: 'Môi trường' },
  CLEANUP_EVENT: { label: 'Sự kiện dọn dẹp', icon: '🧹', category: 'Môi trường' },
  CARBON_OFFSET: { label: 'Bù đắp carbon', icon: '🌍', category: 'Môi trường' },
  ECO_ACTION: { label: 'Hành động xanh', icon: '♻️', category: 'Môi trường' },
  
  // Commerce
  FARM_DELIVERY: { label: 'Giao hàng nông sản', icon: '🚚', category: 'Thương mại' },
  MARKET_FAIR_TRADE: { label: 'Giao dịch công bằng', icon: '⚖️', category: 'Thương mại' },
  PRODUCT_REVIEW: { label: 'Đánh giá sản phẩm', icon: '⭐', category: 'Thương mại' },
  SELLER_VERIFY: { label: 'Xác minh người bán', icon: '✔️', category: 'Thương mại' },
  
  // Governance
  BUG_BOUNTY: { label: 'Báo cáo lỗi', icon: '🐛', category: 'Quản trị' },
  GOV_PROPOSAL: { label: 'Đề xuất chính sách', icon: '📋', category: 'Quản trị' },
  GOV_VOTE: { label: 'Bỏ phiếu', icon: '🗳️', category: 'Quản trị' },
  DISPUTE_RESOLVE: { label: 'Giải quyết tranh chấp', icon: '⚖️', category: 'Quản trị' },
  POLICY_REVIEW: { label: 'Đánh giá chính sách', icon: '📑', category: 'Quản trị' },
  
  // Daily Life
  DAILY_RITUAL: { label: 'Nghi lễ hàng ngày', icon: '🌅', category: 'Hàng ngày' },
  GRATITUDE_PRACTICE: { label: 'Thực hành biết ơn', icon: '🙏', category: 'Hàng ngày' },
  JOURNAL_WRITE: { label: 'Viết nhật ký', icon: '📓', category: 'Hàng ngày' },
  QUESTION_ASK: { label: 'Đặt câu hỏi', icon: '❓', category: 'Hàng ngày' },
  DAILY_LOGIN: { label: 'Đăng nhập hàng ngày', icon: '📆', category: 'Hàng ngày' },
  
  // Investment
  STAKE_LOCK: { label: 'Stake token', icon: '🔒', category: 'Đầu tư' },
  LIQUIDITY_PROVIDE: { label: 'Cung cấp thanh khoản', icon: '💧', category: 'Đầu tư' },
  REFERRAL_INVITE: { label: 'Giới thiệu bạn bè', icon: '👥', category: 'Đầu tư' },
  
  // Identity
  PROFILE_COMPLETE: { label: 'Hoàn thiện hồ sơ', icon: '👤', category: 'Danh tính' },
  KYC_VERIFY: { label: 'Xác minh KYC', icon: '🪪', category: 'Danh tính' },
  REPUTATION_EARN: { label: 'Nhận điểm uy tín', icon: '🏆', category: 'Danh tính' },
};

// ============================================
// BASE REWARDS
// ============================================

export const BASE_REWARDS: Record<PPLPActionType, number> = {
  // High value
  PROJECT_SUBMIT: 5000,
  COURSE_CREATE: 10000,
  MENTOR_HELP: 3000,
  DONATE: 2000,
  VOLUNTEER: 3000,
  CAMPAIGN_CREATE: 5000,
  TREE_PLANT: 2000,
  CLEANUP_EVENT: 2500,
  GOV_PROPOSAL: 5000,
  DISPUTE_RESOLVE: 3000,
  BUG_BOUNTY: 10000,
  KYC_VERIFY: 5000,
  
  // Medium value
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
  
  // Lower value
  CONTENT_SHARE: 500,
  COMMENT_CREATE: 500,
  POST_ENGAGEMENT: 300,
  DAILY_RITUAL: 500,
  GRATITUDE_PRACTICE: 1000,
  JOURNAL_WRITE: 2000,
  QUESTION_ASK: 1500,
  DAILY_LOGIN: 100,
  ECO_ACTION: 500,
  REFERRAL_INVITE: 1000,
  
  // Separate economics
  STAKE_LOCK: 0,
  LIQUIDITY_PROVIDE: 0,
  
  // Identity
  PROFILE_COMPLETE: 2000,
  REPUTATION_EARN: 1000,
};
