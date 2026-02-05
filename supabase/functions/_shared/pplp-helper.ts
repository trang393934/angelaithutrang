/**
 * PPLP Integration Helper for Edge Functions
 * 
 * Provides unified PPLP action submission for all reward flows.
 * This module enables the Light Economy by tracking all value-creating
 * actions through the PPLP (Proof of Pure Light Protocol) engine.
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// PPLP Action Types mapped to reward flows
export const PPLP_ACTION_TYPES = {
  // Chat actions
  QUESTION_ASK: 'QUESTION_ASK',
  QUESTION_QUALITY: 'QUESTION_QUALITY',
  
  // Community actions
  POST_CREATE: 'POST_CREATE',
  POST_ENGAGEMENT: 'POST_ENGAGEMENT',
  COMMENT_CREATE: 'COMMENT_CREATE',
  SHARE_CONTENT: 'SHARE_CONTENT',
  
  // Journal actions
  JOURNAL_WRITE: 'JOURNAL_WRITE',
  GRATITUDE_PRACTICE: 'GRATITUDE_PRACTICE',
  
  // Engagement actions
  DAILY_LOGIN: 'DAILY_LOGIN',
  HELP_COMMUNITY: 'HELP_COMMUNITY',
  DONATE_SUPPORT: 'DONATE_SUPPORT',
  IDEA_SUBMIT: 'IDEA_SUBMIT',
  FEEDBACK_GIVE: 'FEEDBACK_GIVE',
} as const;

export type PPLPActionType = typeof PPLP_ACTION_TYPES[keyof typeof PPLP_ACTION_TYPES];

export interface PPLPActionInput {
  platform_id?: string;
  action_type: PPLPActionType;
  actor_id: string;
  target_id?: string;
  metadata?: Record<string, unknown>;
  impact?: {
    scope?: 'individual' | 'group' | 'platform' | 'ecosystem';
    reach_count?: number;
    quality_indicators?: string[];
  };
  integrity?: {
    content_hash?: string;
    source_verified?: boolean;
    duplicate_check?: boolean;
  };
  evidences?: Array<{
    evidence_type: string;
    uri?: string;
    content_hash: string;
    metadata?: Record<string, unknown>;
  }>;
  // Additional context for scoring
  reward_amount?: number;
  purity_score?: number;
  content_length?: number;
}

export interface PPLPSubmitResult {
  success: boolean;
  action_id?: string;
  error?: string;
}

/**
 * Generate a content hash for evidence integrity
 */
export function generateContentHash(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `0x${Math.abs(hash).toString(16).padStart(16, '0')}`;
}

/**
 * Generate evidence bundle hash from multiple evidence items
 */
