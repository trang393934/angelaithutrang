import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCoordinatorRole } from "@/hooks/useCoordinatorRole";
import { useCoordinatorProjects, useProjectVersions } from "@/hooks/useCoordinatorProjects";
import { useCoordinatorChat } from "@/hooks/useCoordinatorChat";
import { ModeSelector } from "@/components/coordinator/ModeSelector";
import { RoleSelector } from "@/components/coordinator/RoleSelector";
import { CoordinatorChat } from "@/components/coordinator/CoordinatorChat";
import { CoordinatorSpecPreview } from "@/components/coordinator/CoordinatorSpecPreview";
import { VersionHistory } from "@/components/coordinator/VersionHistory";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, PanelRightOpen, PanelRightClose, Info } from "lucide-react";

export default function CoordinatorProject() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { hasAccess, isLoading: roleLoading } = useCoordinatorRole();
  const { projects } = useCoordinatorProjects();
  const { versions, saveVersion } = useProjectVersions(projectId);
  const { messages, isStreaming, streamingContent, sendMessage } = useCoordinatorChat(projectId);

  const [mode, setMode] = useState("product_spec");
  const [aiRole, setAiRole] = useState("product_architect");
  const [showPreview, setShowPreview] = useState(true);

  const project = projects.find((p) => p.id === projectId);

  if (authLoading || roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !hasAccess) {
    navigate("/coordinator-gate");
    return null;
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-muted-foreground mb-4">Project not found</p>
        <Button variant="outline" onClick={() => navigate("/coordinator-gate")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
      </div>
    );
  }

  const handleSend = (content: string) => {
    sendMessage(content, mode, aiRole, {
      name: project.name,
      platform_type: project.platform_type,
      value_model: project.value_model,
      token_flow_model: project.token_flow_model,
      vision_statement: project.vision_statement,
      status: project.status,
    }, messages);
  };

  const handleSaveVersion = () => {
    const assistantMessages = messages.filter((m) => m.role === "assistant");
    const snapshotMessages = messages.map((m) => ({ role: m.role, content: m.content }));
    saveVersion.mutate({
      projectId: project.id,
      changeSummary: `${assistantMessages.length} AI outputs saved`,
      snapshotData: { messages: snapshotMessages, mode, aiRole } as unknown as import("@/integrations/supabase/types").Json,
    });
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top bar */}
      <header className="border-b bg-background/95 backdrop-blur px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/coordinator-gate")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-sm font-semibold leading-tight">{project.name}</h1>
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="text-[10px] h-4">{project.platform_type}</Badge>
              <Badge variant="secondary" className="text-[10px] h-4">{project.status}</Badge>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowPreview(!showPreview)}>
          {showPreview ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
        </Button>
      </header>

      {/* 3-column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <aside className="w-[260px] border-r flex flex-col overflow-y-auto shrink-0 p-4 space-y-6">
          {/* Project info */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <Info className="h-3 w-3" /> Project
            </div>
            {project.value_model && <p className="text-xs text-muted-foreground">Model: {project.value_model}</p>}
            {project.token_flow_model && <p className="text-xs text-muted-foreground">Token: {project.token_flow_model}</p>}
            {project.vision_statement && <p className="text-xs text-muted-foreground italic line-clamp-3">"{project.vision_statement}"</p>}
          </div>

          <ModeSelector selected={mode} onSelect={setMode} />
          <RoleSelector selected={aiRole} onSelect={setAiRole} />
          <VersionHistory versions={versions} onSaveVersion={handleSaveVersion} isSaving={saveVersion.isPending} />
        </aside>

        {/* Center: Chat */}
        <main className="flex-1 min-w-0">
          <CoordinatorChat
            messages={messages}
            isStreaming={isStreaming}
            streamingContent={streamingContent}
            mode={mode}
            aiRole={aiRole}
            onSend={handleSend}
          />
        </main>

        {/* Right: Spec Preview */}
        {showPreview && (
          <aside className="w-[320px] shrink-0">
            <CoordinatorSpecPreview
              messages={messages}
              streamingContent={isStreaming ? streamingContent : undefined}
              onClose={() => setShowPreview(false)}
            />
          </aside>
        )}
      </div>
    </div>
  );
}
