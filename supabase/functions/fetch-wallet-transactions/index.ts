import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BSCSCAN_API_KEY = Deno.env.get("BSCSCAN_API_KEY") || "";
const BSCSCAN_BASE = "https://api.bscscan.com/api";
const TREASURY_WALLET = "0x416336c3b7ACAe89F47EAD2707412f20DA159ac8".toLowerCase();
const CAMLY_CONTRACT = "0x0910320181889feFDE0BB1Ca63962b0A8882e413".toLowerCase();

interface BscTx {
  hash: string;
  from: string;
  to: string;
  value: string;
  timeStamp: string;
  confirmations: string;
  isError?: string;
  tokenSymbol?: string;
  tokenName?: string;
  tokenDecimal?: string;
  contractAddress?: string;
  gasUsed?: string;
  gasPrice?: string;
}

async function fetchBscApi(params: Record<string, string>): Promise<BscTx[]> {
  const url = new URL(BSCSCAN_BASE);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("apikey", BSCSCAN_API_KEY);

  const res = await fetch(url.toString());
  const json = await res.json();
  if (json.status === "1" && Array.isArray(json.result)) return json.result;
  return [];
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { wallet_address } = await req.json();
    if (!wallet_address) {
      return new Response(JSON.stringify({ error: "wallet_address required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const addr = wallet_address.toLowerCase();

    // Verify wallet ownership
    const { data: walletRecord } = await supabase
      .from("user_wallet_addresses")
      .select("id")
      .eq("user_id", user.id)
      .eq("wallet_address", wallet_address)
      .maybeSingle();

    if (!walletRecord) {
      return new Response(JSON.stringify({ error: "Wallet not linked to your account" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch known Angel AI wallets
    const { data: knownWallets } = await supabase
      .from("user_wallet_addresses")
      .select("wallet_address, user_id");

    const knownSet = new Map<string, string>();
    (knownWallets || []).forEach((w: any) => {
      if (w.wallet_address) knownSet.set(w.wallet_address.toLowerCase(), w.user_id);
    });

    // Resolve user names
    const userIds = Array.from(new Set(knownSet.values()));
    const nameMap = new Map<string, string>();
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);
      (profiles || []).forEach((p: any) => {
        if (p.display_name) nameMap.set(p.user_id, p.display_name);
      });
    }

    // Fetch 3 types from BSCScan in parallel
    const commonParams = { module: "account", address: wallet_address, sort: "desc", offset: "500", page: "1" };

    const [normalTxs, tokenTxs, internalTxs] = await Promise.all([
      fetchBscApi({ ...commonParams, action: "txlist" }),
      delay(200).then(() => fetchBscApi({ ...commonParams, action: "tokentx" })),
      delay(400).then(() => fetchBscApi({ ...commonParams, action: "txlistinternal" })),
    ]);

    // Also fetch balances
    const [bnbRes, camlyRes] = await Promise.all([
      fetchBscApi({ module: "account", action: "balance", address: wallet_address, tag: "latest" }),
      fetchBscApi({
        module: "account",
        action: "tokenbalance",
        address: wallet_address,
        contractaddress: "0x0910320181889feFDE0BB1Ca63962b0A8882e413",
        tag: "latest",
      }),
    ]);

    // Parse balances from raw API (balance endpoints return result as string, not array)
    let bnbBalance = "0";
    let camlyBalance = "0";
    try {
      const bnbUrl = new URL(BSCSCAN_BASE);
      bnbUrl.searchParams.set("module", "account");
      bnbUrl.searchParams.set("action", "balance");
      bnbUrl.searchParams.set("address", wallet_address);
      bnbUrl.searchParams.set("tag", "latest");
      bnbUrl.searchParams.set("apikey", BSCSCAN_API_KEY);
      const bnbJson = await (await fetch(bnbUrl.toString())).json();
      if (bnbJson.status === "1") bnbBalance = bnbJson.result;

      await delay(200);

      const camlyUrl = new URL(BSCSCAN_BASE);
      camlyUrl.searchParams.set("module", "account");
      camlyUrl.searchParams.set("action", "tokenbalance");
      camlyUrl.searchParams.set("address", wallet_address);
      camlyUrl.searchParams.set("contractaddress", "0x0910320181889feFDE0BB1Ca63962b0A8882e413");
      camlyUrl.searchParams.set("tag", "latest");
      camlyUrl.searchParams.set("apikey", BSCSCAN_API_KEY);
      const camlyJson = await (await fetch(camlyUrl.toString())).json();
      if (camlyJson.status === "1") camlyBalance = camlyJson.result;
    } catch (e) {
      console.error("Balance fetch error:", e);
    }

    // Classify helper
    function classify(counterparty: string) {
      const cp = counterparty.toLowerCase();
      if (cp === TREASURY_WALLET) {
        return { source: "angel_ai" as const, counterparty_name: "Angel AI Treasury" };
      }
      const userId = knownSet.get(cp);
      if (userId) {
        return { source: "angel_ai" as const, counterparty_name: nameMap.get(userId) || "Angel AI User" };
      }
      return { source: "external" as const, counterparty_name: undefined };
    }

    // Merge all transactions
    const transactions: any[] = [];

    // Normal transactions
    for (const tx of normalTxs) {
      const direction = tx.from.toLowerCase() === addr ? "out" : "in";
      const counterparty = direction === "out" ? tx.to : tx.from;
      const { source, counterparty_name } = classify(counterparty);
      const isPending = parseInt(tx.confirmations || "999") < 12;

      transactions.push({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: tx.value,
        tokenSymbol: "BNB",
        tokenDecimal: "18",
        timestamp: parseInt(tx.timeStamp),
        type: "normal",
        source,
        direction,
        counterparty_name,
        status: tx.isError === "1" ? "failed" : isPending ? "pending" : "confirmed",
      });
    }

    // Token transfers
    for (const tx of tokenTxs) {
      const direction = tx.from.toLowerCase() === addr ? "out" : "in";
      const counterparty = direction === "out" ? tx.to : tx.from;
      const { source, counterparty_name } = classify(counterparty);
      const isPending = parseInt(tx.confirmations || "999") < 12;

      transactions.push({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: tx.value,
        tokenSymbol: tx.tokenSymbol || "Unknown",
        tokenName: tx.tokenName,
        tokenDecimal: tx.tokenDecimal || "18",
        contractAddress: tx.contractAddress,
        timestamp: parseInt(tx.timeStamp),
        type: "token",
        source,
        direction,
        counterparty_name,
        status: isPending ? "pending" : "confirmed",
      });
    }

    // Internal transactions
    for (const tx of internalTxs) {
      const direction = tx.from.toLowerCase() === addr ? "out" : "in";
      const counterparty = direction === "out" ? tx.to : tx.from;
      const { source, counterparty_name } = classify(counterparty);

      transactions.push({
        hash: tx.hash,
        from: tx.from,
        to: tx.to || "",
        value: tx.value,
        tokenSymbol: "BNB",
        tokenDecimal: "18",
        timestamp: parseInt(tx.timeStamp),
        type: "internal",
        source,
        direction,
        counterparty_name,
        status: tx.isError === "1" ? "failed" : "confirmed",
      });
    }

    // Deduplicate by hash+type and sort by timestamp desc
    const seen = new Set<string>();
    const unique = transactions.filter((tx) => {
      const key = `${tx.hash}-${tx.type}-${tx.from}-${tx.to}-${tx.value}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    unique.sort((a, b) => b.timestamp - a.timestamp);

    return new Response(
      JSON.stringify({
        transactions: unique,
        balances: {
          bnb: bnbBalance,
          camly: camlyBalance,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("fetch-wallet-transactions error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
