import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { submitAndScorePPLPAction, PPLP_ACTION_TYPES } from "../_shared/pplp-helper.ts";

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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, message: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ success: false, message: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { amount, txHash, message } = await req.json();

    // Validate amount
    if (!amount || amount <= 0) {
      return new Response(
        JSON.stringify({ success: false, message: "Invalid amount" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing manual donation: user=${user.id}, amount=${amount}, txHash=${txHash || 'none'}`);

    // Insert the manual donation with pending_verification status
    const { data: donation, error: donationError } = await supabase
      .from("project_donations")
      .insert({
        donor_id: user.id,
        amount: amount,
        message: message || null,
        donation_type: "crypto_manual",
        tx_hash: txHash || null,
        status: txHash ? "pending_verification" : "confirmed", // If no tx_hash, confirm immediately (trust-based)
      })
      .select()
      .single();

    if (donationError) {
      console.error("Donation insert error:", donationError);
      return new Response(
        JSON.stringify({ success: false, message: "Failed to record donation" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update project_fund balance
    const { error: fundError } = await supabase.rpc("increment_project_fund", {
      donation_amount: amount,
    });

    if (fundError) {
      console.error("Project fund update error:", fundError);
      // Don't fail the whole request, the donation is recorded
    }

    // Update user's PoPL score for donation
    const poplBonus = Math.min(Math.floor(amount / 100), 50); // Max 50 points per donation
    
    const { error: poplError } = await supabase
      .from("light_points")
      .insert({
        user_id: user.id,
        points: poplBonus,
        reason: `Manual crypto donation: ${amount} CAMLY`,
        source_type: "donation",
      });

    if (poplError) {
      console.error("PoPL update error:", poplError);
    }

    // Get user profile for notification
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", user.id)
      .single();

    const displayName = profile?.display_name || "Người dùng";

    // Send healing message notification
    await supabase.from("healing_messages").insert({
      user_id: user.id,
      title: "🙏 Cảm ơn bạn đã donate!",
      content: `${displayName} ơi, Angel AI vô cùng biết ơn sự đóng góp ${amount.toLocaleString()} CAMLY của bạn. Mỗi đồng coin đều góp phần xây dựng cộng đồng ánh sáng. 💛`,
      message_type: "donation_thanks",
      triggered_by: "manual_donation",
    });

    console.log(`Manual donation recorded successfully: donation_id=${donation.id}`);

    // ============= PPLP Integration: Manual crypto donation (DONATE_SUPPORT) =============
    submitAndScorePPLPAction(supabase, {
      action_type: PPLP_ACTION_TYPES.DONATE_SUPPORT,
      actor_id: user.id,
      target_id: donation.id,
      metadata: {
        donation_type: 'crypto_manual',
        amount,
        tx_hash: txHash || null,
        message: message || null,
      },
      impact: {
        scope: 'ecosystem',
        reach_count: 1,
        quality_indicators: ['crypto_donation', 'ecosystem_builder'],
      },
      integrity: {
        source_verified: !!txHash,
        content_hash: txHash || undefined,
      },
      reward_amount: amount,
    }).then(r => {
      if (r.success) console.log(`[PPLP] Manual donation scored: ${r.action_id}, FUN: ${r.reward}`);
    }).catch(e => console.warn('[PPLP] Manual donation error:', e));
    // ============= End PPLP Integration =============

    return new Response(
      JSON.stringify({
        success: true,
        message: txHash 
          ? "Donation recorded! Pending verification." 
          : "Thank you! Your donation has been recorded.",
        donationId: donation.id,
        poplBonus,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
