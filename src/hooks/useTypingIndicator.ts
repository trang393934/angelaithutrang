import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useTypingIndicator(conversationPartnerId?: string) {
  const { user } = useAuth();
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingUpdateRef = useRef<number>(0);

  // Send typing indicator
  const sendTypingIndicator = useCallback(async () => {
    if (!user || !conversationPartnerId) return;

    // Throttle to prevent too many updates
    const now = Date.now();
    if (now - lastTypingUpdateRef.current < 1000) return;
    lastTypingUpdateRef.current = now;

    await supabase
      .from("typing_indicators")
      .upsert({
        user_id: user.id,
        conversation_partner_id: conversationPartnerId,
        is_typing: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,conversation_partner_id" });

    // Clear typing after 3 seconds of inactivity
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      clearTypingIndicator();
    }, 3000);
  }, [user, conversationPartnerId]);

  // Clear typing indicator
  const clearTypingIndicator = useCallback(async () => {
    if (!user || !conversationPartnerId) return;

    await supabase
      .from("typing_indicators")
      .delete()
      .eq("user_id", user.id)
      .eq("conversation_partner_id", conversationPartnerId);
  }, [user, conversationPartnerId]);

  // Subscribe to partner's typing status
  useEffect(() => {
    if (!user || !conversationPartnerId) return;

    // Initial fetch
    const fetchTypingStatus = async () => {
      const { data } = await supabase
        .from("typing_indicators")
        .select("*")
        .eq("user_id", conversationPartnerId)
        .eq("conversation_partner_id", user.id)
        .maybeSingle();

      if (data) {
        const updatedAt = new Date(data.updated_at).getTime();
        const threeSecondsAgo = Date.now() - 3000;
        setIsPartnerTyping(data.is_typing && updatedAt > threeSecondsAgo);
      }
    };

    fetchTypingStatus();

    const channel = supabase
      .channel(`typing_${conversationPartnerId}_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "typing_indicators",
          filter: `user_id=eq.${conversationPartnerId}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            setIsPartnerTyping(false);
          } else {
            const data = payload.new as { conversation_partner_id: string; is_typing: boolean };
            if (data.conversation_partner_id === user.id) {
              setIsPartnerTyping(data.is_typing);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      clearTypingIndicator();
    };
  }, [user, conversationPartnerId, clearTypingIndicator]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    isPartnerTyping,
    sendTypingIndicator,
    clearTypingIndicator,
  };
}
