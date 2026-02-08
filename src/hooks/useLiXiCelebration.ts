import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface LiXiNotification {
  id: string;
  camlyAmount: number;
  funAmount: number;
}

export function useLiXiCelebration() {
  const { user } = useAuth();
  const [pendingLiXi, setPendingLiXi] = useState<LiXiNotification | null>(null);
  const [showPopup, setShowPopup] = useState(false);

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
    if (!pendingLiXi) return;

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", pendingLiXi.id);

    if (error) {
      console.error("Lỗi đánh dấu notification đã đọc:", error);
    }

    setShowPopup(false);
    setPendingLiXi(null);
  };

  return {
    showPopup,
    setShowPopup,
    pendingLiXi,
    claim,
  };
}
