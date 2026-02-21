import { ProjectVersion } from "@/hooks/useCoordinatorProjects";
import { Button } from "@/components/ui/button";
import { Save, History } from "lucide-react";
import { format } from "date-fns";

interface Props {
  versions: ProjectVersion[];
  onSaveVersion: () => void;
  isSaving?: boolean;
}

export function VersionHistory({ versions, onSaveVersion, isSaving }: Props) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Versions</p>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={onSaveVersion} disabled={isSaving}>
          <Save className="h-3 w-3" /> Save
        </Button>
      </div>
      {versions.length === 0 && (
        <p className="text-xs text-muted-foreground px-1">No versions saved yet</p>
      )}
      {versions.slice(0, 10).map((v) => (
        <div key={v.id} className="flex items-center gap-2 px-2 py-1.5 rounded text-xs hover:bg-muted/40 transition-colors">
          <History className="h-3 w-3 text-muted-foreground shrink-0" />
          <div className="min-w-0">
            <span className="font-medium">v{v.version_number}</span>
            <span className="text-muted-foreground ml-1.5">{format(new Date(v.created_at), "MMM d, HH:mm")}</span>
            {v.change_summary && <p className="text-muted-foreground truncate">{v.change_summary}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
