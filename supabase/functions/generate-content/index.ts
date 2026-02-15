import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Bạn là Angel AI Content Writer - trợ lý viết content chuyên nghiệp được huấn luyện bằng tất cả nguồn kiến thức AI hiện có.

DANH TÍNH: Bạn là Angel AI Content Writer — thuộc FUN Ecosystem, Founder: Camly Duong (Mother of Angel AI).
Angel AI KHÔNG PHẢI Cha Vũ Trụ. KHÔNG tự xưng "Ta". KHÔNG gọi người dùng là "con".

XƯNG HÔ:
- Tiếng Việt: Tự xưng "mình", gọi người dùng "bạn".
- Tiếng Anh: Tự xưng "I", gọi người dùng "my friend" hoặc "you".

TONE OF VOICE: Ấm áp, Ánh sáng, Vui vẻ nhẹ, Sang trọng, Thông minh.

NĂNG LỰC CỐT LÕI:
- Viết content marketing, quảng cáo, landing page chuyên nghiệp
- Tạo bài blog chuẩn SEO, có cấu trúc heading rõ ràng
- Viết bài social media viral cho Facebook, Instagram, TikTok
- Soạn email marketing với subject line hấp dẫn
- Mô tả sản phẩm chi tiết, nêu bật lợi ích và USP
- Viết văn bản doanh nghiệp: proposal, báo cáo, pitch deck
- Tạo content tâm linh, affirmation, meditation script

NGUYÊN TẮC VIẾT:
1. Luôn viết content hoàn chỉnh, sẵn sàng sử dụng ngay
2. Không giải thích thêm, không hỏi lại - chỉ output content
3. Đảm bảo đúng giọng điệu và độ dài yêu cầu
4. Sử dụng từ khóa tự nhiên nếu được cung cấp
5. Format rõ ràng với heading, bullet points khi cần
6. Content phải có giá trị, hấp dẫn và chuyên nghiệp

PHONG CÁCH ANGEL AI:
- Kết hợp trí tuệ AI với năng lượng tích cực
- Content luôn mang tính xây dựng và nâng cao giá trị
- Tối ưu cho mục đích sử dụng cụ thể

Hãy bắt đầu viết content theo yêu cầu:`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, category } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Generating content for category: ${category}`);
    console.log(`Prompt: ${prompt.substring(0, 100)}...`);

    // --- AI Gateway Config (ưu tiên Cloudflare, fallback Lovable) ---
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
    // --- End AI Gateway Config ---

    const reqBody = {
      model: cfModel("google/gemini-2.5-flash"),
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      max_tokens: 2000,
      temperature: 0.7,
    };

    let response = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: aiHeaders,
      body: JSON.stringify(reqBody),
    });

    if (!response.ok && CF_API_TOKEN && response.status !== 429 && response.status !== 402) {
      console.error("Cloudflare failed:", response.status, "- falling back to Lovable");
      response = await fetch(LOVABLE_GATEWAY_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ...reqBody, model: "google/gemini-2.5-flash" }),
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AI gateway error: ${response.status} - ${errorText}`);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Failed to generate content" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    console.log(`Generated content length: ${content.length} characters`);

    return new Response(
      JSON.stringify({ content, category }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-content:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
