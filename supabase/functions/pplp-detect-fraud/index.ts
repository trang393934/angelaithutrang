import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FraudCheckRequest {
  actor_id: string;
  action_id?: string;
  action_type?: string;
  metadata?: Record<string, unknown>;
}

interface FraudSignal {
  signal_type: string;
  severity: number;
  details: Record<string, unknown>;
  source: string;
}

// Check for sybil behavior (multiple accounts, suspicious patterns)
async function checkSybilBehavior(
  supabase: SupabaseClient,
  actorId: string,
  metadata: Record<string, unknown>
): Promise<FraudSignal | null> {
  // Check for device fingerprint collision
  if (metadata.device_hash) {
    const { data: sameDevice } = await supabase
      .from('pplp_actions')
      .select('actor_id')
      .neq('actor_id', actorId)
      .contains('integrity', { device_hash: metadata.device_hash })
      .limit(1);

    if (sameDevice && sameDevice.length > 0) {
      const matchedUser = (sameDevice[0] as { actor_id: string }).actor_id;
      return {
        signal_type: 'SYBIL',
        severity: 4,
        details: { reason: 'Device fingerprint matches another user', matched_user: matchedUser },
        source: 'ANGEL_AI',
      };
    }
  }

  // Check for IP pattern (if available)
  if (metadata.ip_hash) {
    const { count } = await supabase
      .from('pplp_actions')
      .select('*', { count: 'exact', head: true })
      .neq('actor_id', actorId)
      .contains('integrity', { ip_hash: metadata.ip_hash });

    if (count && count > 5) {
      return {
        signal_type: 'SYBIL',
        severity: 3,
        details: { reason: 'IP pattern matches multiple users', match_count: count },
        source: 'ANGEL_AI',
      };
    }
  }

  return null;
}

