 import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 import { ethers } from "https://esm.sh/ethers@6.16.0";
 import {
   signMintRequest,
   createMintPayload,
   serializeSignedRequest,
   isValidAddress,
   PPLP_DOMAIN,
 } from "../_shared/pplp-eip712.ts";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
 };
 
 // BSC Testnet RPC fallback list
 const BSC_TESTNET_RPC_LIST = [
   "https://data-seed-prebsc-1-s1.binance.org:8545",
   "https://data-seed-prebsc-2-s1.binance.org:8545",
   "https://data-seed-prebsc-1-s2.binance.org:8545",
   "https://data-seed-prebsc-2-s2.binance.org:8545",
   "https://bsc-testnet.public.blastapi.io",
 ];
 
 const BSC_TESTNET_CHAIN_ID = 97n;
 
 interface ValidatedRpcResult {
   provider: ethers.JsonRpcProvider;
   nonce: bigint;
   blockNumber: number;
 }
 
 async function getValidatedBscProvider(
   contractAddress: string,
   walletAddress: string,
   customRpcUrl?: string
 ): Promise<ValidatedRpcResult | null> {
   // Build RPC list: custom first (if valid), then fallbacks
   const rpcList = customRpcUrl
     ? [customRpcUrl, ...BSC_TESTNET_RPC_LIST.filter((r) => r !== customRpcUrl)]
     : BSC_TESTNET_RPC_LIST;
 
   for (const rpcUrl of rpcList) {
     try {
       console.log(`[PPLP Mint] Trying RPC: ${rpcUrl}`);
       const provider = new ethers.JsonRpcProvider(rpcUrl);
 
       // Timeout for slow RPCs
       const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error("RPC timeout")), 5000));
 
       // 1. Verify chain ID
       const network = await Promise.race([provider.getNetwork(), timeout]);
       if (network.chainId !== BSC_TESTNET_CHAIN_ID) {
         console.warn(`[PPLP Mint] RPC ${rpcUrl} returned wrong chainId: ${network.chainId}`);
         continue;
       }
 
       // 2. Get block number (should be >80M for BSC Testnet)
       const blockNumber = await Promise.race([provider.getBlockNumber(), timeout]);
       if (blockNumber < 10_000_000) {
         console.warn(`[PPLP Mint] RPC ${rpcUrl} block number too low: ${blockNumber}`);
         continue;
       }
 
       // 3. Verify contract code exists
       const code = await Promise.race([provider.getCode(contractAddress), timeout]);
       if (code === "0x" || code.length < 4) {
         console.warn(`[PPLP Mint] RPC ${rpcUrl} has no contract code at ${contractAddress}`);
         continue;
       }
 
       // 4. Fetch nonce
       const nonceAbi = [
         "function getNonce(address user) view returns (uint256)",
         "function mintNonces(address user) view returns (uint256)",
       ];
       const contract = new ethers.Contract(contractAddress, nonceAbi, provider);
 
       let nonce: bigint;
       try {
         nonce = await Promise.race([contract.getNonce(walletAddress), timeout]);
       } catch {
         nonce = await Promise.race([contract.mintNonces(walletAddress), timeout]);
       }
 
       console.log(`[PPLP Mint] ✓ Valid RPC ${rpcUrl} - block ${blockNumber}, nonce ${nonce}`);
       return { provider, nonce, blockNumber };
     } catch (error) {
       console.warn(`[PPLP Mint] RPC ${rpcUrl} failed:`, error);
       continue;
     }
   }
 
   return null;
 }
 
 interface MintAuthorizationRequest {
   action_id: string;
   wallet_address: string;
 }
 
 serve(async (req) => {
   if (req.method === "OPTIONS") {
     return new Response("ok", { headers: corsHeaders });
   }
 
   try {
     const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
     const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
     const signerPrivateKey = Deno.env.get("TREASURY_PRIVATE_KEY");
     const bscRpcUrl = Deno.env.get("BSC_RPC_URL");
 
     // Debug: Log if private key is available (not the key itself!)
     console.log(
       `[PPLP Mint] Treasury private key configured: ${!!signerPrivateKey}, length: ${signerPrivateKey?.length || 0}`
     );
     console.log(`[PPLP Mint] BSC RPC URL configured: ${!!bscRpcUrl}`);
 
     const supabase = createClient(supabaseUrl, serviceRoleKey);
 
     const { action_id, wallet_address }: MintAuthorizationRequest = await req.json();
 
     // ============================================
     // VALIDATION
     // ============================================
 
     if (!action_id) {
       return new Response(JSON.stringify({ error: "action_id is required" }), {
         status: 400,
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       });
     }
 
     if (!wallet_address || !isValidAddress(wallet_address)) {
       return new Response(JSON.stringify({ error: "Valid wallet_address is required (0x...)" }), {
         status: 400,
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       });
     }
 
     // ============================================
     // VALIDATE BSC TESTNET RPC + FETCH ON-CHAIN NONCE
     // ============================================
 
     const rpcResult = await getValidatedBscProvider(PPLP_DOMAIN.verifyingContract, wallet_address, bscRpcUrl);
 
     if (!rpcResult) {
       console.error("[PPLP Mint] All BSC Testnet RPCs failed");
       return new Response(
         JSON.stringify({
           error: "Backend cannot reach BSC Testnet. Please try again later.",
           details: "All RPC endpoints failed validation",
         }),
         { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     const onChainNonce = rpcResult.nonce;
     console.log(`[PPLP Mint] Using validated RPC - block ${rpcResult.blockNumber}, nonce ${onChainNonce}`);
 
     // ============================================
     // CHECK IDEMPOTENCY
     // ============================================
 
     const { data: existingMint } = await supabase
       .from("pplp_mint_requests")
       .select("*")
       .eq("action_id", action_id)
       .maybeSingle();
 
     if (existingMint) {
       // If already minted on-chain, return the tx_hash
       if (existingMint.status === "minted") {
         return new Response(
           JSON.stringify({
             error: "Action already minted",
             tx_hash: existingMint.tx_hash,
             minted_at: existingMint.minted_at,
           }),
           { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
         );
       }
 
       // Check if existing signed request is still valid AND nonce matches on-chain
       if (
         existingMint.status === "signed" &&
         new Date(existingMint.valid_before) > new Date() &&
         existingMint.signature
       ) {
         const existingNonce = BigInt(existingMint.nonce);
 
         // If nonce matches on-chain, return existing signature
         if (existingNonce === onChainNonce) {
           // IMPORTANT: Scale amount to 18 decimals when returning existing mint
           // Database stores raw FUN amount, but smart contract expects wei (× 10^18)
           const scaledAmount = (BigInt(existingMint.amount) * BigInt(10 ** 18)).toString();
 
           return new Response(
             JSON.stringify({
               success: true,
               message: "Returning existing valid mint request",
               mint_request: {
                 to: existingMint.recipient_address,
                 amount: scaledAmount,
                 actionId: existingMint.action_hash,
                 evidenceHash: existingMint.evidence_hash,
                 policyVersion: existingMint.policy_version.toString(),
                 validAfter: Math.floor(new Date(existingMint.valid_after).getTime() / 1000).toString(),
                 validBefore: Math.floor(new Date(existingMint.valid_before).getTime() / 1000).toString(),
                 nonce: existingMint.nonce.toString(),
                 signature: existingMint.signature,
                 signer: existingMint.signer_address,
               },
             }),
             { headers: { ...corsHeaders, "Content-Type": "application/json" } }
           );
         } else {
           // Nonce mismatch - invalidate old signature and create new one
           console.log(
             `[PPLP Mint] Nonce mismatch for action ${action_id}: DB=${existingNonce}, on-chain=${onChainNonce}. Creating new signature.`
           );
           await supabase
             .from("pplp_mint_requests")
             .update({ status: "expired", signature: null })
             .eq("action_id", action_id);
           // Continue to create new signature below
         }
       }
     }
 
     // ============================================
     // FETCH ACTION WITH SCORE
     // ============================================
 
     const { data: action, error: actionError } = await supabase
       .from("pplp_actions")
       .select("*")
       .eq("id", action_id)
       .single();
 
     if (actionError || !action) {
       return new Response(JSON.stringify({ error: "Action not found" }), {
         status: 404,
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       });
     }
 
     // Allow both 'scored' (new) and 'minted' (off-chain only, need on-chain)
     if (action.status !== "scored" && action.status !== "minted") {
       return new Response(
         JSON.stringify({
           error: "Action must be scored or minted (off-chain) before on-chain mint authorization",
           current_status: action.status,
         }),
         { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     // Check if already has on-chain tx_hash (shouldn't happen but double-check)
     if (existingMint?.tx_hash) {
       return new Response(
         JSON.stringify({
           error: "Action already minted on-chain",
           tx_hash: existingMint.tx_hash,
         }),
         { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     // Fetch score separately (no FK relationship in Supabase)
     const { data: score, error: scoreError } = await supabase
       .from("pplp_scores")
       .select("*")
       .eq("action_id", action_id)
       .single();
 
     if (!score) {
       return new Response(JSON.stringify({ error: "Score record not found for action", scoreError }), {
         status: 404,
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       });
     }
 
     if (score.decision !== "pass") {
       return new Response(
         JSON.stringify({
           error: "Action did not pass scoring thresholds",
           decision: score.decision,
           fail_reasons: score.fail_reasons,
         }),
         { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     // ============================================
     // CHECK FRAUD SIGNALS
     // ============================================
 
     const { count: fraudSignals } = await supabase
       .from("pplp_fraud_signals")
       .select("*", { count: "exact", head: true })
       .eq("actor_id", action.actor_id)
       .eq("is_resolved", false)
       .gte("severity", 4);
 
     if (fraudSignals && fraudSignals > 0) {
       return new Response(
         JSON.stringify({
           error: "Mint blocked due to unresolved fraud signals",
           fraud_signal_count: fraudSignals,
         }),
         { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     // ============================================
     // VALIDATE REWARD AMOUNT
     // ============================================
 
     const rewardAmount = score.final_reward;
 
     if (rewardAmount <= 0) {
       return new Response(JSON.stringify({ error: "No reward to mint", final_reward: rewardAmount }), {
         status: 400,
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       });
     }
 
     // ============================================
     // USE ON-CHAIN NONCE (not database)
     // ============================================
 
     // Use the on-chain nonce we fetched earlier
     const nonce = onChainNonce;
     console.log(`[PPLP Mint] Using on-chain nonce: ${nonce}`);
 
     // ============================================
     // CREATE MINT PAYLOAD
     // ============================================
 
     const mintPayload = createMintPayload({
       recipientAddress: wallet_address,
       amount: rewardAmount,
       actionId: action.id,
       evidenceHash: action.evidence_hash || "0x" + "0".repeat(64),
       policyVersion: parseInt(action.policy_version?.replace("v", "") || "1"),
       nonce: nonce, // Now bigint from on-chain
       validityHours: 24,
     });
 
     // ============================================
     // SIGN MINT REQUEST (if signer key available)
     // ============================================
 
     let signedRequest;
     let signerAddress = "0x0000000000000000000000000000000000000000";
 
     if (signerPrivateKey) {
       try {
         signedRequest = await signMintRequest(mintPayload, signerPrivateKey, PPLP_DOMAIN);
         signerAddress = signedRequest.signer;
         console.log(`[PPLP Mint] Signed request for action ${action.id} by ${signerAddress}`);
       } catch (signError) {
         console.error("Failed to sign mint request:", signError);
         // Continue without signature for testing
       }
     } else {
       console.warn("[PPLP Mint] No signer private key configured, returning unsigned request");
     }
 
     // ============================================
     // STORE MINT REQUEST
     // ============================================
 
     const validAfter = new Date(mintPayload.validAfter * 1000).toISOString();
     const validBefore = new Date(mintPayload.validBefore * 1000).toISOString();
 
     const { error: insertError } = await supabase.from("pplp_mint_requests").upsert(
       {
         action_id: action.id,
         actor_id: action.actor_id,
         recipient_address: wallet_address,
         amount: rewardAmount,
         action_hash: mintPayload.actionId,
         evidence_hash: mintPayload.evidenceHash,
         policy_version: mintPayload.policyVersion,
         valid_after: validAfter,
         valid_before: validBefore,
         // PostgREST cannot JSON-serialize BigInt. Send as string and let Postgres cast.
         nonce: nonce.toString(),
         signature: signedRequest?.signature || null,
         signer_address: signerAddress,
         status: signedRequest ? "signed" : "pending",
       },
       { onConflict: "action_id" }
     );
 
     if (insertError) {
       console.error("Failed to store mint request:", insertError);
       return new Response(JSON.stringify({ error: "Failed to store mint request" }), {
         status: 500,
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       });
     }
 
     // ============================================
     // MINT OFF-CHAIN (FUN Money) - Only if not already minted
     // ============================================
 
     let newBalance = null;
 
     // Only add coins if action is still 'scored' (first time mint)
     if (action.status === "scored") {
       const { data: balance, error: coinError } = await supabase.rpc("add_camly_coins", {
         _user_id: action.actor_id,
         _amount: rewardAmount,
         _transaction_type: "pplp_reward",
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
         },
       });
 
       if (coinError) {
         console.error("Failed to add coins:", coinError);
         // Don't fail - on-chain mint is still possible
       } else {
         newBalance = balance;
       }
     } else {
       console.log(`[PPLP Mint] Skipping off-chain mint - action ${action.id} already minted off-chain`);
     }
 
     // ============================================
     // UPDATE ACTION STATUS
     // ============================================
 
     // Only update status if not already minted
     if (action.status === "scored") {
       await supabase
         .from("pplp_actions")
         .update({
           status: "minted",
           minted_at: new Date().toISOString(),
           mint_request_hash: mintPayload.actionId,
         })
         .eq("id", action.id);
 
       // Update PoPL score
       await supabase.rpc("update_popl_score", {
         _user_id: action.actor_id,
         _action_type: action.action_type.toLowerCase(),
         _is_positive: true,
       });
     }
 
     console.log(`[PPLP Mint] Action ${action.id}: Authorized ${rewardAmount} FUN Money to ${wallet_address}`);
 
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
       { headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   } catch (error) {
     console.error("PPLP Authorize Mint error:", error);
     const errorMessage = error instanceof Error ? error.message : "Unknown error";
     return new Response(JSON.stringify({ error: "Internal server error", details: errorMessage }), {
       status: 500,
       headers: { ...corsHeaders, "Content-Type": "application/json" },
     });
   }
 });