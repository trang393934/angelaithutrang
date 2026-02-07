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

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

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

    const senderId = userData.user.id;
    const { receiver_id, amount, message, context_type, context_id } = await req.json();

    console.log(`Processing gift: sender=${senderId}, receiver=${receiver_id}, amount=${amount}, context=${context_type}`);

    // Validations
    if (!receiver_id || !amount) {
      return new Response(
        JSON.stringify({ error: "receiver_id và amount là bắt buộc" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (senderId === receiver_id) {
      return new Response(
        JSON.stringify({ error: "Không thể tặng coin cho chính mình" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const giftAmount = Number(amount);
    if (isNaN(giftAmount) || giftAmount < 100) {
      return new Response(
        JSON.stringify({ error: "Số lượng tối thiểu là 100 Camly Coin" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limit: max 10 tips per day
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { count: todayCount } = await supabaseAdmin
      .from("coin_gifts")
      .select("id", { count: "exact", head: true })
      .eq("sender_id", senderId)
      .gte("created_at", todayStart.toISOString());

    if ((todayCount || 0) >= 10) {
      return new Response(
        JSON.stringify({ error: "Đã đạt giới hạn 10 giao dịch tặng/ngày. Hãy quay lại ngày mai nhé!" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check sender balance
    const { data: senderBalance, error: balanceError } = await supabaseAdmin
      .from("camly_coin_balances")
      .select("balance, lifetime_spent")
      .eq("user_id", senderId)
      .maybeSingle();

    if (balanceError) {
      console.error("Balance check error:", balanceError);
      return new Response(
        JSON.stringify({ error: "Không thể kiểm tra số dư" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const currentBalance = senderBalance?.balance || 0;
    if (currentBalance < giftAmount) {
      return new Response(
        JSON.stringify({ error: `Số dư không đủ. Hiện có: ${currentBalance.toLocaleString()} Camly Coin` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check receiver exists
    const { data: receiverProfile, error: receiverError } = await supabaseAdmin
      .from("profiles")
      .select("user_id, display_name")
      .eq("user_id", receiver_id)
      .maybeSingle();

    if (receiverError || !receiverProfile) {
      return new Response(
        JSON.stringify({ error: "Người nhận không tồn tại" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get sender profile
    const { data: senderProfile } = await supabaseAdmin
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("user_id", senderId)
      .maybeSingle();

    const senderName = senderProfile?.display_name || "Một người bạn";
    const receiverName = receiverProfile.display_name || "Bạn";

    // Generate receipt_public_id
    const receiptPublicId = crypto.randomUUID();

    // ===== TRANSACTION =====
    // 1. Deduct from sender
    const { error: deductError } = await supabaseAdmin
      .from("camly_coin_balances")
      .update({
        balance: currentBalance - giftAmount,
        lifetime_spent: (senderBalance?.lifetime_spent || 0) + giftAmount,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", senderId);

    if (deductError) {
      console.error("Deduct error:", deductError);
      return new Response(
        JSON.stringify({ error: "Không thể trừ số dư" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Add to receiver (upsert)
    const { data: receiverBalance } = await supabaseAdmin
      .from("camly_coin_balances")
      .select("*")
      .eq("user_id", receiver_id)
      .maybeSingle();

    if (receiverBalance) {
      await supabaseAdmin
        .from("camly_coin_balances")
        .update({
          balance: receiverBalance.balance + giftAmount,
          lifetime_earned: receiverBalance.lifetime_earned + giftAmount,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", receiver_id);
    } else {
      await supabaseAdmin.from("camly_coin_balances").insert({
        user_id: receiver_id,
        balance: giftAmount,
        lifetime_earned: giftAmount,
      });
    }

    // 3. Record transactions
    await supabaseAdmin.from("camly_coin_transactions").insert([
      {
        user_id: senderId,
        amount: -giftAmount,
        transaction_type: "gift_sent",
        description: `Tặng ${giftAmount.toLocaleString()} Camly Coin cho ${receiverName}`,
        metadata: { receiver_id, message, context_type: context_type || "global", context_id: context_id || null },
      },
      {
        user_id: receiver_id,
        amount: giftAmount,
        transaction_type: "gift_received",
        description: `Nhận ${giftAmount.toLocaleString()} Camly Coin từ ${senderName}`,
        metadata: { sender_id: senderId, message, context_type: context_type || "global", context_id: context_id || null },
      },
    ]);

    // 4. Insert gift record with receipt_public_id and context
    const { data: giftRecord, error: giftError } = await supabaseAdmin.from("coin_gifts").insert({
      sender_id: senderId,
      receiver_id: receiver_id,
      amount: giftAmount,
      message: message || null,
      receipt_public_id: receiptPublicId,
      context_type: context_type || "global",
      context_id: context_id || null,
    }).select("id").single();

    if (giftError) {
      console.error("Gift record error:", giftError);
    }

    // 5. Send notification to receiver
    await supabaseAdmin.from("healing_messages").insert({
      user_id: receiver_id,
      title: "🎁 Bạn nhận được quà!",
      content: `${senderName} đã tặng bạn ${giftAmount.toLocaleString()} Camly Coin${message ? ` với lời nhắn: "${message}"` : ""}. Cảm ơn bạn là một phần của cộng đồng! 💛`,
      message_type: "gift_received",
      triggered_by: senderId,
    });

    // 6. Auto-create tip message in DM between sender and receiver
    const tipContent = `🎁 ${senderName} đã tặng ${receiverName} ${giftAmount.toLocaleString()} Camly Coin${message ? `\n💬 "${message}"` : ""}`;
    await supabaseAdmin.from("direct_messages").insert({
      sender_id: senderId,
      receiver_id: receiver_id,
      content: tipContent,
      message_type: "tip",
      tip_gift_id: giftRecord?.id || null,
    });

    console.log(`Gift successful: ${senderId} -> ${receiver_id}, amount=${giftAmount}, receipt=${receiptPublicId}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Đã tặng ${giftAmount.toLocaleString()} Camly Coin cho ${receiverName}!`,
        gift: {
          id: giftRecord?.id,
          sender_id: senderId,
          receiver_id,
          amount: giftAmount,
          receipt_public_id: receiptPublicId,
          context_type: context_type || "global",
          context_id: context_id || null,
          sender_name: senderName,
          sender_avatar: senderProfile?.avatar_url,
          receiver_name: receiverName,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Gift processing error:", error);
    return new Response(
      JSON.stringify({ error: "Lỗi xử lý tặng quà" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
