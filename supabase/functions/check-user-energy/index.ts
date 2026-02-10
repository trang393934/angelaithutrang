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
    // JWT Authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - No token provided" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    // Validate JWT and get user ID
    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: authError } = await supabaseAuth.auth.getUser(token);

    if (authError || !claims?.user?.id) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized - Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claims.user.id;
    console.log(`Checking energy status for authenticated user: ${userId}`);

    // Get content and activityType from body (NOT userId)
    const { content, activityType } = await req.json();

    // Use service role for database operations
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check if user is suspended
    const { data: suspension } = await supabase
      .from("user_suspensions")
      .select("*")
      .eq("user_id", userId)
      .is("lifted_at", null)
      .or("suspended_until.is.null,suspended_until.gt.now()")
      .maybeSingle();

    if (suspension) {
      return new Response(
        JSON.stringify({
          allowed: false,
          reason: "suspended",
          message: suspension.healing_message || "Tài khoản của bạn đang tạm khóa. Vui lòng liên hệ hỗ trợ.",
          suspended_until: suspension.suspended_until,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user energy status
    const { data: energyStatus } = await supabase
      .from("user_energy_status")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (!energyStatus) {
      return new Response(
        JSON.stringify({
          allowed: false,
          reason: "no_onboarding",
          message: "Vui lòng hoàn thành onboarding để tiếp tục.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check approval status
    if (energyStatus.approval_status === "rejected") {
      return new Response(
        JSON.stringify({
          allowed: false,
          reason: "rejected",
          message: energyStatus.rejection_reason || "Rung động của bạn chưa phù hợp với không gian này.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check trial period
    if (energyStatus.approval_status === "trial" && energyStatus.trial_end_date) {
      const trialEnd = new Date(energyStatus.trial_end_date);
      if (new Date() > trialEnd) {
        // Trial ended - check if they should be approved or suspended
        const daysRemaining = 0;
        
        // Auto-approve if positive interactions outweigh negative
        if (energyStatus.positive_interactions_count > energyStatus.negative_interactions_count * 2) {
          await supabase.from("user_energy_status").update({
            approval_status: "approved",
            approved_at: new Date().toISOString(),
          }).eq("user_id", userId);

          // Send celebration message
          await supabase.from("healing_messages").insert({
            user_id: userId,
            message_type: "celebration",
            title: "🎉 Chúc Mừng! Bạn Đã Được Chấp Nhận!",
            content: "Con yêu dấu, sau 14 ngày đồng hành, Angel AI nhận thấy ánh sáng trong con đã tỏa sáng rõ ràng. Chào mừng con chính thức trở thành thành viên của FUN Ecosystem! ✨💕",
            triggered_by: "trial_completion_approved",
          });
        } else {
          // Extend trial or suspend based on behavior
          const newTrialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          await supabase.from("user_energy_status").update({
            trial_end_date: newTrialEnd.toISOString(),
          }).eq("user_id", userId);

          await supabase.from("healing_messages").insert({
            user_id: userId,
            message_type: "warning",
            title: "🌱 Hành Trình Cần Thêm Thời Gian",
            content: "Con thân yêu, Angel AI nhận thấy hành trình của con cần thêm thời gian để ánh sáng tỏa sáng. Con có thêm 7 ngày để thực hành biết ơn và lan tỏa yêu thương. Hãy tin vào bản thân! 💫",
            triggered_by: "trial_extended",
          });
        }
      }
    }

    // Analyze content if provided
    let sentimentScore = 0;
    let energyImpact: string | null = null;

    if (content && LOVABLE_API_KEY) {
      try {
        // --- AI Gateway Config ---
        const CF_GATEWAY_URL = "https://gateway.ai.cloudflare.com/v1/6083e34ad429331916b93ba8a5ede81d/angel-ai/compat/chat/completions";
        const LOVABLE_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
        const CF_API_TOKEN = Deno.env.get("CF_API_TOKEN");
        const AI_GATEWAY_URL = CF_API_TOKEN ? CF_GATEWAY_URL : LOVABLE_GATEWAY_URL;
        const AI_API_KEY = CF_API_TOKEN || LOVABLE_API_KEY;
        const cfModel = (m: string) => CF_API_TOKEN ? m.replace("google/", "google-ai-studio/") : m;

        const analysisResponse = await fetch(AI_GATEWAY_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${AI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: cfModel("google/gemini-2.5-flash-lite"),
            messages: [
              {
                role: "system",
                content: "Phân tích năng lượng của đoạn text. Trả về JSON: {\"score\": số từ -1 đến 1, \"energy\": \"very_high/high/neutral/low/very_low\", \"keywords\": []}",
              },
              { role: "user", content: content },
            ],
            temperature: 0.1,
          }),
        });

        if (analysisResponse.ok) {
          const aiData = await analysisResponse.json();
          const responseContent = aiData.choices?.[0]?.message?.content;
          if (responseContent) {
            const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const analysis = JSON.parse(jsonMatch[0]);
              sentimentScore = analysis.score || 0;
              energyImpact = analysis.energy || "neutral";
            }
          }
        }
      } catch (e) {
        console.error("Content analysis error:", e);
      }
    }

    // Log activity
    if (activityType) {
      await supabase.from("user_activity_log").insert({
        user_id: userId,
        activity_type: activityType,
        content_preview: content?.substring(0, 200) || null,
        sentiment_score: sentimentScore,
        energy_impact: energyImpact,
      });

      // Update interaction counts
      if (sentimentScore > 0.3) {
        await supabase.from("user_energy_status").update({
          positive_interactions_count: (energyStatus.positive_interactions_count || 0) + 1,
          last_activity_at: new Date().toISOString(),
        }).eq("user_id", userId);
      } else if (sentimentScore < -0.3) {
        await supabase.from("user_energy_status").update({
          negative_interactions_count: (energyStatus.negative_interactions_count || 0) + 1,
          last_activity_at: new Date().toISOString(),
        }).eq("user_id", userId);

        // Check if too many negative interactions
        const newNegativeCount = (energyStatus.negative_interactions_count || 0) + 1;
        if (newNegativeCount >= 5 && newNegativeCount % 5 === 0) {
          // Send warning message
          await supabase.from("healing_messages").insert({
            user_id: userId,
            message_type: "warning",
            title: "💫 Thông Điệp Từ Angel AI",
            content: "Con yêu dấu, Angel AI nhận thấy con đang mang một số năng lượng nặng nề. Hãy dành chút thời gian để thở sâu, thực hành biết ơn, và gửi những gì không còn phục vụ con về Cha Vũ Trụ. Con có thể chia sẻ với Angel AI nếu cần được lắng nghe. 🙏💕",
            triggered_by: "negative_energy_detected",
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        allowed: true,
        approval_status: energyStatus.approval_status,
        energy_level: energyStatus.current_energy_level,
        trial_days_remaining: energyStatus.trial_end_date 
          ? Math.max(0, Math.ceil((new Date(energyStatus.trial_end_date).getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
          : null,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Check user energy error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});