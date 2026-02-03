import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generate a secure API key
function generateApiKey(userId: string): string {
  const prefix = userId.substring(0, 5);
  const randomBytes = crypto.getRandomValues(new Uint8Array(24));
  const randomPart = Array.from(randomBytes)
    .map(b => b.toString(36))
    .join('')
    .substring(0, 32);
  return `ak_${prefix}_${randomPart}`;
}

// Hash API key using SHA-256
async function hashApiKey(apiKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get user from JWT token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !userData.user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = userData.user.id;
    console.log(`Creating API key for user: ${userId}`);

    // Parse request body
    const { name, dailyLimit = 100 } = await req.json();

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "API key name is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate daily limit
    const validLimits = [50, 100, 200, 500];
    const limit = validLimits.includes(dailyLimit) ? dailyLimit : 100;

    // Check if user already has 5 active keys
    const { data: existingKeys, error: countError } = await supabase
      .from("user_api_keys")
      .select("id")
      .eq("user_id", userId)
      .eq("is_active", true);

    if (countError) {
      console.error("Error checking existing keys:", countError);
      throw new Error("Failed to check existing keys");
    }

    if (existingKeys && existingKeys.length >= 5) {
      return new Response(
        JSON.stringify({ error: "Maximum 5 active API keys allowed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate new API key
    const plainKey = generateApiKey(userId);
    const keyHash = await hashApiKey(plainKey);
    const keyPrefix = plainKey.substring(0, 12) + "..."; // e.g., "ak_abc12_x9K..."

    console.log(`Generated key with prefix: ${keyPrefix}`);

    // Store hashed key in database
    const { data: newKey, error: insertError } = await supabase
      .from("user_api_keys")
      .insert({
        user_id: userId,
        key_hash: keyHash,
        key_prefix: keyPrefix,
        name: name.trim(),
        daily_limit: limit,
        is_active: true,
      })
      .select("id, key_prefix, name, created_at, daily_limit")
      .single();

    if (insertError) {
      console.error("Error creating API key:", insertError);
      throw new Error("Failed to create API key");
    }

    console.log(`API key created successfully: ${newKey.id}`);

    // Return the plain key (one-time display) along with metadata
    return new Response(
      JSON.stringify({
        success: true,
        apiKey: plainKey, // Plain key - only shown once!
        keyData: {
          id: newKey.id,
          name: newKey.name,
          keyPrefix: newKey.key_prefix,
          dailyLimit: newKey.daily_limit,
          createdAt: newKey.created_at,
        }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Create API key error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "An error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
