import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ECOSYSTEM_CONTEXT = `
# FUN Ecosystem Architecture

## Core Principles
- **FUN Money** = Vision Layer (on-chain, BEP-20 on BSC). Minted through PPLP protocol. Represents verified positive contributions.
- **Camly Coin** = Flow Layer (off-chain, internal). Earned through daily activities. 1:1 conversion ratio with FUN Money upon minting.
- **PPLP Protocol** (Proof of Positive Life Protocol) v1.0.2: 5D Light Economy framework.
  - 5 Dimensions: Chân thật (S), Đóng góp (T), Chữa lành (H), Phụng sự (C), Hợp nhất (U)
  - Daily cap: 5M FUN/day. Light Score >= 60 required.
  - 14 platforms scored in real-time.
  - Evidence Anchoring via keccak256 hash on-chain.

## Platform Types
- FUN Profile, FUN Play, FUN Wallet, FUN Farm, FUN Academy, FUN Life, FUN Earth, FUN Planet, FUN Charity, FUN Treasury, FU Trading, FU Legal

## Value Models
- Learn & Earn, Share & Have, Play & Grow, Create & Prosper, Heal & Thrive, Serve & Shine

## Token Flow
- Users earn Camly Coin → accumulate → request mint → PPLP scores → if pass → FUN Money minted on-chain
- FUN Money distribution: User (variable%) + Genesis Fund + Partners Fund + Platform Fund
- Recycling: Unearned/expired rewards return to ecosystem pool

## Governance
- Light Constitution: Core values and principles
- Master Charter: Organizational structure
- PoPL Score: Individual Light Score (0-100) based on behavior

## Language Style
- Warm, encouraging, professional
- Vietnamese primary, English secondary
- Use "Ánh sáng" (Light) metaphors naturally
- Reference "5 chiều" (5 Dimensions) when discussing value
`;

const MODE_PROMPTS: Record<string, string> = {
  product_spec: `You are in Product Spec Mode. Generate structured product documentation including:
- Vision & Mission
- Target Users (personas)
- Core Features (prioritized)
- User Stories
- Monetization Logic
- Token Integration (FUN Money + Camly Coin)
- Technical Requirements
- Roadmap (phased)
Format output as clean Markdown with headers and bullet points.`,

  smart_contract: `You are in Smart Contract Mode. Focus on:
- Token logic (mint/burn/transfer conditions)
- Reward distribution formulas
- Security considerations (reentrancy, overflow, access control)
- Gas optimization
- Upgrade patterns (proxy/diamond)
- Integration with PPLP protocol
- Audit checklist
Provide Solidity code snippets when relevant.`,

  tokenomics: `You are in Tokenomics Mode. Analyze and design:
- Supply model (total, circulating, locked)
- Inflation/deflation mechanics
- Reward sustainability (daily caps, diminishing returns)
- Incentive design (staking, LP, governance)
- Token velocity management
- Simulation scenarios (bull/bear/stagnant)
- Risk assessment
Use tables and formulas where appropriate.`,

  ux_flow: `You are in UX Flow Mode. Design:
- User journeys (step-by-step)
- Screen descriptions and wireframes (text-based)
- Interaction logic and state management
- Error handling and edge cases
- Accessibility considerations
- Mobile-first responsive patterns
- Onboarding flow optimization
Present as structured flow diagrams in Markdown.`,

  growth: `You are in Growth Strategy Mode. Plan:
- Launch strategy (soft/hard launch phases)
- Network effects and viral loops
- Referral mechanics with token incentives
- Community building tactics
- Partnership opportunities within FUN Ecosystem
- Metrics and KPIs
- Growth experiments framework
Focus on actionable, measurable strategies.`,

  governance: `You are in Light Governance Check Mode. Evaluate:
- PPLP Protocol alignment (5D scoring compatibility)
- Ecosystem compliance (token flow rules)
- Long-term sustainability (reward pool depletion risk)
- Reward imbalance detection
- Anti-manipulation safeguards
- Light Constitution compliance
- Suggested improvements for ecosystem harmony
Flag any violations or risks clearly with severity levels.`,
};

