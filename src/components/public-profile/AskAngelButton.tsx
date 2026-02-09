import { useState } from "react";
import { Bot, Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import angelLogo from "@/assets/angel-ai-golden-logo.png";

interface AskAngelButtonProps {
  displayName: string | null;
  userId: string;
  handle: string | null;
}

export function AskAngelButton({ displayName, userId, handle }: AskAngelButtonProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAsk = async () => {
    setOpen(true);
    if (response) return; // Already loaded

    setIsLoading(true);
    try {
      const prompt = `Hãy giới thiệu ngắn gọn về thành viên FUN có tên "${displayName || "User"}" (handle: ${handle || "N/A"}, user_id: ${userId}). Chỉ dùng thông tin công khai: bài viết cộng đồng, hoạt động hệ sinh thái FUN, và các chỉ số như PoPL score. Trả lời bằng tiếng Việt, 3-5 câu, thân thiện và tích cực.`;

      const { data, error } = await supabase.functions.invoke("angel-chat", {
        body: {
          message: prompt,
          context: "public_profile_summary",
          targetUserId: userId,
        },
      });

      if (error) throw error;
      setResponse(data?.reply || data?.response || "Không thể tải thông tin.");
    } catch (err) {
      console.error("Ask Angel error:", err);
      setResponse("Xin lỗi, Angel AI chưa thể trả lời lúc này. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleAsk}
        className="gap-2 text-xs text-muted-foreground hover:text-primary"
      >
        <Bot className="w-3.5 h-3.5" />
        {t("publicProfile.askAngel") || "Hỏi Angel về người này"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <img src={angelLogo} alt="Angel AI" className="w-5 h-5" />
              Angel AI
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            ) : (
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {response}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
