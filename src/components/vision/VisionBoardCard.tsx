import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Target, 
  Globe, 
  Lock, 
  Trash2, 
  ChevronDown, 
  ChevronUp,
  Trophy,
  Calendar,
  Coins,
  Camera
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ImageLightbox } from "@/components/community/ImageLightbox";
import { useLanguage } from "@/contexts/LanguageContext";

interface VisionImage {
  id: string;
  url: string;
  caption?: string;
  photographer?: string;
  photographerUrl?: string;
}

interface Goal {
  id: string;
  text: string;
  isCompleted: boolean;
}

interface VisionBoardCardProps {
  board: {
    id: string;
    title: string;
    description: string | null;
    goals: Goal[];
    images?: VisionImage[];
    is_public: boolean;
    is_first_board: boolean;
    is_rewarded: boolean;
    reward_amount: number;
    completed_goals_count: number;
    total_goals_count: number;
    created_at: string;
  };
  onToggleGoal: (boardId: string, goalId: string) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

export function VisionBoardCard({ board, onToggleGoal, onDelete }: VisionBoardCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const { t } = useLanguage();

  const progress = board.total_goals_count > 0 
    ? (board.completed_goals_count / board.total_goals_count) * 100 
    : 0;

  const handleDelete = async () => {
    setIsDeleting(true);
    await onDelete(board.id);
    setIsDeleting(false);
  };

  return (
    <Card className={cn(
      "transition-all duration-300 hover:shadow-lg",
      progress === 100 && "border-green-300 dark:border-green-700 bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-lg truncate">{board.title}</CardTitle>
              {board.is_public ? (
                <Badge variant="secondary" className="text-xs">
                  <Globe className="h-3 w-3 mr-1" />
                  Công khai
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs">
                  <Lock className="h-3 w-3 mr-1" />
                  Riêng tư
                </Badge>
              )}
              {board.is_rewarded && (
                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 text-xs">
                  <Coins className="h-3 w-3 mr-1" />
                  +{board.reward_amount}
                </Badge>
              )}
            </div>
            {board.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {board.description}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xóa Vision Board?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bạn có chắc muốn xóa "{board.title}"? Hành động này không thể hoàn tác.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    {isDeleting ? "Đang xóa..." : "Xóa"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Images Gallery */}
        {board.images && board.images.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
              <Camera className="h-4 w-4" />
              <span>{t("visionBoard.images")}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {board.images.map((img) => (
                <div
                  key={img.id}
                  className="relative aspect-video rounded-lg overflow-hidden bg-muted cursor-pointer group"
                  onClick={() => setLightboxImage(img.url)}
                >
                  <img
                    src={img.url}
                    alt={img.caption || "Vision"}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  {img.photographer && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-1 py-0.5 truncate">
                      📷 {img.photographer}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {t("visionBoard.unsplashCredit")}
            </p>
          </div>
        )}

        {/* Progress bar */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t("visionBoard.progress")}</span>
            <span className={cn(
              "font-medium",
              progress === 100 ? "text-green-600 dark:text-green-400" : "text-foreground"
            )}>
              {board.completed_goals_count}/{board.total_goals_count} {t("visionBoard.goals")}
            </span>
          </div>
          <Progress 
            value={progress} 
            className={cn(
              "h-2",
              progress === 100 && "[&>div]:bg-green-500"
            )}
          />
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          {/* Goals list */}
          <div className="space-y-2">
            {board.goals.map((goal) => (
              <div
                key={goal.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg transition-colors",
                  goal.isCompleted 
                    ? "bg-green-50 dark:bg-green-950/20" 
                    : "bg-muted/50 hover:bg-muted"
                )}
              >
                <Checkbox
                  id={goal.id}
                  checked={goal.isCompleted}
                  onCheckedChange={() => onToggleGoal(board.id, goal.id)}
                  className="mt-0.5"
                />
                <label
                  htmlFor={goal.id}
                  className={cn(
                    "flex-1 text-sm cursor-pointer",
                    goal.isCompleted && "line-through text-muted-foreground"
                  )}
                >
                  {goal.text}
                </label>
                {goal.isCompleted && (
                  <Trophy className="h-4 w-4 text-green-600 dark:text-green-400" />
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>
                {t("visionBoard.createdOn")} {format(new Date(board.created_at), "dd/MM/yyyy", { locale: vi })}
              </span>
            </div>
            {progress === 100 && (
              <div className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                <Trophy className="h-3 w-3" />
                <span>{t("visionBoard.completed")}</span>
              </div>
            )}
          </div>
        </CardContent>
      )}

      {/* Image Lightbox */}
      <ImageLightbox
        imageUrl={lightboxImage || ""}
        alt="Vision Board Image"
        isOpen={!!lightboxImage}
        onClose={() => setLightboxImage(null)}
      />
    </Card>
  );
}
