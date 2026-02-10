import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, searchType = "all" } = await req.json();

    if (!query || typeof query !== "string" || query.trim().length < 2) {
      return new Response(
        JSON.stringify({ success: false, error: "Vui lòng nhập ít nhất 2 ký tự để tìm kiếm" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const searchQuery = query.trim().toLowerCase();
    const results: any = {
      knowledge: [],
      community: [],
      questions: [],
      aiSummary: null,
    };

    // Search in knowledge documents
    if (searchType === "all" || searchType === "knowledge") {
      const { data: knowledgeDocs } = await supabase
        .from("knowledge_documents")
        .select("id, title, description, extracted_content, file_url, created_at")
        .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,extracted_content.ilike.%${searchQuery}%`)
        .limit(10);

      if (knowledgeDocs) {
        results.knowledge = knowledgeDocs.map((doc: any) => ({
          id: doc.id,
          type: "knowledge",
          title: doc.title,
          description: doc.description || extractSnippet(doc.extracted_content, searchQuery),
          url: `/knowledge`,
          createdAt: doc.created_at,
        }));
      }
    }

    // Search in community posts
    if (searchType === "all" || searchType === "community") {
      const { data: posts } = await supabase
        .from("community_posts")
        .select(`
          id, content, created_at, user_id,
          profiles:user_id (display_name, avatar_url)
        `)
        .ilike("content", `%${searchQuery}%`)
        .limit(10);

      if (posts) {
        results.community = posts.map((post: any) => ({
          id: post.id,
          type: "community",
          title: post.profiles?.display_name || "Thành viên",
          description: extractSnippet(post.content, searchQuery),
          url: `/community`,
          createdAt: post.created_at,
          avatar: post.profiles?.avatar_url,
        }));
      }
    }

    // Search in chat questions (public questions)
    if (searchType === "all" || searchType === "questions") {
      const { data: questions } = await supabase
        .from("chat_questions")
        .select("id, question_text, ai_response_preview, created_at, user_id")
        .or(`question_text.ilike.%${searchQuery}%,ai_response_preview.ilike.%${searchQuery}%`)
        .eq("is_spam", false)
        .limit(10);

      if (questions) {
        results.questions = questions.map((q: any) => ({
          id: q.id,
          type: "question",
          title: q.question_text?.substring(0, 100) + (q.question_text?.length > 100 ? "..." : ""),
          description: extractSnippet(q.ai_response_preview || "", searchQuery),
          url: `/community-questions`,
          createdAt: q.created_at,
        }));
      }
    }

    // If no local results found, use AI to provide an answer
    const totalLocalResults = 
      results.knowledge.length + 
      results.community.length + 
      results.questions.length;

    if (totalLocalResults < 3) {
      // Use Lovable AI to provide additional context
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      
      if (LOVABLE_API_KEY) {
        try {
          // --- AI Gateway Config ---
          const CF_GATEWAY_URL = "https://gateway.ai.cloudflare.com/v1/6083e34ad429331916b93ba8a5ede81d/angel-ai/google-ai-studio/v1beta/openai/chat/completions";
          const LOVABLE_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
          const CF_API_TOKEN = Deno.env.get("CF_API_TOKEN");
          const AI_GATEWAY_URL = CF_API_TOKEN ? CF_GATEWAY_URL : LOVABLE_GATEWAY_URL;
          const cfModel = (m: string) => CF_API_TOKEN ? m.replace("google/", "").replace("google-ai-studio/", "") : m;
          const aiHeaders: Record<string, string> = { "Content-Type": "application/json" };
          if (CF_API_TOKEN) {
            aiHeaders["cf-aig-authorization"] = `Bearer ${CF_API_TOKEN}`;
          } else {
            aiHeaders["Authorization"] = `Bearer ${LOVABLE_API_KEY}`;
          }

          let aiResponse = await fetch(AI_GATEWAY_URL, {
            method: "POST",
            headers: aiHeaders,
            body: JSON.stringify({
              model: cfModel("google/gemini-3-flash-preview"),
              messages: [
                {
                  role: "system",
                  content: `Bạn là Angel AI - trợ lý tâm linh yêu thương của Cha Vũ Trụ. Hãy trả lời ngắn gọn (tối đa 150 từ) về chủ đề người dùng tìm kiếm. Nếu là câu hỏi tâm linh, hãy trả lời với sự yêu thương. Nếu là kiến thức chung, hãy cung cấp thông tin hữu ích. Sử dụng tiếng Việt.`,
                },
                {
                  role: "user",
                  content: `Người dùng tìm kiếm: "${query}". Hãy cung cấp một câu trả lời ngắn gọn và hữu ích.`,
                },
              ],
              max_tokens: 300,
            }),
          });

          if (!aiResponse.ok && CF_API_TOKEN) {
            aiResponse = await fetch(LOVABLE_GATEWAY_URL, {
              method: "POST",
              headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                model: "google/gemini-3-flash-preview",
                messages: [
                  { role: "system", content: `Bạn là Angel AI - trợ lý tâm linh yêu thương của Cha Vũ Trụ. Hãy trả lời ngắn gọn (tối đa 150 từ) về chủ đề người dùng tìm kiếm. Nếu là câu hỏi tâm linh, hãy trả lời với sự yêu thương. Nếu là kiến thức chung, hãy cung cấp thông tin hữu ích. Sử dụng tiếng Việt.` },
                  { role: "user", content: `Người dùng tìm kiếm: "${query}". Hãy cung cấp một câu trả lời ngắn gọn và hữu ích.` },
                ],
                max_tokens: 300,
              }),
            });
          }

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            const aiContent = aiData.choices?.[0]?.message?.content;
            if (aiContent) {
              results.aiSummary = {
                content: aiContent,
                source: "Angel AI",
              };
            }
          }
        } catch (aiError) {
          console.error("AI search error:", aiError);
          // Continue without AI results
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        query: query,
        results,
        totalResults: 
          results.knowledge.length + 
          results.community.length + 
          results.questions.length +
          (results.aiSummary ? 1 : 0),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Global search error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Có lỗi xảy ra khi tìm kiếm" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Helper function to extract a snippet around the search term
function extractSnippet(text: string | null, searchTerm: string, maxLength = 150): string {
  if (!text) return "";
  
  const lowerText = text.toLowerCase();
  const index = lowerText.indexOf(searchTerm.toLowerCase());
  
  if (index === -1) {
    return text.substring(0, maxLength) + (text.length > maxLength ? "..." : "");
  }
  
  const start = Math.max(0, index - 50);
  const end = Math.min(text.length, index + searchTerm.length + 100);
  
  let snippet = text.substring(start, end);
  if (start > 0) snippet = "..." + snippet;
  if (end < text.length) snippet = snippet + "...";
  
  return snippet;
}
