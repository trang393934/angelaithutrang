import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { ethers } from "https://esm.sh/ethers@6.16.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// BSC Testnet RPC fallback list
const BSC_TESTNET_RPC_LIST = [
  "https://bsc-testnet-rpc.publicnode.com",
  "https://data-seed-prebsc-1-s1.binance.org:8545",
  "https://data-seed-prebsc-2-s1.binance.org:8545",
  "https://bsc-testnet.blockpi.network/v1/rpc/public",
  "https://rpc.ankr.com/bsc_testnet_chapel",
];

const BSC_TESTNET_CHAIN_ID = 97n;

// FUNMoneyProductionV1_2_1 contract address
const CONTRACT_ADDRESS = "0x1aa8DE8B1E4465C6d729E8564893f8EF823a5ff2";

// Actual contract ABI for lockWithPPLP flow
const CONTRACT_ABI = [
  "function name() view returns (string)",
  "function nonces(address) view returns (uint256)",
  "function isAttester(address) view returns (bool)",
  "function attesterThreshold() view returns (uint256)",
  "function actions(bytes32) view returns (bool allowed, uint32 version, bool deprecated)",
  "function lockWithPPLP(address user, string action, uint256 amount, bytes32 evidenceHash, bytes[] sigs)",
  "function govRegisterAction(string action, uint8 actionType)",
  "function guardianGov() view returns (address)",
];

// PPLP EIP-712 domain — MUST match contract: EIP712("FUN Money", "1.2.1")
const PPLP_DOMAIN = {
  name: "FUN Money",
  version: "1.2.1",
  chainId: 97,
  verifyingContract: CONTRACT_ADDRESS,
};

// PPLP PureLoveProof typehash structure
// MUST match contract PPLP_TYPEHASH: PureLoveProof(address user,bytes32 actionHash,uint256 amount,bytes32 evidenceHash,uint256 nonce)
const PPLP_LOCK_TYPES = {
  PureLoveProof: [
    { name: "user", type: "address" },
    { name: "actionHash", type: "bytes32" },
    { name: "amount", type: "uint256" },
    { name: "evidenceHash", type: "bytes32" },
    { name: "nonce", type: "uint256" },
  ],
};

interface RpcFailureReason {
  rpc: string;
  reason: string;
}

interface ValidatedRpcResult {
  provider: ethers.JsonRpcProvider;
  nonce: bigint;
  blockNumber: number;
}

async function getValidatedBscProvider(
  walletAddress: string
): Promise<{ result: ValidatedRpcResult | null; failures: RpcFailureReason[] }> {
  const failures: RpcFailureReason[] = [];

  for (const rpcUrl of BSC_TESTNET_RPC_LIST) {
    try {
      console.log(`[PPLP Lock] Trying RPC: ${rpcUrl}`);
      const provider = new ethers.JsonRpcProvider(rpcUrl);

      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("RPC timeout")), 5000)
      );

      // 1. Verify chain ID
      const network = await Promise.race([provider.getNetwork(), timeout]);
      if (network.chainId !== BSC_TESTNET_CHAIN_ID) {
        const reason = `wrong chainId: ${network.chainId}`;
        console.warn(`[PPLP Lock] RPC ${rpcUrl} ${reason}`);
        failures.push({ rpc: rpcUrl, reason });
        continue;
      }

      // 2. Get block number
      const blockNumber = await Promise.race([provider.getBlockNumber(), timeout]);
      if (blockNumber < 10_000_000) {
        const reason = `block number too low: ${blockNumber}`;
        console.warn(`[PPLP Lock] RPC ${rpcUrl} ${reason}`);
        failures.push({ rpc: rpcUrl, reason });
        continue;
      }

      // 3. Verify contract code exists
      const code = await Promise.race([provider.getCode(CONTRACT_ADDRESS), timeout]);
      if (code === "0x" || code.length < 4) {
        const reason = `no contract code at ${CONTRACT_ADDRESS}`;
        console.warn(`[PPLP Lock] RPC ${rpcUrl} ${reason}`);
        failures.push({ rpc: rpcUrl, reason });
        continue;
      }

      // 4. Read nonce from contract using nonces(address) mapping
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      
      try {
        const nonce = await Promise.race([contract.nonces(walletAddress), timeout]);
        console.log(`[PPLP Lock] ✓ Valid RPC ${rpcUrl} - block ${blockNumber}, nonce ${nonce}`);
        return { result: { provider, nonce, blockNumber }, failures };
      } catch (nonceError: any) {
        const reason = `nonces() read failed: ${nonceError?.message || "unknown"}`;
        console.warn(`[PPLP Lock] RPC ${rpcUrl} ${reason}`);
        failures.push({ rpc: rpcUrl, reason });
        continue;
      }
    } catch (error: any) {
      const reason = error?.message || "unknown error";
      console.warn(`[PPLP Lock] RPC ${rpcUrl} failed:`, reason);
      failures.push({ rpc: rpcUrl, reason });
      continue;
    }
  }

  return { result: null, failures };
}

