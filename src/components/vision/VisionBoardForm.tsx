import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, X, Target, Sparkles, Gift } from "lucide-react";
import { cn } from "@/lib/utils";

interface VisionBoardFormProps {
  isFirstBoard: boolean;
  isSubmitting: boolean;
  onSubmit: (data: {
    title: string;
    description?: string;
    goals: string[];
    is_public?: boolean;
  }) => Promise<void>;
  onCancel?: () => void;
}

export function VisionBoardForm({ 
  isFirstBoard, 
  isSubmitting, 
  onSubmit, 
  onCancel 
}: VisionBoardFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [goals, setGoals] = useState<string[]>([""]);
  const [isPublic, setIsPublic] = useState(false);

  const addGoal = () => {
    if (goals.length < 10) {
      setGoals([...goals, ""]);
    }
  };

  const removeGoal = (index: number) => {
    if (goals.length > 1) {
      setGoals(goals.filter((_, i) => i !== index));
    }
  };

  const updateGoal = (index: number, value: string) => {
    const newGoals = [...goals];
    newGoals[index] = value;
    setGoals(newGoals);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validGoals = goals.filter(g => g.trim().length > 0);
    if (!title.trim() || validGoals.length === 0) return;

    await onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      goals: validGoals,
      is_public: isPublic,
    });
  };

  const isValid = title.trim().length > 0 && goals.some(g => g.trim().length > 0);

  return (
    <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-purple-200">
          <Target className="h-5 w-5" />
          Tạo Vision Board mới
        </CardTitle>
        <CardDescription>
          Định hình tầm nhìn và mục tiêu của bạn
        </CardDescription>
        
        {isFirstBoard && (
          <div className="flex items-center gap-2 mt-2 p-3 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200">
            <Gift className="h-5 w-5" />
            <span className="text-sm font-medium">
              Tạo Vision Board đầu tiên để nhận <strong>1000 Camly Coin</strong>!
            </span>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Tiêu đề Vision Board *</Label>
            <Input
              id="title"
              placeholder="VD: Mục tiêu năm 2025"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-white dark:bg-black/20"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Mô tả (tùy chọn)</Label>
            <Textarea
              id="description"
              placeholder="Mô tả ngắn về tầm nhìn của bạn..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-white dark:bg-black/20 min-h-[80px]"
            />
          </div>

          {/* Goals */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Mục tiêu *</Label>
              <span className="text-xs text-muted-foreground">{goals.length}/10</span>
            </div>
            
            <div className="space-y-2">
              {goals.map((goal, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      {index + 1}.
                    </span>
                    <Input
                      placeholder={`Mục tiêu ${index + 1}`}
                      value={goal}
                      onChange={(e) => updateGoal(index, e.target.value)}
                      className="pl-8 bg-white dark:bg-black/20"
                    />
                  </div>
                  {goals.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeGoal(index)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {goals.length < 10 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addGoal}
                className="w-full border-dashed"
              >
                <Plus className="h-4 w-4 mr-2" />
                Thêm mục tiêu
              </Button>
            )}
          </div>

          {/* Public toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-white/50 dark:bg-black/20">
            <div className="space-y-0.5">
              <Label htmlFor="is-public" className="text-sm font-medium">
                Công khai Vision Board
              </Label>
              <p className="text-xs text-muted-foreground">
                Cho phép người khác xem tầm nhìn của bạn
              </p>
            </div>
            <Switch
              id="is-public"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>

          {/* Submit buttons */}
          <div className="flex gap-3">
            {onCancel && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                className="flex-1"
              >
                Hủy
              </Button>
            )}
            <Button
              type="submit"
              disabled={!isValid || isSubmitting}
              className={cn(
                "flex-1",
                isFirstBoard 
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600" 
                  : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              )}
            >
              {isSubmitting ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Tạo Vision Board
                  {isFirstBoard && " (+1000 coin)"}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
