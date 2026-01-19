import { useState } from "react";
import { BookOpen, Heart, RefreshCw, Moon, Send, Coins } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useCamlyCoin } from "@/hooks/useCamlyCoin";
import { supabase } from "@/integrations/supabase/client";

export function GratitudeJournal() {
  const { user } = useAuth();
  const { dailyStatus, refreshBalance } = useCamlyCoin();
  const [activeTab, setActiveTab] = useState<"gratitude" | "confession">("gratitude");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastReward, setLastReward] = useState<{ coins: number; purityScore: number } | null>(null);

  const canWrite = dailyStatus?.canWriteJournal ?? false;
  const journalsRemaining = dailyStatus?.journalsRemaining ?? 3;

  const handleSubmit = async () => {
    if (!user || !content.trim()) return;

    if (!canWrite) {
      toast.error("Nhật ký chỉ mở sau 20:00 (8 giờ tối). Hãy quay lại sau! 🌙");
      return;
    }

    if (journalsRemaining <= 0) {
      toast.error("Bạn đã viết đủ 3 bài nhật ký hôm nay. Hãy quay lại vào ngày mai! 📝");
      return;
    }

    if (content.trim().length < 50) {
      toast.error("Bài viết cần ít nhất 50 ký tự. Hãy chia sẻ nhiều hơn! 💭");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke("analyze-reward-journal", {
        body: {
          userId: user.id,
          content: content.trim(),
          journalType: activeTab,
        },
      });

      if (error) throw error;

      if (data.rewarded) {
        setLastReward({ coins: data.coins, purityScore: data.purityScore });
        toast.success(data.message);
        setContent("");
        refreshBalance();
      } else {
        toast.info(data.message);
      }
    } catch (error) {
      console.error("Submit journal error:", error);
      toast.error("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!canWrite) {
    return (
      <Card className="bg-gradient-to-br from-indigo-50/80 via-purple-50/40 to-violet-50/60 border-indigo-200/50">
        <CardContent className="p-6 text-center">
          <Moon className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-indigo-800 mb-2">Nhật Ký Tối</h3>
          <p className="text-indigo-600/70">
            Mở cửa sau 20:00 (8 giờ tối) mỗi ngày.<br />
            Viết biết ơn hoặc sám hối để nhận 5.000 - 9.000 Camly Coin! 🌙
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-indigo-50/80 via-purple-50/40 to-violet-50/60 border-indigo-200/50 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-indigo-800">
          <BookOpen className="w-5 h-5" />
          Nhật Ký Tối
        </CardTitle>
        <CardDescription className="text-indigo-600/70">
          Còn {journalsRemaining} bài • 5.000 - 9.000 Camly Coin/bài
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "gratitude" | "confession")}>
          <TabsList className="grid w-full grid-cols-2 bg-white/50">
            <TabsTrigger value="gratitude" className="flex items-center gap-1.5">
              <Heart className="w-4 h-4" />
              Biết Ơn
            </TabsTrigger>
            <TabsTrigger value="confession" className="flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4" />
              Sám Hối
            </TabsTrigger>
          </TabsList>

          <TabsContent value="gratitude" className="mt-4">
            <p className="text-sm text-indigo-700/70 mb-3">
              Hôm nay bạn biết ơn điều gì? Hãy viết ra những điều tốt đẹp bạn đã nhận được... 💝
            </p>
          </TabsContent>

          <TabsContent value="confession" className="mt-4">
            <p className="text-sm text-indigo-700/70 mb-3">
              Hãy nhìn lại những điều chưa tốt trong ngày và cam kết thay đổi tích cực... 🙏
            </p>
          </TabsContent>
        </Tabs>

        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={
            activeTab === "gratitude"
              ? "Con biết ơn vì hôm nay..."
              : "Con xin được sám hối về..."
          }
          className="min-h-[150px] bg-white/60 border-indigo-200/50 focus:border-indigo-400 resize-none"
          disabled={isSubmitting || journalsRemaining <= 0}
        />

        <div className="flex items-center justify-between">
          <div className="text-xs text-indigo-600/60">
            {content.length} ký tự {content.length < 50 && "(tối thiểu 50)"}
          </div>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || content.trim().length < 50 || journalsRemaining <= 0}
            className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Đang gửi...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Gửi & Nhận Coin
              </>
            )}
          </Button>
        </div>

        {lastReward && (
          <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-lg p-3 text-center animate-fade-in">
            <p className="text-amber-800 font-medium flex items-center justify-center gap-2">
              <Coins className="w-5 h-5 text-amber-600" />
              +{lastReward.coins.toLocaleString()} Camly Coin!
            </p>
            <p className="text-xs text-amber-600/70">
              Tâm thuần khiết: {Math.round(lastReward.purityScore * 100)}%
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default GratitudeJournal;