function generateEvidenceHash(evidences: PPLPActionInput['evidences']): string | null {
  if (!evidences || evidences.length === 0) return null;
  
  const bundle = JSON.stringify(evidences.map(e => e.content_hash).sort());
  let hash = 0;
  for (let i = 0; i < bundle.length; i++) {
    const char = bundle.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `0x${Math.abs(hash).toString(16).padStart(16, '0')}`;
}

/**
 * Submit a PPLP action from within an Edge Function
 * 
 * This is the core integration point for connecting reward flows to PPLP.
 * Each rewarded action (chat, post, journal, share) should call this.
 * 
 * @param supabase - Supabase client with service role
 * @param input - Action details
 * @returns Submission result with action_id if successful
 */
export async function submitPPLPAction(
  supabase: SupabaseClient,
  input: PPLPActionInput
): Promise<PPLPSubmitResult> {
  try {
    // Get current active policy with full versioning data
    const { data: policy, error: policyError } = await supabase
      .from('pplp_policies')
      .select('version, policy_hash, thresholds, caps, formulas, action_configs')
      .eq('is_active', true)
      .maybeSingle();

    if (policyError) {
      console.error('[PPLP Helper] Policy fetch error:', policyError);
      return { success: false, error: 'No active policy found' };
    }

    const policyVersion = policy?.version || 'v1.0.0';
    const policyHash = policy?.policy_hash || null;
    const actionConfigs = policy?.action_configs || {};
    const evidenceHash = generateEvidenceHash(input.evidences);

    // Get action-specific config from policy
    const actionConfig = actionConfigs[input.action_type] || {};
    const maxDaily = actionConfig.max_daily;
    const baseReward = actionConfig.base_reward;

    console.log(`[PPLP Helper] Using policy ${policyVersion} (hash: ${policyHash?.slice(0, 10)}...)`);
    console.log(`[PPLP Helper] Action config for ${input.action_type}:`, actionConfig);

    // Enrich metadata with reward context
    const enrichedMetadata = {
      ...input.metadata,
      reward_amount: input.reward_amount,
      purity_score: input.purity_score,
      content_length: input.content_length,
      submitted_at: new Date().toISOString(),
      integration_source: 'edge_function_direct',
    };

    // Default impact based on action type
    const defaultImpact = {
      scope: input.impact?.scope || 'individual',
      reach_count: input.impact?.reach_count || 1,
      quality_indicators: input.impact?.quality_indicators || [],
    };

    // Default integrity
    const defaultIntegrity = {
      content_hash: input.integrity?.content_hash || null,
      source_verified: input.integrity?.source_verified ?? true,
      duplicate_check: input.integrity?.duplicate_check ?? false,
    };

    // Create the action record with policy snapshot
    const { data: action, error: actionError } = await supabase
      .from('pplp_actions')
      .insert({
        platform_id: input.platform_id || 'angel_ai',
        action_type: input.action_type,
        actor_id: input.actor_id,
        target_id: input.target_id || null,
        metadata: enrichedMetadata,
        impact: defaultImpact,
        integrity: defaultIntegrity,
        evidence_hash: evidenceHash,
        policy_version: policyVersion,
        policy_snapshot: {
          version: policyVersion,
          hash: policyHash,
          action_config: actionConfig,
          thresholds: policy?.thresholds,
        },
        status: 'pending',
      })
      .select('id')
      .single();

    if (actionError) {
      console.error('[PPLP Helper] Action insert error:', actionError);
      return { success: false, error: actionError.message };
    }

    // Insert evidences if provided
    if (input.evidences && input.evidences.length > 0) {
      const evidenceRecords = input.evidences.map(e => ({
        action_id: action.id,
        evidence_type: e.evidence_type,
        uri: e.uri || null,
        content_hash: e.content_hash,
        metadata: e.metadata || {},
      }));

      const { error: evidenceError } = await supabase
        .from('pplp_evidences')
        .insert(evidenceRecords);

      if (evidenceError) {
        console.error('[PPLP Helper] Evidence insert warning:', evidenceError);
        // Don't fail - evidences are supplementary
      }
    }

    console.log(`[PPLP Helper] ✓ Action submitted: ${action.id} | ${input.action_type} | actor: ${input.actor_id.slice(0, 8)}...`);

    return {
      success: true,
      action_id: action.id,
    };

  } catch (error) {
    console.error('[PPLP Helper] Unexpected error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Submit and immediately score + auto-mint a PPLP action
 * 
 * This is the PRIMARY method for Light Economy integration.
 * After submission, the action is automatically scored and if passed,
 * FUN Money is minted directly to the user.
 * 
 * Flow: Submit → Score → Auto-Mint (if passed)
 */
export async function submitAndScorePPLPAction(
  supabase: SupabaseClient,
  input: PPLPActionInput
): Promise<PPLPSubmitResult & { scored?: boolean; minted?: boolean; reward?: number }> {
  const submitResult = await submitPPLPAction(supabase, input);
  
  if (!submitResult.success || !submitResult.action_id) {
    return submitResult;
  }

  // Trigger scoring + auto-mint
  try {
    const scoreResponse = await supabase.functions.invoke('pplp-score-action', {
      body: { action_id: submitResult.action_id }
    });

    if (scoreResponse.data) {
      const { decision, mint, final_reward } = scoreResponse.data;
      return {
        ...submitResult,
        scored: true,
        minted: mint?.auto_minted === true,
        reward: final_reward,
      };
    }
  } catch (scoreError) {
    console.warn('[PPLP Helper] Score/Mint warning:', scoreError);
    // Action submitted but scoring failed - can be retried
  }

  return { ...submitResult, scored: false, minted: false };
}

/**
 * Submit action only (scoring will happen later)
 * 
 * Use this for batch processing or when you want manual control
 * over the scoring/minting flow.
 */
export async function submitPPLPActionOnly(
  supabase: SupabaseClient,
  input: PPLPActionInput
): Promise<PPLPSubmitResult> {
  return submitPPLPAction(supabase, input);
}

/**
 * Map reward transaction type to PPLP action type
 */
export function mapRewardToPPLPAction(transactionType: string): PPLPActionType | null {
  const mapping: Record<string, PPLPActionType> = {
    'chat_reward': PPLP_ACTION_TYPES.QUESTION_ASK,
    'community_support': PPLP_ACTION_TYPES.POST_CREATE,
    'engagement_reward': PPLP_ACTION_TYPES.POST_ENGAGEMENT,
    'content_share': PPLP_ACTION_TYPES.SHARE_CONTENT,
    'journal_reward': PPLP_ACTION_TYPES.JOURNAL_WRITE,
    'daily_login': PPLP_ACTION_TYPES.DAILY_LOGIN,
    'community_help': PPLP_ACTION_TYPES.HELP_COMMUNITY,
    'donation_support': PPLP_ACTION_TYPES.DONATE_SUPPORT,
    'idea_submit': PPLP_ACTION_TYPES.IDEA_SUBMIT,
    'feedback_reward': PPLP_ACTION_TYPES.FEEDBACK_GIVE,
  };
  
  return mapping[transactionType] || null;
}
