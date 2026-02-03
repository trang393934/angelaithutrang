import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useApiKeys } from "@/hooks/useApiKeys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Key, Copy, Check, AlertTriangle, Loader2, Code } from "lucide-react";

interface CreateApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateApiKeyDialog({ open, onOpenChange }: CreateApiKeyDialogProps) {
  const { t } = useLanguage();
  const { createApiKey, isCreating } = useApiKeys();
  
  const [step, setStep] = useState<"create" | "success">("create");
  const [name, setName] = useState("");
  const [dailyLimit, setDailyLimit] = useState("100");
  const [generatedKey, setGeneratedKey] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast({
        title: t("common.error"),
        description: t("apiKeys.nameRequired"),
        variant: "destructive",
      });
      return;
    }

    const plainKey = await createApiKey(name.trim(), parseInt(dailyLimit));
    
    if (plainKey) {
      setGeneratedKey(plainKey);
      setStep("success");
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedKey);
    setCopied(true);
    toast({
      title: t("apiKeys.copied"),
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    // Reset state when closing
    setStep("create");
    setName("");
    setDailyLimit("100");
    setGeneratedKey("");
    setCopied(false);
    onOpenChange(false);
  };

  const handleDone = () => {
    if (!copied) {
      // Warn user if they haven't copied
      toast({
        title: t("apiKeys.copyWarningTitle"),
        description: t("apiKeys.copyWarning"),
        variant: "destructive",
      });
      return;
    }
    handleClose();
  };

  // Get the edge function URL for the example
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://your-project.supabase.co";
  const exampleUrl = `${supabaseUrl}/functions/v1/angel-chat`;

  return (
    <Dialog open={open} onOpenChange={step === "success" ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-lg" onPointerDownOutside={step === "success" ? (e) => e.preventDefault() : undefined}>
        {step === "create" ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                {t("apiKeys.createNew")}
              </DialogTitle>
              <DialogDescription>
                {t("apiKeys.createDescription")}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="keyName">{t("apiKeys.name")}</Label>
                <Input
                  id="keyName"
                  placeholder={t("apiKeys.namePlaceholder")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={50}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dailyLimit">{t("apiKeys.dailyLimit")}</Label>
                <Select value={dailyLimit} onValueChange={setDailyLimit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50">50 {t("apiKeys.requestsPerDay")}</SelectItem>
                    <SelectItem value="100">100 {t("apiKeys.requestsPerDay")}</SelectItem>
                    <SelectItem value="200">200 {t("apiKeys.requestsPerDay")}</SelectItem>
                    <SelectItem value="500">500 {t("apiKeys.requestsPerDay")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={isCreating}>
                {t("common.cancel")}
              </Button>
              <Button onClick={handleCreate} disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {t("common.loading")}
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4 mr-2" />
                    {t("apiKeys.create")}
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <Check className="h-5 w-5" />
                {t("apiKeys.createSuccess")}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  {t("apiKeys.copyWarning")}
                </p>
              </div>

              <div className="space-y-2">
                <Label>{t("apiKeys.yourKey")}</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-3 bg-muted rounded-lg font-mono text-sm break-all select-all">
                    {generatedKey}
                  </code>
                  <Button
                    size="icon"
                    variant={copied ? "default" : "outline"}
                    onClick={handleCopy}
                    className="flex-shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  {t("apiKeys.usageExample")}
                </Label>
                <pre className="p-3 bg-muted rounded-lg text-xs overflow-x-auto">
{`fetch('${exampleUrl}', {
  method: 'POST',
  headers: {
    'x-api-key': '${generatedKey.substring(0, 15)}...',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'Hello' }]
  })
})`}
                </pre>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleDone} className="w-full sm:w-auto">
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    {t("apiKeys.done")}
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    {t("apiKeys.copyFirst")}
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
