import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface PPLPDispute {
  id: string;
  action_id: string;
  submitted_by: string;
  reason: string;
  evidence: Record<string, unknown>;
  status: "open" | "investigating" | "resolved" | "rejected";
  assigned_to: string | null;
  resolution: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateDisputeParams {
  action_id: string;
  reason: string;
  evidence?: Record<string, unknown>;
}

export function usePPLPDisputes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [disputes, setDisputes] = useState<PPLPDispute[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDisputes = useCallback(async (options?: { 
    status?: PPLPDispute["status"]; 
    limit?: number;
    adminView?: boolean;
  }) => {
    if (!user) return;

    setIsLoading(true);
    try {
      let query = supabase
        .from("pplp_disputes")
        .select("*")
        .order("created_at", { ascending: false });

      // If not admin view, only show user's own disputes
      if (!options?.adminView) {
        query = query.eq("submitted_by", user.id);
      }

      if (options?.status) {
        query = query.eq("status", options.status);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      setDisputes((data || []) as unknown as PPLPDispute[]);
    } catch (error) {
      console.error("Error fetching disputes:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const createDispute = useCallback(async (params: CreateDisputeParams) => {
    if (!user) {
      toast({
        title: "Chưa đăng nhập",
        description: "Vui lòng đăng nhập để tạo khiếu nại",
        variant: "destructive"
      });
      return null;
    }

    setIsSubmitting(true);
    try {
      const insertData: {
        action_id: string;
        submitted_by: string;
        reason: string;
        evidence: Record<string, string | number | boolean | null>;
        status: "open";
      } = {
        action_id: params.action_id,
        submitted_by: user.id,
        reason: params.reason,
        evidence: (params.evidence || {}) as Record<string, string | number | boolean | null>,
        status: "open" as const
      };

      const { data, error } = await supabase
        .from("pplp_disputes")
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Đã gửi khiếu nại",
        description: "Chúng con sẽ xem xét và phản hồi sớm nhất"
      });

      await fetchDisputes();
      return data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Có lỗi xảy ra";
      toast({
        title: "Lỗi",
        description: message,
        variant: "destructive"
      });
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [user, toast, fetchDisputes]);

  const updateDisputeStatus = useCallback(async (
    disputeId: string, 
    status: PPLPDispute["status"],
    resolution?: string
  ) => {
    if (!user) return null;

    try {
      const updateData: Record<string, unknown> = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === "resolved" || status === "rejected") {
        updateData.resolved_by = user.id;
        updateData.resolved_at = new Date().toISOString();
        if (resolution) {
          updateData.resolution = resolution;
        }
      }

      if (status === "investigating") {
        updateData.assigned_to = user.id;
      }

      const { data, error } = await supabase
        .from("pplp_disputes")
        .update(updateData)
        .eq("id", disputeId)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Đã cập nhật trạng thái",
        description: `Khiếu nại đã được cập nhật thành ${status}`
      });

      await fetchDisputes({ adminView: true });
      return data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Có lỗi xảy ra";
      toast({
        title: "Lỗi",
        description: message,
        variant: "destructive"
      });
      return null;
    }
  }, [user, toast, fetchDisputes]);

  return {
    disputes,
    isLoading,
    isSubmitting,
    fetchDisputes,
    createDispute,
    updateDisputeStatus
  };
}
