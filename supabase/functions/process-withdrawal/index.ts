import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ERC20 ABI for transfer function
const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

// CAMLY token has 3 decimals (not 18 like standard ERC20)
const CAMLY_DECIMALS = 3;

// Camly Coin Contract Address on BSC
const CAMLY_CONTRACT = "0x0910320181889fefde0bb1ca63962b0a8882e413";

// Simple ethers-like implementation for BSC
async function sendTransaction(
  privateKey: string,
  rpcUrl: string,
  toAddress: string,
  amount: bigint
): Promise<{ hash: string; success: boolean; error?: string }> {
  try {
    // Import ethers dynamically
    const { ethers } = await import("npm:ethers@6.16.0");
    
    // Create provider and wallet
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    
    // Create contract instance
    const contract = new ethers.Contract(CAMLY_CONTRACT, ERC20_ABI, wallet);
    
    // Check treasury balance first
    const balance = await contract.balanceOf(wallet.address);
    console.log(`Treasury balance: ${balance.toString()}`);
    
    if (balance < amount) {
      return {
        hash: "",
        success: false,
        error: `Insufficient CAMLY balance in treasury. Required: ${amount}, Available: ${balance}`
      };
    }
    
    // Estimate gas
    const gasEstimate = await contract.transfer.estimateGas(toAddress, amount);
    console.log(`Gas estimate: ${gasEstimate.toString()}`);
    
    // Send transaction with some gas buffer
    const tx = await contract.transfer(toAddress, amount, {
      gasLimit: gasEstimate * 120n / 100n // 20% buffer
    });
    
    console.log(`Transaction sent: ${tx.hash}`);
    
    // Wait for confirmation
    const receipt = await tx.wait(1);
    console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
    
    return {
      hash: tx.hash,
      success: true
    };
  } catch (error: unknown) {
    console.error("Transaction error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Check for specific error types
    if (errorMessage.includes("insufficient funds")) {
      return {
        hash: "",
        success: false,
        error: "Insufficient BNB for gas fee. Please add BNB to treasury wallet."
      };
    }
    
    return {
      hash: "",
      success: false,
      error: errorMessage
    };
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user is admin
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get request body
    const { withdrawal_id } = await req.json();
    
    if (!withdrawal_id) {
      return new Response(
        JSON.stringify({ error: 'withdrawal_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing withdrawal: ${withdrawal_id}`);

    // Get withdrawal details - use service role for this operation
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: withdrawal, error: withdrawalError } = await adminClient
      .from('coin_withdrawals')
      .select('*')
      .eq('id', withdrawal_id)
      .single();

    if (withdrawalError || !withdrawal) {
      return new Response(
        JSON.stringify({ error: 'Withdrawal not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check status
    if (withdrawal.status !== 'pending' && withdrawal.status !== 'processing') {
      return new Response(
        JSON.stringify({ error: `Invalid withdrawal status: ${withdrawal.status}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update status to processing
    await adminClient
      .from('coin_withdrawals')
      .update({ 
        status: 'processing',
        processed_by: userId,
        error_message: null
      })
      .eq('id', withdrawal_id);

    // Get secrets
    const privateKey = Deno.env.get('TREASURY_PRIVATE_KEY');
    const rpcUrl = Deno.env.get('BSC_RPC_URL') || 'https://bsc-dataseed.binance.org/';

    if (!privateKey) {
      await adminClient
        .from('coin_withdrawals')
        .update({ 
          status: 'failed',
          error_message: 'Treasury private key not configured'
        })
        .eq('id', withdrawal_id);

      return new Response(
        JSON.stringify({ error: 'Treasury configuration missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Convert amount to smallest unit (CAMLY has 3 decimals, not 18!)
    const amountWei = BigInt(withdrawal.amount) * BigInt(10 ** CAMLY_DECIMALS);
    
    console.log(`Sending ${withdrawal.amount} CAMLY to ${withdrawal.wallet_address}`);

    // Execute blockchain transaction
    const result = await sendTransaction(
      privateKey,
      rpcUrl,
      withdrawal.wallet_address,
      amountWei
    );

    if (result.success) {
      // Update withdrawal as completed
      await adminClient
        .from('coin_withdrawals')
        .update({
          status: 'completed',
          tx_hash: result.hash,
          processed_at: new Date().toISOString(),
          error_message: null
        })
        .eq('id', withdrawal_id);

      console.log(`Withdrawal completed: ${result.hash}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          tx_hash: result.hash,
          message: 'Withdrawal processed successfully'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Increment retry count and save error
      const newRetryCount = (withdrawal.retry_count || 0) + 1;
      
      await adminClient
        .from('coin_withdrawals')
        .update({
          status: newRetryCount >= 3 ? 'failed' : 'pending',
          retry_count: newRetryCount,
          error_message: result.error
        })
        .eq('id', withdrawal_id);

      console.error(`Withdrawal failed: ${result.error}`);

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: result.error,
          retry_count: newRetryCount,
          can_retry: newRetryCount < 3
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error: unknown) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
