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
    const { imageUrl, instruction, style } = await req.json();

    if (!imageUrl || !instruction) {
      return new Response(
        JSON.stringify({ error: "imageUrl và instruction là bắt buộc" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("AI service is not configured");
    }

    console.log("Editing image with instruction:", instruction);

    // Quality enhancement keywords
    const qualityBoost = "ultra sharp, high resolution, 8K UHD, crystal clear, highly detailed, professional quality, sharp focus";

    // Build enhanced instruction based on style
    let enhancedInstruction = instruction;
    if (style === "spiritual") {
      enhancedInstruction = `${instruction}. Style: divine light, ethereal, spiritual, peaceful, heavenly atmosphere, golden rays, ${qualityBoost}`;
    } else if (style === "realistic") {
      enhancedInstruction = `${instruction}. Style: photorealistic, professional photography, DSLR quality, ${qualityBoost}`;
    } else if (style === "artistic") {
      enhancedInstruction = `${instruction}. Style: artistic, oil painting style, masterpiece, beautiful composition, ${qualityBoost}`;
    } else {
      enhancedInstruction = `${instruction}. ${qualityBoost}`;
    }

    const systemPrompt = `You are an expert image editor. Your task is to EDIT the provided image according to the user's instructions. 
You must:
1. Keep the original composition and main elements of the image as much as possible
2. Only modify what the user specifically asks for
3. Maintain the quality and resolution of the original image
4. Apply the requested changes naturally and seamlessly

IMPORTANT: You are EDITING the existing image, not creating a new one from scratch. Preserve the original image's essence while applying the requested modifications.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Edit this image with the following instruction: ${enhancedInstruction}`
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        modalities: ["image", "text"]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Image editing error:", response.status, errorText);
      
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
      
      throw new Error("Failed to edit image");
    }

    const data = await response.json();
    console.log("Image editing response received");

    const editedImageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    const textResponse = data.choices?.[0]?.message?.content || "";

    if (!editedImageUrl) {
      throw new Error("Không thể chỉnh sửa hình ảnh. Vui lòng thử lại với lệnh khác.");
    }

    return new Response(
      JSON.stringify({ 
        imageUrl: editedImageUrl,
        description: textResponse,
        instruction: enhancedInstruction
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Edit image error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Không thể chỉnh sửa hình ảnh. Vui lòng thử lại." 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
