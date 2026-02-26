import { CoordinatorProject } from "@/hooks/useCoordinatorProjects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  in_design: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  testing: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  live: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

interface Props {
  project: CoordinatorProject;
  onDelete?: (id: string) => void;
}

export function ProjectCard({ project, onDelete }: Props) {
  const navigate = useNavigate();

  return (
    <Card className="group hover:shadow-md transition-shadow border-border/60">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold leading-tight">{project.name}</CardTitle>
          <Badge className={STATUS_COLORS[project.status] || STATUS_COLORS.draft} variant="secondary">
            {project.status.replace("_", " ")}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{project.platform_type}</p>
      </CardHeader>
      <CardContent>
        {project.vision_statement && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{project.vision_statement}</p>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Updated {format(new Date(project.updated_at), "MMM d, yyyy")}</span>
          <div className="flex gap-1">
            {onDelete && (
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); onDelete(project.id); }}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
            <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate(`/coordinator-gate/${project.id}`)}>
              Open <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
