import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface MismatchedMint {
  recipientAddress: string;
  totalAmount: number;
  txHashes: string[];
}

export function useWalletMismatch(
  connectedAddress: string | undefined,
  allocationIsZero: boolean
) {
  const { user } = useAuth();
  const [mismatch, setMismatch] = useState<MismatchedMint | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (!user?.id || !connectedAddress || !allocationIsZero) {
      setMismatch(null);
      return;
    }

    let cancelled = false;

    const check = async () => {
      setIsChecking(true);
      try {
        const normalizedConnected = connectedAddress.toLowerCase();

        // Query mint requests where the user is the actor but recipient is different
        const { data, error } = await supabase
          .from("pplp_mint_requests")
          .select("recipient_address, amount, tx_hash, actor_id")
          .eq("status", "minted")
          .eq("actor_id", user.id)
          .not("tx_hash", "is", null);

        if (error || !data || cancelled) return;

        // Filter for mismatched addresses
        const mismatched = data.filter(
          (r) => r.recipient_address?.toLowerCase() !== normalizedConnected
        );

        if (mismatched.length === 0) {
          setMismatch(null);
          return;
        }

        // Group by recipient address and sum amounts
        const totalAmount = mismatched.reduce(
          (sum, r) => sum + Number(r.amount || 0),
          0
        );
        const txHashes = mismatched
          .map((r) => r.tx_hash)
          .filter(Boolean) as string[];

        // Use the first recipient address (most common case: single wallet)
        setMismatch({
          recipientAddress: mismatched[0].recipient_address!,
          totalAmount,
          txHashes,
        });
      } catch {
        // Silently fail – this is a UX enhancement, not critical
      } finally {
        if (!cancelled) setIsChecking(false);
      }
    };

    check();
    return () => {
      cancelled = true;
    };
  }, [user?.id, connectedAddress, allocationIsZero]);

  return { mismatch, isChecking };
}
