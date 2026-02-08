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

      // Insert claim record
      const { error: claimError } = await supabase
        .from("lixi_claims")
        .insert({
          user_id: user.id,
          notification_id: pendingLiXi.id,
          camly_amount: pendingLiXi.camlyAmount,
          fun_amount: pendingLiXi.funAmount,
          wallet_address: walletData?.wallet_address || null,
          status: "pending",
        });

      if (claimError) {
        console.error("Lỗi tạo yêu cầu claim:", claimError);
        toast.error("Không thể gửi yêu cầu claim. Vui lòng thử lại.");
        return;
      }

      // Mark notification as read
      await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", pendingLiXi.id);

      // Send notification to admin about the claim request
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin")
        .limit(5);

      if (adminRoles && adminRoles.length > 0) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("user_id", user.id)
          .maybeSingle();

        const adminNotifications = adminRoles.map((admin) => ({
          user_id: admin.user_id,
          type: "lixi_claim_request",
          title: "🧧 Yêu cầu Claim Lì xì mới",
          content: `${profile?.display_name || "Người dùng"} đã yêu cầu claim ${pendingLiXi.camlyAmount.toLocaleString()} Camly Coin từ chương trình Lì xì Tết.`,
          metadata: {
            claimer_id: user.id,
            camly_amount: pendingLiXi.camlyAmount,
            fun_amount: pendingLiXi.funAmount,
            wallet_address: walletData?.wallet_address || null,
          },
        }));

        await supabase.from("notifications").insert(adminNotifications);
      }

      toast.success("🧧 Yêu cầu claim đã gửi! Admin sẽ chuyển thưởng đến ví Web3 của bạn.", {
        duration: 5000,
      });

      setShowPopup(false);
      setPendingLiXi(null);
    } catch (error) {
      console.error("Lỗi claim Lì xì:", error);
      toast.error("Đã xảy ra lỗi khi gửi yêu cầu claim.");
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
