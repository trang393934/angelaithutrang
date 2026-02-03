import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PolicyConfig {
  global: {
    minTruth: number;
    minIntegrity: number;
    minLightScore: number;
    weights: { S: number; T: number; H: number; C: number; U: number };
  };
  platforms: Record<string, {
    actions: Record<string, {
      baseReward: number;
      thresholds: Record<string, number>;
      multipliers: { Q: [number, number]; I: [number, number]; K: [number, number] };
    }>;
  }>;
}

interface ActionData {
  id: string;
  platform_id: string;
  action_type: string;
  actor_id: string;
  metadata: Record<string, unknown>;
  impact: Record<string, unknown>;
  integrity: Record<string, unknown>;
  policy_version: string;
}

// Default scoring policy (v1.0.0)
const defaultPolicy: PolicyConfig = {
  global: {
    minTruth: 70,
    minIntegrity: 60,
    minLightScore: 60,
    weights: { S: 0.25, T: 0.20, H: 0.20, C: 0.20, U: 0.15 }
  },
  platforms: {
    ANGEL_AI: {
      actions: {
        QUESTION_ASK: { baseReward: 100, thresholds: { T: 70, K: 70 }, multipliers: { Q: [0.8, 2.0], I: [0.8, 1.5], K: [0.6, 1.0] } },
        AI_REVIEW_HELPFUL: { baseReward: 150, thresholds: { T: 80, K: 75 }, multipliers: { Q: [1.0, 2.5], I: [1.0, 2.0], K: [0.7, 1.0] } },
        FRAUD_REPORT_VALID: { baseReward: 300, thresholds: { T: 85, K: 80 }, multipliers: { Q: [1.0, 3.0], I: [1.0, 3.0], K: [0.8, 1.0] } },
      }
    },
    FUN_PROFILE: {
      actions: {
        CONTENT_CREATE: { baseReward: 150, thresholds: { T: 70, U: 65, K: 70 }, multipliers: { Q: [0.8, 2.5], I: [0.8, 2.0], K: [0.6, 1.0] } },
        COMMUNITY_POST: { baseReward: 100, thresholds: { T: 70, K: 65 }, multipliers: { Q: [0.8, 2.0], I: [0.8, 1.5], K: [0.6, 1.0] } },
        MENTOR_HELP: { baseReward: 300, thresholds: { T: 75, H: 70, K: 75 }, multipliers: { Q: [1.0, 3.0], I: [1.0, 2.5], K: [0.7, 1.0] } },
      }
    },
    FUN_CHARITY: {
      actions: {
        DONATE: { baseReward: 500, thresholds: { T: 85, S: 75, K: 80 }, multipliers: { Q: [1.0, 2.0], I: [1.0, 5.0], K: [0.8, 1.0] } },
        VOLUNTEER: { baseReward: 400, thresholds: { T: 80, H: 75, K: 75 }, multipliers: { Q: [1.0, 2.5], I: [1.0, 3.0], K: [0.7, 1.0] } },
      }
    },
    FUN_ACADEMY: {
      actions: {
        LEARN_COMPLETE: { baseReward: 200, thresholds: { T: 70, LightScore: 60, K: 60 }, multipliers: { Q: [0.8, 2.0], I: [0.8, 1.5], K: [0.6, 1.0] } },
        PROJECT_SUBMIT: { baseReward: 500, thresholds: { T: 75, C: 70, K: 65 }, multipliers: { Q: [1.0, 3.0], I: [1.0, 2.5], K: [0.65, 1.0] } },
        PEER_REVIEW: { baseReward: 150, thresholds: { T: 75, K: 70 }, multipliers: { Q: [0.8, 2.0], I: [0.8, 1.5], K: [0.6, 1.0] } },
      }
    },
  }
};

