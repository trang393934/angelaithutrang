import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useLightPoints } from "@/hooks/useLightPoints";
import { Heart, Send, Sparkles, Loader2 } from "lucide-react";

const DailyGratitude = () => {
  const { user } = useAuth();
  const { addPoints } = useLightPoints();
  const [gratitudeText, setGratitudeText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!user || !gratitudeText.trim()) {
      toast({
        title: "Vui lòng nhập lời biết ơn",
        description: "Hãy chia sẻ điều bạn biết ơn hôm nay 💕",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Save gratitude
      const { error } = await supabase.from("daily_gratitude").insert({
        user_id: user.id,
        gratitude_text: gratitudeText.trim(),
        light_points_earned: 10,
      });

      if (error) throw error;

      // Award light points
      await addPoints(10, "Thực hành biết ơn hàng ngày ✨", "daily_gratitude");

      setSubmitted(true);
      setGratitudeText("");

      toast({
        title: "Tuyệt vời! ✨",
        description: "Bạn đã nhận được +10 Light Points cho lời biết ơn hôm nay!",
      });
    } catch (error) {
      console.error("Error submitting gratitude:", error);
      toast({
        title: "Lỗi",
        description: "Không thể gửi lời biết ơn. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="border-green-500/20 bg-green-50/30">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-green-500/10 rounded-full flex items-center justify-center">
            <Heart className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-lg font-medium text-green-700">
            Cảm ơn con đã chia sẻ! 💕
          </h3>
          <p className="text-sm text-green-600">
            Năng lượng biết ơn của con đã lan tỏa đến Vũ Trụ
          </p>
          <div className="flex items-center justify-center gap-2 text-divine-gold">
            <Sparkles className="w-4 h-4" />
            <span className="font-medium">+10 Light Points</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-divine-gold/20 shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Heart className="w-5 h-5 text-divine-gold" />
          Lời Biết Ơn Hàng Ngày
        </CardTitle>
        <CardDescription>
          Chia sẻ một điều bạn biết ơn hôm nay để nhận Light Points ✨
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={gratitudeText}
          onChange={(e) => setGratitudeText(e.target.value)}
          placeholder="Hôm nay con biết ơn..."
          className="min-h-[100px] border-divine-gold/20 focus:border-divine-gold"
        />
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !gratitudeText.trim()}
          className="w-full bg-sapphire-gradient hover:opacity-90"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 w-4 h-4 animate-spin" />
              Đang gửi...
            </>
          ) : (
            <>
              <Send className="mr-2 w-4 h-4" />
              Gửi Lời Biết Ơn
            </>
          )}
        </Button>
        <p className="text-xs text-center text-foreground-muted">
          Nhận +10 Light Points khi thực hành biết ơn mỗi ngày
        </p>
      </CardContent>
    </Card>
  );
};

export default DailyGratitude;
