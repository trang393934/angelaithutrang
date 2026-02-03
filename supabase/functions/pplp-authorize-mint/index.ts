import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  signMintRequest,
  createMintPayload,
  serializeSignedRequest,
  isValidAddress,
  PPLP_DOMAIN,
} from "../_shared/pplp-eip712.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MintAuthorizationRequest {
  action_id: string;
  wallet_address: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const signerPrivateKey = Deno.env.get('TREASURY_PRIVATE_KEY');
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { action_id, wallet_address }: MintAuthorizationRequest = await req.json();

    // ============================================
    // VALIDATION
    // ============================================

    if (!action_id) {
      return new Response(
        JSON.stringify({ error: 'action_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!wallet_address || !isValidAddress(wallet_address)) {
      return new Response(
        JSON.stringify({ error: 'Valid wallet_address is required (0x...)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================
    // CHECK IDEMPOTENCY - Each action can only mint once
    // ============================================

    const { data: existingMint } = await supabase
      .from('pplp_mint_requests')
      .select('*')
      .eq('action_id', action_id)
      .single();

    if (existingMint) {
      if (existingMint.status === 'minted') {
        return new Response(
          JSON.stringify({ 
            error: 'Action already minted',
            tx_hash: existingMint.tx_hash,
            minted_at: existingMint.minted_at
          }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Return existing signed request if still valid
      if (existingMint.status === 'signed' && new Date(existingMint.valid_before) > new Date()) {
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Returning existing valid mint request',
            mint_request: {
              to: existingMint.recipient_address,
              amount: existingMint.amount.toString(),
              actionId: existingMint.action_hash,
              evidenceHash: existingMint.evidence_hash,
              policyVersion: existingMint.policy_version.toString(),
              validAfter: Math.floor(new Date(existingMint.valid_after).getTime() / 1000).toString(),
              validBefore: Math.floor(new Date(existingMint.valid_before).getTime() / 1000).toString(),
              nonce: existingMint.nonce.toString(),
              signature: existingMint.signature,
              signer: existingMint.signer_address,
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // ============================================
    // FETCH ACTION WITH SCORE
    // ============================================

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
        JSON.stringify({ 
          error: 'Action must be scored before mint authorization', 
          current_status: action.status 
        }),
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

    // ============================================
    // CHECK FRAUD SIGNALS
    // ============================================

    const { count: fraudSignals } = await supabase
      .from('pplp_fraud_signals')
      .select('*', { count: 'exact', head: true })
      .eq('actor_id', action.actor_id)
      .eq('is_resolved', false)
      .gte('severity', 4);

    if (fraudSignals && fraudSignals > 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Mint blocked due to unresolved fraud signals',
          fraud_signal_count: fraudSignals
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================
    // VALIDATE REWARD AMOUNT
    // ============================================

    const rewardAmount = score.final_reward;

    if (rewardAmount <= 0) {
      return new Response(
        JSON.stringify({ error: 'No reward to mint', final_reward: rewardAmount }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================
    // GET NONCE (Atomic increment)
    // ============================================

    const { data: nonce, error: nonceError } = await supabase
      .rpc('get_next_nonce', { _user_id: action.actor_id });

    if (nonceError) {
      console.error('Failed to get nonce:', nonceError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate nonce' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================
    // CREATE MINT PAYLOAD
    // ============================================

    const mintPayload = createMintPayload({
      recipientAddress: wallet_address,
      amount: rewardAmount,
      actionId: action.id,
      evidenceHash: action.evidence_hash || '0x' + '0'.repeat(64),
      policyVersion: parseInt(action.policy_version?.replace('v', '') || '1'),
      nonce: nonce,
      validityHours: 24,
    });

    // ============================================
    // SIGN MINT REQUEST (if signer key available)
    // ============================================

    let signedRequest;
    let signerAddress = '0x0000000000000000000000000000000000000000';

    if (signerPrivateKey) {
      try {
        signedRequest = await signMintRequest(mintPayload, signerPrivateKey, PPLP_DOMAIN);
        signerAddress = signedRequest.signer;
        console.log(`[PPLP Mint] Signed request for action ${action.id} by ${signerAddress}`);
      } catch (signError) {
        console.error('Failed to sign mint request:', signError);
        // Continue without signature for testing
      }
    } else {
      console.warn('[PPLP Mint] No signer private key configured, returning unsigned request');
    }

    // ============================================
    // STORE MINT REQUEST
    // ============================================

    const validAfter = new Date(mintPayload.validAfter * 1000).toISOString();
    const validBefore = new Date(mintPayload.validBefore * 1000).toISOString();

    const { error: insertError } = await supabase
      .from('pplp_mint_requests')
      .upsert({
        action_id: action.id,
        actor_id: action.actor_id,
        recipient_address: wallet_address,
        amount: rewardAmount,
        action_hash: mintPayload.actionId,
        evidence_hash: mintPayload.evidenceHash,
        policy_version: mintPayload.policyVersion,
        valid_after: validAfter,
        valid_before: validBefore,
        nonce: nonce,
        signature: signedRequest?.signature || null,
        signer_address: signerAddress,
        status: signedRequest ? 'signed' : 'pending',
      }, { onConflict: 'action_id' });

    if (insertError) {
      console.error('Failed to store mint request:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to store mint request' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================
    // ALSO MINT OFF-CHAIN (Camly Coins) for immediate use
    // ============================================

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
          on_chain_pending: !!signedRequest,
        }
      });

    if (coinError) {
      console.error('Failed to add coins:', coinError);
      // Don't fail - on-chain mint is still possible
    }

    // ============================================
    // UPDATE ACTION STATUS
    // ============================================

    await supabase
      .from('pplp_actions')
      .update({ 
        status: 'minted',
        minted_at: new Date().toISOString(),
        mint_request_hash: mintPayload.actionId,
      })
      .eq('id', action.id);

    // Update PoPL score
    await supabase.rpc('update_popl_score', {
      _user_id: action.actor_id,
      _action_type: action.action_type.toLowerCase(),
      _is_positive: true
    });

    console.log(`[PPLP Mint] Action ${action.id}: Authorized ${rewardAmount} Camly Coins to ${wallet_address}`);

    // ============================================
    // RESPONSE
    // ============================================

    const responsePayload = signedRequest 
      ? serializeSignedRequest(signedRequest)
      : {
          to: mintPayload.to,
          amount: mintPayload.amount.toString(),
          actionId: mintPayload.actionId,
          evidenceHash: mintPayload.evidenceHash,
          policyVersion: mintPayload.policyVersion.toString(),
          validAfter: mintPayload.validAfter.toString(),
          validBefore: mintPayload.validBefore.toString(),
          nonce: mintPayload.nonce.toString(),
          signature: null,
          signer: null,
        };

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
        mint_request: responsePayload,
        domain: PPLP_DOMAIN,
        message: signedRequest 
          ? `Signed mint request ready for on-chain submission`
          : `Unsigned mint request (configure TREASURY_PRIVATE_KEY for signing)`,
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