const ROLE_PROMPTS: Record<string, string> = {
  product_architect: `You are acting as a **Product Architect**. You think in systems, user flows, and feature prioritization. You validate ideas against user needs and ecosystem fit. You output structured PRDs and roadmaps.`,
  smart_contract_architect: `You are acting as a **Smart Contract Architect**. You think in Solidity patterns, security vectors, and gas efficiency. You validate token logic against PPLP rules. You output secure, auditable code.`,
  tokenomics_guardian: `You are acting as a **Tokenomics Guardian**. You think in supply dynamics, inflation models, and incentive alignment. You validate sustainability against ecosystem caps. You flag unsustainable models immediately.`,
  growth_strategist: `You are acting as a **Growth Strategist**. You think in viral coefficients, retention curves, and network effects. You design growth loops that align with Light Economy principles. You measure everything.`,
  legal_architect: `You are acting as a **Legal & Compliance Architect**. You think in regulatory frameworks, token classification, and user protection. You validate against Vietnamese and international crypto regulations. You flag legal risks.`,
  pplp_guardian: `You are acting as a **PPLP Guardian**. You are the authority on the Proof of Positive Life Protocol. You validate everything against the 5D framework (S, T, H, C, U). You ensure Light Score integrity and anti-fraud compliance.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["coordinator", "admin"]);

    if (!roleData || roleData.length === 0) {
      return new Response(JSON.stringify({ error: "Coordinator access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, mode, ai_role, project_context, stream: streamParam } = await req.json();
    const shouldStream = streamParam !== false;

    const modePrompt = MODE_PROMPTS[mode] || MODE_PROMPTS.product_spec;
    const rolePrompt = ROLE_PROMPTS[ai_role] || ROLE_PROMPTS.product_architect;

    let projectContextStr = "";
    if (project_context) {
      projectContextStr = `
## Current Project Context
- **Project Name**: ${project_context.name || "Untitled"}
- **Platform Type**: ${project_context.platform_type || "Custom"}
- **Value Model**: ${project_context.value_model || "Not specified"}
- **Token Flow Model**: ${project_context.token_flow_model || "Not specified"}
- **Vision**: ${project_context.vision_statement || "Not specified"}
- **Status**: ${project_context.status || "Draft"}
`;
    }

    const systemPrompt = `${rolePrompt}

${modePrompt}

${ECOSYSTEM_CONTEXT}

${projectContextStr}

## Response Guidelines
- Always respond in the same language as the user's message (Vietnamese or English)
- Use structured Markdown formatting
- Be specific and actionable
- Reference ecosystem rules when relevant
- Flag any conflicts with PPLP or ecosystem architecture
`;

    // --- AI Gateway Config (Lovable primary for Vietnamese stability) ---
    const LOVABLE_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
    const CF_GATEWAY_URL = "https://gateway.ai.cloudflare.com/v1/6083e34ad429331916b93ba8a5ede81d/angel-ai/compat/chat/completions";
    const CF_API_TOKEN = Deno.env.get("CF_API_TOKEN");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!CF_API_TOKEN && !LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[coordinator-chat] Using gateway: Lovable (primary), stream=${shouldStream}`);

    const aiBody = JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      stream: shouldStream,
    });

    let response = await fetch(LOVABLE_GATEWAY_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: aiBody,
    });

    // Fallback: Lovable fails (not 429/402) → retry via Cloudflare
    if (!response.ok && CF_API_TOKEN && response.status !== 429 && response.status !== 402) {
      console.log(`[coordinator-chat] Lovable error ${response.status}, falling back to Cloudflare`);
      response = await fetch(CF_GATEWAY_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${CF_API_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google-ai-studio/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          stream: shouldStream,
        }),
      });
    }

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- NON-STREAM MODE ---
    if (!shouldStream) {
      const jsonData = await response.json();
      const content = jsonData.choices?.[0]?.message?.content || "";
      return new Response(JSON.stringify({ content }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- STREAM MODE ---
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("coordinator-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
