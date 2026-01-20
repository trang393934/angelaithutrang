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

  const checkCompletion = async () => {
    if (authLoading) return;
    
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

  useEffect(() => {
    checkCompletion();
  }, [user, authLoading]);

  const refetch = () => {
    setIsChecking(true);
    checkCompletion();
  };

  return { 
    status, 
    isChecking, 
    isLoading: authLoading || isChecking,
    refetch 
  };
}
