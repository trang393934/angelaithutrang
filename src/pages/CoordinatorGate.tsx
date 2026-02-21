import { useAuth } from "@/hooks/useAuth";
import { useCoordinatorRole } from "@/hooks/useCoordinatorRole";
import { useCoordinatorProjects } from "@/hooks/useCoordinatorProjects";
import { ProjectCreateDialog } from "@/components/coordinator/ProjectCreateDialog";
import { ProjectCard } from "@/components/coordinator/ProjectCard";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldAlert, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function CoordinatorGate() {
  const { user, isLoading: authLoading } = useAuth();
  const { hasAccess, isLoading: roleLoading } = useCoordinatorRole();
  const { projects, isLoading: projectsLoading, createProject, deleteProject } = useCoordinatorProjects();
  const navigate = useNavigate();

  if (authLoading || roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
        <ShieldAlert className="h-12 w-12 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Authentication Required</h1>
        <p className="text-muted-foreground mb-4">Please sign in to access Coordinator Gate.</p>
        <Button onClick={() => navigate("/auth")}>Sign In</Button>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
        <ShieldAlert className="h-12 w-12 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Coordinator Access Required</h1>
        <p className="text-muted-foreground mb-4 max-w-md">
          This portal is restricted to verified FUN Coordinators. Please contact an admin to request Coordinator access.
        </p>
        <Button variant="outline" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
        </Button>
      </div>
    );
  }

  const activeProjects = projects.filter((p) => p.status !== "draft");
  const draftProjects = projects.filter((p) => p.status === "draft");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Coordinator Gate</h1>
            <p className="text-sm text-muted-foreground">Build the Light Economy Together</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Home
            </Button>
            <ProjectCreateDialog onSubmit={(data) => createProject.mutate(data)} isPending={createProject.isPending} />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {projectsLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20">
            <h2 className="text-xl font-semibold mb-2">No projects yet</h2>
            <p className="text-muted-foreground mb-6">Create your first project to start building with Angel AI.</p>
            <ProjectCreateDialog onSubmit={(data) => createProject.mutate(data)} isPending={createProject.isPending} />
          </div>
        ) : (
          <div className="space-y-8">
            {activeProjects.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-3">Active Projects</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeProjects.map((p) => (
                    <ProjectCard key={p.id} project={p} onDelete={(id) => deleteProject.mutate(id)} />
                  ))}
                </div>
              </section>
            )}
            {draftProjects.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-3">Drafts</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {draftProjects.map((p) => (
                    <ProjectCard key={p.id} project={p} onDelete={(id) => deleteProject.mutate(id)} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
