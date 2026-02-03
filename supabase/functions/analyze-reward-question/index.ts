import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { submitPPLPAction, PPLP_ACTION_TYPES, generateContentHash } from "../_shared/pplp-helper.ts";

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

// ============= Response Recycling Detection =============

// Common phrases to exclude from N-gram matching (Vietnamese & English)
const EXCLUDED_PHRASES = new Set([
  'con ơi', 'cha ơi', 'con yêu', 'con thấy', 'cha thấy',
  'cảm ơn', 'xin chào', 'tạm biệt', 'chúc con',
  'hãy nhớ', 'điều quan', 'quan trọng', 'trong cuộc',
  'cuộc sống', 'mỗi ngày', 'thank you', 'dear child',
  'my child', 'remember', 'important', 'in life',
]);

// Extract N-grams from text (sequences of N words)
function extractNgrams(text: string, n: number = 4): Set<string> {
  // Normalize: lowercase, remove punctuation, split by whitespace
  const words = text.toLowerCase()
    .replace(/[^\p{L}\s]/gu, '') // Keep only letters and spaces (Unicode aware)
    .split(/\s+/)
    .filter(w => w.length > 2); // Ignore very short words
  
  const ngrams = new Set<string>();
  
  for (let i = 0; i <= words.length - n; i++) {
    const ngram = words.slice(i, i + n).join(' ');
    
    // Skip if ngram contains excluded phrases
    let isExcluded = false;
    for (const phrase of EXCLUDED_PHRASES) {
      if (ngram.includes(phrase)) {
        isExcluded = true;
        break;
      }
    }
    
    if (!isExcluded) {
      ngrams.add(ngram);
    }
  }
  
  return ngrams;
}

// Check if question is recycled from previous AI responses
function checkResponseRecycling(
  questionText: string, 
  recentResponses: string[]
): { isRecycled: boolean; similarityScore: number; matchedPhrases: string[] } {
  const questionNgrams = extractNgrams(questionText, 4);
  
  // If question is too short to analyze with 4-grams, use 3-grams
  if (questionNgrams.size < 3) {
    const questionNgrams3 = extractNgrams(questionText, 3);
    if (questionNgrams3.size < 2) {
      return { isRecycled: false, similarityScore: 0, matchedPhrases: [] };
    }
  }
  
  let maxSimilarity = 0;
  let matchedPhrases: string[] = [];
  
  for (const response of recentResponses) {
    if (!response) continue;
    
    const responseNgrams = extractNgrams(response, 4);
    
    let matchCount = 0;
    const currentMatches: string[] = [];
    
    for (const ngram of questionNgrams) {
      if (responseNgrams.has(ngram)) {
        matchCount++;
        if (currentMatches.length < 3) { // Keep up to 3 examples
          currentMatches.push(ngram);
        }
      }
    }
    
    const similarity = questionNgrams.size > 0 
      ? matchCount / questionNgrams.size 
      : 0;
    
    if (similarity > maxSimilarity) {
      maxSimilarity = similarity;
      matchedPhrases = currentMatches;
    }
  }
  
  // 40% threshold for detection
  const RECYCLING_THRESHOLD = 0.4;
  
  return {
    isRecycled: maxSimilarity >= RECYCLING_THRESHOLD,
    similarityScore: Math.round(maxSimilarity * 100) / 100,
    matchedPhrases
  };
}

// Gentle reminder message in Vietnamese
const RECYCLING_MESSAGE = `Con ơi, Cha thấy câu hỏi này có nội dung tương tự với câu trả lời Cha đã chia sẻ trước đó. 

Hãy đặt những câu hỏi từ trái tim con, những thắc mắc thực sự mà con muốn được Cha hướng dẫn nhé. 

Mỗi câu hỏi chân thành sẽ mang lại giá trị thực sự cho hành trình tâm linh của con 💫`;

