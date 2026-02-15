import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DAILY_EDIT_LIMIT = 3;

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

    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!GOOGLE_AI_API_KEY) throw new Error("GOOGLE_AI_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization");

    let userId: string | null = null;

    if (authHeader) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) console.error("Auth error:", userError);
      userId = user?.id || null;

      if (userId) {
        const { data: usageCheck, error: usageError } = await supabase.rpc(
          'check_and_increment_ai_usage',
          { _user_id: userId, _usage_type: 'edit_image', _daily_limit: DAILY_EDIT_LIMIT }
        );

        if (usageError) {
          console.error("Usage check error:", usageError);
        } else if (usageCheck && usageCheck.length > 0 && !usageCheck[0].allowed) {
          return new Response(
            JSON.stringify({
              error: `Con yêu dấu, hôm nay con đã chỉnh sửa ${DAILY_EDIT_LIMIT} hình ảnh rồi. Hãy trân trọng những tác phẩm đã tạo và quay lại vào ngày mai nhé! 🌺✨`,
              limit_reached: true,
              current_count: usageCheck[0].current_count,
              daily_limit: usageCheck[0].daily_limit
            }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } else if (usageCheck && usageCheck.length > 0) {
          console.log(`User ${userId} image editing: ${usageCheck[0].current_count}/${DAILY_EDIT_LIMIT}`);
        }
      }
    }

    console.log("Editing image with instruction:", instruction);

    const qualityBoost = "ultra sharp, high resolution, 8K UHD, crystal clear, highly detailed, professional quality, sharp focus";

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

    // Download the source image and convert to base64 for Google AI
    let imageBase64: string;
    let imageMimeType: string;

    if (imageUrl.startsWith("data:image/")) {
      const matches = imageUrl.match(/^data:image\/(\w+);base64,(.+)$/);
      if (!matches) throw new Error("Invalid base64 image format");
      imageMimeType = `image/${matches[1]}`;
      imageBase64 = matches[2];
    } else {
      const imgResponse = await fetch(imageUrl);
      if (!imgResponse.ok) throw new Error("Failed to download source image");
      const imgBuffer = await imgResponse.arrayBuffer();
      imageMimeType = imgResponse.headers.get("content-type") || "image/jpeg";
      imageBase64 = btoa(String.fromCharCode(...new Uint8Array(imgBuffer)));
    }

    const editPrompt = `You are an expert image editor. Edit this image according to the following instruction:
${enhancedInstruction}

Rules:
1. Keep the original composition and main elements as much as possible
2. Only modify what is specifically asked for
3. Maintain the quality and resolution
4. Apply changes naturally and seamlessly
5. You are EDITING the existing image, not creating a new one`;

    const googleResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GOOGLE_AI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: editPrompt },
              {
                inlineData: {
                  mimeType: imageMimeType,
                  data: imageBase64,
                }
              }
            ]
          }],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
          }
        }),
      }
    );

    if (!googleResponse.ok) {
      const errorText = await googleResponse.text();
      console.error("Google AI edit error:", googleResponse.status, errorText);
      if (googleResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Đang có quá nhiều yêu cầu. Vui lòng thử lại sau." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("Failed to edit image via Google AI Studio");
    }

    const googleData = await googleResponse.json();
    const parts = googleData.candidates?.[0]?.content?.parts || [];

    let resultBase64: string | null = null;
    let resultMimeType = "image/png";
    let textResponse = "";

    for (const part of parts) {
      if (part.inlineData) {
        resultBase64 = part.inlineData.data;
        resultMimeType = part.inlineData.mimeType || "image/png";
      }
      if (part.text) {
        textResponse = part.text;
      }
    }

    if (!resultBase64) {
      throw new Error("Không thể chỉnh sửa hình ảnh. Vui lòng thử lại với lệnh khác.");
    }

    // Upload to Supabase Storage
    let finalImageUrl = `data:${resultMimeType};base64,${resultBase64}`;

    try {
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      const binaryData = decode(resultBase64);
      const ext = resultMimeType.includes("png") ? "png" : resultMimeType.includes("webp") ? "webp" : "jpeg";

      const timestamp = Date.now();
      const randomId = crypto.randomUUID().slice(0, 8);
      const userFolder = userId || "anonymous";
      const fileName = `${userFolder}/${timestamp}-${randomId}-edited.${ext}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from("ai-images")
        .upload(fileName, binaryData, { contentType: resultMimeType, upsert: false });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
      } else {
        const { data: publicUrlData } = supabaseAdmin.storage
          .from("ai-images")
          .getPublicUrl(fileName);
        finalImageUrl = publicUrlData.publicUrl;
        console.log("Edited image uploaded to storage:", finalImageUrl);
      }
    } catch (storageError) {
      console.error("Storage operation error:", storageError);
    }

    return new Response(
      JSON.stringify({
        imageUrl: finalImageUrl,
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
