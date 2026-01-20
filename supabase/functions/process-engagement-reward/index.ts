import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LIKES_THRESHOLD = 10;
const ENGAGEMENT_REWARD = 500;

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

    const likerId = claims.user.id;
    console.log(`Processing engagement for authenticated user: ${likerId}`);

    // Get questionId from body (NOT likerId)
    const { questionId } = await req.json();

    if (!questionId) {
      return new Response(
        JSON.stringify({ error: "Missing questionId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role for database operations
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check if user already liked this question
    const { data: existingLike } = await supabase
      .from("question_likes")
      .select("id")
      .eq("question_id", questionId)
      .eq("user_id", likerId)
      .maybeSingle();

    if (existingLike) {
      // Unlike - remove the like
      await supabase
        .from("question_likes")
        .delete()
        .eq("question_id", questionId)
        .eq("user_id", likerId);

      // Decrement likes count
      const { data: question } = await supabase
        .from("chat_questions")
        .select("likes_count")
        .eq("id", questionId)
        .single();

      await supabase
        .from("chat_questions")
        .update({ likes_count: Math.max(0, (question?.likes_count || 1) - 1) })
        .eq("id", questionId);

      return new Response(
        JSON.stringify({ 
          liked: false, 
          message: "Đã bỏ thích câu hỏi" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Add new like
    const { error: likeError } = await supabase
      .from("question_likes")
      .insert({ question_id: questionId, user_id: likerId });

    if (likeError) {
      console.error("Like error:", likeError);
      throw likeError;
    }

    // Get question details and update likes count
    const { data: question } = await supabase
      .from("chat_questions")
      .select("id, user_id, likes_count, is_rewarded")
      .eq("id", questionId)
      .single();

    if (!question) {
      throw new Error("Question not found");
    }

    const newLikesCount = (question.likes_count || 0) + 1;

    await supabase
      .from("chat_questions")
      .update({ likes_count: newLikesCount })
      .eq("id", questionId);

    // Check if threshold reached and not already rewarded for engagement
    let engagementRewarded = false;
    if (newLikesCount >= LIKES_THRESHOLD) {
      // Check if engagement reward already given
      const { data: existingReward } = await supabase
        .from("camly_coin_transactions")
        .select("id")
        .eq("transaction_type", "engagement_reward")
        .contains("metadata", { question_id: questionId })
        .maybeSingle();

      if (!existingReward) {
        // Award engagement reward to question author
        await supabase.rpc("add_camly_coins", {
          _user_id: question.user_id,
          _amount: ENGAGEMENT_REWARD,
          _transaction_type: "engagement_reward",
          _description: `Câu hỏi đạt ${newLikesCount} lượt thích! 🎉`,
          _purity_score: null,
          _metadata: { question_id: questionId, likes_count: newLikesCount }
        });

        engagementRewarded = true;

        // Send notification to question author (via healing_messages)
        await supabase
          .from("healing_messages")
          .insert({
            user_id: question.user_id,
            title: "🎉 Câu hỏi của bạn được yêu thích!",
            content: `Câu hỏi của bạn đã nhận được ${newLikesCount} lượt thích từ cộng đồng! Bạn nhận được ${ENGAGEMENT_REWARD} Camly Coin như phần thưởng cho sự đóng góp tích cực. Tiếp tục chia sẻ những câu hỏi hay nhé! 💫`,
            message_type: "reward",
            triggered_by: "engagement_system",
          });
      }
    }

    return new Response(
      JSON.stringify({ 
        liked: true, 
        likesCount: newLikesCount,
        engagementRewarded,
        message: engagementRewarded 
          ? `+${ENGAGEMENT_REWARD} Camly Coin cho tác giả! 🎉` 
          : "Đã thích câu hỏi ❤️"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Process engagement error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});