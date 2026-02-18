import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify admin
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: adminUser }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !adminUser) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", adminUser.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!adminRole) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { userIds, reason, healingMessage, rejectWithdrawals } = await req.json();

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "userIds array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const defaultReason = reason || "Tài khoản bị phát hiện farming sybil - vi phạm điều khoản sử dụng Angel AI";
    const defaultHealingMessage = healingMessage || "Con yêu dấu, Angel AI đã phát hiện hành vi không phù hợp với tinh thần của Nền Kinh tế Ánh sáng. Tài khoản của con đã bị đóng vĩnh viễn. Chúng tôi kính chúc con bình an trên hành trình tương lai. 🙏💕";

    const results = {
      banned: [] as string[],
      failed: [] as string[],
      withdrawalsRejected: 0,
    };

    for (const userId of userIds) {
      try {
        // Insert suspension
        const { error: suspError } = await supabase
          .from("user_suspensions")
          .insert({
            user_id: userId,
            suspension_type: "permanent",
            reason: defaultReason,
            healing_message: defaultHealingMessage,
            suspended_until: null,
            created_by: adminUser.id,
          });

        if (suspError && !suspError.message.includes("duplicate")) {
          console.error(`Suspend error for ${userId}:`, suspError);
          results.failed.push(userId);
          continue;
        }

        // Update energy status
        await supabase
          .from("user_energy_status")
          .update({
            approval_status: "rejected",
            rejection_reason: defaultReason,
            rejected_at: new Date().toISOString(),
            rejected_by: adminUser.id,
          })
          .eq("user_id", userId);

        // Send healing message
        await supabase.from("healing_messages").insert({
          user_id: userId,
          message_type: "healing",
          title: "🚫 Thông Báo Từ Angel AI",
          content: defaultHealingMessage,
          triggered_by: "admin_bulk_suspension",
        });

        // Mark fraud alert as actioned
        await supabase
          .from("fraud_alerts")
          .update({ is_reviewed: true, reviewed_by: adminUser.id, reviewed_at: new Date().toISOString(), action_taken: "banned" })
          .eq("user_id", userId);

        results.banned.push(userId);
      } catch (e) {
        console.error(`Error processing ${userId}:`, e);
        results.failed.push(userId);
      }
    }

    // Reject all pending withdrawals for these users
    if (rejectWithdrawals !== false) {
      const { data: rejectedWDs } = await supabase
        .from("coin_withdrawals")
        .update({
          status: "failed",
          admin_notes: "Từ chối - Tài khoản bị ban vĩnh viễn do sybil farming",
          processed_at: new Date().toISOString(),
          processed_by: adminUser.id,
        })
        .in("user_id", userIds)
        .eq("status", "pending")
        .select("id");

      results.withdrawalsRejected = rejectedWDs?.length || 0;
    }

    return new Response(
      JSON.stringify({
        success: true,
        banned_count: results.banned.length,
        failed_count: results.failed.length,
        withdrawals_rejected: results.withdrawalsRejected,
        details: results,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Bulk suspend error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
