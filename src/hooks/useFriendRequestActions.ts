import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import type { Notification } from "@/hooks/useNotifications";

export function useFriendRequestActions(markAsRead: (id: string) => Promise<void>) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAccept = useCallback(
    async (notif: Notification) => {
      if (!user || isProcessing) return;
      setIsProcessing(true);
      try {
        const { data: friendship } = await supabase
          .from("friendships")
          .select("id")
          .eq("requester_id", notif.actor_id!)
          .eq("addressee_id", user.id)
          .eq("status", "pending")
          .maybeSingle();

        if (friendship) {
          await supabase
            .from("friendships")
            .update({ status: "accepted", updated_at: new Date().toISOString() })
            .eq("id", friendship.id);
          await markAsRead(notif.id);
          toast.success(t("notifications.acceptedRequest"));
        } else {
          toast.error(t("notifications.requestNotFound"));
        }
      } catch {
        toast.error(t("notifications.errorOccurred"));
      } finally {
        setIsProcessing(false);
      }
    },
    [user, isProcessing, markAsRead, t]
  );

  const handleReject = useCallback(
    async (notif: Notification) => {
      if (!user || isProcessing) return;
      setIsProcessing(true);
      try {
        const { data: friendship } = await supabase
          .from("friendships")
          .select("id")
          .eq("requester_id", notif.actor_id!)
          .eq("addressee_id", user.id)
          .eq("status", "pending")
          .maybeSingle();

        if (friendship) {
          await supabase
            .from("friendships")
            .update({ status: "declined", updated_at: new Date().toISOString() })
            .eq("id", friendship.id);
          await markAsRead(notif.id);
          toast.success(t("notifications.rejectedRequest"));
        }
      } catch {
        toast.error(t("notifications.errorOccurred"));
      } finally {
        setIsProcessing(false);
      }
    },
    [user, isProcessing, markAsRead, t]
  );

  return { handleAccept, handleReject, isProcessing };
}
