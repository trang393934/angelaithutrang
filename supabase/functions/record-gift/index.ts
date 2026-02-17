import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the caller is authenticated
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

    const body = await req.json();
    const { gifts } = body;

    if (!Array.isArray(gifts) || gifts.length === 0) {
      return new Response(
        JSON.stringify({ error: "gifts array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const results: { success: number; failed: number; duplicates: number } = {
      success: 0,
      failed: 0,
      duplicates: 0,
    };

    for (const gift of gifts) {
      // Validate sender_id matches authenticated user
      if (gift.sender_id !== user.id) {
        console.warn(`Sender mismatch: ${gift.sender_id} vs ${user.id}`);
        results.failed++;
        continue;
      }

      // Check for duplicate by tx_hash if provided
      if (gift.tx_hash) {
        const { data: existing } = await adminClient
          .from("coin_gifts")
          .select("id")
          .eq("tx_hash", gift.tx_hash)
          .maybeSingle();

        if (existing) {
          console.log(`Duplicate tx_hash: ${gift.tx_hash}`);
          results.duplicates++;
          continue;
        }
      }

      // Validate context_id is a valid UUID (not a tx_hash hex string)
      let contextId = gift.context_id || null;
      if (contextId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(contextId)) {
        console.warn(`Invalid UUID for context_id: ${contextId}, setting to null`);
        contextId = null;
      }

      const record = {
        sender_id: gift.sender_id,
        receiver_id: gift.receiver_id,
        amount: gift.amount,
        message: gift.message || null,
        tx_hash: gift.tx_hash || null,
        gift_type: gift.gift_type || "web3",
        context_type: gift.context_type || "direct",
        context_id: contextId,
      };

      const { error: insertError } = await adminClient
        .from("coin_gifts")
        .insert(record);

      if (insertError) {
        console.error(`Insert failed for tx ${gift.tx_hash}:`, insertError.message);
        results.failed++;
      } else {
        results.success++;
      }
    }

    console.log(`Record-gift results: ${JSON.stringify(results)}`);

    return new Response(
      JSON.stringify({ success: true, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Record gift error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
