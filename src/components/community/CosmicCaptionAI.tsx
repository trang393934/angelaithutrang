import { useState } from "react";
import { Sparkles, Wand2, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface CosmicCaptionAIProps {
  onCaptionGenerated: (caption: string) => void;
  currentContent?: string;
}

const CAPTION_PROMPTS = [
  { label: "Truyền cảm hứng", icon: "✨", prompt: "viết một caption truyền cảm hứng về ánh sáng và tỉnh thức" },
  { label: "Biết ơn", icon: "🙏", prompt: "viết một caption về lòng biết ơn và sự thịnh vượng" },
  { label: "Chữa lành", icon: "💚", prompt: "viết một caption về chữa lành và yêu thương bản thân" },
  { label: "Thành công", icon: "🚀", prompt: "viết một caption về sự quyết tâm và thành công" },
];

export const CosmicCaptionAI = ({ onCaptionGenerated, currentContent = "" }: CosmicCaptionAIProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const generateCaption = async (prompt: string) => {
    setIsGenerating(true);
    
    try {
      const fullPrompt = currentContent
        ? `Dựa trên nội dung: "${currentContent.substring(0, 200)}", ${prompt}. Viết ngắn gọn (2-3 câu), có emoji, tích cực và đầy năng lượng ánh sáng.`
        : `${prompt}. Viết ngắn gọn (2-3 câu), có emoji, tích cực và đầy năng lượng ánh sáng.`;

      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: { 
          prompt: fullPrompt,
          category: "cosmic_caption"
        }
      });

      if (error) throw error;

      const generatedCaption = data.content?.trim() || "";
      
      if (generatedCaption) {
        onCaptionGenerated(generatedCaption);
        toast({
          title: "Caption đã sẵn sàng! ✨",
          description: "Angel AI đã tạo caption cho bạn"
        });
      }
    } catch (error) {
      console.error("Error generating caption:", error);
      toast({
        title: "Không thể tạo caption",
        description: "Vui lòng thử lại sau",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-3 p-4 rounded-xl bg-gradient-to-br from-divine-gold/10 via-purple-500/10 to-pink-500/10 border border-divine-gold/20">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-divine-gold/20 flex items-center justify-center">
          <Wand2 className="w-4 h-4 text-divine-gold" />
        </div>
        <div>
          <h4 className="font-semibold text-sm">Cosmic Caption AI</h4>
          <p className="text-xs text-muted-foreground">Để Angel AI viết caption cho bạn</p>
        </div>
      </div>

      {/* Quick Prompts */}
      <div className="flex flex-wrap gap-2">
        {CAPTION_PROMPTS.map((item) => (
          <Button
            key={item.label}
            variant="outline"
            size="sm"
            disabled={isGenerating}
            onClick={() => generateCaption(item.prompt)}
            className="text-xs hover:bg-divine-gold/20 hover:border-divine-gold"
          >
            <span className="mr-1">{item.icon}</span>
            {item.label}
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCustom(!showCustom)}
          className="text-xs"
        >
          <Sparkles className="w-3 h-3 mr-1" />
          Tùy chỉnh
        </Button>
      </div>

      {/* Custom Prompt */}
      {showCustom && (
        <div className="flex gap-2">
          <Textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Mô tả caption bạn muốn..."
            className="min-h-[60px] text-sm resize-none"
          />
          <Button
            size="icon"
            disabled={isGenerating || !customPrompt.trim()}
            onClick={() => generateCaption(customPrompt)}
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      )}

      {/* Loading State */}
      {isGenerating && (
        <div className="flex items-center justify-center gap-2 py-2 text-sm text-divine-gold">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Đang tạo caption ánh sáng...</span>
        </div>
      )}
    </div>
  );
};
