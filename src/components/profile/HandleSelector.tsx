import { useHandle } from "@/hooks/useHandle";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Check, X, Loader2, Link as LinkIcon, Clock, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface HandleSelectorProps {
  onClaimed?: (handle: string) => void;
  showLabel?: boolean;
  compact?: boolean;
  source?: "signup" | "settings";
}

export function HandleSelector({ onClaimed, showLabel = true, compact = false, source = "settings" }: HandleSelectorProps) {
  const {
    handle,
    currentHandle,
    checkResult,
    isChecking,
    isClaiming,
    validationError,
    canChangeHandle,
    daysUntilChange,
    handleInputChange,
    claimHandle,
    selectSuggestion,
  } = useHandle();

  const handleClaim = async () => {
    const success = await claimHandle();
    if (success) {
      toast({
        title: "✨ Link đã được đặt!",
        description: `fun.rich/${handle} là của bạn rồi!`,
      });
      onClaimed?.(handle);
    } else if (!checkResult?.available) {
      toast({
        title: "Không thể đặt link này",
        description: checkResult?.reason || "Vui lòng chọn tên khác",
        variant: "destructive",
      });
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    selectSuggestion(suggestion);
  };

  const isChanged = handle !== (currentHandle || "");
  const canSave = checkResult?.available && isChanged && !isChecking && !isClaiming;

  if (!canChangeHandle && currentHandle) {
    return (
      <div className="space-y-2">
        {showLabel && (
          <Label className="text-sm font-medium flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-divine-gold" />
            FUN Profile Link
          </Label>
        )}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
          <span className="text-sm text-muted-foreground">fun.rich/</span>
          <span className="text-sm font-medium text-foreground">{currentHandle}</span>
          <Badge variant="outline" className="ml-auto text-xs">
            <Clock className="w-3 h-3 mr-1" />
            Đổi sau {daysUntilChange} ngày
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {showLabel && (
        <Label className="text-sm font-medium flex items-center gap-2">
          <LinkIcon className="w-4 h-4 text-divine-gold" />
          {source === "signup" ? "Chọn FUN Link của bạn" : "FUN Profile Link"}
        </Label>
      )}

      {source === "signup" && (
        <p className="text-xs text-muted-foreground">
          Đây là link hồ sơ công khai của bạn, giống LinkedIn. Ví dụ: <span className="font-medium text-divine-gold">fun.rich/camly_duong</span>
        </p>
      )}

      <div className="flex gap-2">
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none select-none">
            fun.rich/
          </div>
          <Input
            value={handle}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="your_name"
            className={cn(
              "pl-[5.5rem] pr-10",
              checkResult?.available === true && "border-primary/50 focus-visible:ring-primary/30",
              checkResult?.available === false && "border-destructive/50 focus-visible:ring-destructive/30",
              validationError && "border-destructive/50"
            )}
            maxLength={30}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isChecking && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
            {!isChecking && checkResult?.available === true && <Check className="w-4 h-4 text-primary" />}
            {!isChecking && checkResult?.available === false && <X className="w-4 h-4 text-destructive" />}
          </div>
        </div>

        {!compact && (
          <Button
            onClick={handleClaim}
            disabled={!canSave}
            size="default"
            className="bg-sapphire-gradient hover:opacity-90 shrink-0"
          >
            {isClaiming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-1" />
                {currentHandle ? "Đổi" : "Chọn"}
              </>
            )}
          </Button>
        )}
      </div>

      {/* Validation error */}
      {validationError && (
        <p className="text-xs text-destructive">{validationError}</p>
      )}

      {/* Availability status */}
      {checkResult && !validationError && (
        <div className="space-y-2">
          {checkResult.available ? (
            <p className="text-xs text-primary flex items-center gap-1">
              <Check className="w-3 h-3" />
              ✨ Link này là của bạn!
            </p>
          ) : (
            <p className="text-xs text-destructive flex items-center gap-1">
              <X className="w-3 h-3" />
              {checkResult.reason || "Link đã được sử dụng"}
            </p>
          )}

          {/* Suggestions */}
          {checkResult.suggestions.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Gợi ý cho bạn:</p>
              <div className="flex flex-wrap gap-1.5">
                {checkResult.suggestions.map((suggestion) => (
                  <Badge
                    key={suggestion}
                    variant="outline"
                    className="cursor-pointer hover:bg-divine-gold/10 hover:border-divine-gold/30 transition-colors text-xs"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    fun.rich/{suggestion}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Current handle info */}
      {currentHandle && isChanged && (
        <p className="text-xs text-muted-foreground">
          Link hiện tại: <span className="font-medium">fun.rich/{currentHandle}</span>
        </p>
      )}

      {compact && canSave && (
        <Button
          onClick={handleClaim}
          disabled={!canSave}
          size="sm"
          className="w-full bg-sapphire-gradient hover:opacity-90"
        >
          {isClaiming ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Sparkles className="w-4 h-4 mr-2" />
          )}
          {currentHandle ? "Đổi Link" : "Chọn Link Này"}
        </Button>
      )}
    </div>
  );
}
