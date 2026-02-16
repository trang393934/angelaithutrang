import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    // 1. Get wallets that have web3 activity (instead of ALL wallets)
    const { data: web3Gifts } = await adminClient
      .from("coin_gifts")
      .select("sender_id, receiver_id")
      .eq("gift_type", "web3");

    const { data: withdrawals } = await adminClient
      .from("coin_withdrawals")
      .select("user_id")
      .in("status", ["completed", "approved"]);

    const activeUserIds = new Set<string>();
    for (const g of web3Gifts || []) {
      activeUserIds.add(g.sender_id);
      activeUserIds.add(g.receiver_id);
    }
    for (const w of withdrawals || []) {
      activeUserIds.add(w.user_id);
    }

    // Get ALL wallet addresses (for mapping) but only scan active ones
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
    const walletsToScan = new Set<string>();
    for (const w of walletData) {
      if (!w.wallet_address) continue;
      const addr = w.wallet_address.toLowerCase();
      walletToUser.set(addr, w.user_id);
      // Only scan wallets belonging to active users
      if (activeUserIds.has(w.user_id)) {
        walletsToScan.add(addr);
      }
    }

    console.log(`Total wallets mapped: ${walletToUser.size}, Wallets to scan: ${walletsToScan.size}`);

    // 2. Get existing tx_hashes to avoid duplicates
    const { data: existingGifts } = await adminClient
      .from("coin_gifts")
      .select("tx_hash")
      .not("tx_hash", "is", null);

    const existingHashes = new Set(
      (existingGifts || []).map((g) => g.tx_hash?.toLowerCase())
    );

    // 3. Query BSCScan for active wallets only
    const allTransfers: BscScanTransfer[] = [];
    let apiCalls = 0;
    let rateLimited = 0;

    for (const wallet of walletsToScan) {
      // Rate limit: 2 second delay every 3 requests
      if (apiCalls > 0 && apiCalls % 3 === 0) {
        await new Promise((r) => setTimeout(r, 2000));
      }

      try {
        const url = `${BSCSCAN_API_URL}?module=account&action=tokentx&contractaddress=${CAMLY_CONTRACT}&address=${wallet}&startblock=0&endblock=99999999&sort=asc&apikey=${bscscanApiKey}`;
        const resp = await fetch(url);
        const data = await resp.json();
        apiCalls++;

        // Handle rate limit
        if (data.status === "0" && data.message?.includes("Max rate limit")) {
          rateLimited++;
          console.warn(`Rate limited on wallet ${wallet}, waiting 5s...`);
          await new Promise((r) => setTimeout(r, 5000));
          // Retry once
          const retryResp = await fetch(url);
          const retryData = await retryResp.json();
          apiCalls++;
          if (retryData.status === "1" && Array.isArray(retryData.result)) {
            for (const tx of retryData.result) {
              const fromLower = tx.from.toLowerCase();
              const toLower = tx.to.toLowerCase();
              // Accept if at least ONE side is a known wallet
              if (walletToUser.has(fromLower) || walletToUser.has(toLower)) {
                allTransfers.push(tx);
              }
            }
          }
          continue;
        }

        if (data.status === "1" && Array.isArray(data.result)) {
          for (const tx of data.result) {
            const fromLower = tx.from.toLowerCase();
            const toLower = tx.to.toLowerCase();
            if (walletToUser.has(fromLower) || walletToUser.has(toLower)) {
              allTransfers.push(tx);
            }
          }
        } else if (data.status === "0" && data.message !== "No transactions found") {
          console.warn(`BSCScan issue for ${wallet}: ${data.message}`);
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

      // Need at least one known user
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

      // Use a placeholder for unknown sender/receiver
      const finalSenderId = senderId || "00000000-0000-0000-0000-000000000000";
      const finalReceiverId = receiverId || "00000000-0000-0000-0000-000000000000";

      const { error: insertError } = await adminClient
        .from("coin_gifts")
        .insert({
          sender_id: finalSenderId,
          receiver_id: finalReceiverId,
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
      walletsScanned: walletsToScan.size,
      totalWalletsMapped: walletToUser.size,
      totalTransfersFound: uniqueTransfers.size,
      synced,
      skipped,
      failed,
      apiCalls,
      rateLimited,
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