// Check for bot behavior (rapid actions, mechanical patterns)
async function checkBotBehavior(
  supabase: SupabaseClient,
  actorId: string,
  actionType: string
): Promise<FraudSignal | null> {
  // Check action frequency in last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  
  const { count } = await supabase
    .from('pplp_actions')
    .select('*', { count: 'exact', head: true })
    .eq('actor_id', actorId)
    .eq('action_type', actionType)
    .gte('created_at', oneHourAgo);

  if (count && count > 20) {
    return {
      signal_type: 'BOT',
      severity: 4,
      details: { reason: 'Excessive action frequency', actions_per_hour: count, action_type: actionType },
      source: 'ANGEL_AI',
    };
  }

  // Check for too-regular timing patterns
  const { data: recentActions } = await supabase
    .from('pplp_actions')
    .select('created_at')
    .eq('actor_id', actorId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (recentActions && recentActions.length >= 5) {
    const actions = recentActions as Array<{ created_at: string }>;
    const intervals: number[] = [];
    for (let i = 1; i < actions.length; i++) {
      const diff = new Date(actions[i-1].created_at).getTime() - new Date(actions[i].created_at).getTime();
      intervals.push(diff);
    }

    // Check if intervals are suspiciously uniform (within 10% of each other)
    if (intervals.length >= 4) {
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const allSimilar = intervals.every(i => Math.abs(i - avg) < avg * 0.1);
      
      if (allSimilar && avg < 60000) { // Less than 1 minute apart, very regular
        return {
          signal_type: 'BOT',
          severity: 3,
          details: { reason: 'Mechanical timing pattern detected', average_interval_ms: avg },
          source: 'ANGEL_AI',
        };
      }
    }
  }

  return null;
}

// Check for spam behavior (low quality, repetitive content)
async function checkSpamBehavior(
  supabase: SupabaseClient,
  actorId: string,
  metadata: Record<string, unknown>
): Promise<FraudSignal | null> {
  // Check for very short content
  if (metadata.content_length && typeof metadata.content_length === 'number') {
    if (metadata.content_length < 10) {
      return {
        signal_type: 'SPAM',
        severity: 2,
        details: { reason: 'Content too short', content_length: metadata.content_length },
        source: 'ANGEL_AI',
      };
    }
  }

  // Check for repetitive content (same hash)
  if (metadata.content_hash) {
    const { count } = await supabase
      .from('pplp_actions')
      .select('*', { count: 'exact', head: true })
      .eq('actor_id', actorId)
      .contains('metadata', { content_hash: metadata.content_hash });

    if (count && count > 2) {
      return {
        signal_type: 'SPAM',
        severity: 3,
        details: { reason: 'Duplicate content detected', duplicate_count: count },
        source: 'ANGEL_AI',
      };
    }
  }

  return null;
}

// Check for collusion (coordinated behavior between accounts)
async function checkCollusionBehavior(
  supabase: SupabaseClient,
  actorId: string,
  actionId: string | undefined
): Promise<FraudSignal | null> {
  if (!actionId) return null;

  // Check if this user frequently interacts with same targets
  const { data: frequentTargets } = await supabase
    .from('pplp_actions')
    .select('target_id')
    .eq('actor_id', actorId)
    .not('target_id', 'is', null)
    .limit(50);

  if (frequentTargets && frequentTargets.length >= 10) {
    const targets = frequentTargets as Array<{ target_id: string | null }>;
    const targetCounts: Record<string, number> = {};
    targets.forEach(a => {
      if (a.target_id) {
        targetCounts[a.target_id] = (targetCounts[a.target_id] || 0) + 1;
      }
    });

    const suspiciousTargets = Object.entries(targetCounts)
      .filter(([_, count]) => count > targets.length * 0.5);

    if (suspiciousTargets.length > 0) {
      return {
        signal_type: 'COLLUSION',
        severity: 3,
        details: { 
          reason: 'Concentrated interaction pattern', 
          suspicious_targets: suspiciousTargets.map(([id, count]) => ({ id, count }))
        },
        source: 'ANGEL_AI',
      };
    }
  }

  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body: FraudCheckRequest = await req.json();

    if (!body.actor_id) {
      return new Response(
        JSON.stringify({ error: 'actor_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const signals: FraudSignal[] = [];
    const metadata = body.metadata || {};

    // Run all fraud checks in parallel
    const [sybilSignal, botSignal, spamSignal, collusionSignal] = await Promise.all([
      checkSybilBehavior(supabase, body.actor_id, metadata),
      checkBotBehavior(supabase, body.actor_id, body.action_type || 'UNKNOWN'),
      checkSpamBehavior(supabase, body.actor_id, metadata),
      checkCollusionBehavior(supabase, body.actor_id, body.action_id),
    ]);

    if (sybilSignal) signals.push(sybilSignal);
    if (botSignal) signals.push(botSignal);
    if (spamSignal) signals.push(spamSignal);
    if (collusionSignal) signals.push(collusionSignal);

    // Store any detected signals
    if (signals.length > 0) {
      const signalRecords = signals.map(s => ({
        actor_id: body.actor_id,
        action_id: body.action_id || null,
        signal_type: s.signal_type,
        severity: s.severity,
        details: s.details,
        source: s.source,
      }));

      const { error: insertError } = await supabase
        .from('pplp_fraud_signals')
        .insert(signalRecords);

      if (insertError) {
        console.error('Failed to store fraud signals:', insertError);
      }
    }

    // Calculate overall risk score (0-100)
    const maxSeverity = signals.length > 0 ? Math.max(...signals.map(s => s.severity)) : 0;
    const riskScore = Math.min(100, signals.length * 15 + maxSeverity * 10);

    // Get historical fraud signal count for this user
    const { count: historicalSignals } = await supabase
      .from('pplp_fraud_signals')
      .select('*', { count: 'exact', head: true })
      .eq('actor_id', body.actor_id)
      .eq('is_resolved', false);

    // ============= ANTI-SYBIL Bước 4: Tự động xử lý khi risk score cao =============
    let autoActionResult = null;
    if (riskScore > 25) {
      try {
        const { data: actionResult } = await supabase
          .rpc('auto_suspend_high_risk', {
            _user_id: body.actor_id,
            _risk_score: riskScore,
            _signals: JSON.stringify(signals),
          });
        
        autoActionResult = actionResult;
        console.log(`[PPLP Fraud] Auto-action for ${body.actor_id}: risk=${riskScore}, action=${actionResult?.action}`);

        // Bước 2: Đóng băng pending rewards khi risk > 50
        if (riskScore > 50) {
          const { data: frozenCount } = await supabase
            .rpc('freeze_user_pending_rewards', {
              _user_id: body.actor_id,
              _reason: `Risk score ${riskScore}/100 - ${signals.length} tín hiệu bất thường`
            });
          console.log(`[PPLP Fraud] Frozen ${frozenCount} pending rewards for ${body.actor_id}`);
        }
      } catch (autoErr) {
        console.error('[PPLP Fraud] Auto-action error:', autoErr);
      }
    }
    // ============= End Auto-Action =============

    console.log(`[PPLP Fraud] Actor ${body.actor_id}: ${signals.length} new signals, risk score: ${riskScore}`);

    return new Response(
      JSON.stringify({
        success: true,
        actor_id: body.actor_id,
        signals_detected: signals.length,
        signals,
        risk_score: riskScore,
        historical_unresolved_signals: historicalSignals || 0,
        auto_action: autoActionResult,
        recommendation: riskScore > 70 ? 'AUTO_SUSPENDED' : riskScore > 50 ? 'REWARDS_FROZEN' : riskScore > 25 ? 'MONITOR' : 'CLEAR',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('PPLP Fraud Detection error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
