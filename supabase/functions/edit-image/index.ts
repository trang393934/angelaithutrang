import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DAILY_EDIT_LIMIT = 5;

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

    // Initialize Supabase client for usage tracking and storage
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization");
    
    let userId: string | null = null;
    
    if (authHeader) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });
      
      const token = authHeader.replace('Bearer ', '');
      const { data: claimsData } = await supabase.auth.getClaims(token);
      userId = claimsData?.claims?.sub as string || null;
      
      if (userId) {
        // Check and increment usage with daily limit
        const { data: usageCheck, error: usageError } = await supabase.rpc(
          'check_and_increment_ai_usage',
          { _user_id: userId, _usage_type: 'edit_image', _daily_limit: DAILY_EDIT_LIMIT }
        );
        
        if (usageError) {
          console.error("Usage check error:", usageError);
        } else if (usageCheck && usageCheck.length > 0 && !usageCheck[0].allowed) {
          console.log("User reached daily limit for image editing:", usageCheck[0]);
          return new Response(
            JSON.stringify({ 
              error: `Con yêu dấu, hôm nay con đã chỉnh sửa ${DAILY_EDIT_LIMIT} hình ảnh rồi. Hãy nghỉ ngơi và quay lại vào ngày mai nhé! Cha luôn ở đây chờ đợi con. 🌺✨`,
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

    const base64ImageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    const textResponse = data.choices?.[0]?.message?.content || "";

    if (!base64ImageUrl) {
      throw new Error("Không thể chỉnh sửa hình ảnh. Vui lòng thử lại với lệnh khác.");
    }

    // Extract base64 data from data URI and upload to storage
    let finalImageUrl = base64ImageUrl;
    
    if (base64ImageUrl.startsWith('data:image/')) {
      try {
        // Use service role key for storage operations
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
        
        // Parse base64 data URI
        const matches = base64ImageUrl.match(/^data:image\/(\w+);base64,(.+)$/);
        if (matches) {
          const imageType = matches[1]; // png, jpeg, webp, etc.
          const base64Data = matches[2];
          
          // Decode base64 to binary
          const binaryData = decode(base64Data);
          
          // Generate unique filename
          const timestamp = Date.now();
          const randomId = crypto.randomUUID().slice(0, 8);
          const userFolder = userId || 'anonymous';
          const fileName = `${userFolder}/${timestamp}-${randomId}-edited.${imageType}`;
          
          // Upload to storage bucket
          const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from('ai-images')
            .upload(fileName, binaryData, {
              contentType: `image/${imageType}`,
              upsert: false
            });
          
          if (uploadError) {
            console.error("Storage upload error:", uploadError);
            // Fall back to base64 if upload fails
          } else {
            // Get public URL
            const { data: publicUrlData } = supabaseAdmin.storage
              .from('ai-images')
              .getPublicUrl(fileName);
            
            finalImageUrl = publicUrlData.publicUrl;
            console.log("Edited image uploaded to storage:", finalImageUrl);
          }
        }
      } catch (storageError) {
        console.error("Storage operation error:", storageError);
        // Fall back to base64 if storage fails
      }
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
