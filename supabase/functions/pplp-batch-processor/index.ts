import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BatchResult {
  action_id: string;
  status: 'success' | 'failed' | 'skipped';
  light_score?: number;
  reward?: number;
  error?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Parse options
    const { batch_size = 50, dry_run = false, action = 'process' } = await req.json().catch(() => ({}));

    // ========== RANDOM AUDIT MODE ==========
    if (action === 'random_audit') {
      console.log('[PPLP Batch] Running random audit...');
      
      const { data: auditCount, error: auditError } = await supabase
        .rpc('schedule_random_audit');
      
      if (auditError) {
        console.error('[PPLP Batch] Random audit error:', auditError);
        return new Response(
          JSON.stringify({ error: 'Random audit failed', details: auditError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Kiểm tra user nào có >= 3 audit flags chưa xử lý → tự động đình chỉ
      const { data: flaggedUsers } = await supabase
        .from('pplp_audits')
        .select('actor_id')
        .eq('result', 'FLAGGED')
        .eq('is_resolved', false);
      
      if (flaggedUsers && flaggedUsers.length > 0) {
        // Đếm flags per user
        const flagCounts: Record<string, number> = {};
        for (const f of flaggedUsers) {
          flagCounts[f.actor_id] = (flagCounts[f.actor_id] || 0) + 1;
        }
        
        let suspendedCount = 0;
        for (const [userId, count] of Object.entries(flagCounts)) {
          if (count >= 3) {
            await supabase.rpc('auto_suspend_high_risk', {
              _user_id: userId,
              _risk_score: 75,
              _signals: JSON.stringify([{ type: 'RANDOM_AUDIT', flags: count }])
            });
            suspendedCount++;
            console.log(`[PPLP Batch] Auto-suspended user ${userId.slice(0, 8)}... with ${count} audit flags`);
          }
        }
        
        console.log(`[PPLP Batch] Random audit complete: ${auditCount} audits scheduled, ${suspendedCount} users auto-suspended`);
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          action: 'random_audit',
          audits_scheduled: auditCount,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    // ========== CROSS-ACCOUNT SCAN MODE ==========
    if (action === 'cross_account_scan') {
      console.log('[PPLP Batch] Running cross-account scan...');
      
      const { data: scanResult, error: scanError } = await supabase
        .rpc('run_cross_account_scan');
      
      if (scanError) {
        console.error('[PPLP Batch] Cross-account scan error:', scanError);
        return new Response(
          JSON.stringify({ error: 'Cross-account scan failed', details: scanError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log(`[PPLP Batch] Cross-account scan complete:`, scanResult);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          action: 'cross_account_scan',
          ...scanResult,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    // ========== END CROSS-ACCOUNT SCAN ==========
    // ========== RELEASE PENDING REWARDS MODE ==========
    if (action === 'release_pending_rewards') {
      console.log('[PPLP Batch] Releasing pending rewards...');
      
      const { data: releaseResult, error: releaseError } = await supabase
        .rpc('release_pending_rewards');
      
      if (releaseError) {
        console.error('[PPLP Batch] Release error:', releaseError);
        return new Response(
          JSON.stringify({ error: 'Release failed', details: releaseError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const result = releaseResult?.[0] || { released_count: 0, total_amount: 0, frozen_count: 0 };
      console.log(`[PPLP Batch] Released ${result.released_count} rewards (${result.total_amount} coins), frozen ${result.frozen_count}`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          action: 'release_pending_rewards',
          ...result,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    // ========== END RELEASE PENDING REWARDS ==========

    // ========== END RANDOM AUDIT ==========

    console.log(`[PPLP Batch] Starting batch processor | batch_size: ${batch_size} | dry_run: ${dry_run}`);

    // Fetch pending actions
    const { data: pendingActions, error: fetchError } = await supabase
      .from('pplp_actions')
      .select('id, platform_id, action_type, actor_id, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(batch_size);

    if (fetchError) {
      console.error('[PPLP Batch] Fetch error:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch pending actions', details: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!pendingActions || pendingActions.length === 0) {
      console.log('[PPLP Batch] No pending actions found');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No pending actions to process',
          processed: 0,
          results: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[PPLP Batch] Found ${pendingActions.length} pending actions`);

    const results: BatchResult[] = [];
    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    // Process each action
    for (const action of pendingActions) {
      try {
        // Check if action is too old (>24h) - skip stale actions
        const createdAt = new Date(action.created_at);
        const hoursSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceCreation > 24) {
          console.log(`[PPLP Batch] Skipping stale action ${action.id} (${hoursSinceCreation.toFixed(1)}h old)`);
          
          // Mark as rejected due to staleness
          if (!dry_run) {
            await supabase
              .from('pplp_actions')
              .update({ status: 'rejected' })
              .eq('id', action.id);
          }
          
          results.push({
            action_id: action.id,
            status: 'skipped',
            error: `Stale action (${hoursSinceCreation.toFixed(1)}h old)`
          });
          skippedCount++;
          continue;
        }

        if (dry_run) {
          results.push({
            action_id: action.id,
            status: 'skipped',
            error: 'Dry run - not processed'
          });
          skippedCount++;
          continue;
        }

        // Call the scoring function
        const scoreResponse = await supabase.functions.invoke('pplp-score-action', {
          body: { action_id: action.id }
        });

        if (scoreResponse.error) {
          throw new Error(scoreResponse.error.message || 'Scoring failed');
        }

        const scoreResult = scoreResponse.data;

        if (scoreResult.success) {
          results.push({
            action_id: action.id,
            status: 'success',
            light_score: scoreResult.light_score,
            reward: scoreResult.final_reward
          });
          successCount++;
          console.log(`[PPLP Batch] ✓ Action ${action.id}: LightScore=${scoreResult.light_score}, Reward=${scoreResult.final_reward}`);
        } else {
          results.push({
            action_id: action.id,
            status: 'failed',
            error: scoreResult.error || 'Unknown scoring error'
          });
          failedCount++;
          console.log(`[PPLP Batch] ✗ Action ${action.id}: ${scoreResult.error}`);
        }

        // Small delay between processing to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          action_id: action.id,
          status: 'failed',
          error: errorMessage
        });
        failedCount++;
        console.error(`[PPLP Batch] Error processing action ${action.id}:`, errorMessage);
      }
    }

    // Calculate stats
    const totalRewards = results
      .filter(r => r.status === 'success' && r.reward)
      .reduce((sum, r) => sum + (r.reward || 0), 0);

    const avgLightScore = results
      .filter(r => r.status === 'success' && r.light_score)
      .reduce((sum, r, _, arr) => sum + (r.light_score || 0) / arr.length, 0);

    const summary = {
      success: true,
      processed: pendingActions.length,
      success_count: successCount,
      failed_count: failedCount,
      skipped_count: skippedCount,
      total_rewards_minted: totalRewards,
      avg_light_score: Math.round(avgLightScore * 100) / 100,
      dry_run,
      results
    };

    console.log(`[PPLP Batch] Complete | Success: ${successCount} | Failed: ${failedCount} | Skipped: ${skippedCount} | Rewards: ${totalRewards}`);

    return new Response(
      JSON.stringify(summary),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[PPLP Batch] Fatal error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Batch processor failed', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
