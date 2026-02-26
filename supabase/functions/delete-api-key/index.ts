import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    // Parse request body
    const { keyId, action } = await req.json();

    if (!keyId) {
      return new Response(
        JSON.stringify({ error: "API key ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the key belongs to this user
    const { data: existingKey, error: fetchError } = await supabase
      .from("user_api_keys")
      .select("id, user_id, is_active")
      .eq("id", keyId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !existingKey) {
      console.error("Key not found or doesn't belong to user:", fetchError);
      return new Response(
        JSON.stringify({ error: "API key not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle different actions
    if (action === "toggle") {
      // Toggle active status
      const { error: updateError } = await supabase
        .from("user_api_keys")
        .update({ is_active: !existingKey.is_active })
        .eq("id", keyId);

      if (updateError) {
        console.error("Error toggling API key:", updateError);
        throw new Error("Failed to update API key");
      }

      console.log(`API key ${keyId} toggled to: ${!existingKey.is_active}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: existingKey.is_active ? "API key disabled" : "API key enabled",
          isActive: !existingKey.is_active
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else {
      // Delete the key
      const { error: deleteError } = await supabase
        .from("user_api_keys")
        .delete()
        .eq("id", keyId);

      if (deleteError) {
        console.error("Error deleting API key:", deleteError);
        throw new Error("Failed to delete API key");
      }

      console.log(`API key ${keyId} deleted`);

      return new Response(
        JSON.stringify({ success: true, message: "API key deleted" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

  } catch (error) {
    console.error("Delete/Toggle API key error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "An error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
