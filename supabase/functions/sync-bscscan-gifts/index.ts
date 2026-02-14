import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// CAMLY token contract on BSC Mainnet
const CAMLY_CONTRACT = "0x0910320181889fefde0bb1ca63962b0a8882e413";
const BSCSCAN_API_URL = "https://api.bscscan.com/api";

interface BscScanTransfer {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const bscscanApiKey = Deno.env.get("BSCSCAN_API_KEY");

    if (!bscscanApiKey) {
      return new Response(
        JSON.stringify({ error: "BSCSCAN_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Check admin role
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Get all wallet addresses mapped to user IDs
    const { data: walletData } = await adminClient
      .from("user_wallet_addresses")
      .select("user_id, wallet_address");

    if (!walletData || walletData.length === 0) {
      return new Response(
        JSON.stringify({ error: "No wallet addresses found", synced: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const walletToUser = new Map<string, string>();
    const allWallets = new Set<string>();
    for (const w of walletData) {
      if (!w.wallet_address) continue;
      const addr = w.wallet_address.toLowerCase();
      walletToUser.set(addr, w.user_id);
      allWallets.add(addr);
    }

    // 2. Get existing tx_hashes to avoid duplicates
    const { data: existingGifts } = await adminClient
      .from("coin_gifts")
      .select("tx_hash")
      .not("tx_hash", "is", null);

    const existingHashes = new Set(
      (existingGifts || []).map((g) => g.tx_hash?.toLowerCase())
    );

    // 3. Query BSCScan for each unique wallet
    const allTransfers: BscScanTransfer[] = [];
    const processedWallets = new Set<string>();
    let apiCalls = 0;

    for (const wallet of allWallets) {
      if (processedWallets.has(wallet)) continue;
      processedWallets.add(wallet);

      // Rate limit: 5 req/sec for free tier
      if (apiCalls > 0 && apiCalls % 4 === 0) {
        await new Promise((r) => setTimeout(r, 1200));
      }

      try {
        const url = `${BSCSCAN_API_URL}?module=account&action=tokentx&contractaddress=${CAMLY_CONTRACT}&address=${wallet}&startblock=0&endblock=99999999&sort=asc&apikey=${bscscanApiKey}`;
        const resp = await fetch(url);
        const data = await resp.json();
        apiCalls++;

        if (data.status === "1" && Array.isArray(data.result)) {
          for (const tx of data.result) {
            // Only include transfers between known wallets
            const fromLower = tx.from.toLowerCase();
            const toLower = tx.to.toLowerCase();
            if (walletToUser.has(fromLower) && walletToUser.has(toLower)) {
              allTransfers.push(tx);
            }
          }
        }
      } catch (err) {
        console.error(`BSCScan fetch error for ${wallet}:`, err);
      }
    }

    // 4. Deduplicate transfers by tx hash
    const uniqueTransfers = new Map<string, BscScanTransfer>();
    for (const tx of allTransfers) {
      const hashLower = tx.hash.toLowerCase();
      if (!uniqueTransfers.has(hashLower)) {
        uniqueTransfers.set(hashLower, tx);
      }
    }

    // 5. Insert missing records
    let synced = 0;
    let skipped = 0;
    let failed = 0;

    for (const [hashLower, tx] of uniqueTransfers) {
      if (existingHashes.has(hashLower)) {
        skipped++;
        continue;
      }

      const senderId = walletToUser.get(tx.from.toLowerCase());
      const receiverId = walletToUser.get(tx.to.toLowerCase());
      if (!senderId || !receiverId) {
        skipped++;
        continue;
      }

      // Convert token amount (CAMLY has 18 decimals typically)
      const decimals = parseInt(tx.tokenDecimal) || 18;
      const amount = Number(BigInt(tx.value) / BigInt(10 ** decimals));
      if (amount <= 0) {
        skipped++;
        continue;
      }

      const { error: insertError } = await adminClient
        .from("coin_gifts")
        .insert({
          sender_id: senderId,
          receiver_id: receiverId,
          amount,
          tx_hash: tx.hash,
          gift_type: "web3",
          context_type: "direct",
          message: null,
          created_at: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
        });

      if (insertError) {
        console.error(`Insert error for ${tx.hash}:`, insertError.message);
        failed++;
      } else {
        synced++;
      }
    }

    const result = {
      success: true,
      walletsScanned: processedWallets.size,
      totalTransfersFound: uniqueTransfers.size,
      synced,
      skipped,
      failed,
      apiCalls,
    };

    console.log("BSCScan sync result:", JSON.stringify(result));

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Sync BSCScan error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
