import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface ProfileCompletionStatus {
  isComplete: boolean;
  missingFields: string[];
  profile: {
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null;
  } | null;
}

export function useProfileCompletion() {
  const { user, isLoading: authLoading } = useAuth();
  const [status, setStatus] = useState<ProfileCompletionStatus | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Don't start checking until auth is done loading
    if (authLoading) {
      setIsChecking(true);
      return;
    }

    const checkCompletion = async () => {
      // If no user after auth loading is complete
      if (!user) {
        setStatus({
          isComplete: false,
          missingFields: ["user"],
          profile: null,
        });
        setIsChecking(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("display_name, avatar_url, bio")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error checking profile completion:", error);
          setStatus({
            isComplete: false,
            missingFields: ["error"],
            profile: null,
          });
          setIsChecking(false);
          return;
        }

        // Check required fields (wallet address is NOT required)
        const missingFields: string[] = [];
        
        if (!data?.display_name || data.display_name.trim() === "") {
          missingFields.push("display_name");
        }
        if (!data?.avatar_url || data.avatar_url.trim() === "") {
          missingFields.push("avatar_url");
        }
        if (!data?.bio || data.bio.trim() === "") {
          missingFields.push("bio");
        }

        setStatus({
          isComplete: missingFields.length === 0,
          missingFields,
          profile: data,
        });
      } catch (error) {
        console.error("Error checking profile completion:", error);
        setStatus({
          isComplete: false,
          missingFields: ["error"],
          profile: null,
        });
      } finally {
        setIsChecking(false);
      }
    };

    checkCompletion();
  }, [user, authLoading]);

  const refetch = () => {
    setIsChecking(true);
    // Re-trigger the effect by calling it directly
    if (!authLoading && user) {
      const doRefetch = async () => {
        try {
          const { data, error } = await supabase
            .from("profiles")
            .select("display_name, avatar_url, bio")
            .eq("user_id", user.id)
            .maybeSingle();

          if (error) {
            setStatus({
              isComplete: false,
              missingFields: ["error"],
              profile: null,
            });
            return;
          }

          const missingFields: string[] = [];
          if (!data?.display_name || data.display_name.trim() === "") {
            missingFields.push("display_name");
          }
          if (!data?.avatar_url || data.avatar_url.trim() === "") {
            missingFields.push("avatar_url");
          }
          if (!data?.bio || data.bio.trim() === "") {
            missingFields.push("bio");
          }

          setStatus({
            isComplete: missingFields.length === 0,
            missingFields,
            profile: data,
          });
        } finally {
          setIsChecking(false);
        }
      };
      doRefetch();
    }
  };

  // Only consider checking done when auth is done AND we've finished our check
  const isReallyChecking = authLoading || isChecking;

  return { 
    status, 
    isChecking: isReallyChecking, 
    isLoading: isReallyChecking,
    refetch 
  };
}
