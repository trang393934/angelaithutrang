import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SubmitActionRequest {
  platform_id: string;
  action_type: string;
  target_id?: string;
  metadata?: Record<string, unknown>;
  impact?: Record<string, unknown>;
  integrity?: Record<string, unknown>;
  evidences?: Array<{
    evidence_type: string;
    uri?: string;
    content_hash: string;
    metadata?: Record<string, unknown>;
  }>;
}

// Generate canonical hash for action
function generateCanonicalHash(action: SubmitActionRequest, actor_id: string, timestamp: string): string {
  const canonical = JSON.stringify({
    platform_id: action.platform_id,
    action_type: action.action_type,
    actor_id,
    timestamp,
    metadata: action.metadata || {},
  });
  
  // Simple hash for MVP - in production use crypto.subtle
  let hash = 0;
  for (let i = 0; i < canonical.length; i++) {
    const char = canonical.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `0x${Math.abs(hash).toString(16).padStart(16, '0')}`;
}

// Generate evidence bundle hash
function generateEvidenceHash(evidences: SubmitActionRequest['evidences']): string | null {
  if (!evidences || evidences.length === 0) return null;
  
  const bundle = JSON.stringify(evidences.map(e => e.content_hash).sort());
  let hash = 0;
  for (let i = 0; i < bundle.length; i++) {
    const char = bundle.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `0x${Math.abs(hash).toString(16).padStart(16, '0')}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: claimsError } = await supabase.auth.getUser(token);
    
    if (claimsError || !claims.user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claims.user.id;
    const body: SubmitActionRequest = await req.json();

    // Validate required fields
    if (!body.platform_id || !body.action_type) {
      return new Response(
        JSON.stringify({ error: 'platform_id and action_type are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current active policy version
    const { data: policy, error: policyError } = await supabase
      .from('pplp_policies')
      .select('version')
      .eq('is_active', true)
      .single();

    if (policyError || !policy) {
      console.error('Policy fetch error:', policyError);
      return new Response(
        JSON.stringify({ error: 'No active policy found' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const timestamp = new Date().toISOString();
    const evidenceHash = generateEvidenceHash(body.evidences);

    // Create the action record
    const { data: action, error: actionError } = await supabase
      .from('pplp_actions')
      .insert({
        platform_id: body.platform_id,
        action_type: body.action_type,
        actor_id: userId,
        target_id: body.target_id || null,
        metadata: body.metadata || {},
        impact: body.impact || {},
        integrity: body.integrity || {},
        evidence_hash: evidenceHash,
        policy_version: policy.version,
        status: 'pending',
      })
      .select()
      .single();

    if (actionError) {
      console.error('Action insert error:', actionError);
      return new Response(
        JSON.stringify({ error: 'Failed to create action', details: actionError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert evidences if provided
    if (body.evidences && body.evidences.length > 0) {
      const evidenceRecords = body.evidences.map(e => ({
        action_id: action.id,
        evidence_type: e.evidence_type,
        uri: e.uri || null,
        content_hash: e.content_hash,
        metadata: e.metadata || {},
      }));

      const { error: evidenceError } = await supabase
        .from('pplp_evidences')
        .insert(evidenceRecords);

      if (evidenceError) {
        console.error('Evidence insert error:', evidenceError);
        // Don't fail the whole request, just log
      }
    }

    console.log(`[PPLP] Action submitted: ${action.id} by ${userId} - ${body.platform_id}/${body.action_type}`);

    return new Response(
      JSON.stringify({
        success: true,
        action_id: action.id,
        status: 'pending',
        policy_version: policy.version,
        message: 'Action submitted successfully. Awaiting scoring.',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('PPLP Submit Action error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
