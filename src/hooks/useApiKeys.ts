import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

export interface ApiKey {
  id: string;
  key_prefix: string;
  name: string;
  created_at: string;
  last_used_at: string | null;
  is_active: boolean;
  daily_limit: number;
  total_requests: number;
  todayUsage?: number;
}

export function useApiKeys() {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Fetch user's API keys
  const fetchApiKeys = useCallback(async () => {
    if (!user) {
      setApiKeys([]);
      setIsLoading(false);
      return;
    }

    try {
      // Fetch API keys
      const { data: keys, error } = await supabase
        .from("user_api_keys")
        .select("id, key_prefix, name, created_at, last_used_at, is_active, daily_limit, total_requests")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch today's usage for each key
      const today = new Date().toISOString().split('T')[0];
      const { data: usageData } = await supabase
        .from("api_key_usage")
        .select("api_key_id, request_count")
        .eq("usage_date", today);

      const usageMap = new Map<string, number>();
      usageData?.forEach(u => {
        usageMap.set(u.api_key_id, u.request_count);
      });

      const keysWithUsage = (keys || []).map(key => ({
        ...key,
        todayUsage: usageMap.get(key.id) || 0
      }));

      setApiKeys(keysWithUsage);
    } catch (error) {
      console.error("Error fetching API keys:", error);
      toast({
        title: "Error",
        description: "Failed to load API keys",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchApiKeys();
  }, [fetchApiKeys]);

  // Create new API key
  const createApiKey = async (name: string, dailyLimit: number = 100): Promise<string | null> => {
    if (!user) return null;

    setIsCreating(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        throw new Error("No authentication token");
      }

      const response = await supabase.functions.invoke("create-api-key", {
        body: { name, dailyLimit },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to create API key");
      }

      const { apiKey, keyData } = response.data;

      // Add new key to state
      setApiKeys(prev => [{
        id: keyData.id,
        key_prefix: keyData.keyPrefix,
        name: keyData.name,
        created_at: keyData.createdAt,
        last_used_at: null,
        is_active: true,
        daily_limit: keyData.dailyLimit,
        total_requests: 0,
        todayUsage: 0,
      }, ...prev]);

      return apiKey; // Return plain key for one-time display
    } catch (error) {
      console.error("Error creating API key:", error);
      const message = error instanceof Error ? error.message : "Failed to create API key";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  // Delete API key
  const deleteApiKey = async (keyId: string): Promise<boolean> => {
    try {
      const response = await supabase.functions.invoke("delete-api-key", {
        body: { keyId },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to delete API key");
      }

      setApiKeys(prev => prev.filter(k => k.id !== keyId));
      return true;
    } catch (error) {
      console.error("Error deleting API key:", error);
      toast({
        title: "Error",
        description: "Failed to delete API key",
        variant: "destructive",
      });
      return false;
    }
  };

  // Toggle API key active status
  const toggleApiKey = async (keyId: string): Promise<boolean> => {
    try {
      const response = await supabase.functions.invoke("delete-api-key", {
        body: { keyId, action: "toggle" },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to update API key");
      }

      setApiKeys(prev => prev.map(k => 
        k.id === keyId ? { ...k, is_active: response.data.isActive } : k
      ));
      return true;
    } catch (error) {
      console.error("Error toggling API key:", error);
      toast({
        title: "Error",
        description: "Failed to update API key",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    apiKeys,
    isLoading,
    isCreating,
    createApiKey,
    deleteApiKey,
    toggleApiKey,
    refetch: fetchApiKeys,
    canCreateMore: apiKeys.filter(k => k.is_active).length < 5,
  };
}
