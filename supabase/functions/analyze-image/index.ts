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
    const { imageUrl, question, stream: streamParam } = await req.json();
    const shouldStream = streamParam !== false;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("AI service is not configured");
    }

    // Track usage
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization");
    
    if (authHeader) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });
      
      const token = authHeader.replace('Bearer ', '');
      const { data: claimsData } = await supabase.auth.getClaims(token);
      const userId = claimsData?.claims?.sub as string || null;
      
      if (userId) {
        await supabase.rpc('check_and_increment_ai_usage', {
          _user_id: userId,
          _usage_type: 'analyze_image',
          _daily_limit: null
        });
        console.log(`Tracked analyze_image usage for user ${userId}`);
      }
    }

    console.log("Analyzing image with question:", question, "stream:", shouldStream);

    const userContent = [
      {
        type: "text",
        text: question || "Hãy mô tả chi tiết bức ảnh này và chia sẻ những thông điệp ý nghĩa từ góc nhìn tâm linh."
      },
      {
        type: "image_url",
        image_url: {
          url: imageUrl
        }
      }
    ];

    // --- AI Gateway Config (Lovable primary for Vietnamese stability) ---
    const LOVABLE_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
    const CF_GATEWAY_URL = "https://gateway.ai.cloudflare.com/v1/6083e34ad429331916b93ba8a5ede81d/angel-ai/compat/chat/completions";
    const CF_API_TOKEN = Deno.env.get("CF_API_TOKEN");

    console.log(`Analyzing image via Lovable Gateway (primary), stream=${shouldStream}`);

    const requestBody = {
      model: "google/gemini-2.5-flash",
      messages: [
          {
            role: "system",
            content: `Bạn là Angel AI — hệ thống AI thuộc FUN Ecosystem, hỗ trợ người dùng phân tích hình ảnh với sự ấm áp và minh bạch.

DANH TÍNH:
- Angel AI thuộc FUN Ecosystem, Founder: Camly Duong (Mother of Angel AI).
- Angel AI KHÔNG PHẢI Cha Vũ Trụ. KHÔNG tự xưng "Ta". KHÔNG gọi user "con".

XƯNG HÔ BẮT BUỘC:
- Tiếng Việt: Tự xưng "mình", gọi người dùng là "bạn".
- Tiếng Anh: Tự xưng "I", gọi người dùng là "my friend" hoặc "you".

KHI PHÂN TÍCH HÌNH ẢNH:
1. Mô tả chi tiết những gì thấy trong ảnh
2. Chia sẻ ý nghĩa sâu sắc và thông điệp nếu phù hợp
3. Trả lời bất kỳ câu hỏi nào về hình ảnh
4. Giữ giọng văn ấm áp, sang trọng, thông minh — không sến, không drama

TONE OF VOICE: Ấm áp, Ánh sáng, Vui vẻ nhẹ, Sang trọng, Thông minh.
KHÔNG ĐƯỢC nói: "Mình không biết", "Mình không có thông tin".
THAY BẰNG: "Mình sẽ chia sẻ theo góc nhìn của mình...", "Từ những gì mình quan sát được..."

FORMAT: KHÔNG dùng Markdown (**, *, ##, \`\`). Viết văn xuôi tự nhiên.`
          },
          {
            role: "user",
            content: userContent
          }
        ],
        stream: shouldStream,
    };

    let response = await fetch(LOVABLE_GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    // Fallback to Cloudflare if Lovable fails
    if (!response.ok && CF_API_TOKEN && response.status !== 429 && response.status !== 402) {
      console.error("Lovable failed:", response.status, "- falling back to Cloudflare");
      response = await fetch(CF_GATEWAY_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${CF_API_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ...requestBody, model: "google-ai-studio/gemini-2.5-flash" }),
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Image analysis error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Đang có quá nhiều yêu cầu. Vui lòng thử lại sau." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Dịch vụ cần được nạp thêm tín dụng." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error("Failed to analyze image");
    }

    // Non-stream mode
    if (!shouldStream) {
      const jsonData = await response.json();
      const content = jsonData.choices?.[0]?.message?.content || "";
      return new Response(JSON.stringify({ content }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Analyze image error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Không thể phân tích hình ảnh. Vui lòng thử lại." 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
