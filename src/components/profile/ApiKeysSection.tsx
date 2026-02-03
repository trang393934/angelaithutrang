import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useApiKeys, ApiKey } from "@/hooks/useApiKeys";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { 
  Key, 
  Plus, 
  Copy, 
  Trash2, 
  Pause, 
  Play, 
  Loader2,
  Clock,
  Activity,
  AlertTriangle,
  Shield
} from "lucide-react";
import { CreateApiKeyDialog } from "./CreateApiKeyDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from "date-fns";

export function ApiKeysSection() {
  const { t } = useLanguage();
  const { apiKeys, isLoading, deleteApiKey, toggleApiKey, canCreateMore } = useApiKeys();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState<string | null>(null);

  const handleCopyKeyId = (keyPrefix: string) => {
    navigator.clipboard.writeText(keyPrefix);
    toast({
      title: t("apiKeys.copied"),
      description: keyPrefix,
    });
  };

  const handleDeleteClick = (keyId: string) => {
    setKeyToDelete(keyId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!keyToDelete) return;
    
    setIsDeleting(true);
    const success = await deleteApiKey(keyToDelete);
    setIsDeleting(false);
    setDeleteDialogOpen(false);
    setKeyToDelete(null);

    if (success) {
      toast({
        title: t("common.success"),
        description: t("apiKeys.deleted"),
      });
    }
  };

  const handleToggle = async (keyId: string) => {
    setIsToggling(keyId);
    await toggleApiKey(keyId);
    setIsToggling(null);
  };

  const formatLastUsed = (lastUsed: string | null) => {
    if (!lastUsed) return t("apiKeys.never");
    return formatDistanceToNow(new Date(lastUsed), { addSuffix: true });
  };

  if (isLoading) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-background to-muted/30">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-primary/20 bg-gradient-to-br from-background to-muted/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">{t("apiKeys.title")}</CardTitle>
            </div>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              disabled={!canCreateMore}
              size="sm"
              className="gap-1"
            >
              <Plus className="h-4 w-4" />
              {t("apiKeys.createNew")}
            </Button>
          </div>
          <CardDescription>
            {t("apiKeys.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {apiKeys.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{t("apiKeys.noKeys")}</p>
              <p className="text-sm mt-1">{t("apiKeys.createFirst")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {apiKeys.map((key) => (
                <ApiKeyCard
                  key={key.id}
                  apiKey={key}
                  onCopy={() => handleCopyKeyId(key.key_prefix)}
                  onDelete={() => handleDeleteClick(key.id)}
                  onToggle={() => handleToggle(key.id)}
                  isToggling={isToggling === key.id}
                  formatLastUsed={formatLastUsed}
                />
              ))}
            </div>
          )}

          {!canCreateMore && apiKeys.length >= 5 && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-amber-600 dark:text-amber-400">
                {t("apiKeys.maxKeysReached")}
              </span>
            </div>
          )}

          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border">
            <Shield className="h-4 w-4 text-muted-foreground mt-0.5" />
            <p className="text-xs text-muted-foreground">
              {t("apiKeys.securityNote")}
            </p>
          </div>
        </CardContent>
      </Card>

      <CreateApiKeyDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("apiKeys.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("apiKeys.deleteConfirm")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface ApiKeyCardProps {
  apiKey: ApiKey;
  onCopy: () => void;
  onDelete: () => void;
  onToggle: () => void;
  isToggling: boolean;
  formatLastUsed: (lastUsed: string | null) => string;
}

function ApiKeyCard({ apiKey, onCopy, onDelete, onToggle, isToggling, formatLastUsed }: ApiKeyCardProps) {
  const { t } = useLanguage();

  return (
    <div className={`p-4 rounded-lg border transition-colors ${
      apiKey.is_active 
        ? "bg-card border-border" 
        : "bg-muted/30 border-muted opacity-70"
    }`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium truncate">{apiKey.name}</span>
            <Badge variant={apiKey.is_active ? "default" : "secondary"} className="text-xs">
              {apiKey.is_active ? t("apiKeys.active") : t("apiKeys.inactive")}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono">
            <code className="bg-muted px-2 py-0.5 rounded text-xs">
              {apiKey.key_prefix}
            </code>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {t("apiKeys.lastUsed")}: {formatLastUsed(apiKey.last_used_at)}
            </span>
            <span className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              {t("apiKeys.todayUsage").replace("{used}", String(apiKey.todayUsage || 0)).replace("{limit}", String(apiKey.daily_limit))}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onCopy}
            className="h-8 w-8"
            title={t("apiKeys.copy")}
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            disabled={isToggling}
            className="h-8 w-8"
            title={apiKey.is_active ? t("apiKeys.disable") : t("apiKeys.enable")}
          >
            {isToggling ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : apiKey.is_active ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            title={t("common.delete")}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
