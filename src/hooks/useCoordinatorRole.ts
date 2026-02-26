import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useCoordinatorRole() {
  const { user } = useAuth();

  const { data: hasAccess = false, isLoading } = useQuery({
    queryKey: ["coordinator-role", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .in("role", ["coordinator", "admin"]);
      if (error) return false;
      return (data?.length ?? 0) > 0;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  return { hasAccess, isLoading };
}
