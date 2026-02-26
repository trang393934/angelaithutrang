import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BSCSCAN_API_KEY = Deno.env.get("BSCSCAN_API_KEY") || "";
const BSCSCAN_BASE = "https://api.bscscan.com/api";
const DEFAULT_COLLECTOR = "0xcc07E57E53669010881cab278aAEc1A2c4066B8f";

const TOKEN_CONTRACTS: Record<string, string> = {
  CAMLY: "0x0910320181889feFDE0BB1Ca63962b0A8882e413",
  USDT: "0x55d398326f99059fF775485246999027B3197955",
  FUN: "0x1aa8DE8B1E4465C6d729E8564893f8EF823a5ff2",
};

interface BscTx {
  hash: string;
  from: string;
  to: string;
  value: string;
  timeStamp: string;
  tokenSymbol?: string;
  tokenDecimal?: string;
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchBscApi(params: Record<string, string>): Promise<any[]> {
  const url = new URL(BSCSCAN_BASE);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("apikey", BSCSCAN_API_KEY);
  console.log("BSCScan request URL:", url.toString().replace(BSCSCAN_API_KEY, "***"));
  const res = await fetch(url.toString());
  const json = await res.json();
  console.log("BSCScan response:", json.status, json.message, typeof json.result === 'string' ? json.result.substring(0, 200) : `array[${json.result?.length}]`);
  if (json.status === "1" && Array.isArray(json.result)) return json.result;
  if (json.status === "0" && json.message?.includes("Max rate limit")) {
    console.warn("Rate limited, retrying after 5s...");
    await delay(5000);
    const res2 = await fetch(url.toString());
    const json2 = await res2.json();
    if (json2.status === "1" && Array.isArray(json2.result)) return json2.result;
  }
  return [];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await anonClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceKey);

    // Check admin role
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin only" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse params
    let collectorAddress = DEFAULT_COLLECTOR;
    try {
      const body = await req.json();
      if (body.collector_address) collectorAddress = body.collector_address;
    } catch { /* use default */ }

    const collectorLower = collectorAddress.toLowerCase();

    // ---- Fetch BSCScan data ----
    console.log(`Scanning collector wallet: ${collectorAddress}`);

    // Token transfers for each contract
    const allTxs: Array<BscTx & { token: string }> = [];

    for (const [token, contract] of Object.entries(TOKEN_CONTRACTS)) {
      const txs = await fetchBscApi({
        module: "account",
        action: "tokentx",
        contractaddress: contract,
        address: collectorAddress,
        startblock: "0",
        endblock: "99999999",
        sort: "asc",
      });
      for (const tx of txs) {
        if (tx.to?.toLowerCase() === collectorLower) {
          allTxs.push({ ...tx, token });
        }
      }
      await delay(250);
    }

    // Normal BNB transactions
    const bnbTxs = await fetchBscApi({
      module: "account",
      action: "txlist",
      address: collectorAddress,
      startblock: "0",
      endblock: "99999999",
      sort: "asc",
    });
    for (const tx of bnbTxs) {
      if (tx.to?.toLowerCase() === collectorLower && BigInt(tx.value || "0") > 0n) {
        allTxs.push({ ...tx, token: "BNB", tokenDecimal: "18" });
      }
    }

    // Extract unique senders
    const senderMap = new Map<string, { txs: typeof allTxs }>();
    for (const tx of allTxs) {
      const from = tx.from.toLowerCase();
      if (!senderMap.has(from)) senderMap.set(from, { txs: [] });
      senderMap.get(from)!.txs.push(tx);
    }

    const uniqueSenders = Array.from(senderMap.keys());
    console.log(`Total incoming txs: ${allTxs.length}, unique senders: ${uniqueSenders.length}`);

    // ---- Cross-reference with DB ----
    // 1. user_wallet_addresses
    const { data: walletRecords } = await adminClient
      .from("user_wallet_addresses")
      .select("user_id, wallet_address");

    const walletToUser = new Map<string, string>();
    for (const w of (walletRecords || [])) {
      if (w.wallet_address) walletToUser.set(w.wallet_address.toLowerCase(), w.user_id);
    }

    // 2. coin_withdrawals (fallback - withdrawal wallet → user)
    const { data: withdrawalRecords } = await adminClient
      .from("coin_withdrawals")
      .select("user_id, wallet_address")
      .eq("status", "completed");

    const withdrawalWalletToUser = new Map<string, string>();
    for (const w of (withdrawalRecords || [])) {
      if (w.wallet_address) {
        const wLower = w.wallet_address.toLowerCase();
        if (!walletToUser.has(wLower) && !withdrawalWalletToUser.has(wLower)) {
          withdrawalWalletToUser.set(wLower, w.user_id);
        }
      }
    }

