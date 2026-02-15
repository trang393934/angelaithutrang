import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DAILY_IMAGE_LIMIT = 3;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, style, mode = "fast" } = await req.json();

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
          'check_ai_usage_only',
          { _user_id: userId, _usage_type: 'generate_image', _daily_limit: DAILY_IMAGE_LIMIT }
        );

        if (usageError) {
          console.error("Usage check error:", usageError);
        } else if (usageCheck && usageCheck.length > 0 && !usageCheck[0].allowed) {
          return new Response(
            JSON.stringify({
              error: `Con yêu dấu, hôm nay con đã tạo ${DAILY_IMAGE_LIMIT} hình ảnh rồi. Hãy trân trọng những tác phẩm đã tạo và quay lại vào ngày mai nhé! 🌸✨`,
              limit_reached: true,
              current_count: usageCheck[0].current_count,
              daily_limit: usageCheck[0].daily_limit
            }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } else if (usageCheck && usageCheck.length > 0) {
          console.log(`User ${userId} image generation check [${mode}]: ${usageCheck[0].current_count}/${DAILY_IMAGE_LIMIT} (not incremented yet)`);
        }
      }
    }

    console.log(`Generating image [mode=${mode}] with prompt:`, prompt);

    const qualityBoost = "ultra sharp, high resolution, 8K UHD, crystal clear, highly detailed, professional quality, sharp focus, intricate details";

    let enhancedPrompt = prompt;
    if (style === "spiritual") {
      enhancedPrompt = `${prompt}, divine light, ethereal, spiritual, peaceful, heavenly atmosphere, golden rays, angelic, ${qualityBoost}`;
    } else if (style === "realistic") {
      enhancedPrompt = `${prompt}, photorealistic, professional photography, DSLR quality, ${qualityBoost}`;
    } else if (style === "artistic") {
      enhancedPrompt = `${prompt}, artistic, oil painting style, masterpiece, beautiful composition, ${qualityBoost}`;
    } else {
      enhancedPrompt = `${prompt}, ${qualityBoost}`;
    }

    let finalImageUrl: string;
    let textResponse = "";

    if (mode === "fast") {
      // ===== FAL.AI FLUX SCHNELL =====
      const FAL_KEY = Deno.env.get("FAL_KEY");
      if (!FAL_KEY) throw new Error("FAL_KEY is not configured");

      const falResponse = await fetch("https://fal.run/fal-ai/flux/schnell", {
        method: "POST",
        headers: {
          Authorization: `Key ${FAL_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: enhancedPrompt,
          image_size: "square_hd",
          num_images: 1,
        }),
      });

      if (!falResponse.ok) {
        const errorText = await falResponse.text();
        console.error("Fal.ai error:", falResponse.status, errorText);
        if (falResponse.status === 429) {
          return new Response(
            JSON.stringify({ error: "Đang có quá nhiều yêu cầu. Vui lòng thử lại sau." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        throw new Error("Failed to generate image via Fal.ai");
      }

      const falData = await falResponse.json();
      const falImageUrl = falData.images?.[0]?.url;

      if (!falImageUrl) throw new Error("No image generated from Fal.ai");

      // Download from Fal and upload to Supabase Storage to avoid link expiry
      try {
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
        const imgResponse = await fetch(falImageUrl);
        const imgBuffer = new Uint8Array(await imgResponse.arrayBuffer());
        const contentType = imgResponse.headers.get("content-type") || "image/jpeg";
        const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpeg";

        const timestamp = Date.now();
        const randomId = crypto.randomUUID().slice(0, 8);
        const userFolder = userId || "anonymous";
        const fileName = `${userFolder}/${timestamp}-${randomId}-fast.${ext}`;

        const { error: uploadError } = await supabaseAdmin.storage
          .from("ai-images")
          .upload(fileName, imgBuffer, { contentType, upsert: false });

        if (uploadError) {
          console.error("Storage upload error:", uploadError);
          finalImageUrl = falImageUrl; // fallback
        } else {
          const { data: publicUrlData } = supabaseAdmin.storage
            .from("ai-images")
            .getPublicUrl(fileName);
          finalImageUrl = publicUrlData.publicUrl;
          console.log("Fast image uploaded to storage:", finalImageUrl);
        }
      } catch (storageError) {
        console.error("Storage operation error:", storageError);
        finalImageUrl = falImageUrl;
      }

      textResponse = "Ảnh đã được tạo bằng chế độ Siêu tốc ⚡";

    } else {
      // ===== GOOGLE AI STUDIO (SPIRITUAL MODE) =====
      const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
      if (!GOOGLE_AI_API_KEY) throw new Error("GOOGLE_AI_API_KEY is not configured");

      const containsVietnamese = /[À-ỹ]/.test(prompt);
      if (containsVietnamese) {
        enhancedPrompt = `${enhancedPrompt}

IMPORTANT (Vietnamese text): If the image includes any Vietnamese words provided in the prompt, you MUST render the text EXACTLY as written, preserving every diacritic (ă â ê ô ơ ư đ) and every tone mark, punctuation, spacing, and capitalization. Do NOT translate, rephrase, or correct the text. If you cannot render the text perfectly, render NO text at all.

Typography: clean, high-contrast, readable Vietnamese diacritics; avoid stylized fonts that distort accents.`;
      }

      const googleResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GOOGLE_AI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: enhancedPrompt }]
            }],
            generationConfig: {
              responseModalities: ["TEXT", "IMAGE"],
            }
          }),
        }
      );

      if (!googleResponse.ok) {
        const errorText = await googleResponse.text();
        console.error("Google AI error:", googleResponse.status, errorText);
        if (googleResponse.status === 429) {
          return new Response(
            JSON.stringify({ error: "Đang có quá nhiều yêu cầu. Vui lòng thử lại sau." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        throw new Error("Failed to generate image via Google AI Studio");
      }

      const googleData = await googleResponse.json();
      const parts = googleData.candidates?.[0]?.content?.parts || [];

      let base64Data: string | null = null;
      let mimeType = "image/png";

      for (const part of parts) {
        if (part.inlineData) {
          base64Data = part.inlineData.data;
          mimeType = part.inlineData.mimeType || "image/png";
        }
        if (part.text) {
          textResponse = part.text;
        }
      }

      if (!base64Data) throw new Error("No image generated from Google AI Studio");

      // Upload base64 to Supabase Storage
      try {
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
        const binaryData = decode(base64Data);
        const ext = mimeType.includes("png") ? "png" : mimeType.includes("webp") ? "webp" : "jpeg";

        const timestamp = Date.now();
        const randomId = crypto.randomUUID().slice(0, 8);
        const userFolder = userId || "anonymous";
        const fileName = `${userFolder}/${timestamp}-${randomId}-spiritual.${ext}`;

        const { error: uploadError } = await supabaseAdmin.storage
          .from("ai-images")
          .upload(fileName, binaryData, { contentType: mimeType, upsert: false });

        if (uploadError) {
          console.error("Storage upload error:", uploadError);
          finalImageUrl = `data:${mimeType};base64,${base64Data}`;
        } else {
          const { data: publicUrlData } = supabaseAdmin.storage
            .from("ai-images")
            .getPublicUrl(fileName);
          finalImageUrl = publicUrlData.publicUrl;
          console.log("Spiritual image uploaded to storage:", finalImageUrl);
        }
      } catch (storageError) {
        console.error("Storage operation error:", storageError);
        finalImageUrl = `data:${mimeType};base64,${base64Data}`;
      }
    }

    // Increment usage count ONLY after successful image generation
    if (userId) {
      const supabaseForIncrement = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader! } }
      });
      const { error: incError } = await supabaseForIncrement.rpc(
        'increment_ai_usage',
        { _user_id: userId, _usage_type: 'generate_image' }
      );
      if (incError) {
        console.error("Usage increment error:", incError);
      } else {
        console.log(`User ${userId} image usage incremented after successful generation`);
      }
    }

    return new Response(
      JSON.stringify({
        imageUrl: finalImageUrl,
        description: textResponse,
        prompt: enhancedPrompt,
        mode,
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