// Calculate 5-pillar scores based on action data
function calculatePillarScores(action: ActionData): { S: number; T: number; H: number; C: number; U: number } {
  const metadata = action.metadata || {};
  const impact = action.impact || {};
  const integrity = action.integrity || {};

  // S - Service to Life (based on beneficiaries and outcome)
  let S = 50; // Base score
  if (impact.beneficiaries && typeof impact.beneficiaries === 'number') {
    S = Math.min(100, 50 + impact.beneficiaries * 5);
  }
  if (impact.outcome === 'positive' || impact.outcome === 'helpful') S += 20;

  // T - Truth/Transparency (based on evidence quality)
  let T = 60; // Base score
  if (metadata.has_evidence) T += 20;
  if (metadata.verified) T += 15;
  if (integrity.verification_score && typeof integrity.verification_score === 'number') {
    T = Math.min(100, T + integrity.verification_score * 10);
  }

  // H - Healing/Compassion (based on emotional impact)
  let H = 50; // Base score
  if (metadata.sentiment_score && typeof metadata.sentiment_score === 'number') {
    H = Math.min(100, 50 + metadata.sentiment_score * 50);
  }
  if (impact.healing_effect) H += 25;

  // C - Contribution durability (based on lasting value)
  let C = 50; // Base score
  if (metadata.content_length && typeof metadata.content_length === 'number') {
    C = Math.min(100, 50 + Math.min(metadata.content_length / 100, 30));
  }
  if (metadata.is_educational) C += 20;
  if (impact.creates_asset) C += 25;

  // U - Unity alignment (based on community impact)
  let U = 50; // Base score
  if (impact.promotes_unity) U += 30;
  if (metadata.is_collaborative) U += 20;
  if (impact.connection_score && typeof impact.connection_score === 'number') {
    U = Math.min(100, U + impact.connection_score * 20);
  }

  return {
    S: Math.round(Math.min(100, Math.max(0, S))),
    T: Math.round(Math.min(100, Math.max(0, T))),
    H: Math.round(Math.min(100, Math.max(0, H))),
    C: Math.round(Math.min(100, Math.max(0, C))),
    U: Math.round(Math.min(100, Math.max(0, U))),
  };
}

