import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
];

const CAMLY_DECIMALS = 3;
const CAMLY_CONTRACT = "0x0910320181889fefde0bb1ca63962b0a8882e413";

async function sendCamlyTransfer(
  privateKey: string,
  rpcUrl: string,
  toAddress: string,
  amount: bigint
): Promise<{ hash: string; success: boolean; error?: string }> {
  try {
    const { ethers } = await import("npm:ethers@6.16.0");
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(CAMLY_CONTRACT, ERC20_ABI, wallet);

    const balance = await contract.balanceOf(wallet.address);
    console.log(`Treasury CAMLY balance: ${balance.toString()}`);

    if (balance < amount) {
      return { hash: "", success: false, error: `Insufficient CAMLY. Required: ${amount}, Available: ${balance}` };
    }

    const gasEstimate = await contract.transfer.estimateGas(toAddress, amount);
    const tx = await contract.transfer(toAddress, amount, {
      gasLimit: gasEstimate * 120n / 100n,
    });

    console.log(`TX sent: ${tx.hash}`);
    const receipt = await tx.wait(1);

    if (receipt.status !== 1) {
      return { hash: tx.hash, success: false, error: "Transaction reverted" };
    }

    console.log(`TX confirmed block ${receipt.blockNumber}`);
    return { hash: tx.hash, success: true };
  } catch (error: unknown) {
    console.error("Transfer error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("insufficient funds")) {
      return { hash: "", success: false, error: "Insufficient BNB for gas fee in treasury wallet." };
    }
    return { hash: "", success: false, error: msg };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Verify user from JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await adminClient.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = userData.user.id;

    const { claim_id } = await req.json();
    if (!claim_id) {
      return new Response(JSON.stringify({ error: 'claim_id is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing lixi claim: ${claim_id} for user: ${userId}`);

    // Get claim details
    const { data: claim, error: claimError } = await adminClient
      .from('lixi_claims')
      .select('*')
      .eq('id', claim_id)
      .eq('user_id', userId)
      .single();

    if (claimError || !claim) {
      return new Response(JSON.stringify({ error: 'Claim not found or not yours' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (claim.status === 'completed') {
      return new Response(JSON.stringify({ error: 'Already completed', tx_hash: claim.tx_hash }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!claim.wallet_address) {
      return new Response(JSON.stringify({ error: 'No wallet address. Please connect your Web3 wallet first.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update to processing
    await adminClient
      .from('lixi_claims')
      .update({ status: 'processing' })
      .eq('id', claim_id);

    const privateKey = Deno.env.get('TREASURY_PRIVATE_KEY');
    const rpcUrl = Deno.env.get('BSC_RPC_URL') || 'https://bsc-dataseed.binance.org/';

    if (!privateKey) {
      await adminClient.from('lixi_claims').update({ status: 'failed', error_message: 'Treasury key not configured' }).eq('id', claim_id);
      return new Response(JSON.stringify({ error: 'Treasury configuration missing' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const amountWei = BigInt(claim.camly_amount) * BigInt(10 ** CAMLY_DECIMALS);
    console.log(`Sending ${claim.camly_amount} CAMLY to ${claim.wallet_address}`);

    const result = await sendCamlyTransfer(privateKey, rpcUrl, claim.wallet_address, amountWei);

    if (result.success) {
      // Update claim as completed
      await adminClient
        .from('lixi_claims')
        .update({
          status: 'completed',
          tx_hash: result.hash,
          claimed_at: new Date().toISOString(),
        })
        .eq('id', claim_id);

      // Record in camly_coin_transactions for history
      await adminClient
        .from('camly_coin_transactions')
        .insert({
          user_id: userId,
          amount: claim.camly_amount,
          transaction_type: 'lixi_claim',
          description: `🧧 Lì xì Tết 2026 - ${claim.fun_amount} FUN`,
          metadata: {
            tx_hash: result.hash,
            claim_id: claim_id,
            fun_amount: claim.fun_amount,
            source: 'tet_lixi',
          },
        });

      // Send success notification to user
      await adminClient.from('notifications').insert({
        user_id: userId,
        type: 'lixi_claim_completed',
        title: '🧧 Lì xì đã chuyển thành công!',
        content: `${claim.camly_amount.toLocaleString()} Camly Coin đã được chuyển đến ví Web3 của bạn.`,
        metadata: {
          tx_hash: result.hash,
          camly_amount: claim.camly_amount,
          fun_amount: claim.fun_amount,
        },
      });

      console.log(`Lixi claim completed: ${result.hash}`);
      return new Response(JSON.stringify({ success: true, tx_hash: result.hash }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      // Failed
      await adminClient
        .from('lixi_claims')
        .update({
          status: 'failed',
          error_message: result.error,
        })
        .eq('id', claim_id);

      // Notify admins
      const { data: adminRoles } = await adminClient
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin')
        .limit(5);

      if (adminRoles?.length) {
        await adminClient.from('notifications').insert(
          adminRoles.map(a => ({
            user_id: a.user_id,
            type: 'lixi_claim_failed',
            title: '⚠️ Lì xì chuyển thất bại',
            content: `Claim ${claim_id} thất bại: ${result.error}`,
            metadata: { claim_id, error: result.error, user_id: userId },
          }))
        );
      }

      return new Response(JSON.stringify({ success: false, error: result.error }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error: unknown) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
