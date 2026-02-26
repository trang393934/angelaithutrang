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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("AI service not configured");
    }

    // Verify admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await adminClient.auth.getUser(token);
    if (authError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin");

    if (!roleData || roleData.length === 0) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { targets = ["chat_history"], limit = 20, dryRun = false } = await req.json();
    
    console.log(`[repair] Starting repair: targets=${targets}, limit=${limit}, dryRun=${dryRun}`);

    const results: { target: string; scanned: number; repaired: number; ids: string[]; errors: string[] }[] = [];

    // Corruption detection pattern
    const corruptionPattern = /\uFFFD|[a-zàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]\?\?[a-zàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/i;

    async function repairText(text: string, context?: string): Promise<string | null> {
      const prompt = `You are a Vietnamese text repair tool. The input text has encoding corruption where Vietnamese characters were damaged (e.g., "thực" became "thc", "của" became "ca" or "c\uFFFDa", "giá trị" became "gi??á tr??ị").

Your task: Reconstruct the CORRECT Vietnamese text with proper diacritics and characters. Return ONLY the repaired plain text, no explanation, no markdown.

${context ? `Context question: "${context.substring(0, 200)}"` : ""}

Corrupted text to repair:
${text.substring(0, 3000)}`;

      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            { role: "user", content: prompt }
          ],
          stream: false,
          max_tokens: 4000,
        }),
      });

      if (!resp.ok) return null;
      const data = await resp.json();
      return data.choices?.[0]?.message?.content || null;
    }

    // --- chat_history ---
    if (targets.includes("chat_history")) {
      const result = { target: "chat_history", scanned: 0, repaired: 0, ids: [] as string[], errors: [] as string[] };
      
      const { data: rows, error } = await adminClient
        .from("chat_history")
        .select("id, answer_text, question_text")
        .limit(limit * 5); // Fetch more to filter

      if (error) {
        result.errors.push(error.message);
      } else {
        const corruptedRows = (rows || []).filter(r => corruptionPattern.test(r.answer_text)).slice(0, limit);
        result.scanned = corruptedRows.length;

        for (const row of corruptedRows) {
          try {
            const repaired = await repairText(row.answer_text, row.question_text);
            if (repaired && !dryRun) {
              await adminClient.from("chat_history").update({ answer_text: repaired }).eq("id", row.id);
              result.repaired++;
              result.ids.push(row.id);
            } else if (repaired && dryRun) {
              result.repaired++;
              result.ids.push(row.id);
            }
          } catch (e) {
            result.errors.push(`${row.id}: ${e instanceof Error ? e.message : "unknown"}`);
          }
        }
      }
      results.push(result);
    }

    // --- coordinator_chat_messages ---
    if (targets.includes("coordinator")) {
      const result = { target: "coordinator_chat_messages", scanned: 0, repaired: 0, ids: [] as string[], errors: [] as string[] };
      
      const { data: rows, error } = await adminClient
        .from("coordinator_chat_messages")
        .select("id, content")
        .eq("role", "assistant")
        .limit(limit * 5);

      if (error) {
        result.errors.push(error.message);
      } else {
        const corruptedRows = (rows || []).filter(r => corruptionPattern.test(r.content)).slice(0, limit);
        result.scanned = corruptedRows.length;

        for (const row of corruptedRows) {
          try {
            const repaired = await repairText(row.content);
            if (repaired && !dryRun) {
              await adminClient.from("coordinator_chat_messages").update({ content: repaired }).eq("id", row.id);
              result.repaired++;
              result.ids.push(row.id);
            } else if (repaired && dryRun) {
              result.repaired++;
              result.ids.push(row.id);
            }
          } catch (e) {
            result.errors.push(`${row.id}: ${e instanceof Error ? e.message : "unknown"}`);
          }
        }
      }
      results.push(result);
    }

    // --- cached_responses ---
    if (targets.includes("cached_responses")) {
      const result = { target: "cached_responses", scanned: 0, repaired: 0, ids: [] as string[], errors: [] as string[] };
      
      const { data: rows, error } = await adminClient
        .from("cached_responses")
        .select("id, response, question_normalized")
        .limit(limit * 5);

      if (error) {
        result.errors.push(error.message);
      } else {
        const corruptedRows = (rows || []).filter(r => corruptionPattern.test(r.response)).slice(0, limit);
        result.scanned = corruptedRows.length;

        for (const row of corruptedRows) {
          try {
            const repaired = await repairText(row.response, row.question_normalized);
            if (repaired && !dryRun) {
              await adminClient.from("cached_responses").update({ response: repaired }).eq("id", row.id);
              result.repaired++;
              result.ids.push(row.id);
            } else if (repaired && dryRun) {
              result.repaired++;
              result.ids.push(row.id);
            }
          } catch (e) {
            result.errors.push(`${row.id}: ${e instanceof Error ? e.message : "unknown"}`);
          }
        }
      }
      results.push(result);
    }

    console.log(`[repair] Complete:`, JSON.stringify(results));

    return new Response(JSON.stringify({ success: true, dryRun, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Repair error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
