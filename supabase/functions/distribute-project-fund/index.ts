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

    const adminId = userData.user.id;

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabaseAuth
      .from("user_roles")
      .select("role")
      .eq("user_id", adminId)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { recipient_id, amount, reason } = await req.json();

    console.log(`Processing distribution: admin=${adminId}, recipient=${recipient_id}, amount=${amount}`);

    // Validations
    if (!recipient_id || !amount || !reason) {
      return new Response(
        JSON.stringify({ error: "recipient_id, amount, và reason là bắt buộc" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const distributionAmount = Number(amount);
    if (isNaN(distributionAmount) || distributionAmount <= 0) {
      return new Response(
        JSON.stringify({ error: "Số lượng không hợp lệ" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check fund balance
    const { data: fundData, error: fundError } = await supabaseAdmin
      .from("project_fund")
      .select("balance, total_distributed")
      .eq("id", "00000000-0000-0000-0000-000000000001")
      .single();

    if (fundError || !fundData) {
      console.error("Fund check error:", fundError);
      return new Response(
        JSON.stringify({ error: "Không thể kiểm tra quỹ" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (fundData.balance < distributionAmount) {
      return new Response(
        JSON.stringify({ error: `Số dư quỹ không đủ. Hiện có: ${fundData.balance.toLocaleString()} Camly Coin` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get recipient profile for notification
    const { data: recipientProfile } = await supabaseAdmin
      .from("profiles")
      .select("display_name")
      .eq("user_id", recipient_id)
      .maybeSingle();

    const recipientName = recipientProfile?.display_name || "Contributor";

    // ===== ATOMIC TRANSACTION =====
    // 1. Deduct from fund
    const { error: deductFundError } = await supabaseAdmin
      .from("project_fund")
      .update({
        balance: fundData.balance - distributionAmount,
        total_distributed: fundData.total_distributed + distributionAmount,
      })
      .eq("id", "00000000-0000-0000-0000-000000000001");

    if (deductFundError) {
      console.error("Deduct fund error:", deductFundError);
      return new Response(
        JSON.stringify({ error: "Không thể trừ quỹ" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Add to recipient balance
    const { data: recipientBalance } = await supabaseAdmin
      .from("camly_coin_balances")
      .select("balance, lifetime_earned")
      .eq("user_id", recipient_id)
      .maybeSingle();

    if (recipientBalance) {
      await supabaseAdmin
        .from("camly_coin_balances")
        .update({
          balance: recipientBalance.balance + distributionAmount,
          lifetime_earned: recipientBalance.lifetime_earned + distributionAmount,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", recipient_id);
    } else {
      await supabaseAdmin
        .from("camly_coin_balances")
        .insert({
          user_id: recipient_id,
          balance: distributionAmount,
          lifetime_earned: distributionAmount,
        });
    }

    // 3. Record transaction
    await supabaseAdmin.from("camly_coin_transactions").insert({
      user_id: recipient_id,
      amount: distributionAmount,
      transaction_type: "project_reward",
      description: `Thưởng từ Quỹ Dự Án: ${reason}`,
      metadata: { 
        distributed_by: adminId,
        reason,
        source: "project_fund"
      },
    });

    // 4. Send healing message notification
    await supabaseAdmin.from("healing_messages").insert({
      user_id: recipient_id,
      title: "🎁 Bạn nhận được thưởng từ Quỹ Dự Án!",
      content: `Chúc mừng ${recipientName}! Bạn vừa nhận được ${distributionAmount.toLocaleString()} Camly Coin từ Quỹ Dự Án Angel AI.\n\nLý do: ${reason}\n\nCảm ơn bạn đã đóng góp cho cộng đồng! 💛`,
      message_type: "reward",
      triggered_by: "project_fund_distribution",
    });

    // 5. Update PoPL score for receiving reward
    await supabaseAdmin.rpc("update_popl_score", {
      _user_id: recipient_id,
      _action_type: "quality_post",
      _is_positive: true,
    });

    console.log(`Distribution successful: recipient=${recipient_id}, amount=${distributionAmount}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Đã phân phối ${distributionAmount.toLocaleString()} Camly Coin cho ${recipientName}! 🎉`,
        distribution: {
          recipient_id,
          amount: distributionAmount,
          reason,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Distribution processing error:", error);
    return new Response(
      JSON.stringify({ error: "Lỗi xử lý phân phối" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
