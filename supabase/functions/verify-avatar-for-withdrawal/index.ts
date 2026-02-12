import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Verifying avatar for user: ${user.id}`);

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('avatar_url, cover_photo_url, display_name')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return new Response(
        JSON.stringify({ 
          eligible: false, 
          reason: 'Không thể tải thông tin hồ sơ',
          details: { avatar_valid: false, cover_valid: false }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!profile) {
      return new Response(
        JSON.stringify({ 
          eligible: false, 
          reason: 'Vui lòng tạo hồ sơ cá nhân trước khi rút tiền',
          details: { avatar_valid: false, cover_valid: false }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if cover photo exists
    if (!profile.cover_photo_url || profile.cover_photo_url.trim() === '') {
      return new Response(
        JSON.stringify({ 
          eligible: false, 
          reason: 'Vui lòng cập nhật ảnh bìa trước khi rút tiền',
          details: { avatar_valid: false, cover_valid: false }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if avatar exists
    if (!profile.avatar_url || profile.avatar_url.trim() === '') {
      return new Response(
        JSON.stringify({ 
          eligible: false, 
          reason: 'Vui lòng cập nhật ảnh đại diện trước khi rút tiền',
          details: { avatar_valid: false, cover_valid: true }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use AI to analyze if the avatar is a real person
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      // Fallback: if we can't verify, we'll allow but log
      return new Response(
        JSON.stringify({ 
          eligible: true, 
          reason: 'Không thể xác minh avatar, cho phép tạm thời',
          details: { avatar_valid: true, cover_valid: true, ai_verified: false }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Analyzing avatar image: ${profile.avatar_url}`);

    // Call AI to analyze the avatar
    const analysisPrompt = `Analyze this profile picture and determine if it shows a REAL HUMAN PERSON's face.

IMPORTANT CRITERIA:
1. The image MUST show a clear, recognizable human face as the main subject
2. The human should appear to be a real person (not an anime character, cartoon, mascot, AI-generated avatar, or illustration)
3. Logos, symbols, text, landscapes, animals, objects, abstract art, or group photos are NOT acceptable
4. The face should be clearly visible (not hidden, blurred, or obscured)
5. Selfies, portraits, headshots, and professional photos are acceptable

Respond with ONLY a JSON object in this exact format:
{
  "is_real_person": true or false,
  "confidence": 0.0 to 1.0,
  "reason": "brief explanation in Vietnamese"
}

Do not include any other text, markdown, or formatting.`;

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

    const avatarBody = { model: cfModel("google/gemini-2.5-flash"), messages: [
          { role: "user", content: [
              { type: "text", text: analysisPrompt },
              { type: "image_url", image_url: { url: profile.avatar_url } }
            ] }
        ], max_tokens: 500 };
    let aiResponse = await fetch(AI_GATEWAY_URL, {
      method: "POST", headers: aiHeaders, body: JSON.stringify(avatarBody),
    });
    if (!aiResponse.ok && CF_API_TOKEN) {
      aiResponse = await fetch(LOVABLE_GATEWAY_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ...avatarBody, model: "google/gemini-2.5-flash" }),
      });
    }

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      // Fallback: if AI fails, don't block but log
      return new Response(
        JSON.stringify({ 
          eligible: true, 
          reason: 'Không thể xác minh avatar bằng AI, vui lòng đảm bảo sử dụng ảnh chân dung thật',
          details: { avatar_valid: true, cover_valid: true, ai_verified: false }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResult = await aiResponse.json();
    const content = aiResult.choices?.[0]?.message?.content || '';
    
    console.log('AI analysis result:', content);

    // Parse the AI response
    let analysis;
    try {
      // Clean up the response - remove markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/```json?\n?/g, '').replace(/```\n?/g, '');
      }
      analysis = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // If we can't parse, be lenient but warn
      return new Response(
        JSON.stringify({ 
          eligible: true, 
          reason: 'Không thể phân tích avatar, vui lòng đảm bảo sử dụng ảnh chân dung thật của bạn',
          details: { avatar_valid: true, cover_valid: true, ai_verified: false }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isRealPerson = analysis.is_real_person === true;
    const confidence = typeof analysis.confidence === 'number' ? analysis.confidence : 0;
    const reason = analysis.reason || '';

    console.log(`Avatar analysis: isRealPerson=${isRealPerson}, confidence=${confidence}, reason=${reason}`);

    // Require high confidence for real person verification (>= 0.7)
    if (!isRealPerson || confidence < 0.7) {
      return new Response(
        JSON.stringify({ 
          eligible: false, 
          reason: `Avatar không hợp lệ: ${reason || 'Vui lòng sử dụng ảnh chân dung thật của chính bạn (không phải logo, phong cảnh, hay hình ảnh khác)'}`,
          details: { 
            avatar_valid: false, 
            cover_valid: true, 
            ai_verified: true,
            confidence,
            ai_reason: reason
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // All checks passed
    return new Response(
      JSON.stringify({ 
        eligible: true, 
        reason: 'Hồ sơ đã được xác minh thành công',
        details: { 
          avatar_valid: true, 
          cover_valid: true, 
          ai_verified: true,
          confidence,
          ai_reason: reason
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return new Response(
      JSON.stringify({ 
        eligible: false, 
        reason: 'Lỗi hệ thống khi xác minh avatar',
        error: errorMessage
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
