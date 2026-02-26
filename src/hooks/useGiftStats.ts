import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface GiftStatsData {
  totalGiven: number;
  totalReceived: number;
  giftsSentCount: number;
  giftsReceivedCount: number;
  isTopGiver: boolean;
  isTopReceiver: boolean;
  giverRank: number | null;
  receiverRank: number | null;
  isLoading: boolean;
}

export function useGiftStats(userId?: string) {
  const [data, setData] = useState<GiftStatsData>({
    totalGiven: 0,
    totalReceived: 0,
    giftsSentCount: 0,
    giftsReceivedCount: 0,
    isTopGiver: false,
    isTopReceiver: false,
    giverRank: null,
    receiverRank: null,
    isLoading: true,
  });

  useEffect(() => {
    if (!userId) {
      setData((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    const fetch = async () => {
      try {
        const [sentRes, receivedRes, topGiversRes, topReceiversRes] = await Promise.all([
          supabase
            .from("coin_gifts")
            .select("amount")
            .eq("sender_id", userId),
          supabase
            .from("coin_gifts")
            .select("amount")
            .eq("receiver_id", userId),
          supabase
            .from("coin_gifts")
            .select("sender_id, amount"),
          supabase
            .from("coin_gifts")
            .select("receiver_id, amount"),
        ]);

        const totalGiven = (sentRes.data || []).reduce((s, r) => s + (r.amount || 0), 0);
        const totalReceived = (receivedRes.data || []).reduce((s, r) => s + (r.amount || 0), 0);

        // Calculate giver ranks
        const giverMap = new Map<string, number>();
        (topGiversRes.data || []).forEach((r: any) => {
          giverMap.set(r.sender_id, (giverMap.get(r.sender_id) || 0) + (r.amount || 0));
        });
        const giverRanking = [...giverMap.entries()].sort((a, b) => b[1] - a[1]);
        const giverIdx = giverRanking.findIndex(([id]) => id === userId);

        // Calculate receiver ranks
        const receiverMap = new Map<string, number>();
        (topReceiversRes.data || []).forEach((r: any) => {
          receiverMap.set(r.receiver_id, (receiverMap.get(r.receiver_id) || 0) + (r.amount || 0));
        });
        const receiverRanking = [...receiverMap.entries()].sort((a, b) => b[1] - a[1]);
        const receiverIdx = receiverRanking.findIndex(([id]) => id === userId);

        setData({
          totalGiven,
          totalReceived,
          giftsSentCount: sentRes.data?.length || 0,
          giftsReceivedCount: receivedRes.data?.length || 0,
          isTopGiver: giverIdx >= 0 && giverIdx < 10,
          isTopReceiver: receiverIdx >= 0 && receiverIdx < 10,
          giverRank: giverIdx >= 0 ? giverIdx + 1 : null,
          receiverRank: receiverIdx >= 0 ? receiverIdx + 1 : null,
          isLoading: false,
        });
      } catch (err) {
        console.error("Error fetching gift stats:", err);
        setData((prev) => ({ ...prev, isLoading: false }));
      }
    };

    fetch();
  }, [userId]);

  return data;
}
