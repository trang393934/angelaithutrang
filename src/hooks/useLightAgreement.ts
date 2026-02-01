import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

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

      try {
        const { data, error } = await supabase
          .from("user_light_agreements")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error checking light agreement:", error);
          setHasAgreed(false);
        } else {
          setHasAgreed(!!data);
        }
      } catch (error) {
        console.error("Error checking light agreement:", error);
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
