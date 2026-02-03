import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MintAuthorizationRequest {
  action_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { action_id }: MintAuthorizationRequest = await req.json();

    if (!action_id) {
      return new Response(
        JSON.stringify({ error: 'action_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch action with score
    const { data: action, error: actionError } = await supabase
      .from('pplp_actions')
      .select('*, pplp_scores(*)')
      .eq('id', action_id)
      .single();

    if (actionError || !action) {
      return new Response(
        JSON.stringify({ error: 'Action not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action.status !== 'scored') {
      return new Response(
        JSON.stringify({ error: 'Action must be scored before mint authorization', current_status: action.status }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const score = action.pplp_scores?.[0];
    if (!score) {
      return new Response(
        JSON.stringify({ error: 'Score record not found for action' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (score.decision !== 'pass') {
      return new Response(
        JSON.stringify({ 
          error: 'Action did not pass scoring thresholds', 
          decision: score.decision,
          fail_reasons: score.fail_reasons 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for unresolved fraud signals
    const { count: fraudSignals } = await supabase
      .from('pplp_fraud_signals')
      .select('*', { count: 'exact', head: true })
      .eq('actor_id', action.actor_id)
      .eq('is_resolved', false)
      .gte('severity', 4); // Only block for high severity

    if (fraudSignals && fraudSignals > 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Mint blocked due to unresolved fraud signals',
          fraud_signal_count: fraudSignals
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const rewardAmount = score.final_reward;

    if (rewardAmount <= 0) {
      return new Response(
        JSON.stringify({ error: 'No reward to mint', final_reward: rewardAmount }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Award Camly Coins using existing function
    const { data: newBalance, error: coinError } = await supabase
      .rpc('add_camly_coins', {
        _user_id: action.actor_id,
        _amount: rewardAmount,
        _transaction_type: 'pplp_reward',
        _description: `PPLP Reward: ${action.platform_id}/${action.action_type}`,
        _purity_score: score.light_score,
        _metadata: {
          action_id: action.id,
          platform_id: action.platform_id,
          action_type: action.action_type,
          pillars: {
            S: score.pillar_s,
            T: score.pillar_t,
            H: score.pillar_h,
            C: score.pillar_c,
            U: score.pillar_u,
          },
          multipliers: {
            Q: score.mult_q,
            I: score.mult_i,
            K: score.mult_k,
          },
          light_score: score.light_score,
        }
      });

    if (coinError) {
      console.error('Failed to add coins:', coinError);
      return new Response(
        JSON.stringify({ error: 'Failed to mint reward', details: coinError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update action status to minted
    await supabase
      .from('pplp_actions')
      .update({ 
        status: 'minted',
        minted_at: new Date().toISOString()
      })
      .eq('id', action.id);

    // Update PoPL score for the user
    await supabase.rpc('update_popl_score', {
      _user_id: action.actor_id,
      _action_type: action.action_type.toLowerCase(),
      _is_positive: true
    });

    console.log(`[PPLP Mint] Action ${action.id}: Minted ${rewardAmount} Camly Coins to ${action.actor_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        action_id: action.id,
        actor_id: action.actor_id,
        reward_amount: rewardAmount,
        new_balance: newBalance,
        light_score: score.light_score,
        pillars: {
          S: score.pillar_s,
          T: score.pillar_t,
          H: score.pillar_h,
          C: score.pillar_c,
          U: score.pillar_u,
        },
        message: `Successfully minted ${rewardAmount} Camly Coins based on PPLP scoring`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('PPLP Authorize Mint error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
