import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCamlyCoin } from "@/hooks/useCamlyCoin";

interface GiftRecord {
  id: string;
  sender_id: string;
  receiver_id: string;
  amount: number;
  message: string | null;
  created_at: string;
  sender_profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
  receiver_profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface DonationRecord {
  id: string;
  donor_id: string;
  amount: number;
  message: string | null;
  created_at: string;
  donor_profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface TopGiver {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  total_given: number;
}

interface TopReceiver {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  total_received: number;
}

interface TopDonor {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  total_donated: number;
}

export function useCoinGifts() {
  const { user } = useAuth();
  const { refreshBalance } = useCamlyCoin();
  const [isLoading, setIsLoading] = useState(false);
  const [allGivers, setAllGivers] = useState<TopGiver[]>([]);
  const [allReceivers, setAllReceivers] = useState<TopReceiver[]>([]);
  const [allDonors, setAllDonors] = useState<TopDonor[]>([]);
  const [totalGifted, setTotalGifted] = useState(0);
  const [totalDonated, setTotalDonated] = useState(0);

  // Computed top lists for display
  const topGivers = allGivers.slice(0, 5);
  const topReceivers = allReceivers.slice(0, 5);
  const topDonors = allDonors.slice(0, 10);

  const fetchLeaderboards = useCallback(async () => {
    try {
      // Fetch all givers
      const { data: gifts } = await supabase
        .from("coin_gifts")
        .select("sender_id, amount");

      if (gifts) {
        const giverMap = new Map<string, number>();
        gifts.forEach((g) => {
          giverMap.set(g.sender_id, (giverMap.get(g.sender_id) || 0) + g.amount);
        });

        const giverIds = Array.from(giverMap.keys());
        const { data: giverProfiles } = await supabase
          .from("profiles")
          .select("user_id, display_name, avatar_url")
          .in("user_id", giverIds);

        const givers: TopGiver[] = giverIds
          .map((id) => {
            const profile = giverProfiles?.find((p) => p.user_id === id);
            return {
              user_id: id,
              display_name: profile?.display_name || null,
              avatar_url: profile?.avatar_url || null,
              total_given: giverMap.get(id) || 0,
            };
          })
          .sort((a, b) => b.total_given - a.total_given);

        setAllGivers(givers);
        setTotalGifted(gifts.reduce((sum, g) => sum + g.amount, 0));
      }

      // Fetch all receivers
      const { data: receivedGifts } = await supabase
        .from("coin_gifts")
        .select("receiver_id, amount");

      if (receivedGifts) {
        const receiverMap = new Map<string, number>();
        receivedGifts.forEach((g) => {
          receiverMap.set(g.receiver_id, (receiverMap.get(g.receiver_id) || 0) + g.amount);
        });

        const receiverIds = Array.from(receiverMap.keys());
        const { data: receiverProfiles } = await supabase
          .from("profiles")
          .select("user_id, display_name, avatar_url")
          .in("user_id", receiverIds);

        const receivers: TopReceiver[] = receiverIds
          .map((id) => {
            const profile = receiverProfiles?.find((p) => p.user_id === id);
            return {
              user_id: id,
              display_name: profile?.display_name || null,
              avatar_url: profile?.avatar_url || null,
              total_received: receiverMap.get(id) || 0,
            };
          })
          .sort((a, b) => b.total_received - a.total_received);

        setAllReceivers(receivers);
      }

      // Fetch all donors
      const { data: donations } = await supabase
        .from("project_donations")
        .select("donor_id, amount");

      if (donations) {
        const donorMap = new Map<string, number>();
        donations.forEach((d) => {
          donorMap.set(d.donor_id, (donorMap.get(d.donor_id) || 0) + d.amount);
        });

        const donorIds = Array.from(donorMap.keys());
        const { data: donorProfiles } = await supabase
          .from("profiles")
          .select("user_id, display_name, avatar_url")
          .in("user_id", donorIds);

        const donors: TopDonor[] = donorIds
          .map((id) => {
            const profile = donorProfiles?.find((p) => p.user_id === id);
            return {
              user_id: id,
              display_name: profile?.display_name || null,
              avatar_url: profile?.avatar_url || null,
              total_donated: donorMap.get(id) || 0,
            };
          })
          .sort((a, b) => b.total_donated - a.total_donated);

        setAllDonors(donors);
        setTotalDonated(donations.reduce((sum, d) => sum + d.amount, 0));
      }
    } catch (error) {
      console.error("Error fetching leaderboards:", error);
    }
  }, []);

  const sendGift = async (
    receiverId: string,
    amount: number,
    message?: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!user) {
      return { success: false, message: "Con yêu dấu, hãy đăng ký tài khoản để Ta đồng hành cùng con nhé!" };
    }

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, message: "Phiên đăng nhập hết hạn" };
      }

      const response = await supabase.functions.invoke("process-coin-gift", {
        body: { receiver_id: receiverId, amount, message },
      });

      if (response.error) {
        return { success: false, message: response.error.message || "Lỗi xử lý tặng quà" };
      }

      if (response.data?.error) {
        return { success: false, message: response.data.error };
      }

      await refreshBalance();
      await fetchLeaderboards();

      return { success: true, message: response.data.message };
    } catch (error: any) {
      console.error("Gift error:", error);
      return { success: false, message: error.message || "Lỗi không xác định" };
    } finally {
      setIsLoading(false);
    }
  };

  const donateToProject = async (
    amount: number,
    message?: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!user) {
      return { success: false, message: "Con yêu dấu, hãy đăng ký tài khoản để Ta đồng hành cùng con nhé!" };
    }

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, message: "Phiên đăng nhập hết hạn" };
      }

      const response = await supabase.functions.invoke("process-project-donation", {
        body: { amount, message },
      });

      if (response.error) {
        return { success: false, message: response.error.message || "Lỗi xử lý donate" };
      }

      if (response.data?.error) {
        return { success: false, message: response.data.error };
      }

      await refreshBalance();
      await fetchLeaderboards();

      return { success: true, message: response.data.message };
    } catch (error: any) {
      console.error("Donation error:", error);
      return { success: false, message: error.message || "Lỗi không xác định" };
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboards();
  }, [fetchLeaderboards]);

  // Realtime subscriptions
  useEffect(() => {
    const giftsChannel = supabase
      .channel("coin_gifts_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "coin_gifts" },
        () => fetchLeaderboards()
      )
      .subscribe();

    const donationsChannel = supabase
      .channel("project_donations_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "project_donations" },
        () => fetchLeaderboards()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(giftsChannel);
      supabase.removeChannel(donationsChannel);
    };
  }, [fetchLeaderboards]);

  return {
    isLoading,
    topGivers,
    topReceivers,
    topDonors,
    allGivers,
    allReceivers,
    allDonors,
    totalGifted,
    totalDonated,
    sendGift,
    donateToProject,
    refreshLeaderboards: fetchLeaderboards,
  };
}