    // Resolve sender → user_id
    const resolvedUsers = new Map<string, { user_id: string; source: string }>();
    for (const sender of uniqueSenders) {
      if (walletToUser.has(sender)) {
        resolvedUsers.set(sender, { user_id: walletToUser.get(sender)!, source: "wallet_address" });
      } else if (withdrawalWalletToUser.has(sender)) {
        resolvedUsers.set(sender, { user_id: withdrawalWalletToUser.get(sender)!, source: "withdrawal" });
      }
    }

    // Get user details
    const userIds = Array.from(new Set([...resolvedUsers.values()].map((u) => u.user_id)));

    let profileMap = new Map<string, { display_name: string; avatar_url: string; handle: string }>();
    let suspensionSet = new Set<string>();
    let balanceMap = new Map<string, number>();
    let totalWithdrawnMap = new Map<string, number>();

    if (userIds.length > 0) {
      // Profiles
      const { data: profiles } = await adminClient
        .from("profiles")
        .select("user_id, display_name, avatar_url, handle")
        .in("user_id", userIds);
      for (const p of (profiles || [])) {
        profileMap.set(p.user_id, {
          display_name: p.display_name || "",
          avatar_url: p.avatar_url || "",
          handle: p.handle || "",
        });
      }

      // Suspensions
      const { data: suspensions } = await adminClient
        .from("user_suspensions")
        .select("user_id")
        .in("user_id", userIds)
        .eq("is_active", true);
      for (const s of (suspensions || [])) {
        suspensionSet.add(s.user_id);
      }

      // Balances
      const { data: balances } = await adminClient
        .from("camly_coin_balances")
        .select("user_id, balance")
        .in("user_id", userIds);
      for (const b of (balances || [])) {
        balanceMap.set(b.user_id, b.balance);
      }

      // Total withdrawn
      const { data: withdrawals } = await adminClient
        .from("coin_withdrawals")
        .select("user_id, amount")
        .in("user_id", userIds)
        .eq("status", "completed");
      for (const w of (withdrawals || [])) {
        totalWithdrawnMap.set(w.user_id, (totalWithdrawnMap.get(w.user_id) || 0) + w.amount);
      }
    }

    // Build matched_users
    const matchedUsers: any[] = [];
    const unmatchedWallets: string[] = [];

    for (const [sender, data] of senderMap) {
      const resolved = resolvedUsers.get(sender);
      if (!resolved) {
        unmatchedWallets.push(sender);
        continue;
      }

      const { user_id } = resolved;
      const profile = profileMap.get(user_id);
      const txs = data.txs;
      const tokens = [...new Set(txs.map((t) => t.token))];

      // Calculate total sent per token
      const tokenTotals: Record<string, number> = {};
      for (const tx of txs) {
        const decimals = parseInt(tx.tokenDecimal || "18");
        const amount = Number(BigInt(tx.value) / BigInt(10 ** Math.min(decimals, 18)));
        tokenTotals[tx.token] = (tokenTotals[tx.token] || 0) + amount;
      }

      const totalSentStr = Object.entries(tokenTotals)
        .map(([t, a]) => `${a.toLocaleString()} ${t}`)
        .join(", ");

      matchedUsers.push({
        wallet: sender,
        user_id,
        display_name: profile?.display_name || "Unknown",
        handle: profile?.handle || "",
        avatar_url: profile?.avatar_url || "",
        is_suspended: suspensionSet.has(user_id),
        camly_balance: balanceMap.get(user_id) || 0,
        total_withdrawn: totalWithdrawnMap.get(user_id) || 0,
        txs_to_collector: txs.length,
        total_sent_to_collector: totalSentStr,
        token_totals: tokenTotals,
        tokens,
        match_source: resolved.source,
      });
    }

    // Sort: suspended first, then by txs count desc
    matchedUsers.sort((a, b) => {
      if (a.is_suspended !== b.is_suspended) return a.is_suspended ? -1 : 1;
      return b.txs_to_collector - a.txs_to_collector;
    });

    const suspendedCount = matchedUsers.filter((u) => u.is_suspended).length;

    const result = {
      collector_address: collectorAddress,
      total_incoming_txs: allTxs.length,
      unique_senders: uniqueSenders.length,
      matched_users: matchedUsers,
      unmatched_wallets: unmatchedWallets,
      summary: {
        matched: matchedUsers.length,
        unmatched: unmatchedWallets.length,
        suspended: suspendedCount,
        active: matchedUsers.length - suspendedCount,
      },
    };

    console.log(`Scan complete: ${matchedUsers.length} matched, ${unmatchedWallets.length} unmatched, ${suspendedCount} suspended`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("scan-collector-wallet error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
