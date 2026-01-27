import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ERC20 ABI for balance checking
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

// Camly Coin Contract Address on BSC
const CAMLY_CONTRACT = "0x0910320181889fefde0bb1ca63962b0a8882e413";

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

    // Get treasury private key to derive address
    const privateKey = Deno.env.get('TREASURY_PRIVATE_KEY');
    const rpcUrl = Deno.env.get('BSC_RPC_URL') || 'https://bsc-dataseed.binance.org/';

    if (!privateKey) {
      return new Response(
        JSON.stringify({ error: 'Treasury not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Import ethers dynamically
    const { ethers } = await import("npm:ethers@6.16.0");
    
    // Create wallet to get address
    const wallet = new ethers.Wallet(privateKey);
    const treasuryAddress = wallet.address;
    
    // Create provider
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // Get BNB balance
    const bnbBalance = await provider.getBalance(treasuryAddress);
    const bnbFormatted = ethers.formatEther(bnbBalance);
    
    // Get CAMLY balance
    const camlyContract = new ethers.Contract(CAMLY_CONTRACT, ERC20_ABI, provider);
    const camlyBalance = await camlyContract.balanceOf(treasuryAddress);
    const camlyFormatted = ethers.formatUnits(camlyBalance, 18);

    console.log(`Treasury Balance - BNB: ${bnbFormatted}, CAMLY: ${camlyFormatted}`);

    return new Response(
      JSON.stringify({
        success: true,
        treasury_address: treasuryAddress,
        bnb_balance: parseFloat(bnbFormatted),
        bnb_balance_wei: bnbBalance.toString(),
        camly_balance: parseFloat(camlyFormatted),
        camly_balance_wei: camlyBalance.toString(),
        updated_at: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error fetching treasury balance:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
