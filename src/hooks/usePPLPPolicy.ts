import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PPLPPolicyData {
  version: string;
  policy_json: {
    weights: {
      S: number;
      T: number;
      H: number;
      C: number;
      U: number;
    };
    thresholds: {
      min_light_score: number;
      min_integrity_k: number;
    };
    base_reward: number;
    platform_overrides?: Record<string, {
      min_pillar_thresholds?: Record<string, number>;
      min_light_score?: number;
      min_integrity_k?: number;
    }>;
  };
  is_active: boolean;
  created_at: string;
  created_by: string | null;
}

export function usePPLPPolicy() {
  const [activePolicy, setActivePolicy] = useState<PPLPPolicyData | null>(null);
  const [allPolicies, setAllPolicies] = useState<PPLPPolicyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchActivePolicy = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("pplp_policies")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setActivePolicy({
          version: data.version,
          policy_json: data.policy_json as PPLPPolicyData["policy_json"],
          is_active: data.is_active ?? false,
          created_at: data.created_at,
          created_by: data.created_by
        });
      }
    } catch (error) {
      console.error("Error fetching active policy:", error);
    }
  }, []);

  const fetchAllPolicies = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("pplp_policies")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      setAllPolicies((data || []).map(p => ({
        version: p.version,
        policy_json: p.policy_json as PPLPPolicyData["policy_json"],
        is_active: p.is_active ?? false,
        created_at: p.created_at,
        created_by: p.created_by
      })));
    } catch (error) {
      console.error("Error fetching all policies:", error);
    }
  }, []);

  const getPlatformThresholds = useCallback((platformId: string) => {
    if (!activePolicy) return null;

    const defaultThresholds = activePolicy.policy_json.thresholds;
    const platformOverride = activePolicy.policy_json.platform_overrides?.[platformId];

    return {
      min_light_score: platformOverride?.min_light_score ?? defaultThresholds.min_light_score,
      min_integrity_k: platformOverride?.min_integrity_k ?? defaultThresholds.min_integrity_k,
      min_pillar_thresholds: platformOverride?.min_pillar_thresholds ?? {}
    };
  }, [activePolicy]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchActivePolicy(), fetchAllPolicies()]);
      setIsLoading(false);
    };

    loadData();
  }, [fetchActivePolicy, fetchAllPolicies]);

  return {
    activePolicy,
    allPolicies,
    isLoading,
    fetchActivePolicy,
    fetchAllPolicies,
    getPlatformThresholds
  };
}
