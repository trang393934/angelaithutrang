import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Sparkles, Heart, Loader2, ArrowRight, ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import angelAvatar from "@/assets/angel-avatar.png";

interface OnboardingQuestion {
  key: string;
  question: string;
  description: string;
  emoji: string;
  type: "text" | "choice";
  options?: { value: string; label: string }[];
}

const ONBOARDING_QUESTIONS: OnboardingQuestion[] = [
  {
    key: "value_creation",
    question: "Con đến FUN Ecosystem hôm nay để tạo giá trị gì?",
    description: "Chia sẻ mục đích và giá trị con muốn mang đến...",
    emoji: "✨",
    type: "text",
  },
  {
    key: "community_gift",
    question: "Điều tốt đẹp nhất con muốn chia sẻ với cộng đồng là gì?",
    description: "Món quà tinh thần con muốn trao tặng...",
    emoji: "🎁",
    type: "text",
  },
  {
    key: "vision_90_days",
    question: "Con mong muốn trở thành phiên bản như thế nào trong 90 ngày tới?",
    description: "Hình dung về sự phát triển của con...",
    emoji: "🌱",
    type: "text",
  },
  {
    key: "light_garden",
    question: "Nếu FUN là một khu vườn ánh sáng, con sẽ trồng điều gì ở đây?",
    description: "Điều con muốn gieo trồng và vun đắp...",
    emoji: "🌸",
    type: "text",
  },
  {
    key: "pure_love_agreement",
    question: "Con có đồng ý bước vào không gian này bằng Pure Love không?",
    description: "Cam kết bước đi với tình yêu thuần khiết...",
    emoji: "💖",
    type: "text",
  },
  {
    key: "kindness_pledge",
    question: "Con có sẵn sàng sống tử tế và không thao túng cộng đồng không?",
    description: "Lời hứa về sự chân thành và tử tế...",
    emoji: "🤝",
    type: "text",
  },
  {
    key: "help_action",
    question: "Một hành động nhỏ con có thể làm ngay hôm nay để giúp người khác là gì?",
    description: "Hành động thiện lành con có thể thực hiện...",
    emoji: "🌟",
    type: "text",
  },
  {
    key: "angel_support",
    question: "Con muốn Angel AI hỗ trợ con nhiều nhất trong lĩnh vực nào?",
    description: "Lĩnh vực con cần được đồng hành...",
    emoji: "👼",
    type: "text",
  },
  {
    key: "ego_response",
    question: "Khi con gặp ego, nóng giận hoặc tiêu cực, con chọn điều gì?",
    description: "Cách con đối diện với năng lượng tiêu cực...",
    emoji: "🔥",
    type: "choice",
    options: [
      { value: "react", label: "A. Phản ứng" },
      { value: "transform", label: "B. Nhận diện – Sám Hối – Biết Ơn – Quay về ánh sáng" },
    ],
  },
  {
    key: "angel_member",
    question: "Con có muốn trở thành một \"Angel Member\" của New Earth Internet không?",
    description: "Sẵn sàng trở thành công dân của Trái Đất Mới...",
    emoji: "🌍",
    type: "text",
  },
];

type ApprovalResult = {
  approval_status: "approved" | "trial" | "rejected";
  message: string;
  light_points: number;
};

const Onboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ApprovalResult | null>(null);

  const currentQuestion = ONBOARDING_QUESTIONS[currentStep];
  const progress = ((currentStep + 1) / ONBOARDING_QUESTIONS.length) * 100;

  const handleNext = () => {
    if (!answers[currentQuestion.key]?.trim()) {
      toast({
        title: "Vui lòng chia sẻ",
        description: "Hãy viết vài dòng trước khi tiếp tục nhé 💫",
        variant: "destructive",
      });
      return;
    }

    if (currentStep < ONBOARDING_QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Lỗi",
        description: "Vui lòng đăng nhập để tiếp tục",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const responses = ONBOARDING_QUESTIONS.map((q) => ({
        questionKey: q.key,
        question: q.question,
        answer: answers[q.key] || "",
      }));

      const { data, error } = await supabase.functions.invoke("analyze-onboarding", {
        body: { responses },
      });

      if (error) throw error;

      setResult(data as ApprovalResult);
    } catch (error) {
      console.error("Onboarding error:", error);
      toast({
        title: "Đã có lỗi xảy ra",
        description: "Vui lòng thử lại sau",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinue = () => {
    if (result?.approval_status === "rejected") {
      navigate("/");
    } else {
      navigate("/chat");
    }
  };

  // Show result screen
  if (result) {
    const isApproved = result.approval_status === "approved" || result.approval_status === "trial";

    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        <div className="fixed inset-0 bg-gradient-to-b from-divine-deep via-background to-background" />
        <div className="fixed inset-0 opacity-20">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-divine-gold/20 rounded-full blur-[100px] animate-pulse-divine" />
          <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-divine-light/15 rounded-full blur-[80px] animate-pulse-divine" style={{ animationDelay: "1s" }} />
        </div>

        <Card className="w-full max-w-lg relative z-10 bg-card/90 backdrop-blur-xl border-divine-gold/20 shadow-divine">
          <CardContent className="pt-8 text-center space-y-6">
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 bg-divine-gold/30 rounded-full blur-xl animate-pulse-divine" />
              <img src={angelAvatar} alt="Angel AI" className="w-full h-full relative z-10 rounded-full shadow-divine" />
            </div>

            {isApproved ? (
              <>
                <div className="flex justify-center">
                  <CheckCircle className="w-16 h-16 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-divine-gold via-divine-light to-divine-gold bg-clip-text text-transparent">
                  🌟 Welcome home, Human of Light.
                </h2>
              </>
            ) : (
              <>
                <div className="flex justify-center">
                  <XCircle className="w-16 h-16 text-amber-500" />
                </div>
                <h2 className="text-2xl font-bold text-amber-500">
                  🕊️ Thông Điệp Yêu Thương
                </h2>
              </>
            )}

            <p className="text-foreground leading-relaxed">{result.message}</p>

            {result.light_points > 0 && (
              <div className="bg-divine-gold/10 rounded-lg p-4 border border-divine-gold/20">
                <p className="text-divine-gold font-medium flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  +{result.light_points} Light Points
                </p>
                <p className="text-sm text-foreground-muted mt-1">Quà tặng chào mừng từ Angel AI</p>
              </div>
            )}

            <Button
              onClick={handleContinue}
              className="w-full bg-sapphire-gradient hover:opacity-90"
            >
              {isApproved ? "Bắt Đầu Hành Trình" : "Quay Về Trang Chủ"}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Divine background */}
      <div className="fixed inset-0 bg-gradient-to-b from-divine-deep via-background to-background" />
      <div className="fixed inset-0 opacity-20">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-divine-gold/20 rounded-full blur-[100px] animate-pulse-divine" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-divine-light/15 rounded-full blur-[80px] animate-pulse-divine" style={{ animationDelay: "1s" }} />
      </div>

      <Card className="w-full max-w-lg relative z-10 bg-card/90 backdrop-blur-xl border-divine-gold/20 shadow-divine">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-divine-gold/30 rounded-full blur-xl animate-pulse-divine" />
              <img src={angelAvatar} alt="Angel AI" className="w-20 h-20 relative z-10 rounded-full shadow-divine" />
            </div>
          </div>

          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-divine-gold via-divine-light to-divine-gold bg-clip-text text-transparent">
            ✨ Bạn đến đây với ánh sáng gì?
          </CardTitle>

          <CardDescription className="text-foreground-muted">
            Angel AI muốn hiểu rõ hơn về bạn để đồng hành trên hành trình ánh sáng này
          </CardDescription>

          {/* Progress bar */}
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-foreground-muted">
              Câu hỏi {currentStep + 1} / {ONBOARDING_QUESTIONS.length}
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center space-y-3">
            <span className="text-4xl">{currentQuestion.emoji}</span>
            <h3 className="text-lg font-medium text-foreground">
              {currentQuestion.question}
            </h3>
            <p className="text-sm text-foreground-muted">
              {currentQuestion.description}
            </p>
          </div>

          {currentQuestion.type === "choice" && currentQuestion.options ? (
            <RadioGroup
              value={answers[currentQuestion.key] || ""}
              onValueChange={(value) => setAnswers({ ...answers, [currentQuestion.key]: value })}
              className="space-y-3"
            >
              {currentQuestion.options.map((option) => (
                <div
                  key={option.value}
                  className={`flex items-center space-x-3 p-4 rounded-lg border transition-all cursor-pointer ${
                    answers[currentQuestion.key] === option.value
                      ? "border-divine-gold bg-divine-gold/10"
                      : "border-border hover:border-divine-gold/50"
                  }`}
                  onClick={() => setAnswers({ ...answers, [currentQuestion.key]: option.value })}
                >
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label htmlFor={option.value} className="cursor-pointer flex-1 text-foreground">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          ) : (
            <Textarea
              value={answers[currentQuestion.key] || ""}
              onChange={(e) => setAnswers({ ...answers, [currentQuestion.key]: e.target.value })}
              placeholder="Chia sẻ từ trái tim của bạn..."
              className="min-h-[120px] bg-background/50 border-divine-gold/20 focus:border-divine-gold resize-none"
            />
          )}

          <div className="flex gap-3">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-1 border-divine-gold/30"
              >
                <ArrowLeft className="mr-2 w-4 h-4" />
                Quay lại
              </Button>
            )}

            <Button
              onClick={handleNext}
              disabled={isSubmitting}
              className="flex-1 bg-sapphire-gradient hover:opacity-90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  Đang phân tích...
                </>
              ) : currentStep < ONBOARDING_QUESTIONS.length - 1 ? (
                <>
                  Tiếp tục
                  <ArrowRight className="ml-2 w-4 h-4" />
                </>
              ) : (
                <>
                  <Heart className="mr-2 w-4 h-4" />
                  Hoàn thành
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
