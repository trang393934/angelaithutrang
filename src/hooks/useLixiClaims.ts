import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface LixiClaim {
  id: string;
  user_id: string;
  notification_id: string;
  camly_amount: number;
  fun_amount: number;
  wallet_address: string | null;
  status: string;
  tx_hash: string | null;
  claimed_at: string;
  processed_at: string | null;
  processed_by: string | null;
  error_message: string | null;
}

export function useLixiClaims() {
  const [claims, setClaims] = useState<LixiClaim[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchClaims = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("lixi_claims")
        .select("*")
        .order("claimed_at", { ascending: false });

      if (error) {
        console.error("Error fetching lixi claims:", error);
        return;
      }

      setClaims((data as LixiClaim[]) || []);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("lixi_claims_admin")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "lixi_claims",
        },
        () => {
          fetchClaims();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchClaims]);

  const updateClaimStatus = async (
    claimId: string,
    status: string,
    txHash?: string,
    errorMessage?: string
  ) => {
    const updateData: Record<string, unknown> = {
      status,
      processed_at: new Date().toISOString(),
    };

    if (txHash) updateData.tx_hash = txHash;
    if (errorMessage) updateData.error_message = errorMessage;

    const { error } = await supabase
      .from("lixi_claims")
      .update(updateData)
      .eq("id", claimId);

    if (error) {
      console.error("Error updating claim:", error);
      return false;
    }

    return true;
  };

  // Get claim by user display_name (via profiles lookup)
  const getClaimByUserName = (
    userName: string,
    nameToUserIdMap: Map<string, string>
  ): LixiClaim | undefined => {
    const userId = nameToUserIdMap.get(userName);
    if (!userId) return undefined;
    return claims.find((c) => c.user_id === userId);
  };

  return {
    claims,
    isLoading,
    fetchClaims,
    updateClaimStatus,
    getClaimByUserName,
  };
}
