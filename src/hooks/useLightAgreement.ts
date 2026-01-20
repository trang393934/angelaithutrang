import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useLightAgreement() {
  const { user, isLoading: authLoading } = useAuth();
  const [hasAgreed, setHasAgreed] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAgreement = async () => {
      if (authLoading) return;
      
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

  return { hasAgreed, isChecking, isLoading: authLoading || isChecking };
}