interface MintAuthorizationRequest {
  action_id: string;
  wallet_address: string;
}

function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// Hash action name to bytes32 (same as keccak256 in Solidity)
function hashActionName(actionName: string): string {
  return ethers.keccak256(ethers.toUtf8Bytes(actionName));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const signerPrivateKey = Deno.env.get("TREASURY_PRIVATE_KEY");

    console.log(`[PPLP Lock] Treasury private key configured: ${!!signerPrivateKey}`);

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
      return new Response(
        JSON.stringify({ error: "Valid wallet_address is required (0x...)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // VALIDATE BSC TESTNET RPC + FETCH ON-CHAIN NONCE
    // ============================================

    const { result: rpcResult, failures } = await getValidatedBscProvider(wallet_address);

    if (!rpcResult) {
      console.error("[PPLP Lock] All BSC Testnet RPCs failed");
      const failureSummary = failures.slice(0, 5).map((f) => `${f.rpc.replace(/https?:\/\//, "")}: ${f.reason}`);
      return new Response(
        JSON.stringify({
          error: "Backend cannot reach BSC Testnet. Please try again later.",
          details: "All RPC endpoints failed validation",
          diagnostics: failureSummary,
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const onChainNonce = rpcResult.nonce;
    console.log(`[PPLP Lock] Using validated RPC - block ${rpcResult.blockNumber}, nonce ${onChainNonce}`);

    // ============================================
    // CHECK IDEMPOTENCY
    // ============================================

    const { data: existingMint } = await supabase
      .from("pplp_mint_requests")
      .select("*")
      .eq("action_id", action_id)
      .maybeSingle();

    if (existingMint?.status === "minted" && existingMint?.tx_hash) {
      return new Response(
        JSON.stringify({
          error: "Action already minted on-chain",
          tx_hash: existingMint.tx_hash,
          minted_at: existingMint.minted_at,
        }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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

    if (action.status !== "scored" && action.status !== "minted") {
      return new Response(
        JSON.stringify({
          error: "Action must be scored before mint authorization",
          current_status: action.status,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch score
    const { data: score } = await supabase
      .from("pplp_scores")
      .select("*")
      .eq("action_id", action_id)
      .single();

    if (!score) {
      return new Response(JSON.stringify({ error: "Score record not found for action" }), {
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
    // PREPARE PPLP LOCK DATA
    // ============================================

    const rewardAmount = score.final_reward;
    if (rewardAmount <= 0) {
      return new Response(
        JSON.stringify({ error: "No reward to mint", final_reward: rewardAmount }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Amount in wei (18 decimals)
    const amountWei = BigInt(rewardAmount) * BigInt(10 ** 18);
    
    // Action name for contract (e.g., "QUESTION_ASK")
    const actionName = action.action_type;
    const actionHash = hashActionName(actionName);
    
    // Evidence hash - ensure it's proper bytes32 format
    let evidenceHash = ethers.ZeroHash;
    if (action.evidence_hash) {
      const rawEvidence = action.evidence_hash;
      // If it's already 0x + 64 hex chars, use as is
      if (/^0x[a-fA-F0-9]{64}$/.test(rawEvidence)) {
        evidenceHash = rawEvidence;
      } else {
        // Otherwise hash it
        evidenceHash = ethers.keccak256(ethers.toUtf8Bytes(rawEvidence));
      }
    }

    // ============================================
    // SIGN PPLP LOCK MESSAGE
    // ============================================

    let signature: string | null = null;
    let signerAddress = ethers.ZeroAddress;

    if (signerPrivateKey) {
      try {
        // Add 0x prefix if missing
        const formattedKey = signerPrivateKey.startsWith("0x") 
          ? signerPrivateKey 
          : `0x${signerPrivateKey}`;
        
        const signer = new ethers.Wallet(formattedKey);
        signerAddress = signer.address;
        console.log(`[PPLP Lock] Signer address: ${signerAddress}`);

        // Create EIP-712 typed data — PureLoveProof struct
        const message = {
          user: wallet_address,
          actionHash: actionHash,
          amount: amountWei,
          evidenceHash: evidenceHash,
          nonce: onChainNonce,
        };
        
        console.log(`[PPLP Lock] Signing PureLoveProof:`, JSON.stringify({
          user: message.user,
          actionHash: message.actionHash,
          amount: message.amount.toString(),
          evidenceHash: message.evidenceHash,
          nonce: message.nonce.toString(),
        }));

        signature = await signer.signTypedData(PPLP_DOMAIN, PPLP_LOCK_TYPES, message);
        console.log(`[PPLP Lock] ✓ Signed successfully by: ${signerAddress}`);
      } catch (signError: any) {
        console.error(`[PPLP Lock] Signing failed:`, signError?.message || signError);
      }
    } else {
      console.warn("[PPLP Lock] No signer private key configured");
    }

    // ============================================
    // STORE MINT REQUEST EARLY (before on-chain tx to avoid connection reset)
    // ============================================

    const { error: earlyInsertError } = await supabase.from("pplp_mint_requests").upsert(
      {
        action_id: action.id,
        actor_id: action.actor_id,
        recipient_address: wallet_address,
        amount: rewardAmount,
        action_hash: actionHash,
        evidence_hash: evidenceHash,
        policy_version: 1,
        valid_after: new Date().toISOString(),
        valid_before: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        nonce: onChainNonce.toString(),
        signature: signature,
        signer_address: signerAddress,
        status: signature ? "signed" : "pending",
        tx_hash: null,
        minted_at: null,
        on_chain_error: null,
      },
      { onConflict: "action_id" }
    );

    if (earlyInsertError) {
      console.error("Failed to store mint request (early):", earlyInsertError);
      return new Response(
        JSON.stringify({ error: "Failed to store mint request", details: earlyInsertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[PPLP Lock] ✓ Mint request stored early for action ${action.id}`);

    // ============================================
    // CHECK & REGISTER ACTION IF NEEDED + ON-CHAIN TX
    // ============================================
    
    let txHash: string | null = null;
    let onChainError: string | null = null;
    let onChainErrorDetails: string | null = null;
    
    if (signature && signerPrivateKey) {
      try {
        // Add 0x prefix if missing
        const formattedKey = signerPrivateKey.startsWith("0x") 
          ? signerPrivateKey 
          : `0x${signerPrivateKey}`;
        
        // Create signer connected to provider
        const signer = new ethers.Wallet(formattedKey, rpcResult.provider);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        
        // Check if signer is an attester
        let isAttester = false;
        try {
          isAttester = await contract.isAttester(signer.address);
        } catch (attesterCheckErr: any) {
          onChainError = "RPC_FAILURE";
          onChainErrorDetails = `Cannot check attester status: ${attesterCheckErr?.message || "unknown"}`;
          console.error(`[PPLP Lock] ${onChainError}: ${onChainErrorDetails}`);
          throw attesterCheckErr;
        }
        console.log(`[PPLP Lock] Signer ${signer.address} isAttester: ${isAttester}`);
        
        if (!isAttester) {
          const guardianGov = await contract.guardianGov();
          onChainError = "ATTESTER_NOT_REGISTERED";
          onChainErrorDetails = `Signer ${signer.address} chưa được đăng ký Attester. guardianGov (${guardianGov}) cần gọi govSetAttester("${signer.address}", true)`;
          console.error(`[PPLP Lock] ${onChainError}: ${onChainErrorDetails}`);
          throw new Error(onChainErrorDetails);
        }

        // Check if action is registered
        const actionInfo = await contract.actions(actionHash);
        console.log(`[PPLP Lock] Action "${actionName}" status:`, {
          allowed: actionInfo.allowed,
          version: actionInfo.version,
          deprecated: actionInfo.deprecated,
        });
        
        if (!actionInfo.allowed) {
          const guardianGov = await contract.guardianGov();
          onChainError = "ACTION_NOT_REGISTERED";
          onChainErrorDetails = `Action "${actionName}" chưa đăng ký on-chain. guardianGov (${guardianGov}) cần gọi govRegisterAction("${actionName}", 1)`;
          console.error(`[PPLP Lock] ${onChainError}: ${onChainErrorDetails}`);
          throw new Error(onChainErrorDetails);
        }
        
        // ============================================
        // EXECUTE ON-CHAIN lockWithPPLP TRANSACTION
        // ============================================
        
        console.log(`[PPLP Lock] Submitting lockWithPPLP: user=${wallet_address}, action=${actionName}, amount=${amountWei.toString()} wei`);
        
        const tx = await contract.lockWithPPLP(
          wallet_address,
          actionName,
          amountWei,
          evidenceHash,
          [signature]
        );
        
        console.log(`[PPLP Lock] ⏳ Transaction sent: ${tx.hash}`);
        
        const receipt = await tx.wait(1);
        txHash = receipt.hash;
        onChainError = null;
        onChainErrorDetails = null;
        
        console.log(`[PPLP Lock] ✓ Transaction confirmed: ${txHash} in block ${receipt.blockNumber}`);
      } catch (txError: any) {
        const errMsg = txError?.message || String(txError);
        console.error(`[PPLP Lock] On-chain transaction failed:`, errMsg);
        
        // Classify the error if not already classified
        if (!onChainError) {
          if (errMsg.includes("insufficient funds") || errMsg.includes("gas") || errMsg.includes("INSUFFICIENT_FUNDS")) {
            onChainError = "INSUFFICIENT_GAS";
            onChainErrorDetails = `Ví Treasury thiếu tBNB để trả gas. Cần nạp thêm tBNB vào ${signerPrivateKey ? new ethers.Wallet(signerPrivateKey.startsWith("0x") ? signerPrivateKey : `0x${signerPrivateKey}`).address : "unknown"}`;
          } else if (errMsg.includes("ACTION_INVALID") || errMsg.includes("action")) {
            onChainError = "ACTION_NOT_REGISTERED";
            onChainErrorDetails = `Contract revert: Action "${actionName}" không hợp lệ hoặc chưa đăng ký. Chi tiết: ${errMsg.slice(0, 200)}`;
          } else if (errMsg.includes("ATTESTER") || errMsg.includes("attester")) {
            onChainError = "ATTESTER_NOT_REGISTERED";
            onChainErrorDetails = `Contract revert liên quan đến Attester. Chi tiết: ${errMsg.slice(0, 200)}`;
          } else if (errMsg.includes("timeout") || errMsg.includes("ETIMEDOUT") || errMsg.includes("network")) {
            onChainError = "RPC_FAILURE";
            onChainErrorDetails = `Kết nối BSC Testnet thất bại: ${errMsg.slice(0, 200)}`;
          } else {
            onChainError = "CONTRACT_REVERT";
            onChainErrorDetails = `Hợp đồng từ chối giao dịch: ${errMsg.slice(0, 300)}`;
          }
        }
        // Don't fail the whole request - signature is stored for retry
      }
    }

    // ============================================
    // UPDATE MINT REQUEST WITH ON-CHAIN RESULT (fresh connection)
    // ============================================

    try {
      const freshSupabase = createClient(supabaseUrl, serviceRoleKey);
      await freshSupabase.from("pplp_mint_requests").update({
        status: txHash ? "minted" : (signature ? "signed" : "pending"),
        tx_hash: txHash,
        minted_at: txHash ? new Date().toISOString() : null,
        on_chain_error: txHash ? null : onChainError,
        nonce: onChainNonce.toString(),
        signature: signature,
        signer_address: signerAddress,
      }).eq("action_id", action.id);
    } catch (updateErr) {
      console.error("[PPLP Lock] Failed to update mint request after on-chain tx:", updateErr);
      // Non-fatal: the early insert already saved the signed state
    }

    // ============================================
    // MINT OFF-CHAIN (FUN Money) - Only if not already minted
    // ============================================

    // FUN Money: Update action status based on on-chain result
    // Do NOT add Camly Coins here - FUN Money is separate from Camly Coin
    if (txHash) {
      // On-chain success: mark as minted
      await supabase
        .from("pplp_actions")
        .update({
          status: "minted",
          minted_at: new Date().toISOString(),
          mint_request_hash: actionHash,
        })
        .eq("id", action.id);

      // Update PoPL score on successful mint
      await supabase.rpc("update_popl_score", {
        _user_id: action.actor_id,
        _action_type: action.action_type.toLowerCase(),
        _is_positive: true,
      });

      console.log(`[PPLP Lock] ✓ Action ${action.id} minted on-chain: ${rewardAmount} FUN Money`);
    } else {
      console.log(`[PPLP Lock] Action ${action.id}: Off-chain signature stored, on-chain pending`);
    }

    console.log(`[PPLP Lock] Action ${action.id}: Authorized ${rewardAmount} FUN Money to ${wallet_address}`);

    // ============================================
    // RESPONSE
    // ============================================

    return new Response(
      JSON.stringify({
        success: true,
        action_id: action.id,
        actor_id: action.actor_id,
        reward_amount: rewardAmount,
        reward_unit: "FUN",
        light_score: score.light_score,
        pillars: {
          S: score.pillar_s,
          T: score.pillar_t,
          H: score.pillar_h,
          C: score.pillar_c,
          U: score.pillar_u,
        },
        pplp_lock: {
          user: wallet_address,
          action: actionName,
          actionHash: actionHash,
          amount: amountWei.toString(),
          evidenceHash: evidenceHash,
          nonce: onChainNonce.toString(),
          signature: signature,
          signer: signerAddress,
        },
        tx_hash: txHash,
        on_chain_success: !!txHash,
        on_chain_error: onChainError,
        on_chain_error_details: onChainErrorDetails,
        message: txHash
          ? `✓ ${rewardAmount} FUN Money đã được lock on-chain thành công! TX: ${txHash}`
          : (onChainError
            ? `⚠️ Ký thành công nhưng on-chain thất bại: ${onChainError}`
            : (signature
              ? `Signature đã ký. On-chain lock đang chờ xử lý (${rewardAmount} FUN).`
              : "Chưa có TREASURY_PRIVATE_KEY để ký on-chain.")),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("PPLP Authorize Mint error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal server error", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});