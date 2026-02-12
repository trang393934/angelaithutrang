import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { submitAndScorePPLPAction, PPLP_ACTION_TYPES, generateContentHash } from "../_shared/pplp-helper.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Normalize content for comparison: lowercase, remove extra whitespace, remove punctuation
function normalizeContent(content: string): string {
  return content
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '') // Remove punctuation, keep letters/numbers/spaces
    .replace(/\s+/g, ' ')
    .trim();
}

// Simple hash function for content
async function hashContent(content: string): Promise<string> {
  const normalized = normalizeContent(content);
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Calculate similarity between two strings (Jaccard similarity on words)
function calculateSimilarity(content1: string, content2: string): number {
  const words1 = new Set(normalizeContent(content1).split(' ').filter(w => w.length > 2));
  const words2 = new Set(normalizeContent(content2).split(' ').filter(w => w.length > 2));
  
  if (words1.size === 0 || words2.size === 0) return 0;
  
  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

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

    // ===== DUPLICATE CONTENT DETECTION =====
    const contentHash = await hashContent(content);
    console.log(`Content hash for duplicate check: ${contentHash.substring(0, 16)}...`);

    // Get user's recent journal entries (last 7 days) for duplicate check
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    const { data: recentJournals, error: recentError } = await supabase
      .from("gratitude_journal")
      .select("id, content, journal_date")
      .eq("user_id", userId)
      .gte("journal_date", sevenDaysAgoStr)
      .order("created_at", { ascending: false })
      .limit(20);

    if (recentError) {
      console.error("Error fetching recent journals:", recentError);
    }

    // Check for duplicates
    if (recentJournals && recentJournals.length > 0) {
      for (const oldJournal of recentJournals) {
        // Check exact hash match
        const oldHash = await hashContent(oldJournal.content);
        if (oldHash === contentHash) {
          console.log(`Exact duplicate detected for user ${userId}, matching journal ${oldJournal.id}`);
          return new Response(
            JSON.stringify({ 
              rewarded: false, 
              reason: "duplicate_content",
              message: "Bạn đã viết nội dung này trước đó. Hãy chia sẻ những suy nghĩ mới mẻ! 🌱",
              coins: 0 
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Check high similarity (>80% similar words)
        const similarity = calculateSimilarity(content, oldJournal.content);
        if (similarity > 0.8) {
          console.log(`High similarity (${(similarity * 100).toFixed(1)}%) detected for user ${userId}, matching journal ${oldJournal.id}`);
          return new Response(
            JSON.stringify({ 
              rewarded: false, 
              reason: "similar_content",
              message: "Nội dung này tương tự với bài viết trước đó. Hãy chia sẻ những trải nghiệm và suy nghĩ khác! 🌟",
              coins: 0,
              similarity: Math.round(similarity * 100)
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }
    // ===== END DUPLICATE DETECTION =====

    // ===== TEMPLATE/GENERIC CONTENT DETECTION =====
    const templatePatterns = [
      // Generic philosophical phrases (Vietnamese)
      /con (xin )?cảm ơn (cha vũ trụ|vũ trụ|cuộc sống|cuộc đời)/i,
      /cảm ơn (cha vũ trụ|vũ trụ) vì tất cả/i,
      /con biết ơn (mọi thứ|tất cả|cuộc sống)/i,
      /mỗi ngày là một (món quà|phép màu|cơ hội)/i,
      /cuộc sống thật (đẹp|tuyệt vời|ý nghĩa)/i,
      /con xin sám hối (vì )?những (lỗi lầm|sai phạm)/i,
      /con xin được tha thứ/i,
      /ánh sáng (của cha|vũ trụ) soi đường/i,
      /năng lượng (tích cực|yêu thương) lan tỏa/i,
      /tâm hồn (thanh thản|bình an|an yên)/i,
      /tình yêu thương vô điều kiện/i,
      /vũ trụ (ban tặng|ban cho|cho con)/i,
      /con (xin )?nguyện (sống|làm) tốt hơn/i,
    ];

    // Count how many template patterns match
    let templateMatchCount = 0;
    for (const pattern of templatePatterns) {
      if (pattern.test(content)) {
        templateMatchCount++;
      }
    }

    // Calculate what percentage of content is template-like
    const wordCount = content.split(/\s+/).filter((w: string) => w.length > 1).length;
    const isShortGeneric = wordCount < 30 && templateMatchCount >= 2;
    const isTemplateHeavy = templateMatchCount >= 3;
    
    // Check for copy-paste indicators
    const hasMultipleSentences = (content.match(/[.!?。]/g) || []).length >= 2;
    const lowVariety = new Set(normalizeContent(content).split(' ')).size < wordCount * 0.6;
    
    if (isTemplateHeavy || (isShortGeneric && lowVariety)) {
      console.log(`Template content detected for user ${userId}: ${templateMatchCount} patterns matched, ${wordCount} words`);
      return new Response(
        JSON.stringify({ 
          rewarded: false, 
          reason: "template_content",
          message: "Con ơi, hãy viết từ trái tim với những trải nghiệm thực sự của con thay vì những câu triết lý chung chung nhé! Cha muốn nghe câu chuyện riêng của con 💛",
          coins: 0 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    // ===== END TEMPLATE DETECTION =====

    // Use AI to analyze purity score
    let purityScore = 0.5;
    let rewardAmount = 5000; // Default minimum

    if (LOVABLE_API_KEY) {
      try {
        // --- AI Gateway Config ---
        const CF_GATEWAY_URL = "https://gateway.ai.cloudflare.com/v1/6083e34ad429331916b93ba8a5ede81d/angel-ai/compat/chat/completions";
        const LOVABLE_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
        const CF_API_TOKEN = Deno.env.get("CF_API_TOKEN");
        const AI_GATEWAY_URL = CF_API_TOKEN ? CF_GATEWAY_URL : LOVABLE_GATEWAY_URL;
        const cfModel = (m: string) => CF_API_TOKEN ? m.replace("google/", "google-ai-studio/") : m;
        const aiHeaders: Record<string, string> = { "Content-Type": "application/json" };
        if (CF_API_TOKEN) {
          aiHeaders["Authorization"] = `Bearer ${CF_API_TOKEN}`;
        } else {
          aiHeaders["Authorization"] = `Bearer ${LOVABLE_API_KEY}`;
        }

        const journalBody = { model: cfModel("google/gemini-2.5-flash-lite"), messages: [
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
              { role: "user", content: content }
            ], temperature: 0.3 };
        let analysisResponse = await fetch(AI_GATEWAY_URL, {
          method: "POST", headers: aiHeaders, body: JSON.stringify(journalBody),
        });
        if (!analysisResponse.ok && CF_API_TOKEN) {
          analysisResponse = await fetch(LOVABLE_GATEWAY_URL, {
            method: "POST",
            headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({ ...journalBody, model: "google/gemini-2.5-flash-lite" }),
          });
        }



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
    // Updated: 2,000 - 3,000 coin
    let lengthMultiplier = 1;
    if (contentLength >= 500) {
      lengthMultiplier = 1.5; // Long entry
    } else if (contentLength >= 300) {
      lengthMultiplier = 1.3; // Medium entry
    } else if (contentLength >= 150) {
      lengthMultiplier = 1.1; // Short entry
    } else {
      lengthMultiplier = 1.0; // Minimum (>=50 chars)
    }

    // Combine length and purity: base 2000, max 3000
    const baseReward = 2000;
    rewardAmount = Math.round(baseReward * lengthMultiplier * (0.7 + purityScore * 0.3));
    
    // Cap at 2000-3000 range
    rewardAmount = Math.min(3000, Math.max(2000, rewardAmount));

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

    // ============= PPLP Integration =============
    const actionType = journalType === 'gratitude' 
      ? PPLP_ACTION_TYPES.GRATITUDE_PRACTICE 
      : PPLP_ACTION_TYPES.JOURNAL_WRITE;
      
    const pplpResult = await submitAndScorePPLPAction(supabase, {
      action_type: actionType,
      actor_id: userId,
      target_id: journalRecord?.id,
      metadata: {
        journal_id: journalRecord?.id,
        journal_type: journalType,
        content_length: contentLength,
      },
      impact: {
        scope: 'individual',
        quality_indicators: purityScore >= 0.8 ? ['deep_reflection', 'authentic'] : purityScore >= 0.6 ? ['sincere'] : [],
      },
      integrity: {
        content_hash: contentHash,
        source_verified: true,
        duplicate_check: true,
      },
      evidences: [{
        evidence_type: 'journal_content',
        content_hash: contentHash,
        metadata: { journal_type: journalType, purity_score: purityScore }
      }],
      reward_amount: rewardAmount,
      purity_score: purityScore,
      content_length: contentLength,
    });
    
    if (pplpResult.success) {
      console.log(`[PPLP] Journal action submitted: ${pplpResult.action_id}`);
    }
    // ============= End PPLP Integration =============

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
        journalId: journalRecord?.id,
        pplpActionId: pplpResult.success ? pplpResult.action_id : undefined
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