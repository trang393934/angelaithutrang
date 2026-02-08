import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface MintRequest {
  id: string;
  action_id: string;
  actor_id: string;
  recipient_address: string;
  amount: number;
  action_hash: string;
  evidence_hash: string;
  policy_version: number;
  nonce: number;
  signature: string | null;
  signer_address: string | null;
  status: "pending" | "approved" | "signed" | "minted" | "rejected" | "expired";
  tx_hash: string | null;
  minted_at: string | null;
  created_at: string;
  updated_at: string;
  valid_after: string;
  valid_before: string;
}

/**
 * Hook to manage FUN Money mint requests.
 * Flow: User requests mint → Admin reviews → Admin signs → On-chain lock
 */
export function useMintRequest() {
  const { user } = useAuth();
  const [isRequesting, setIsRequesting] = useState(false);

  /**
   * Create a new mint request for a scored action.
   * This does NOT trigger on-chain minting - it creates a pending request
   * that admin must approve first.
   */
  const requestMint = useCallback(
    async (actionId: string, walletAddress: string): Promise<boolean> => {
      if (!user) {
        toast.error("Vui lòng đăng nhập");
        return false;
      }

      if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
        toast.error("Địa chỉ ví không hợp lệ");
        return false;
      }

      setIsRequesting(true);

      try {
        // Check if action exists and is scored with pass
        const { data: action, error: actionError } = await supabase
          .from("pplp_actions")
          .select("id, actor_id, action_type, status, evidence_hash, pplp_scores(final_reward, decision)")
          .eq("id", actionId)
          .eq("actor_id", user.id)
          .single();

        if (actionError || !action) {
          toast.error("Không tìm thấy action");
          return false;
        }

        if (action.status === "minted") {
          toast.info("Action này đã được mint");
          return false;
        }

        if (action.status !== "scored") {
          toast.error("Action chưa được chấm điểm");
          return false;
        }

        // Resolve score (one-to-one join can return object or array)
        const scoreRaw = action.pplp_scores;
        const score = Array.isArray(scoreRaw) ? scoreRaw[0] : scoreRaw;

        if (!score || score.decision !== "pass") {
          toast.error("Action không đạt điều kiện mint (Light Score < 60)");
          return false;
        }

        // Check for existing mint request
        const { data: existing } = await supabase
          .from("pplp_mint_requests")
          .select("id, status")
          .eq("action_id", actionId)
          .maybeSingle();

        if (existing) {
          if (existing.status === "minted") {
            toast.info("Action này đã được mint on-chain");
            return false;
          }
          if (existing.status === "pending" || existing.status === "signed") {
            toast.info("Yêu cầu mint đang được xử lý");
            return false;
          }
        }

        // Create or update mint request as "pending"
        const actionHash = "0x" + Array.from(
          new Uint8Array(
            await crypto.subtle.digest("SHA-256", new TextEncoder().encode(action.action_type))
          )
        ).map(b => b.toString(16).padStart(2, "0")).join("");

        const evidenceHash = action.evidence_hash || "0x" + "0".repeat(64);

        const { error: upsertError } = await supabase
          .from("pplp_mint_requests")
          .upsert(
            {
              action_id: actionId,
              actor_id: user.id,
              recipient_address: walletAddress,
              amount: score.final_reward,
              action_hash: actionHash,
              evidence_hash: evidenceHash,
              policy_version: 1,
              nonce: 0, // Will be set by admin when signing
              status: "pending",
              signature: null,
              signer_address: null,
              tx_hash: null,
              minted_at: null,
            },
            { onConflict: "action_id" }
          );

        if (upsertError) {
          console.error("Mint request error:", upsertError);
          toast.error("Không thể tạo yêu cầu mint");
          return false;
        }

        toast.success("🎯 Yêu cầu mint đã gửi! Admin sẽ xem xét và phê duyệt.");
        return true;
      } catch (error) {
        console.error("requestMint error:", error);
        toast.error("Có lỗi xảy ra khi gửi yêu cầu mint");
        return false;
      } finally {
        setIsRequesting(false);
      }
    },
    [user]
  );

  /**
   * Get mint request for a specific action
   */
  const getMintRequest = useCallback(
    async (actionId: string): Promise<MintRequest | null> => {
      const { data } = await supabase
        .from("pplp_mint_requests")
        .select("*")
        .eq("action_id", actionId)
        .maybeSingle();

      return data as MintRequest | null;
    },
    []
  );

  return {
    requestMint,
    getMintRequest,
    isRequesting,
  };
}
