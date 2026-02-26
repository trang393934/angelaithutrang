import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
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
  // Extended policy versioning fields
  policy_hash: string | null;
  ipfs_cid: string | null;
  thresholds: Record<string, unknown> | null;
  caps: Record<string, unknown> | null;
  formulas: Record<string, unknown> | null;
  action_configs: Record<string, unknown> | null;
  is_active: boolean;
  created_at: string;
  activated_at: string | null;
  created_by: string | null;
}

interface PolicyChange {
  id: string;
  policy_version: string;
  change_type: string;
  field_changed: string | null;
  old_value: unknown;
  new_value: unknown;
  changed_by: string | null;
  changed_at: string;
  reason: string | null;
}

interface PolicyOnchain {
  id: string;
  policy_version: string;
  chain_id: number;
  contract_address: string;
  policy_hash: string;
  tx_hash: string;
  block_number: number;
  registered_at: string;
  signer_address: string;
}

export function usePPLPPolicy() {
  // Fetch active policy with react-query
  const { 
    data: activePolicy, 
    isLoading: isPolicyLoading,
    error: policyError,
    refetch: refetchActivePolicy
  } = useQuery({
    queryKey: ["pplp-active-policy"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pplp_policies")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      
      return {
        version: data.version,
        policy_json: data.policy_json as PPLPPolicyData["policy_json"],
        policy_hash: data.policy_hash,
        ipfs_cid: data.ipfs_cid,
        thresholds: data.thresholds as Record<string, unknown> | null,
        caps: data.caps as Record<string, unknown> | null,
        formulas: data.formulas as Record<string, unknown> | null,
        action_configs: data.action_configs as Record<string, unknown> | null,
        is_active: data.is_active ?? false,
        created_at: data.created_at,
        activated_at: data.activated_at,
        created_by: data.created_by
      } as PPLPPolicyData;
    },
  });

  // Fetch all policies
  const { 
    data: allPolicies = [],
    isLoading: isAllPoliciesLoading,
    refetch: refetchAllPolicies
  } = useQuery({
    queryKey: ["pplp-all-policies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pplp_policies")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      return (data || []).map(p => ({
        version: p.version,
        policy_json: p.policy_json as PPLPPolicyData["policy_json"],
        policy_hash: p.policy_hash,
        ipfs_cid: p.ipfs_cid,
        thresholds: p.thresholds as Record<string, unknown> | null,
        caps: p.caps as Record<string, unknown> | null,
        formulas: p.formulas as Record<string, unknown> | null,
        action_configs: p.action_configs as Record<string, unknown> | null,
        is_active: p.is_active ?? false,
        created_at: p.created_at,
        activated_at: p.activated_at,
        created_by: p.created_by
      })) as PPLPPolicyData[];
    },
  });

  // Fetch policy change history
  const { 
    data: policyChanges = [],
    isLoading: isChangesLoading 
  } = useQuery({
    queryKey: ["pplp-policy-changes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pplp_policy_changes")
        .select("*")
        .order("changed_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as PolicyChange[];
    },
  });

  // Fetch on-chain registrations
  const { 
    data: onchainPolicies = [],
    isLoading: isOnchainLoading 
  } = useQuery({
    queryKey: ["pplp-policy-onchain"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pplp_policy_onchain")
        .select("*")
        .order("registered_at", { ascending: false });

      if (error) throw error;
      return data as PolicyOnchain[];
    },
  });

  // Get platform-specific thresholds
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

  // Get action-specific config from current policy
  const getActionConfig = useCallback((actionType: string) => {
    if (!activePolicy?.action_configs) return null;
    return activePolicy.action_configs[actionType] || null;
  }, [activePolicy]);

  // Get policy thresholds (extended)
  const getThresholds = useCallback(() => {
    return activePolicy?.thresholds || {
      min_light_score: 0.6,
      pillar_min: { S: 0.1, T: 0.1, H: 0.1, C: 0.1, U: 0.1 },
    };
  }, [activePolicy]);

  // Get policy caps
  const getCaps = useCallback(() => {
    return activePolicy?.caps || {
      epoch_mint_cap: 100000000,
      user_epoch_cap: 10000,
      min_mint_amount: 1,
      max_mint_amount: 1000000,
    };
  }, [activePolicy]);

  // Get formulas
  const getFormulas = useCallback(() => {
    return activePolicy?.formulas || {
      reward: "BaseReward × Q × I × K",
      light_score: "(S + T + H + C + U) / 5",
    };
  }, [activePolicy]);

  // Validate policy version against on-chain
  const validatePolicyVersion = useCallback(async (version: string) => {
    const { data, error } = await supabase
      .rpc("validate_policy_version", { _version: version });

    if (error) {
      console.error("Policy validation error:", error);
      return { valid: false, error: error.message };
    }

    return data;
  }, []);

  return {
    // Active policy
    activePolicy,
    isLoading: isPolicyLoading,
    policyError,
    
    // All policies (admin)
    allPolicies,
    isAllPoliciesLoading,
    
    // Change history
    policyChanges,
    isChangesLoading,
    
    // On-chain registrations
    onchainPolicies,
    isOnchainLoading,
    
    // Fetch functions
    fetchActivePolicy: refetchActivePolicy,
    fetchAllPolicies: refetchAllPolicies,
    
    // Utility functions
    getPlatformThresholds,
    getActionConfig,
    getThresholds,
    getCaps,
    getFormulas,
    validatePolicyVersion,
  };
}

// Export types
export type { PolicyChange, PolicyOnchain };
