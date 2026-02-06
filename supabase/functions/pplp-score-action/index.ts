import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getPolicyBaseReward } from "../_shared/pplp-helper.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

interface ActionCapsConfig {
  action_type: string;
  platform_id: string;
  base_reward: number;
  max_per_user_daily: number | null;
  max_per_user_weekly: number | null;
  max_global_daily: number | null;
  cooldown_seconds: number;
  diminishing_threshold: number;
  diminishing_factor: number;
  min_quality_score: number;
  thresholds: Record<string, number>;
  multiplier_ranges: { Q: [number, number]; I: [number, number]; K: [number, number] };
  is_active: boolean;
}

// ========== 5 PILLARS WEIGHTS (固定) ==========
const PILLAR_WEIGHTS = { S: 0.25, T: 0.20, H: 0.20, C: 0.20, U: 0.15 };
const MIN_LIGHT_SCORE = 50; // Lowered from 60 to allow more actions to pass during initial testing

// ========== Calculate 5-pillar scores ==========
function calculatePillarScores(action: ActionData): { S: number; T: number; H: number; C: number; U: number } {
  const metadata = action.metadata || {};
  const impact = action.impact || {};
  const integrity = action.integrity || {};

  // S - Service to Life
  let S = 50;
  if (impact.beneficiaries && typeof impact.beneficiaries === 'number') {
    S = Math.min(100, 50 + impact.beneficiaries * 5);
  }
  if (impact.outcome === 'positive' || impact.outcome === 'helpful') S += 20;

  // T - Truth/Transparency
  let T = 60;
  if (metadata.has_evidence) T += 20;
  if (metadata.verified) T += 15;
  if (integrity.verification_score && typeof integrity.verification_score === 'number') {
    T = Math.min(100, T + integrity.verification_score * 10);
  }

  // H - Healing/Compassion
  let H = 50;
  if (metadata.sentiment_score && typeof metadata.sentiment_score === 'number') {
    H = Math.min(100, 50 + metadata.sentiment_score * 50);
  }
  if (impact.healing_effect) H += 25;

  // C - Contribution durability
  let C = 50;
  if (metadata.content_length && typeof metadata.content_length === 'number') {
    C = Math.min(100, 50 + Math.min(metadata.content_length / 100, 30));
  }
  if (metadata.is_educational) C += 20;
  if (impact.creates_asset) C += 25;

  // U - Unity alignment
  let U = 50;
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

// ========== Calculate LightScore ==========
function calculateLightScore(pillars: { S: number; T: number; H: number; C: number; U: number }): number {
  return (
    pillars.S * PILLAR_WEIGHTS.S +
    pillars.T * PILLAR_WEIGHTS.T +
    pillars.H * PILLAR_WEIGHTS.H +
    pillars.C * PILLAR_WEIGHTS.C +
    pillars.U * PILLAR_WEIGHTS.U
  );
}

// ========== Calculate Q, I, K multipliers ==========
function calculateMultipliers(
  action: ActionData,
  pillars: { S: number; T: number; H: number; C: number; U: number },
  ranges: { Q: [number, number]; I: [number, number]; K: [number, number] }
): { Q: number; I: number; K: number } {
  const impact = action.impact || {};
  const integrity = action.integrity || {};
  const metadata = action.metadata || {};

  // Q - Quality multiplier
  let qNormalized = 0.5;
  if (metadata.quality_score && typeof metadata.quality_score === 'number') {
    qNormalized = metadata.quality_score;
  } else {
    qNormalized = (pillars.T + pillars.C) / 200;
  }
  const Q = ranges.Q[0] + (ranges.Q[1] - ranges.Q[0]) * qNormalized;

  // I - Impact multiplier
  let iNormalized = 0.3;
  if (impact.beneficiaries && typeof impact.beneficiaries === 'number') {
    iNormalized = Math.min(1, impact.beneficiaries / 10);
  }
  if (impact.reach_score && typeof impact.reach_score === 'number') {
    iNormalized = Math.max(iNormalized, impact.reach_score);
  }
  const I = ranges.I[0] + (ranges.I[1] - ranges.I[0]) * iNormalized;

  // K - Integrity multiplier
  let kNormalized = 0.7;
  if (integrity.anti_sybil_score && typeof integrity.anti_sybil_score === 'number') {
    kNormalized = integrity.anti_sybil_score;
  }
  if (integrity.fraud_signals && (integrity.fraud_signals as unknown[]).length > 0) {
    kNormalized *= 0.5;
  }
  const K = ranges.K[0] + (ranges.K[1] - ranges.K[0]) * kNormalized;

  return {
    Q: Math.round(Q * 100) / 100,
    I: Math.round(I * 100) / 100,
    K: Math.round(K * 100) / 100,
  };
}

// ========== Check thresholds ==========
function checkThresholds(
  pillars: { S: number; T: number; H: number; C: number; U: number },
  lightScore: number,
  multipliers: { Q: number; I: number; K: number },
  thresholds: Record<string, number>
): { pass: boolean; reasons: string[] } {
  const failReasons: string[] = [];

  if (thresholds.S && pillars.S < thresholds.S) {
    failReasons.push(`S_BELOW_${thresholds.S}`);
  }
  if (thresholds.T && pillars.T < thresholds.T) {
    failReasons.push(`T_BELOW_${thresholds.T}`);
  }
  if (thresholds.H && pillars.H < thresholds.H) {
    failReasons.push(`H_BELOW_${thresholds.H}`);
  }
  if (thresholds.C && pillars.C < thresholds.C) {
    failReasons.push(`C_BELOW_${thresholds.C}`);
  }
  if (thresholds.U && pillars.U < thresholds.U) {
    failReasons.push(`U_BELOW_${thresholds.U}`);
  }
  if (thresholds.K && multipliers.K * 100 < thresholds.K) {
    failReasons.push(`K_BELOW_${thresholds.K}`);
  }
  if (thresholds.LightScore && lightScore < thresholds.LightScore) {
    failReasons.push(`LIGHTSCORE_BELOW_${thresholds.LightScore}`);
  }
  if (lightScore < MIN_LIGHT_SCORE) {
    failReasons.push(`LIGHTSCORE_BELOW_GLOBAL_MIN`);
  }

  return { pass: failReasons.length === 0, reasons: failReasons };
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

    // ========== 1. Fetch the action ==========
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
        JSON.stringify({ 
          success: true,
          message: 'Action already scored',
          current_status: action.status,
          action_id: action.id,
          decision: action.status === 'minted' ? 'pass' : 'pass',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========== 2. Fetch action caps config from DB ==========
    const { data: capsConfig } = await supabase
      .from('pplp_action_caps')
      .select('*')
      .eq('action_type', action.action_type)
      .eq('is_active', true)
      .maybeSingle();

    // Default config if not found
    const config: ActionCapsConfig = capsConfig || {
      action_type: action.action_type,
      platform_id: 'ALL',
      base_reward: 100,
      max_per_user_daily: 10,
      max_per_user_weekly: 50,
      max_global_daily: null,
      cooldown_seconds: 0,
      diminishing_threshold: 5,
      diminishing_factor: 0.8,
      min_quality_score: 0.5,
      thresholds: { T: 70, LightScore: 60 },
      multiplier_ranges: { Q: [0.5, 3.0], I: [0.5, 5.0], K: [0.0, 1.0] },
      is_active: true,
    };

    // ========== 3. Calculate pillar scores ==========
    const pillars = calculatePillarScores(action);
    const lightScore = calculateLightScore(pillars);

    // ========== 4. Calculate multipliers ==========
    const multiplierRanges = config.multiplier_ranges || { Q: [0.5, 3.0], I: [0.5, 5.0], K: [0.0, 1.0] };
    const multipliers = calculateMultipliers(action, pillars, multiplierRanges);

    // ========== 5. Check thresholds ==========
    const thresholds = config.thresholds || { T: 70, LightScore: 60 };
    const thresholdCheck = checkThresholds(pillars, lightScore, multipliers, thresholds);
    
    let decision: 'pass' | 'fail' = thresholdCheck.pass ? 'pass' : 'fail';
    const failReasons = thresholdCheck.reasons;

    // ========== 6. Calculate base reward (Policy v1.0.1 FUN Money) ==========
    // Priority: Policy v1.0.1 mapping > pplp_action_caps table > default 100
    const policyBaseReward = getPolicyBaseReward(action.action_type, action.platform_id);
    const baseReward = policyBaseReward ?? config.base_reward ?? 100;
    let finalReward = decision === 'pass' 
      ? Math.floor(baseReward * multipliers.Q * multipliers.I * multipliers.K)
      : 0;

    // ========== 7. Insert score record ==========
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
      console.error('[PPLP] Score insert error:', scoreError);
      return new Response(
        JSON.stringify({ error: 'Failed to save score', details: scoreError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========== 8. Update action status ==========
    await supabase
      .from('pplp_actions')
      .update({ 
        status: 'scored',
        scored_at: new Date().toISOString()
      })
      .eq('id', action.id);

    console.log(`[PPLP] Action ${action.id} scored: ${decision.toUpperCase()} - LightScore: ${lightScore.toFixed(2)}, Reward: ${finalReward}`);

    // ========== 9. Run fraud detection ==========
    let fraudResult = null;
    try {
      const fraudCheckResponse = await fetch(`${supabaseUrl}/functions/v1/pplp-detect-fraud`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({
          actor_id: action.actor_id,
          action_id: action.id,
          action_type: action.action_type,
          metadata: {
            ...action.metadata,
            device_hash: action.integrity?.device_hash,
            ip_hash: action.integrity?.ip_hash,
          },
        }),
      });
      
      if (fraudCheckResponse.ok) {
        fraudResult = await fraudCheckResponse.json();
        console.log(`[PPLP] Fraud check: risk_score=${fraudResult.risk_score}, signals=${fraudResult.signals_detected}`);
      }
    } catch (fraudError) {
      console.error('[PPLP] Fraud detection call failed:', fraudError);
    }

    // ========== 10. AUTO-MINT with Caps & Diminishing Returns ==========
    let mintResult = null;
    if (decision === 'pass' && finalReward > 0) {
      try {
        // Block if high fraud risk
        if (fraudResult && fraudResult.risk_score > 50) {
          console.warn(`[PPLP Auto-Mint] Blocked for ${action.actor_id}: high fraud risk score ${fraudResult.risk_score}`);
          mintResult = { 
            auto_minted: false, 
            blocked_by_fraud: true, 
            fraud_risk_score: fraudResult.risk_score,
            fraud_recommendation: fraudResult.recommendation,
          };
        } else {
          // Check for unresolved high-severity fraud signals (fallback check)
          const { count: fraudSignals } = await supabase
            .from('pplp_fraud_signals')
            .select('*', { count: 'exact', head: true })
            .eq('actor_id', action.actor_id)
            .eq('is_resolved', false)
            .gte('severity', 4);

          if (fraudSignals && fraudSignals > 0) {
            console.warn(`[PPLP Auto-Mint] Blocked for ${action.actor_id}: ${fraudSignals} unresolved fraud signals`);
            mintResult = { auto_minted: false, blocked_by_fraud: true, fraud_signal_count: fraudSignals };
          } else {
            // ========== Get user tier for cap multiplier ==========
            const { data: userTier } = await supabase
              .from('pplp_user_tiers')
              .select('tier, cap_multiplier, trust_score')
              .eq('user_id', action.actor_id)
              .maybeSingle();
            
            const capMultiplier = userTier?.cap_multiplier || 1.0;

            // ========== Check caps & apply diminishing returns ==========
            const { data: capResult, error: capError } = await supabase
              .rpc('check_user_cap_and_update', {
                _user_id: action.actor_id,
                _action_type: action.action_type,
                _reward_amount: finalReward
              });

            if (capError) {
              console.error('[PPLP] Cap check error:', capError);
              mintResult = { auto_minted: false, error: capError.message };
            } else if (!capResult.can_mint) {
              console.warn(`[PPLP Auto-Mint] Blocked: ${capResult.reason}`);
              mintResult = { 
                auto_minted: false, 
                blocked_by_cap: true, 
                reason: capResult.reason,
                action_count_today: capResult.action_count_today,
                max_daily: capResult.max_daily
              };
            } else {
              // Apply diminishing returns and tier multiplier to final reward
              const adjustedReward = Math.floor(capResult.adjusted_reward * capMultiplier);

              // FUN Money: Keep status as "scored" - do NOT auto-mint Camly Coins
              // User will claim FUN Money via pplp-authorize-mint -> lockWithPPLP on-chain
              // Update final_reward in pplp_scores with the adjusted amount
              await supabase
                .from('pplp_scores')
                .update({ final_reward: adjustedReward })
                .eq('action_id', action.id);

              // Update user tier stats
              await supabase
                .from('pplp_user_tiers')
                .upsert({
                  user_id: action.actor_id,
                  total_actions_scored: 1,
                  passed_actions: 1,
                  updated_at: new Date().toISOString(),
                }, { 
                  onConflict: 'user_id',
                  ignoreDuplicates: false 
                });

              // Increment tier counters
              await supabase.rpc('update_user_tier', { _user_id: action.actor_id });

              // Override finalReward with adjusted value for response
              finalReward = adjustedReward;

              mintResult = {
                auto_minted: false,
                status: 'scored',
                message: 'FUN Money reward calculated. User can claim via /mint page.',
                original_reward: Math.floor(baseReward * multipliers.Q * multipliers.I * multipliers.K),
                adjusted_reward: adjustedReward,
                diminishing_multiplier: capResult.diminishing_multiplier,
                tier_multiplier: capMultiplier,
                user_tier: userTier?.tier || 0,
                action_count_today: capResult.action_count_today,
                max_daily: capResult.max_daily,
              };
              
              console.log(`[PPLP Score] ✓ Action ${action.id}: Scored ${adjustedReward} FUN (base: ${baseReward}, Q${multipliers.Q} * I${multipliers.I} * K${multipliers.K}, tier x${capMultiplier}) for ${action.actor_id.slice(0, 8)}...`);
            }
          }
        }
      } catch (mintError) {
        console.error('[PPLP Auto-Mint] Error:', mintError);
        mintResult = { auto_minted: false, error: mintError instanceof Error ? mintError.message : 'Unknown error' };
      }
    } else if (decision === 'fail') {
      // Update user tier for failed action
      try {
        await supabase
          .from('pplp_user_tiers')
          .upsert({
            user_id: action.actor_id,
            total_actions_scored: 1,
            failed_actions: 1,
            updated_at: new Date().toISOString(),
          }, { 
            onConflict: 'user_id',
            ignoreDuplicates: false 
          });
        await supabase.rpc('update_user_tier', { _user_id: action.actor_id });
      } catch (tierError) {
        console.error('[PPLP] Tier update for failed action error:', tierError);
      }
    }

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
        fraud: fraudResult ? {
          risk_score: fraudResult.risk_score,
          signals_detected: fraudResult.signals_detected,
          recommendation: fraudResult.recommendation,
        } : null,
        mint: mintResult,
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