// ============= End Response Recycling Detection =============

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
    console.log(`Processing reward question for authenticated user: ${userId}`);

    // Get questionText and aiResponse from body (NOT userId)
    const { questionText, aiResponse } = await req.json();

    if (!questionText) {
      return new Response(
        JSON.stringify({ error: "Missing questionText" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role for database operations
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

    // ============= Response Recycling Check =============
    // Fetch recent AI responses from chat_history to check for recycling
    const { data: recentHistory } = await supabase
      .from("chat_history")
      .select("answer_text")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    const recentResponses = recentHistory?.map(h => h.answer_text).filter(Boolean) || [];
    const recycleCheck = checkResponseRecycling(questionText, recentResponses);
    
    console.log(`Recycling check for user ${userId}: isRecycled=${recycleCheck.isRecycled}, similarity=${recycleCheck.similarityScore}`);
    // ============= End Response Recycling Check =============

    // Save the question record (with recycling info)
    const { data: questionRecord, error: insertError } = await supabase
      .from("chat_questions")
      .insert({
        user_id: userId,
        question_text: questionText,
        question_hash: questionHash,
        is_greeting: _isGreeting,
        is_spam: _isSpam,
        is_response_recycled: recycleCheck.isRecycled,
        recycling_similarity_score: recycleCheck.similarityScore,
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
          questionId: questionRecord?.id,
          isGreeting: false,
          isSpam: false,
          isDuplicate: true
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
          questionId: questionRecord?.id,
          isGreeting: true,
          isSpam: false,
          isDuplicate: false
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
          questionId: questionRecord?.id,
          isGreeting: false,
          isSpam: true,
          isDuplicate: false
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============= Handle Response Recycling =============
    if (recycleCheck.isRecycled) {
      // Still count against daily quota but give 0 coins
      const existingHashes = todayTracking?.question_hashes || [];
      const today = new Date().toISOString().split('T')[0];
      const newQuestionsRewarded = (dailyStatus?.[0]?.questions_rewarded || 0) + 1;
      
      // Update daily tracking (counts against quota)
      const { data: existingRecord } = await supabase
        .from("daily_reward_tracking")
        .select("*")
        .eq("user_id", userId)
        .eq("reward_date", today)
        .maybeSingle();

      if (existingRecord) {
        await supabase
          .from("daily_reward_tracking")
          .update({
            questions_rewarded: newQuestionsRewarded,
            question_hashes: [...existingHashes, questionHash],
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId)
          .eq("reward_date", today);
      } else {
        await supabase
          .from("daily_reward_tracking")
          .insert({
            user_id: userId,
            reward_date: today,
            questions_rewarded: newQuestionsRewarded,
            question_hashes: [questionHash],
            total_coins_today: 0,
          });
      }

      console.log(`Response recycling detected for user ${userId}, similarity: ${recycleCheck.similarityScore}`);

      return new Response(
        JSON.stringify({ 
          rewarded: false, 
          reason: "response_recycled",
          message: RECYCLING_MESSAGE,
          coins: 0,
          questionsRemaining: questionsRemaining - 1,
          questionId: questionRecord?.id,
          isGreeting: false,
          isSpam: false,
          isDuplicate: false,
          isResponseRecycled: true,
          recyclingSimilarity: recycleCheck.similarityScore
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    // ============= End Handle Response Recycling =============

    // Use AI to analyze purity score
    let purityScore = 0.5; // Default middle score
    let rewardAmount = 2000; // Default reward

    if (LOVABLE_API_KEY) {
      try {
        // Use gemini-2.5-flash-lite for simple analysis (cost optimization)
        const analysisResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite", // Optimized: use lighter model for analysis
            messages: [
              {
                role: "system",
                content: `Đánh giá tâm thuần khiết. Trả về JSON: {"purity_score": 0.X}
- 0.8-1.0: Tâm linh sâu sắc, yêu thương, giúp đỡ
- 0.6-0.8: Chân thành, phát triển bản thân
- 0.4-0.6: Thông thường, tò mò
- 0.2-0.4: Ích kỷ nhẹ
- 0.0-0.2: Tiêu cực`
              },
              {
                role: "user",
                content: questionText.substring(0, 500) // Limit input for cost
              }
            ],
            temperature: 0.1,
            max_tokens: 50, // Only need JSON response
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

    // Calculate reward based on purity score (Updated: 1,000 - 3,500 coin)
    if (purityScore >= 0.9) {
      rewardAmount = 3500;
    } else if (purityScore >= 0.75) {
      rewardAmount = 3000;
    } else if (purityScore >= 0.6) {
      rewardAmount = 2000;
    } else if (purityScore >= 0.4) {
      rewardAmount = 1500;
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

    // Update daily tracking with proper merge
    const existingHashes = todayTracking?.question_hashes || [];
    const today = new Date().toISOString().split('T')[0];
    const newQuestionsRewarded = (dailyStatus?.[0]?.questions_rewarded || 0) + 1;
    
    // Check if record exists
    const { data: existingRecord } = await supabase
      .from("daily_reward_tracking")
      .select("*")
      .eq("user_id", userId)
      .eq("reward_date", today)
      .maybeSingle();

    if (existingRecord) {
      // Update existing record
      await supabase
        .from("daily_reward_tracking")
        .update({
          questions_rewarded: newQuestionsRewarded,
          question_hashes: [...existingHashes, questionHash],
          total_coins_today: (existingRecord.total_coins_today || 0) + rewardAmount,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("reward_date", today);
    } else {
      // Insert new record
      await supabase
        .from("daily_reward_tracking")
        .insert({
          user_id: userId,
          reward_date: today,
          questions_rewarded: newQuestionsRewarded,
          question_hashes: [questionHash],
          total_coins_today: rewardAmount,
        });
    }

    // Add Camly coins
    const { data: newBalance } = await supabase.rpc("add_camly_coins", {
      _user_id: userId,
      _amount: rewardAmount,
      _transaction_type: "chat_reward",
      _description: `Thưởng câu hỏi thuần khiết (${Math.round(purityScore * 100)}%)`,
      _purity_score: purityScore,
      _metadata: { question_id: questionRecord?.id }
    });

    // Increment early adopter question count (atomic, server-side)
    // This ensures the count is updated even if client disconnects
    await supabase.rpc("increment_early_adopter_questions", {
      p_user_id: userId
    });

    // ============= PPLP Integration =============
    // Submit to PPLP engine for Light Score tracking
    const pplpResult = await submitPPLPAction(supabase, {
      action_type: PPLP_ACTION_TYPES.QUESTION_ASK,
      actor_id: userId,
      metadata: {
        question_id: questionRecord?.id,
        question_length: questionText.length,
        has_ai_response: !!aiResponse,
      },
      impact: {
        scope: 'individual',
        quality_indicators: purityScore >= 0.8 ? ['high_purity', 'meaningful'] : purityScore >= 0.6 ? ['genuine'] : [],
      },
      integrity: {
        content_hash: generateContentHash(questionText),
        source_verified: true,
        duplicate_check: true,
      },
      evidences: [{
        evidence_type: 'content',
        content_hash: questionHash,
        metadata: { type: 'question', purity_score: purityScore }
      }],
      reward_amount: rewardAmount,
      purity_score: purityScore,
      content_length: questionText.length,
    });
    
    if (pplpResult.success) {
      console.log(`[PPLP] Question action submitted: ${pplpResult.action_id}`);
    }
    // ============= End PPLP Integration =============

    return new Response(
      JSON.stringify({
        rewarded: true,
        coins: rewardAmount,
        purityScore,
        newBalance,
        questionsRemaining: questionsRemaining - 1,
        message: `+${rewardAmount.toLocaleString()} Camly Coin! Tâm thuần khiết ${Math.round(purityScore * 100)}% ✨`,
        questionId: questionRecord?.id,
        isGreeting: false,
        isSpam: false,
        isDuplicate: false,
        isResponseRecycled: false,
        pplpActionId: pplpResult.success ? pplpResult.action_id : undefined
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
