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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { receipt_id } = await req.json();

    if (!receipt_id) {
      return new Response(
        JSON.stringify({ error: "receipt_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Fetching receipt: ${receipt_id}`);

    // Fetch gift record
    const { data: gift, error: giftError } = await supabaseAdmin
      .from("coin_gifts")
      .select("*")
      .eq("receipt_public_id", receipt_id)
      .maybeSingle();

    if (giftError || !gift) {
      console.error("Receipt not found:", giftError);
      return new Response(
        JSON.stringify({ error: "Biên nhận không tồn tại" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch sender profile
    const { data: senderProfile } = await supabaseAdmin
      .from("profiles")
      .select("user_id, display_name, avatar_url")
      .eq("user_id", gift.sender_id)
      .maybeSingle();

    // Fetch receiver profile
    const { data: receiverProfile } = await supabaseAdmin
      .from("profiles")
      .select("user_id, display_name, avatar_url")
      .eq("user_id", gift.receiver_id)
      .maybeSingle();

    // If context_type is 'post', fetch post info
    let postInfo = null;
    if (gift.context_type === "post" && gift.context_id) {
      const { data: post } = await supabaseAdmin
        .from("community_posts")
        .select("id, content, user_id")
        .eq("id", gift.context_id)
        .maybeSingle();
      if (post) {
        postInfo = {
          id: post.id,
          content_preview: post.content?.substring(0, 100) + (post.content?.length > 100 ? "..." : ""),
        };
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        receipt: {
          id: gift.id,
          receipt_public_id: gift.receipt_public_id,
          sender: senderProfile || { user_id: gift.sender_id, display_name: null, avatar_url: null },
          receiver: receiverProfile || { user_id: gift.receiver_id, display_name: null, avatar_url: null },
          amount: gift.amount,
          message: gift.message,
          gift_type: gift.gift_type,
          tx_hash: gift.tx_hash,
          context_type: gift.context_type,
          context_id: gift.context_id,
          post: postInfo,
          created_at: gift.created_at,
          explorer_url: gift.tx_hash ? `https://bscscan.com/tx/${gift.tx_hash}` : null,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Get receipt error:", error);
    return new Response(
      JSON.stringify({ error: "Lỗi lấy biên nhận" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
