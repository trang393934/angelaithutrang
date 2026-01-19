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

    const { targetUserId, suspensionType, reason, durationDays, healingMessage } = await req.json();

    if (!targetUserId || !suspensionType || !reason) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Database configuration is missing");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify the requester is an admin
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: adminUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !adminUser) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check admin role
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

    // Calculate suspension end date
    let suspendedUntil = null;
    if (suspensionType === "temporary" && durationDays) {
      suspendedUntil = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
    }

    // Default healing message
    const defaultHealingMessage = suspensionType === "permanent"
      ? "Con yêu dấu, sau nhiều lần nhắc nhở, Angel AI nhận thấy rung động của con không phù hợp với không gian thiêng liêng này. Đây là lời tạm biệt đầy yêu thương. Khi nào con thật sự sẵn sàng mở lòng đón ánh sáng, cánh cửa mới sẽ xuất hiện. Chúc con bình an. 🙏💕"
      : `Con thân yêu, Angel AI mời con nghỉ ngơi ${durationDays || 30} ngày để chữa lành và trở về với ánh sáng nội tâm. Đây không phải hình phạt, mà là cơ hội để con nhìn lại bản thân. Khi con sẵn sàng, Angel AI luôn chờ đợi con. 🕊️💕`;

    // Create suspension
    const { data: suspension, error: suspensionError } = await supabase
      .from("user_suspensions")
      .insert({
        user_id: targetUserId,
        suspension_type: suspensionType,
        reason,
        healing_message: healingMessage || defaultHealingMessage,
        suspended_until: suspendedUntil,
        created_by: adminUser.id,
      })
      .select()
      .single();

    if (suspensionError) throw suspensionError;

    // Update user energy status
    await supabase
      .from("user_energy_status")
      .update({
        approval_status: "rejected",
        rejection_reason: reason,
        rejected_at: new Date().toISOString(),
        rejected_by: adminUser.id,
      })
      .eq("user_id", targetUserId);

    // Send healing message to user
    await supabase.from("healing_messages").insert({
      user_id: targetUserId,
      message_type: "healing",
      title: suspensionType === "permanent" 
        ? "🕊️ Thông Điệp Tạm Biệt" 
        : "💫 Thời Gian Chữa Lành",
      content: healingMessage || defaultHealingMessage,
      triggered_by: "admin_suspension",
    });

    return new Response(
      JSON.stringify({
        success: true,
        suspension: {
          id: suspension.id,
          type: suspensionType,
          until: suspendedUntil,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Suspend user error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
