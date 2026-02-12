import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface LiXiNotification {
  id: string;
  camlyAmount: number;
  funAmount: number;
}

export function useLiXiCelebration() {
  const { user } = useAuth();
  const [pendingLiXi, setPendingLiXi] = useState<LiXiNotification | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const fetchPendingLiXi = async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id, metadata")
        .eq("user_id", user.id)
        .eq("type", "tet_lixi_reward")
        .eq("is_read", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Lỗi kiểm tra notification Lì xì:", error);
        return;
      }

      if (data && data.metadata) {
        // Check if already claimed this notification
        const { data: existingClaim } = await supabase
          .from("lixi_claims")
          .select("id")
          .eq("notification_id", data.id)
          .eq("user_id", user.id)
          .maybeSingle();

        if (existingClaim) return; // Already claimed

        const meta = data.metadata as Record<string, unknown>;
        setPendingLiXi({
          id: data.id,
          camlyAmount: Number(meta.camly_amount) || 0,
          funAmount: Number(meta.fun_amount) || 0,
        });
        setShowPopup(true);
      }
    };

    fetchPendingLiXi();
  }, [user?.id]);

  const claim = async () => {
    if (!pendingLiXi || !user?.id) return;

    setIsClaiming(true);
    try {
      // Get user's wallet address
      const { data: walletData } = await supabase
        .from("user_wallet_addresses")
        .select("wallet_address")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!walletData?.wallet_address) {
        toast.error("Vui lòng kết nối ví Web3 trước khi nhận Lì xì.", { duration: 5000 });
        setIsClaiming(false);
        return;
      }

      // Insert claim record
      const { data: claimRecord, error: claimError } = await supabase
        .from("lixi_claims")
        .insert({
          user_id: user.id,
          notification_id: pendingLiXi.id,
          camly_amount: pendingLiXi.camlyAmount,
          fun_amount: pendingLiXi.funAmount,
          wallet_address: walletData.wallet_address,
          status: "pending",
        })
        .select("id")
        .single();

      if (claimError || !claimRecord) {
        console.error("Lỗi tạo yêu cầu claim:", claimError);
        toast.error("Không thể gửi yêu cầu claim. Vui lòng thử lại.");
        return;
      }

      // Mark notification as read
      await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", pendingLiXi.id);

      // Show processing toast
      toast.loading("🧧 Đang chuyển Camly Coin on-chain...", { id: "lixi-claim" });

      // Call edge function to process on-chain transfer
      const { data: session } = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-lixi-claim`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.session?.access_token}`,
          },
          body: JSON.stringify({ claim_id: claimRecord.id }),
        }
      );

      const result = await response.json();

      if (result.success && result.tx_hash) {
        toast.success(
          `🧧 Đã chuyển ${pendingLiXi.camlyAmount.toLocaleString()} Camly Coin thành công!`,
          {
            id: "lixi-claim",
            duration: 8000,
            action: {
              label: "Xem TX",
              onClick: () => window.open(`https://bscscan.com/tx/${result.tx_hash}`, "_blank"),
            },
          }
        );
      } else {
        toast.error(result.error || "Chuyển on-chain thất bại. Admin sẽ xử lý.", {
          id: "lixi-claim",
          duration: 6000,
        });
      }

      setShowPopup(false);
      setPendingLiXi(null);
    } catch (error) {
      console.error("Lỗi claim Lì xì:", error);
      toast.error("Đã xảy ra lỗi khi xử lý claim.", { id: "lixi-claim" });
    } finally {
      setIsClaiming(false);
    }
  };

  return {
    showPopup,
    setShowPopup,
    pendingLiXi,
    claim,
    isClaiming,
  };
}
