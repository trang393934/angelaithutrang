import { useState } from "react";
import { X, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

interface SoulTagsEditorProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  maxTags?: number;
  isEditing?: boolean;
}

const SUGGESTED_SOUL_TAGS = [
  "Ánh Sáng", "Tỉnh Thức", "Biết Ơn", "Yêu Thương", "Sáng Tạo",
  "Chữa Lành", "Trí Tuệ", "Hòa Bình", "Phụng Sự", "Kết Nối",
  "Tâm Linh", "Thiền Định", "Vũ Trụ", "Năng Lượng", "Hạnh Phúc"
];

export const SoulTagsEditor = ({ 
  tags, 
  onTagsChange, 
  maxTags = 5,
  isEditing = true 
}: SoulTagsEditorProps) => {
  const [inputValue, setInputValue] = useState("");

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (!trimmedTag) return;
    
    if (tags.length >= maxTags) {
      toast({
        title: "Đã đạt giới hạn",
        description: `Tối đa ${maxTags} Soul Tags`,
        variant: "destructive",
      });
      return;
    }
    
    if (tags.includes(trimmedTag)) {
      toast({
        title: "Tag đã tồn tại",
        description: "Vui lòng chọn tag khác",
        variant: "destructive",
      });
      return;
    }
    
    onTagsChange([...tags, trimmedTag]);
    setInputValue("");
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(inputValue);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-divine-gold" />
        <h3 className="font-semibold text-foreground">Soul Tags</h3>
        <span className="text-xs text-muted-foreground">
          ({tags.length}/{maxTags})
        </span>
      </div>

      {/* Current Tags */}
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="bg-divine-gold/20 text-divine-gold border-divine-gold/30 px-3 py-1"
          >
            ✨ {tag}
            {isEditing && (
              <button
                onClick={() => removeTag(tag)}
                className="ml-2 hover:text-destructive transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </Badge>
        ))}
        {tags.length === 0 && (
          <span className="text-sm text-muted-foreground italic">
            Chưa có Soul Tags nào
          </span>
        )}
      </div>

      {isEditing && tags.length < maxTags && (
        <>
          {/* Input */}
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập Soul Tag..."
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => addTag(inputValue)}
              disabled={!inputValue.trim()}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Suggestions */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Gợi ý:</p>
            <div className="flex flex-wrap gap-1">
              {SUGGESTED_SOUL_TAGS.filter(tag => !tags.includes(tag)).slice(0, 8).map((tag) => (
                <button
                  key={tag}
                  onClick={() => addTag(tag)}
                  className="text-xs px-2 py-1 rounded-full bg-muted hover:bg-divine-gold/20 hover:text-divine-gold transition-colors"
                >
                  + {tag}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
