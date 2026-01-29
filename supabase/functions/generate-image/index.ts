import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, style } = await req.json();

    const containsVietnamese = /[À-ỹ]/.test(prompt);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("AI service is not configured");
    }

    console.log("Generating image with prompt:", prompt);

    // Quality enhancement keywords for sharper, higher resolution images
    const qualityBoost = "ultra sharp, high resolution, 8K UHD, crystal clear, highly detailed, professional quality, sharp focus, intricate details";

    // Enhance prompt with style
    let enhancedPrompt = prompt;
    if (style === "spiritual") {
      enhancedPrompt = `${prompt}, divine light, ethereal, spiritual, peaceful, heavenly atmosphere, golden rays, angelic, ${qualityBoost}`;
    } else if (style === "realistic") {
      enhancedPrompt = `${prompt}, photorealistic, professional photography, DSLR quality, ${qualityBoost}`;
    } else if (style === "artistic") {
      enhancedPrompt = `${prompt}, artistic, oil painting style, masterpiece, beautiful composition, ${qualityBoost}`;
    } else {
      // Default style also gets quality boost
      enhancedPrompt = `${prompt}, ${qualityBoost}`;
    }

    // Vietnamese text reliability: strongly instruct exact typography.
    if (containsVietnamese) {
      enhancedPrompt = `${enhancedPrompt}

IMPORTANT (Vietnamese text): If the image includes any Vietnamese words provided in the prompt, you MUST render the text EXACTLY as written, preserving every diacritic (ă â ê ô ơ ư đ) and every tone mark, punctuation, spacing, and capitalization. Do NOT translate, rephrase, or correct the text. If you cannot render the text perfectly, render NO text at all.

Typography: clean, high-contrast, readable Vietnamese diacritics; avoid stylized fonts that distort accents.`;
    }

    // Always use the higher quality model for sharper images
    const model = "google/gemini-3-pro-image-preview";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "user",
            content: enhancedPrompt
          }
        ],
        modalities: ["image", "text"]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Image generation error:", response.status, errorText);
      
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
      
      throw new Error("Failed to generate image");
    }

    const data = await response.json();
    console.log("Image generation response received");

    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    const textResponse = data.choices?.[0]?.message?.content || "";

    if (!imageUrl) {
      throw new Error("No image generated");
    }

    return new Response(
      JSON.stringify({ 
        imageUrl,
        description: textResponse,
        prompt: enhancedPrompt
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Generate image error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Không thể tạo hình ảnh. Vui lòng thử lại." 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
