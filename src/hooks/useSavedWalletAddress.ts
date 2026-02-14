import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export function useSavedWalletAddress() {
  const { user } = useAuth();
  const [savedAddress, setSavedAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSavedAddress = useCallback(async () => {
    if (!user?.id) {
      setSavedAddress(null);
      return;
    }
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from("user_wallet_addresses")
        .select("wallet_address")
        .eq("user_id", user.id)
        .maybeSingle();
      setSavedAddress(data?.wallet_address ?? null);
    } catch (err) {
      console.warn("[SavedWallet] Failed to fetch:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchSavedAddress();
  }, [fetchSavedAddress]);

  const shortSavedAddress = savedAddress
    ? `${savedAddress.slice(0, 6)}...${savedAddress.slice(-4)}`
    : null;

  return { savedAddress, shortSavedAddress, isLoading, refetch: fetchSavedAddress };
}
