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
    console.log(`Processing journal reward for authenticated user: ${userId}`);

    // Get content and journalType from body (NOT userId)
    const { content, journalType } = await req.json();

    if (!content || !journalType) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role for database operations
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check if it's after 8pm Vietnam time
    const vietnamTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" });
    const currentHour = new Date(vietnamTime).getHours();

    if (currentHour < 20) {
      return new Response(
        JSON.stringify({ 
          rewarded: false, 
          reason: "not_evening",
          message: "Nhật ký biết ơn và sám hối chỉ mở sau 20:00 (8 giờ tối). Hãy quay lại sau! 🌙",
          coins: 0 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get today's date in Vietnam timezone
    const todayDate = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });

    // CRITICAL: Count directly from gratitude_journal table to enforce limit
    const { count: todayJournalCount, error: countError } = await supabase
      .from("gratitude_journal")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("journal_date", todayDate)
      .eq("is_rewarded", true);

    if (countError) {
      console.error("Error counting journals:", countError);
    }

    const currentJournalCount = todayJournalCount || 0;
    const MAX_JOURNALS_PER_DAY = 3;
    const journalsRemaining = MAX_JOURNALS_PER_DAY - currentJournalCount;

    console.log(`User ${userId} has written ${currentJournalCount} journals today, remaining: ${journalsRemaining}`);

    if (journalsRemaining <= 0) {
      return new Response(
        JSON.stringify({ 
          rewarded: false, 
          reason: "daily_limit_reached",
          message: "Bạn đã viết đủ 3 bài nhật ký hôm nay. Hãy quay lại vào ngày mai! 📝",
          coins: 0,
          journalsToday: currentJournalCount,
          limit: MAX_JOURNALS_PER_DAY
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check content length
    const contentLength = content.trim().length;
    if (contentLength < 50) {
      return new Response(
        JSON.stringify({ 
          rewarded: false, 
          reason: "too_short",
          message: "Bài viết cần ít nhất 50 ký tự để nhận thưởng. Hãy chia sẻ nhiều hơn! 💭",
          coins: 0 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use AI to analyze purity score
    let purityScore = 0.5;
    let rewardAmount = 5000; // Default minimum

    if (LOVABLE_API_KEY) {
      try {
        const analysisResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              {
                role: "system",
                content: `Bạn là hệ thống đánh giá nhật ký của Angel AI.
Loại nhật ký: ${journalType === 'gratitude' ? 'Biết Ơn' : 'Sám Hối'}

Phân tích bài viết và trả về JSON với:
- purity_score: điểm từ 0.0 đến 1.0
- reasoning: lý do ngắn gọn

Tiêu chí đánh giá:
- 0.8-1.0: Bài viết sâu sắc, chân thành, thể hiện sự giác ngộ và thay đổi tích cực
- 0.6-0.8: Bài viết chân thành, có ý nghĩa, thể hiện sự biết ơn/sám hối thật lòng
- 0.4-0.6: Bài viết bình thường, có nội dung nhưng chưa sâu sắc
- 0.2-0.4: Bài viết hời hợt, viết cho có
- 0.0-0.2: Bài viết spam, không liên quan

Trả về CHÍNH XÁC JSON: {"purity_score": 0.X, "reasoning": "..."}`
              },
              {
                role: "user",
                content: content
              }
            ],
            temperature: 0.3,
          }),
        });

        if (analysisResponse.ok) {
          const analysisData = await analysisResponse.json();
          const responseContent = analysisData.choices?.[0]?.message?.content || "";
          
          const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            purityScore = Math.max(0, Math.min(1, parsed.purity_score || 0.5));
          }
        }
      } catch (aiError) {
        console.error("AI analysis error:", aiError);
      }
    }

    // Calculate reward based on content length and purity score
    // Base reward: 5000 (short) to 9000 (long)
    let lengthMultiplier = 1;
    if (contentLength >= 500) {
      lengthMultiplier = 1.8; // Long entry
    } else if (contentLength >= 300) {
      lengthMultiplier = 1.4; // Medium entry
    } else if (contentLength >= 150) {
      lengthMultiplier = 1.0; // Short entry
    } else {
      lengthMultiplier = 0.7; // Very short
    }

    // Combine length and purity
    const baseReward = 5000;
    rewardAmount = Math.round(baseReward * lengthMultiplier * (0.5 + purityScore * 0.5));
    
    // Cap at 9000
    rewardAmount = Math.min(9000, Math.max(5000, rewardAmount));

    // Save journal entry - use todayDate for consistency
    const { data: journalRecord, error: insertError } = await supabase
      .from("gratitude_journal")
      .insert({
        user_id: userId,
        journal_type: journalType,
        content: content,
        content_length: contentLength,
        purity_score: purityScore,
        reward_amount: rewardAmount,
        is_rewarded: true,
        journal_date: todayDate,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting journal:", insertError);
      throw insertError;
    }

    // Update daily tracking - use currentJournalCount + 1 (the new one just added)
    const newJournalCount = currentJournalCount + 1;
    await supabase
      .from("daily_reward_tracking")
      .upsert({
        user_id: userId,
        reward_date: todayDate,
        journals_rewarded: newJournalCount,
      }, {
        onConflict: 'user_id,reward_date'
      });

    // Add Camly coins
    const { data: newBalance } = await supabase.rpc("add_camly_coins", {
      _user_id: userId,
      _amount: rewardAmount,
      _transaction_type: "journal_reward",
      _description: `Nhật ký ${journalType === 'gratitude' ? 'Biết Ơn' : 'Sám Hối'} (${Math.round(purityScore * 100)}%)`,
      _purity_score: purityScore,
      _metadata: { journal_id: journalRecord?.id, content_length: contentLength }
    });

    // Calculate remaining after this journal
    const remainingAfterThis = MAX_JOURNALS_PER_DAY - newJournalCount;

    return new Response(
      JSON.stringify({
        rewarded: true,
        coins: rewardAmount,
        purityScore,
        newBalance,
        journalsRemaining: remainingAfterThis,
        journalsToday: newJournalCount,
        limit: MAX_JOURNALS_PER_DAY,
        message: `+${rewardAmount.toLocaleString()} Camly Coin! Tâm thuần khiết ${Math.round(purityScore * 100)}% 📝✨`,
        journalId: journalRecord?.id
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Analyze journal error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});