// Calculate multipliers based on quality, impact, and integrity
function calculateMultipliers(
  action: ActionData,
  pillars: { S: number; T: number; H: number; C: number; U: number },
  actionConfig: { multipliers: { Q: [number, number]; I: [number, number]; K: [number, number] } }
): { Q: number; I: number; K: number } {
  const impact = action.impact || {};
  const integrity = action.integrity || {};
  const metadata = action.metadata || {};

  // Q - Quality multiplier (based on content quality)
  const qRange = actionConfig.multipliers.Q;
  let qNormalized = 0.5; // Default middle
  if (metadata.quality_score && typeof metadata.quality_score === 'number') {
    qNormalized = metadata.quality_score;
  } else {
    qNormalized = (pillars.T + pillars.C) / 200; // Derive from T and C
  }
  const Q = qRange[0] + (qRange[1] - qRange[0]) * qNormalized;

  // I - Impact multiplier (based on reach and effect)
  const iRange = actionConfig.multipliers.I;
  let iNormalized = 0.3; // Default lower
  if (impact.beneficiaries && typeof impact.beneficiaries === 'number') {
    iNormalized = Math.min(1, impact.beneficiaries / 10);
  }
  if (impact.reach_score && typeof impact.reach_score === 'number') {
    iNormalized = Math.max(iNormalized, impact.reach_score);
  }
  const I = iRange[0] + (iRange[1] - iRange[0]) * iNormalized;

  // K - Integrity multiplier (anti-fraud score)
  const kRange = actionConfig.multipliers.K;
  let kNormalized = 0.7; // Default reasonable trust
  if (integrity.anti_sybil_score && typeof integrity.anti_sybil_score === 'number') {
    kNormalized = integrity.anti_sybil_score;
  }
  if (integrity.fraud_signals && (integrity.fraud_signals as unknown[]).length > 0) {
    kNormalized *= 0.5; // Reduce for fraud signals
  }
  const K = kRange[0] + (kRange[1] - kRange[0]) * kNormalized;

  return {
    Q: Math.round(Q * 100) / 100,
    I: Math.round(I * 100) / 100,
    K: Math.round(K * 100) / 100,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { action_id } = await req.json();

    if (!action_id) {
      return new Response(
        JSON.stringify({ error: 'action_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch the action
    const { data: action, error: actionError } = await supabase
      .from('pplp_actions')
      .select('*')
      .eq('id', action_id)
      .single();

    if (actionError || !action) {
      return new Response(
        JSON.stringify({ error: 'Action not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action.status !== 'pending') {
      return new Response(
        JSON.stringify({ error: 'Action already scored', current_status: action.status }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get policy config (use default for now)
    const policy = defaultPolicy;
    const platformConfig = policy.platforms[action.platform_id];
    const actionConfig = platformConfig?.actions[action.action_type];

    if (!actionConfig) {
      // Use generic fallback
      console.log(`[PPLP] No specific config for ${action.platform_id}/${action.action_type}, using defaults`);
    }

    const baseReward = actionConfig?.baseReward || 100;
    const thresholds = actionConfig?.thresholds || { T: 70, K: 60 };
    const multiplierConfig = actionConfig?.multipliers || { Q: [0.8, 2.0], I: [0.8, 1.5], K: [0.6, 1.0] };

    // Calculate pillar scores
    const pillars = calculatePillarScores(action);

    // Calculate LightScore
    const weights = policy.global.weights;
    const lightScore = 
      pillars.S * weights.S +
      pillars.T * weights.T +
      pillars.H * weights.H +
      pillars.C * weights.C +
      pillars.U * weights.U;

    // Calculate multipliers
    const multipliers = calculateMultipliers(action, pillars, { multipliers: multiplierConfig });

    // Check thresholds
    let decision: 'pass' | 'fail' = 'pass';
    const failReasons: string[] = [];

    if (thresholds.T && pillars.T < thresholds.T) {
      failReasons.push(`T_BELOW_${thresholds.T}`);
    }
    if (thresholds.K && multipliers.K * 100 < thresholds.K) {
      failReasons.push(`K_BELOW_${thresholds.K}`);
    }
    if (thresholds.LightScore && lightScore < thresholds.LightScore) {
      failReasons.push(`LIGHTSCORE_BELOW_${thresholds.LightScore}`);
    }
    if (lightScore < policy.global.minLightScore) {
      failReasons.push(`LIGHTSCORE_BELOW_GLOBAL_MIN`);
    }

    if (failReasons.length > 0) {
      decision = 'fail';
    }

    // Calculate final reward
    const finalReward = decision === 'pass' 
      ? Math.round(baseReward * multipliers.Q * multipliers.I * multipliers.K)
      : 0;

    // Insert score record
    const { error: scoreError } = await supabase
      .from('pplp_scores')
      .insert({
        action_id: action.id,
        pillar_s: pillars.S,
        pillar_t: pillars.T,
        pillar_h: pillars.H,
        pillar_c: pillars.C,
        pillar_u: pillars.U,
        light_score: Math.round(lightScore * 100) / 100,
        base_reward: baseReward,
        multiplier_q: multipliers.Q,
        multiplier_i: multipliers.I,
        multiplier_k: multipliers.K,
        final_reward: finalReward,
        decision,
        decision_reason: failReasons.length > 0 ? failReasons.join(', ') : null,
        scored_by: 'pplp_engine_v1',
        policy_version: action.policy_version,
      });

    if (scoreError) {
      console.error('Score insert error:', scoreError);
      return new Response(
        JSON.stringify({ error: 'Failed to save score', details: scoreError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update action status
    await supabase
      .from('pplp_actions')
      .update({ 
        status: 'scored',
        scored_at: new Date().toISOString()
      })
      .eq('id', action.id);

    console.log(`[PPLP] Action ${action.id} scored: ${decision.toUpperCase()} - LightScore: ${lightScore.toFixed(2)}, Reward: ${finalReward}`);

    return new Response(
      JSON.stringify({
        success: true,
        action_id: action.id,
        pillars,
        light_score: Math.round(lightScore * 100) / 100,
        multipliers,
        base_reward: baseReward,
        final_reward: finalReward,
        decision,
        fail_reasons: failReasons.length > 0 ? failReasons : null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('PPLP Score Action error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
