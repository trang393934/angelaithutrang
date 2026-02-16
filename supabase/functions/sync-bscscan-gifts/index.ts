import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TOKEN_CONTRACTS: Record<string, { address: string; giftType: string }> = {
  CAMLY: {
    address: "0x0910320181889fefde0bb1ca63962b0a8882e413",
    giftType: "web3_CAMLY",
  },
  USDT: {
    address: "0x55d398326f99059fF775485246999027B3197955",
    giftType: "web3_USDT",
  },
};

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

async function fetchTokenTransfers(
  wallet: string,
  contractAddress: string,
  bscscanApiKey: string,
): Promise<{ transfers: BscScanTransfer[]; apiCalls: number; rateLimited: boolean }> {
  const url = `${BSCSCAN_API_URL}?module=account&action=tokentx&contractaddress=${contractAddress}&address=${wallet}&startblock=0&endblock=99999999&sort=asc&apikey=${bscscanApiKey}`;

  const resp = await fetch(url);
  const data = await resp.json();

  if (data.status === "0" && data.message?.includes("Max rate limit")) {
    console.warn(`Rate limited on wallet ${wallet}, waiting 5s...`);
    await new Promise((r) => setTimeout(r, 5000));
    const retryResp = await fetch(url);
    const retryData = await retryResp.json();
    if (retryData.status === "1" && Array.isArray(retryData.result)) {
      return { transfers: retryData.result, apiCalls: 2, rateLimited: true };
    }
    return { transfers: [], apiCalls: 2, rateLimited: true };
  }

  if (data.status === "1" && Array.isArray(data.result)) {
    return { transfers: data.result, apiCalls: 1, rateLimited: false };
  }

  if (data.status === "0" && data.message !== "No transactions found") {
    console.warn(`BSCScan issue for ${wallet}: ${data.message}`);
  }
  return { transfers: [], apiCalls: 1, rateLimited: false };
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

    // 1. Get ALL wallets (scan all registered wallets, not just "active" ones)
    const { data: walletData } = await adminClient
      .from("user_wallet_addresses")
      .select("user_id, wallet_address")
      .not("wallet_address", "is", null);

    if (!walletData || walletData.length === 0) {
      return new Response(
        JSON.stringify({ error: "No wallet addresses found", synced: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const walletToUser = new Map<string, string>();
    for (const w of walletData) {
      if (!w.wallet_address) continue;
      walletToUser.set(w.wallet_address.toLowerCase(), w.user_id);
    }

    console.log(`Total wallets to scan: ${walletToUser.size}`);

    // 2. Get existing tx_hashes to avoid duplicates
    const { data: existingGifts } = await adminClient
      .from("coin_gifts")
      .select("tx_hash")
      .not("tx_hash", "is", null);

    const existingHashes = new Set(
      (existingGifts || []).map((g) => g.tx_hash?.toLowerCase())
    );

    // 3. Query BSCScan for ALL wallets × ALL tokens
    const allTransfers: Array<BscScanTransfer & { _giftType: string }> = [];
    let totalApiCalls = 0;
    let totalRateLimited = 0;
    let requestCount = 0;

    const wallets = Array.from(walletToUser.keys());

    for (const [tokenName, tokenConfig] of Object.entries(TOKEN_CONTRACTS)) {
      console.log(`Scanning ${tokenName} (${tokenConfig.address}) for ${wallets.length} wallets...`);

      for (const wallet of wallets) {
        // Rate limit: 3s delay every 3 requests
        if (requestCount > 0 && requestCount % 3 === 0) {
          await new Promise((r) => setTimeout(r, 3000));
        }

        try {
          const result = await fetchTokenTransfers(wallet, tokenConfig.address, bscscanApiKey);
          totalApiCalls += result.apiCalls;
          if (result.rateLimited) totalRateLimited++;
          requestCount++;

          for (const tx of result.transfers) {
            const fromLower = tx.from.toLowerCase();
            const toLower = tx.to.toLowerCase();
            if (walletToUser.has(fromLower) || walletToUser.has(toLower)) {
              allTransfers.push({ ...tx, _giftType: tokenConfig.giftType });
            }
          }
        } catch (err) {
          console.error(`BSCScan fetch error for ${wallet} (${tokenName}):`, err);
        }
      }
    }

    // 4. Deduplicate transfers by tx hash
    const uniqueTransfers = new Map<string, BscScanTransfer & { _giftType: string }>();
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

      if (!senderId && !receiverId) {
        skipped++;
        continue;
      }

      const decimals = parseInt(tx.tokenDecimal) || 18;
      const amount = Number(BigInt(tx.value) / BigInt(10 ** decimals));
      if (amount <= 0) {
        skipped++;
        continue;
      }

      const finalSenderId = senderId || "00000000-0000-0000-0000-000000000000";
      const finalReceiverId = receiverId || "00000000-0000-0000-0000-000000000000";

      const { error: insertError } = await adminClient
        .from("coin_gifts")
        .insert({
          sender_id: finalSenderId,
          receiver_id: finalReceiverId,
          amount,
          tx_hash: tx.hash,
          gift_type: tx._giftType,
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
      walletsScanned: walletToUser.size,
      tokensScanned: Object.keys(TOKEN_CONTRACTS),
      totalTransfersFound: uniqueTransfers.size,
      synced,
      skipped,
      failed,
      apiCalls: totalApiCalls,
      rateLimited: totalRateLimited,
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
