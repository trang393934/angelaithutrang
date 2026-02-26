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
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { userId, email, scanType } = await req.json();

    if (!userId || !email) {
      return new Response(
        JSON.stringify({ error: "userId and email required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const alerts: Array<{
      alert_type: string;
      matched_pattern?: string;
      severity: string;
      details: Record<string, unknown>;
    }> = [];

    // 1. Kiểm tra email với sybil_pattern_registry
    const { data: patterns } = await supabase
      .from("sybil_pattern_registry")
      .select("*")
      .eq("is_active", true);

    if (patterns) {
      for (const pattern of patterns) {
        const emailLower = email.toLowerCase();
        const patternLower = pattern.pattern_value.toLowerCase();

        let matched = false;
        if (pattern.pattern_type === "email_suffix") {
          matched = emailLower.includes(patternLower);
        } else if (pattern.pattern_type === "email_prefix") {
          matched = emailLower.startsWith(patternLower);
        }

        if (matched) {
          alerts.push({
            alert_type: "email_pattern",
            matched_pattern: pattern.pattern_value,
            severity: pattern.severity,
            details: {
              email,
              pattern_type: pattern.pattern_type,
              pattern_id: pattern.id,
              description: pattern.description,
            },
          });
        }
      }
    }

    // 2. Kiểm tra bulk registration burst (>3 accounts in 2 hours with similar prefix)
    const emailPrefix = email.substring(0, 5).toLowerCase();
    const { data: recentSimilar, error: recentErr } = await supabase.rpc("get_recent_similar_registrations", {
      _email_prefix: emailPrefix,
      _user_id: userId,
    }).single();

    // Fallback: direct query
    if (recentErr) {
      // Use direct approach via auth users joined with agreements
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const { data: recentAgreements } = await supabase
        .from("user_light_agreements")
        .select("user_id")
        .gte("agreed_at", twoHoursAgo)
        .neq("user_id", userId)
        .limit(50);

      if (recentAgreements && recentAgreements.length >= 3) {
        alerts.push({
          alert_type: "bulk_registration",
          severity: "high",
          details: {
            email,
            email_prefix: emailPrefix,
            recent_registrations_2h: recentAgreements.length,
            message: `${recentAgreements.length} new accounts registered in the last 2 hours`,
          },
        });
      }
    }

    // 3. Kiểm tra withdrawal spike (nếu scanType = 'withdrawal')
    if (scanType === "withdrawal") {
      const today = new Date().toISOString().split("T")[0];
      const { count: wdCount } = await supabase
        .from("coin_withdrawals")
        .select("id", { count: "exact" })
        .eq("status", "pending")
        .gte("created_at", today);

      if ((wdCount || 0) >= 5) {
        alerts.push({
          alert_type: "withdrawal_spike",
          severity: "medium",
          details: {
            email,
            pending_withdrawals_today: wdCount,
            message: `${wdCount} pending withdrawals today - potential spike`,
          },
        });
      }
    }

    // Insert all alerts
    if (alerts.length > 0) {
      await supabase.from("fraud_alerts").insert(
        alerts.map((a) => ({
          user_id: userId,
          alert_type: a.alert_type,
          matched_pattern: a.matched_pattern || null,
          severity: a.severity,
          details: a.details,
        }))
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        alerts_created: alerts.length,
        is_suspicious: alerts.some((a) => a.severity === "critical" || a.severity === "high"),
        alerts,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Fraud scanner error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
