import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { 
  PPLP_ACTION_TYPES, 
  FUN_PLATFORMS, 
  LightAction, 
  LightActionEvidence,
  PPLPActionType,
  FUNPlatformId,
  BASE_REWARDS 
} from "../_shared/pplp-types.ts";
import { 
  generateCanonicalHash, 
  generateEvidenceBundleHash,
  generateEvidenceContentHash,
  canonicalJSON 
} from "../_shared/pplp-crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SubmitActionRequest {
  platform_id: string;
  action_type: string;
  target_id?: string;
  metadata?: Record<string, unknown>;
  impact?: {
    beneficiaries?: number;
    measurable_outcome?: string;
    impact_uri?: string;
    scope?: 'individual' | 'group' | 'platform' | 'ecosystem';
    reach_count?: number;
    quality_indicators?: string[];
  };
  integrity?: {
    device_hash?: string;
    session_signals?: string;
    anti_sybil_score?: number;
    source_verified?: boolean;
    duplicate_check?: boolean;
  };
  evidences?: Array<{
    evidence_type: string;
    value?: number | string;
    uri?: string;
    content_hash?: string;
    metadata?: Record<string, unknown>;
  }>;
}

// Validate action type against enum
function isValidActionType(type: string): type is PPLPActionType {
  return Object.values(PPLP_ACTION_TYPES).includes(type as PPLPActionType);
}

// Validate platform ID
function isValidPlatform(platform: string): platform is FUNPlatformId {
  return Object.values(FUN_PLATFORMS).includes(platform as FUNPlatformId);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: claimsError } = await supabase.auth.getUser(token);
    
    if (claimsError || !claims.user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claims.user.id;
    const body: SubmitActionRequest = await req.json();

    // Validate required fields
    if (!body.platform_id || !body.action_type) {
      return new Response(
        JSON.stringify({ error: 'platform_id and action_type are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current active policy version
    const { data: policy, error: policyError } = await supabase
      .from('pplp_policies')
      .select('version')
      .eq('is_active', true)
      .single();

    if (policyError || !policy) {
      console.error('Policy fetch error:', policyError);
      return new Response(
        JSON.stringify({ error: 'No active policy found' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const timestamp = Date.now();
    
    // Convert evidences to LightActionEvidence format and generate hashes
    const evidences: LightActionEvidence[] = (body.evidences || []).map(e => ({
      type: e.evidence_type as any,
      value: e.value,
      uri: e.uri,
      content_hash: e.content_hash,
      metadata: e.metadata,
    }));
    
    // Generate evidence hashes
    const evidenceHashesPromises = evidences.map(async (e) => {
      if (e.content_hash) return e.content_hash;
      return await generateEvidenceContentHash(e);
    });
    const evidenceHashes = await Promise.all(evidenceHashesPromises);
    
    // Generate evidence bundle hash
    const evidenceHash = await generateEvidenceBundleHash(evidences);
    
    // Build LightAction object for canonical hash
    const lightAction: LightAction = {
      action_id: crypto.randomUUID(),
      platform_id: (isValidPlatform(body.platform_id) ? body.platform_id : 'ANGEL_AI') as FUNPlatformId,
      action_type: (isValidActionType(body.action_type) ? body.action_type : 'CONTENT_CREATE') as PPLPActionType,
      actor: userId,
      timestamp,
      metadata: body.metadata || {},
      evidence: evidences,
      impact: body.impact || {},
      integrity: body.integrity || {},
    };
    
    // Generate canonical hash for evidence anchoring
    const canonicalHash = await generateCanonicalHash(lightAction);
    
    // Get base reward for action type
    const baseReward = isValidActionType(body.action_type) 
      ? BASE_REWARDS[body.action_type as PPLPActionType] || 1000
      : 1000;

    // Create the action record with new fields
    const { data: action, error: actionError } = await supabase
      .from('pplp_actions')
      .insert({
        platform_id: body.platform_id,
        action_type: body.action_type,
        action_type_enum: isValidActionType(body.action_type) ? body.action_type : null,
        actor_id: userId,
        target_id: body.target_id || null,
        metadata: {
          ...body.metadata,
          base_reward: baseReward,
          submitted_at: new Date().toISOString(),
        },
        impact: body.impact || {},
        integrity: body.integrity || {},
        evidence_hash: evidenceHash,
        canonical_hash: canonicalHash,
        policy_version: policy.version,
        status: 'pending',
      })
      .select()
      .single();

    if (actionError) {
      console.error('Action insert error:', actionError);
      return new Response(
        JSON.stringify({ error: 'Failed to create action', details: actionError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert evidences if provided with computed hashes
    if (body.evidences && body.evidences.length > 0) {
      const evidenceRecords = body.evidences.map((e, i) => ({
        action_id: action.id,
        evidence_type: e.evidence_type,
        evidence_type_enum: e.evidence_type, // Will be validated by DB
        uri: e.uri || null,
        content_hash: evidenceHashes[i],
        metadata: e.metadata || {},
      }));

      const { error: evidenceError } = await supabase
        .from('pplp_evidences')
        .insert(evidenceRecords);

      if (evidenceError) {
        console.error('Evidence insert error:', evidenceError);
        // Don't fail the whole request, just log
      }
    }

    console.log(`[PPLP] Action submitted: ${action.id} by ${userId} - ${body.platform_id}/${body.action_type} | canonical: ${canonicalHash.slice(0, 18)}...`);

    // Auto-trigger scoring immediately after successful submit
    let scoreResult = null;
    try {
      const scoreResponse = await fetch(`${supabaseUrl}/functions/v1/pplp-score-action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: JSON.stringify({ action_id: action.id }),
      });
      
      if (scoreResponse.ok) {
        scoreResult = await scoreResponse.json();
        console.log(`[PPLP] Auto-scored action ${action.id}: decision=${scoreResult.decision}, light_score=${scoreResult.light_score}`);
      } else {
        console.warn(`[PPLP] Auto-scoring returned non-ok status: ${scoreResponse.status}`);
      }
    } catch (scoreError) {
      console.error('[PPLP] Auto-scoring failed, will be processed by batch:', scoreError);
      // Continue without failing - batch processor will handle later
    }

    // Return response with score result if available
    if (scoreResult && scoreResult.success) {
      return new Response(
        JSON.stringify({
          success: true,
          action_id: action.id,
          status: scoreResult.decision === 'pass' ? 'scored' : 'rejected',
          policy_version: policy.version,
          canonical_hash: canonicalHash,
          evidence_hash: evidenceHash,
          base_reward: baseReward,
          light_score: scoreResult.light_score,
          final_reward: scoreResult.final_reward,
          auto_scored: true,
          message: scoreResult.decision === 'pass' 
            ? `Action scored successfully! Light Score: ${scoreResult.light_score}` 
            : 'Action submitted but did not pass scoring threshold.',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        action_id: action.id,
        status: 'pending',
        policy_version: policy.version,
        canonical_hash: canonicalHash,
        evidence_hash: evidenceHash,
        base_reward: baseReward,
        auto_scored: false,
        message: 'Action submitted successfully. Scoring will be processed shortly.',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('PPLP Submit Action error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
