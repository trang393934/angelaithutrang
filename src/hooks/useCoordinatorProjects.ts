import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

export interface CoordinatorProject {
  id: string;
  user_id: string;
  name: string;
  platform_type: string;
  value_model: string;
  token_flow_model: string;
  vision_statement: string;
  status: string;
  metadata: Json;
  created_at: string;
  updated_at: string;
}

export interface ProjectVersion {
  id: string;
  project_id: string;
  version_number: number;
  change_summary: string;
  snapshot_data: Json;
  created_at: string;
}

export function useCoordinatorProjects() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const projectsQuery = useQuery({
    queryKey: ["coordinator-projects", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coordinator_projects")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as unknown as CoordinatorProject[];
    },
    enabled: !!user,
  });

  const createProject = useMutation({
    mutationFn: async (project: {
      name: string;
      platform_type: string;
      value_model: string;
      token_flow_model: string;
      vision_statement: string;
    }) => {
      const { data, error } = await supabase
        .from("coordinator_projects")
        .insert({ ...project, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data as unknown as CoordinatorProject;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coordinator-projects"] });
      toast.success("Project created successfully");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateProject = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CoordinatorProject> & { id: string }) => {
      const { data, error } = await supabase
        .from("coordinator_projects")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as CoordinatorProject;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coordinator-projects"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteProject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("coordinator_projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coordinator-projects"] });
      toast.success("Project deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { projects: projectsQuery.data ?? [], isLoading: projectsQuery.isLoading, createProject, updateProject, deleteProject };
}

export function useProjectVersions(projectId: string | undefined) {
  const queryClient = useQueryClient();

  const versionsQuery = useQuery({
    queryKey: ["coordinator-versions", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coordinator_project_versions")
        .select("*")
        .eq("project_id", projectId!)
        .order("version_number", { ascending: false });
      if (error) throw error;
      return data as unknown as ProjectVersion[];
    },
    enabled: !!projectId,
  });

  const saveVersion = useMutation({
    mutationFn: async ({ projectId, changeSummary, snapshotData }: { projectId: string; changeSummary: string; snapshotData: Json }) => {
      const nextVersion = (versionsQuery.data?.[0]?.version_number ?? 0) + 1;
      const { data, error } = await supabase
        .from("coordinator_project_versions")
        .insert({
          project_id: projectId,
          version_number: nextVersion,
          change_summary: changeSummary,
          snapshot_data: snapshotData,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coordinator-versions", projectId] });
      toast.success("Version saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { versions: versionsQuery.data ?? [], isLoading: versionsQuery.isLoading, saveVersion };
}
