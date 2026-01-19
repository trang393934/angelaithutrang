import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple hash function for duplicate detection
function simpleHash(str: string): string {
  const normalized = str.toLowerCase().trim().replace(/\s+/g, ' ');
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

// Greeting patterns
const GREETING_PATTERNS = [
  /^(xin chào|chào|hello|hi|hey|hola|bonjour|안녕|こんにちは)/i,
  /^(chào buổi sáng|chào buổi chiều|chào buổi tối|good morning|good afternoon|good evening)/i,
  /^(cảm ơn|thank you|thanks|merci)/i,
  /^(tạm biệt|bye|goodbye|see you)/i,
  /^(alo|alô|ơi|ê|này)/i,
];

function isGreeting(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 30) {
    for (const pattern of GREETING_PATTERNS) {
      if (pattern.test(trimmed)) return true;
    }
  }
  return false;
}

function isSpamOrLowQuality(text: string): boolean {
  const trimmed = text.trim();
  // Too short (less than 10 chars)
  if (trimmed.length < 10) return true;
  // Repeated characters
  if (/(.)\1{4,}/.test(trimmed)) return true;
  // Just numbers or special chars
  if (/^[\d\s\W]+$/.test(trimmed)) return true;
  // Too many repeated words
  const words = trimmed.toLowerCase().split(/\s+/);
  const uniqueWords = new Set(words);
  if (words.length > 3 && uniqueWords.size / words.length < 0.3) return true;
  return false;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, questionText, aiResponse } = await req.json();

    if (!userId || !questionText) {
      return new Response(
        JSON.stringify({ error: "Missing userId or questionText" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check rate limits first
    const { data: rateLimit } = await supabase
      .from("user_rate_limits")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (rateLimit?.is_temp_banned && rateLimit.temp_ban_until) {
      const banUntil = new Date(rateLimit.temp_ban_until);
      if (banUntil > new Date()) {
        return new Response(
          JSON.stringify({ 
            rewarded: false, 
            reason: "temp_banned",
            message: `Tài khoản tạm khóa đến ${banUntil.toLocaleString('vi-VN')}`,
            coins: 0 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Check questions in last hour (anti-abuse)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: questionsLastHour } = await supabase
      .from("chat_questions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", oneHourAgo);

    if ((questionsLastHour || 0) >= 50) {
      // Temp ban for 24 hours
      await supabase
        .from("user_rate_limits")
        .upsert({
          user_id: userId,
          is_temp_banned: true,
          temp_ban_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          ban_reason: "Quá nhiều câu hỏi trong 1 giờ (>50)",
          suspicious_activity_count: (rateLimit?.suspicious_activity_count || 0) + 1,
          questions_last_hour: questionsLastHour,
          last_question_at: new Date().toISOString(),
        });

      return new Response(
        JSON.stringify({ 
          rewarded: false, 
          reason: "rate_limited",
          message: "Bạn đã gửi quá nhiều câu hỏi. Vui lòng thử lại sau 24 giờ.",
          coins: 0 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update rate limit tracking
    await supabase
      .from("user_rate_limits")
      .upsert({
        user_id: userId,
        questions_last_hour: questionsLastHour || 0,
        last_question_at: new Date().toISOString(),
      });

    // Get daily reward status
    const { data: dailyStatus } = await supabase
      .rpc("get_daily_reward_status", { _user_id: userId });

    const questionsRemaining = dailyStatus?.[0]?.questions_remaining ?? 10;

    // Generate question hash
    const questionHash = simpleHash(questionText);

    // Check for duplicate in today's rewards
    const { data: todayTracking } = await supabase
      .from("daily_reward_tracking")
      .select("question_hashes")
      .eq("user_id", userId)
      .eq("reward_date", new Date().toISOString().split('T')[0])
      .maybeSingle();

    const isDuplicate = todayTracking?.question_hashes?.includes(questionHash);

    // Check if greeting or spam
    const _isGreeting = isGreeting(questionText);
    const _isSpam = isSpamOrLowQuality(questionText);

    // Save the question record
    const { data: questionRecord, error: insertError } = await supabase
      .from("chat_questions")
      .insert({
        user_id: userId,
        question_text: questionText,
        question_hash: questionHash,
        is_greeting: _isGreeting,
        is_spam: _isSpam,
        ai_response_preview: aiResponse?.substring(0, 200),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting question:", insertError);
    }

    // Determine if eligible for reward
    if (questionsRemaining <= 0) {
      return new Response(
        JSON.stringify({ 
          rewarded: false, 
          reason: "daily_limit_reached",
          message: "Bạn đã đạt giới hạn 10 câu hỏi được thưởng hôm nay. Hãy quay lại vào ngày mai! 🌟",
          coins: 0,
          questionId: questionRecord?.id
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (isDuplicate) {
      return new Response(
        JSON.stringify({ 
          rewarded: false, 
          reason: "duplicate",
          message: "Câu hỏi này đã được thưởng trước đó.",
          coins: 0,
          questionId: questionRecord?.id
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (_isGreeting) {
      return new Response(
        JSON.stringify({ 
          rewarded: false, 
          reason: "greeting",
          message: "Lời chào không được tính điểm thưởng.",
          coins: 0,
          questionId: questionRecord?.id
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (_isSpam) {
      return new Response(
        JSON.stringify({ 
          rewarded: false, 
          reason: "low_quality",
          message: "Câu hỏi chưa đủ chất lượng để nhận thưởng.",
          coins: 0,
          questionId: questionRecord?.id
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use AI to analyze purity score
    let purityScore = 0.5; // Default middle score
    let rewardAmount = 2000; // Default reward

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
                content: `Bạn là hệ thống đánh giá "Tâm Thuần Khiết" của Angel AI. 
Phân tích câu hỏi của người dùng và trả về JSON với:
- purity_score: điểm từ 0.0 đến 1.0 (1.0 = tâm rất thuần khiết, sâu sắc, chân thành)
- reasoning: lý do ngắn gọn (1 câu)

Tiêu chí đánh giá:
- 0.8-1.0: Câu hỏi sâu sắc về tâm linh, tình yêu vô điều kiện, giác ngộ, giúp đỡ người khác
- 0.6-0.8: Câu hỏi chân thành về cuộc sống, mối quan hệ, phát triển bản thân
- 0.4-0.6: Câu hỏi thông thường, tò mò, tìm hiểu
- 0.2-0.4: Câu hỏi có tính ích kỷ, tiêu cực nhẹ
- 0.0-0.2: Câu hỏi tiêu cực, hận thù, bạo lực

Trả về CHÍNH XÁC JSON format: {"purity_score": 0.X, "reasoning": "..."}`
              },
              {
                role: "user",
                content: questionText
              }
            ],
            temperature: 0.3,
          }),
        });

        if (analysisResponse.ok) {
          const analysisData = await analysisResponse.json();
          const content = analysisData.choices?.[0]?.message?.content || "";
          
          // Parse JSON from response
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            purityScore = Math.max(0, Math.min(1, parsed.purity_score || 0.5));
          }
        }
      } catch (aiError) {
        console.error("AI analysis error:", aiError);
      }
    }

    // Calculate reward based on purity score
    if (purityScore >= 0.9) {
      rewardAmount = 5000;
    } else if (purityScore >= 0.75) {
      rewardAmount = 4000;
    } else if (purityScore >= 0.6) {
      rewardAmount = 3000;
    } else if (purityScore >= 0.4) {
      rewardAmount = 2000;
    } else {
      rewardAmount = 1000;
    }

    // Update question with purity score and reward
    await supabase
      .from("chat_questions")
      .update({
        purity_score: purityScore,
        reward_amount: rewardAmount,
        is_rewarded: true,
      })
      .eq("id", questionRecord?.id);

    // Update daily tracking
    const existingHashes = todayTracking?.question_hashes || [];
    await supabase
      .from("daily_reward_tracking")
      .upsert({
        user_id: userId,
        reward_date: new Date().toISOString().split('T')[0],
        questions_rewarded: (dailyStatus?.[0]?.questions_rewarded || 0) + 1,
        question_hashes: [...existingHashes, questionHash],
      });

    // Add Camly coins
    const { data: newBalance } = await supabase.rpc("add_camly_coins", {
      _user_id: userId,
      _amount: rewardAmount,
      _transaction_type: "chat_reward",
      _description: `Thưởng câu hỏi thuần khiết (${Math.round(purityScore * 100)}%)`,
      _purity_score: purityScore,
      _metadata: { question_id: questionRecord?.id }
    });

    return new Response(
      JSON.stringify({
        rewarded: true,
        coins: rewardAmount,
        purityScore,
        newBalance,
        questionsRemaining: questionsRemaining - 1,
        message: `+${rewardAmount.toLocaleString()} Camly Coin! Tâm thuần khiết ${Math.round(purityScore * 100)}% ✨`,
        questionId: questionRecord?.id
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Analyze reward error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
