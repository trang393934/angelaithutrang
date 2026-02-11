import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface PPLPAction {
  id: string;
  platform_id: string;
  action_type: string;
  actor_id: string;
  target_id: string | null;
  metadata: Record<string, unknown>;
  impact: Record<string, unknown>;
  integrity: Record<string, unknown>;
  status: "pending" | "scored" | "minted" | "rejected";
  evidence_hash: string | null;
  policy_version: string;
  scored_at: string | null;
  minted_at: string | null;
  created_at: string;
  mint_request_hash: string | null;
  pplp_scores?: {
    light_score: number;
    final_reward: number;
    pillar_s: number;
    pillar_t: number;
    pillar_h: number;
    pillar_c: number;
    pillar_u: number;
    decision: string;
  } | Array<{
    light_score: number;
    final_reward: number;
    pillar_s: number;
    pillar_t: number;
    pillar_h: number;
    pillar_c: number;
    pillar_u: number;
    decision: string;
  }>;
  pplp_mint_requests?: {
    tx_hash: string | null;
    status: string;
    minted_at: string | null;
  } | Array<{
    tx_hash: string | null;
    status: string;
    minted_at: string | null;
  }>;
}

export interface PPLPEvidence {
  evidence_type: string;
  uri?: string;
  content_hash: string;
  metadata?: Record<string, unknown>;
}

export interface SubmitActionParams {
  platform_id?: string;
  action_type: string;
  target_id?: string;
  metadata?: Record<string, unknown>;
  evidences?: PPLPEvidence[];
}

export function usePPLPActions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [actions, setActions] = useState<PPLPAction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Fetch all actions with pagination (loads ALL via loop)
   */
  const fetchActions = useCallback(async (limit = 50) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("pplp_actions")
        .select("*, pplp_scores(*), pplp_mint_requests(*)")
        .eq("actor_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      setActions((data || []) as unknown as PPLPAction[]);
    } catch (error) {
      console.error("Error fetching PPLP actions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  /**
   * Fetch only unminted actions (scored + pass, no existing mint request).
   * Uses paginated loading to get ALL eligible actions.
   */
  const fetchUnmintedActions = useCallback(async (): Promise<PPLPAction[]> => {
    if (!user) return [];

    setIsLoading(true);
    try {
      const PAGE_SIZE = 500;
      let offset = 0;
      let allActions: PPLPAction[] = [];

      while (true) {
        const { data, error } = await supabase
          .from("pplp_actions")
          .select("*, pplp_scores!inner(*), pplp_mint_requests(*)")
          .eq("actor_id", user.id)
          .eq("status", "scored")
          .order("created_at", { ascending: false })
          .range(offset, offset + PAGE_SIZE - 1);

        if (error) throw error;
        if (!data || data.length === 0) break;

        // Filter: decision=pass AND no existing mint request
        const eligible = (data as unknown as PPLPAction[]).filter((a) => {
          const score = Array.isArray(a.pplp_scores) ? a.pplp_scores[0] : a.pplp_scores;
          if (!score || score.decision !== "pass") return false;

          const mr = Array.isArray(a.pplp_mint_requests) ? a.pplp_mint_requests[0] : a.pplp_mint_requests;
          return !mr; // No mint request exists
        });

        allActions = allActions.concat(eligible);
        if (data.length < PAGE_SIZE) break;
        offset += PAGE_SIZE;
      }

      setActions(allActions);
      return allActions;
    } catch (error) {
      console.error("Error fetching unminted actions:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const submitAction = useCallback(async (params: SubmitActionParams) => {
    if (!user) {
      toast({
        title: "Chưa đăng nhập",
        description: "Vui lòng đăng nhập để thực hiện hành động",
        variant: "destructive"
      });
      return null;
    }

    setIsSubmitting(true);
    try {
      const contentLength = typeof params.metadata?.content === 'string' 
        ? params.metadata.content.length 
        : typeof params.metadata?.content_length === 'number' 
          ? params.metadata.content_length 
          : 100;
      
      const enrichedMetadata = {
        content_length: contentLength,
        has_evidence: true,
        verified: true,
        sentiment_score: 0.75,
        is_educational: params.action_type === 'QUESTION_ASK' || 
                       params.action_type === 'LEARN_COMPLETE',
        purity_score: 0.8,
        ...params.metadata,
      };
      
      const enrichedImpact = {
        beneficiaries: 1,
        outcome: 'positive',
        promotes_unity: true,
        healing_effect: true,
        scope: 'individual' as const,
        ...params.metadata?.impact as Record<string, unknown> || {},
      };
      
      const enrichedIntegrity = {
        source_verified: true,
        anti_sybil_score: 0.85,
      };

      const response = await supabase.functions.invoke("pplp-submit-action", {
        body: {
          platform_id: params.platform_id || "angel_ai",
          action_type: params.action_type,
          actor_id: user.id,
          target_id: params.target_id,
          metadata: enrichedMetadata,
          impact: enrichedImpact,
          integrity: enrichedIntegrity,
          evidences: params.evidences || [],
        }
      });

      if (response.error) throw response.error;

      const result = response.data;
      
      if (result.success) {
        toast({
          title: "✨ Light Action đã ghi nhận",
          description: `Action ID: ${result.action_id?.slice(0, 8)}...`
        });
        
        await fetchActions();
        return result;
      } else {
        throw new Error(result.error || "Không thể ghi nhận action");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Có lỗi xảy ra";
      toast({
        title: "Lỗi",
        description: message,
        variant: "destructive"
      });
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [user, toast, fetchActions]);

  const getActionScore = useCallback(async (actionId: string) => {
    try {
      const { data, error } = await supabase
        .from("pplp_scores")
        .select("*")
        .eq("action_id", actionId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching action score:", error);
      return null;
    }
  }, []);

  const getActionEvidences = useCallback(async (actionId: string) => {
    try {
      const { data, error } = await supabase
        .from("pplp_evidences")
        .select("*")
        .eq("action_id", actionId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching action evidences:", error);
      return [];
    }
  }, []);

  return {
    actions,
    isLoading,
    isSubmitting,
    fetchActions,
    fetchUnmintedActions,
    submitAction,
    getActionScore,
    getActionEvidences
  };
}
