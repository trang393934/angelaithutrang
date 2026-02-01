import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

const AGREEMENT_CHECK_TIMEOUT = 10000; // 10 seconds

export function useLightAgreement() {
  const { user, isLoading: authLoading } = useAuth();
  const [hasAgreed, setHasAgreed] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Don't start checking until auth is done loading
    if (authLoading) {
      setIsChecking(true);
      return;
    }

    const checkAgreement = async () => {
      // If no user after auth loading is complete, mark as not agreed
      if (!user) {
        setHasAgreed(false);
        setIsChecking(false);
        return;
      }

      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Agreement check timeout")), AGREEMENT_CHECK_TIMEOUT)
      );

      try {
        const queryPromise = supabase
          .from("user_light_agreements")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        // Race between query and timeout
        const result = await Promise.race([queryPromise, timeoutPromise]);
        
        if ((result as any).error) {
          console.error("Error checking light agreement:", (result as any).error);
          // On error, fallback to false - user will be asked to agree again
          setHasAgreed(false);
        } else {
          setHasAgreed(!!(result as any).data);
        }
      } catch (error) {
        console.error("Error/timeout checking light agreement:", error);
        // On timeout or error, fallback to false - user can proceed to agree
        setHasAgreed(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkAgreement();
  }, [user, authLoading]);

  // Only consider checking done when auth is done AND we've finished our check
  const isReallyChecking = authLoading || isChecking;
  
  return { hasAgreed, isChecking: isReallyChecking, isLoading: isReallyChecking };
}
