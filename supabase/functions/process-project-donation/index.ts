import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Client for auth verification
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Service client for database operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabaseAuth.auth.getUser(token);

    if (authError || !userData.user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const donorId = userData.user.id;
    const { amount, message } = await req.json();

    console.log(`Processing donation: donor=${donorId}, amount=${amount}`);

    // Validations
    if (!amount) {
      return new Response(
        JSON.stringify({ error: "Số lượng là bắt buộc" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const donationAmount = Number(amount);
    if (isNaN(donationAmount) || donationAmount < 100) {
      return new Response(
        JSON.stringify({ error: "Số lượng tối thiểu là 100 Camly Coin" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check donor balance
    const { data: donorBalance, error: balanceError } = await supabaseAdmin
      .from("camly_coin_balances")
      .select("*")
      .eq("user_id", donorId)
      .maybeSingle();

    if (balanceError) {
      console.error("Balance check error:", balanceError);
      return new Response(
        JSON.stringify({ error: "Không thể kiểm tra số dư" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const currentBalance = donorBalance?.balance || 0;
    if (currentBalance < donationAmount) {
      return new Response(
        JSON.stringify({ error: `Số dư không đủ. Hiện có: ${currentBalance.toLocaleString()} Camly Coin` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get donor profile for notification
    const { data: donorProfile } = await supabaseAdmin
      .from("profiles")
      .select("display_name")
      .eq("user_id", donorId)
      .maybeSingle();

    const donorName = donorProfile?.display_name || "Một mạnh thường quân";

    // ===== ATOMIC TRANSACTION =====
    // 1. Deduct from donor
    const { error: deductError } = await supabaseAdmin
      .from("camly_coin_balances")
      .update({
        balance: currentBalance - donationAmount,
        lifetime_spent: (donorBalance?.lifetime_spent || 0) + donationAmount,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", donorId);

    if (deductError) {
      console.error("Deduct error:", deductError);
      return new Response(
        JSON.stringify({ error: "Không thể trừ số dư" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Record transaction
    await supabaseAdmin.from("camly_coin_transactions").insert({
      user_id: donorId,
      amount: -donationAmount,
      transaction_type: "project_donation",
      description: `Donate ${donationAmount.toLocaleString()} Camly Coin cho dự án Angel AI`,
      metadata: { message },
    });

    // 3. Insert donation record
    await supabaseAdmin.from("project_donations").insert({
      donor_id: donorId,
      amount: donationAmount,
      message: message || null,
    });

    // 4. Update PoPL score for positive action
    await supabaseAdmin.rpc("update_popl_score", {
      _user_id: donorId,
      _action_type: "donate",
      _is_positive: true,
    });

    console.log(`Donation successful: donor=${donorId}, amount=${donationAmount}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Cảm ơn ${donorName} đã donate ${donationAmount.toLocaleString()} Camly Coin cho dự án Angel AI! 🙏💛`,
        donation: {
          donor_id: donorId,
          amount: donationAmount,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Donation processing error:", error);
    return new Response(
      JSON.stringify({ error: "Lỗi xử lý donate" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
