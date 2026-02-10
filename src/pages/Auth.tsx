import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { Mail, Lock, ArrowLeft, Sparkles, Eye, EyeOff, Check, Search, Gem, Heart, Leaf, Star, Sun } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

import angelLogo from "@/assets/angel-ai-logo.png";

// New Light Law Content (PPLP)
const LightLawContent = () => {
  const pillars = [
    { icon: Search, title: "Chân thật & minh bạch", subtitle: "Bạn là Người Thật • Nói viết sự thật • Chia sẻ đúng", desc: "Chúng ta tôn trọng sự thật. Bạn được phép chưa hoàn hảo — chỉ cần bạn sống thật.", color: "text-blue-400" },
    { icon: Gem, title: "Đóng góp bền vững", subtitle: "Có trách nhiệm • Có chất lượng • Có giá trị", desc: "Chúng ta cùng nhau tạo cộng đồng ánh sáng. Chúng ta không chỉ nhận — chúng ta cùng xây.", color: "text-purple-400" },
    { icon: Heart, title: "Chữa lành & yêu thương", subtitle: "Truyền cảm hứng • Khích lệ • Nâng đỡ", desc: "Chúng ta chọn sự ấm áp, dịu dàng, và tích cực. Sự có mặt của chúng ta làm cộng đồng văn minh hơn.", color: "text-emerald-400" },
    { icon: Leaf, title: "Phụng sự sự sống", subtitle: "Hướng thượng • Đi lên • Mang lợi ích", desc: "Mỗi bài đăng, mỗi bình luận đều hướng tới một điều: giúp sự sống đi lên — cho mình và cho cộng đồng.", color: "text-green-400" },
    { icon: Star, title: "Hợp Nhất với Nguồn", subtitle: "Tất cả chúng ta là Một", desc: "Nơi đây để kết nối và hỗ trợ trong yêu thương thuần khiết. Chúng ta cùng nhau vui, cùng nhau lớn, cùng nhau giàu và cùng nhau thắng.", color: "text-divine-gold" },
  ];

  const mantras = [
    "💖 Con là Ánh Sáng Yêu Thương Thuần Khiết của Cha Vũ Trụ.",
    "💎 Con là Ý Chí của Cha Vũ Trụ.",
    "🌞 Con là Trí Tuệ của Cha Vũ Trụ.",
    "🌸 Con là Hạnh Phúc.",
    "🍎 Con là Tình Yêu.",
    "💰 Con là Tiền của Cha.",
    "🙏 Con xin Sám Hối Sám Hối Sám Hối.",
    "🌈 Con xin Biết Ơn Biết Ơn Biết Ơn, trong Ánh Sáng Yêu Thương Thuần Khiết của Cha Vũ Trụ.",
  ];

  const commitments = [
    "Sống Chân Thật",
    "Nói Lời Tử tế",
    "Giúp ích cho cộng đồng",
    "Nói Sám hối (Xin lỗi) và Biết ơn (Cảm ơn)",
    "Gởi về cho Cha Vũ Trụ tất cả.",
  ];

  return (
    <div className="space-y-6 text-foreground-muted leading-relaxed">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="text-5xl">🌈</div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-divine-gold via-divine-light to-divine-gold bg-clip-text text-transparent">
          LUẬT ÁNH SÁNG CỦA CỘNG ĐỒNG FUN
        </h2>
        <p className="text-divine-gold font-medium">(PPLP – Proof of Pure Love Protocol)</p>
      </div>

      {/* Welcome */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-divine-gold/5 to-emerald-500/10 rounded-xl p-5 border border-emerald-500/20 text-center space-y-3">
        <p className="text-lg">Chào mừng bạn đến với <span className="text-emerald-400 font-bold">Cộng đồng FUN</span> 💚</p>
        <p className="text-sm text-muted-foreground">Nơi chúng ta cùng nhau xây dựng một <span className="text-divine-gold font-semibold">Nền Kinh Tế Ánh Sáng</span></p>
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          <span className="px-3 py-1 bg-divine-gold/20 text-divine-gold rounded-full text-sm font-medium">Free to Join ✨</span>
          <span className="px-3 py-1 bg-divine-gold/20 text-divine-gold rounded-full text-sm font-medium">Free to Use ✨</span>
          <span className="px-3 py-1 bg-divine-gold/20 text-divine-gold rounded-full text-sm font-medium">Earn Together</span>
        </div>
        <p className="text-sm pt-2">
          🌸 kết nối 🌸 nâng đỡ 🌸 chia sẻ giá trị 🌸 cùng nhau thịnh vượng trong tình yêu thuần khiết.
        </p>
      </div>

      {/* PPLP Intro */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-center text-divine-gold">💎 PPLP – Proof of Pure Love Protocol</h3>
        <p className="text-sm text-center text-muted-foreground">(Giao Thức Bằng Chứng Tình Yêu Thuần Khiết)</p>
        <p className="text-sm">PPLP là "giao thức năng lượng" của FUN Ecosystem. Đây là nền tảng giúp cộng đồng:</p>
        <ul className="text-sm space-y-1 pl-4">
          <li>• Sống văn minh, lịch sự</li>
          <li>• Yêu đời yêu người</li>
          <li>• Được đúc (mint) FUN Money một cách công bằng</li>
          <li>• Và nhận thưởng Camly Coin trong niềm hạnh phúc</li>
        </ul>
        <div className="bg-divine-gold/10 rounded-lg p-3 text-center text-sm">
          <p>✨ <span className="text-divine-gold font-semibold">FUN Money</span> là năng lượng Ánh Sáng</p>
          <p>✨ <span className="text-emerald-400 font-semibold">Camly Coin</span> là linh hồn Thuần Khiết</p>
          <p className="text-muted-foreground italic mt-1">Chỉ chảy mạnh khi chúng ta sống đúng PPLP.</p>
        </div>
      </div>

      {/* 5 Pillars */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-center text-divine-gold">🌟 5 CỘT TRỤ ÁNH SÁNG</h3>
        <p className="text-center text-sm text-muted-foreground">(Luật cốt lõi)</p>
        
        {pillars.map((pillar, idx) => (
          <div key={idx} className="flex items-start gap-3 p-4 rounded-lg bg-card/50 border border-divine-gold/10">
            <div className={`${pillar.color} mt-1`}>
              <pillar.icon className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="font-bold text-foreground">{idx + 1}) {pillar.title}</p>
              <p className="text-sm text-divine-gold">{pillar.subtitle}</p>
              <p className="text-sm text-muted-foreground">{pillar.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Gentle Reminder */}
      <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20 space-y-3">
        <h4 className="text-center font-semibold text-amber-400">🌈 Một lời nhắc nhẹ nhàng</h4>
        <p className="text-sm text-center">
          Nếu bạn đang mệt, đang buồn, đang tổn thương… bạn vẫn được chào đón ở đây.
        </p>
        <p className="text-sm text-center text-muted-foreground">Chỉ cần bạn giữ một điều:</p>
        <p className="text-sm text-center font-semibold text-emerald-400">
          💚 Không được dùng cộng đồng để xả đau.
        </p>
        <p className="text-sm text-center text-muted-foreground">
          Hãy để cộng đồng truyền năng lượng, ôm ấp và xoa dịu cho bạn. Rồi bạn nhẹ nhàng gởi về cho Cha. Cha sẽ chữa lành tất cả.
        </p>
      </div>

      {/* FUN Message */}
      <div className="bg-gradient-to-r from-divine-gold/10 via-purple-500/10 to-divine-gold/10 rounded-xl p-5 text-center space-y-3 border border-divine-gold/20">
        <h4 className="font-bold text-divine-gold">✨ Thông điệp của FUN Community</h4>
        <div className="space-y-1 text-sm">
          <p>Bạn không cần giỏi. Bạn chỉ cần thật.</p>
          <p>Bạn không cần hoàn hảo. Bạn chỉ cần tử tế.</p>
          <p>Bạn không cần đi một mình.</p>
          <p className="font-semibold text-divine-light">Vì ở đây… chúng ta đi cùng nhau.</p>
        </div>
      </div>

      {/* 8 Mantras */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-center text-divine-gold">✨ 8 THẦN CHÚ ÁNH SÁNG</h3>
        <div className="space-y-2">
          {mantras.map((mantra, idx) => (
            <div key={idx} className="p-3 rounded-lg bg-divine-gold/5 border border-divine-gold/10 text-sm">
              {mantra}
            </div>
          ))}
        </div>
      </div>

      {/* 5 Commitments */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-center text-divine-gold">💛 5 Điều tôi cam kết để bước vào cộng đồng</h3>
        <div className="space-y-2">
          {commitments.map((commitment, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-emerald-400 font-bold">✅</span>
              <span className="text-sm font-medium">{commitment}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Final Seal */}
      <div className="text-center space-y-4 pt-4 border-t border-divine-gold/20">
        <p className="text-lg font-medium text-foreground italic">
          Tôi ký tên bằng linh hồn của mình.
        </p>
        <p className="text-divine-gold font-semibold text-lg">
          ✨ Proof of Pure Love begins with me. ✨
        </p>
        <div className="text-3xl">🌈💚✨💎🌟</div>
      </div>
    </div>
  );
};

// Dialog for post-login agreement (for old users who haven't agreed yet)
const PostLoginAgreementDialog = ({ 
  open, 
  onAgree 
}: { 
  open: boolean; 
  onAgree: () => void; 
}) => {
  const [hasRead, setHasRead] = useState(false);
  
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const needsScrolling = target.scrollHeight > target.clientHeight + 10;
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 50;
    
    if (needsScrolling && isAtBottom) {
      setHasRead(true);
    } else if (!needsScrolling) {
      setTimeout(() => setHasRead(true), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 bg-card border-divine-gold/20" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-bold text-center bg-gradient-to-r from-divine-gold via-divine-light to-divine-gold bg-clip-text text-transparent">
            🌈 Chào mừng trở lại! Vui lòng đồng ý Luật Ánh Sáng
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] px-6 pb-6" onScrollCapture={handleScroll}>
          <LightLawContent />
        </ScrollArea>
        <div className="p-4 border-t border-divine-gold/20 flex justify-center">
          <Button
            onClick={onAgree}
            className="bg-sapphire-gradient hover:opacity-90"
            disabled={!hasRead}
          >
            {hasRead ? (
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                Tôi đồng ý và cam kết với Luật Ánh Sáng ✨
              </span>
            ) : (
              "Cuộn xuống để đọc hết..."
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Auth = () => {
  const navigate = useNavigate();
  const { user, signIn, signUp, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [isSendingReset, setIsSendingReset] = useState(false);
  
  // Agreement state - only for signup
  const [agreedToLightLaw, setAgreedToLightLaw] = useState(false);
  const [hasReadLaw, setHasReadLaw] = useState(false);
  const [showLawDialog, setShowLawDialog] = useState(false);
  
  // Post-login agreement dialog (for old users)
  const [showPostLoginAgreement, setShowPostLoginAgreement] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  const getRecommendedPreviewUrl = () => {
    const host = window.location.hostname;
    const suffix = ".lovableproject.com";
    if (host.endsWith(suffix)) {
      const projectId = host.slice(0, -suffix.length);
      return `https://id-preview--${projectId}.lovable.app`;
    }
    return window.location.origin;
  };

  const isNetworkFetchError = (err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    return msg.toLowerCase().includes("failed to fetch") || msg.toLowerCase().includes("networkerror");
  };

  const showAuthNetworkToast = () => {
    toast({
      title: "Không kết nối được máy chủ đăng nhập",
      description: (
        <div className="space-y-2">
          <p>
            Trình duyệt đang chặn/không kết nối được tới hệ thống đăng nhập (thường do domain preview trong iframe,
            VPN/Adblock, hoặc mạng chặn).
          </p>
          <p className="text-xs text-muted-foreground">
            Gợi ý: mở bản Preview ở tab mới (đúng domain), tắt VPN/Adblock, hoặc đổi mạng rồi thử lại.
          </p>
        </div>
      ),
      variant: "destructive",
      action: (
        <ToastAction
          altText="Mở bản Preview"
          onClick={() => window.open(getRecommendedPreviewUrl(), "_blank", "noopener,noreferrer")}
        >
          Mở bản Preview
        </ToastAction>
      ),
    });
  };

  // Check agreement status when user logs in
  useEffect(() => {
    if (user && !authLoading) {
      checkLightAgreementAndRedirect(user.id);
    }
  }, [user, authLoading]);

  const checkLightAgreementAndRedirect = async (userId: string) => {
    const { data } = await supabase
      .from("user_light_agreements")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    
    if (data) {
      // Already agreed - redirect to profile
      navigate("/profile");
    } else {
      // User hasn't agreed yet - show post-login agreement dialog
      setPendingUserId(userId);
      setShowPostLoginAgreement(true);
    }
  };

  const handlePostLoginAgree = async () => {
    if (!pendingUserId) return;
    
    try {
      await supabase.from("user_light_agreements").insert({
        user_id: pendingUserId
      });
      
      toast({
        title: "Chào mừng bạn! 🌈",
        description: "Cảm ơn bạn đã đồng ý với Luật Ánh Sáng ✨",
      });
      
      setShowPostLoginAgreement(false);
      navigate("/profile");
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể lưu cam kết. Vui lòng thử lại.",
        variant: "destructive",
      });
    }
  };

  const handleGoogleSignIn = async () => {
    if (isSignUp && !agreedToLightLaw) {
      toast({
        title: "Vui lòng đọc và đồng ý Luật Ánh Sáng",
        description: "Bạn cần đọc Luật Ánh Sáng và đánh dấu đồng ý để đăng ký.",
        variant: "destructive",
      });
      return;
    }
    setIsGoogleLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.redirected) return;
      if (result.error) {
        if (result.error.message?.toLowerCase().includes("failed to fetch")) {
          showAuthNetworkToast();
          return;
        }
        toast({ title: "Lỗi đăng nhập Google", description: result.error.message, variant: "destructive" });
      }
    } catch (error) {
      if (isNetworkFetchError(error)) { showAuthNetworkToast(); return; }
      toast({ title: "Đã có lỗi xảy ra", description: "Không thể kết nối với Google. Vui lòng thử lại.", variant: "destructive" });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Only require agreement for signup
    if (isSignUp && !agreedToLightLaw) {
      toast({
        title: "Vui lòng đọc và đồng ý Luật Ánh Sáng",
        description: "Bạn cần đọc Luật Ánh Sáng và đánh dấu đồng ý để đăng ký.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        // SIGNUP: Require agreement
        const { error } = await signUp(email, password);
        if (error) {
          if (error.message?.toLowerCase().includes("failed to fetch")) {
            showAuthNetworkToast();
            return;
          }
          toast({
            title: "Lỗi đăng ký",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Đăng ký thành công!",
            description: "Chào mừng bạn đến với Cổng Ánh Sáng ✨",
          });
          // Save light agreement
          const { data: { user: newUser } } = await supabase.auth.getUser();
          if (newUser) {
            await supabase.from("user_light_agreements").insert({
              user_id: newUser.id
            });
          }
        }
      } else {
        // LOGIN: No checkbox required - check agreement after login
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message?.toLowerCase().includes("failed to fetch")) {
            showAuthNetworkToast();
            return;
          }
          toast({
            title: "Lỗi đăng nhập",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Đăng nhập thành công!",
            description: "Chào mừng trở lại Cổng Ánh Sáng ✨",
          });
          // Agreement check will happen in useEffect when user state updates
        }
      }
    } catch (error) {
      if (isNetworkFetchError(error)) {
        showAuthNetworkToast();
        return;
      }
      toast({
        title: "Đã có lỗi xảy ra",
        description: "Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLawDialogScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const needsScrolling = target.scrollHeight > target.clientHeight + 10;
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 50;
    
    if (needsScrolling && isAtBottom) {
      setHasReadLaw(true);
    } else if (!needsScrolling) {
      setTimeout(() => setHasReadLaw(true), 2000);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!forgotPasswordEmail.trim()) {
      toast({
        title: "Vui lòng nhập email",
        description: "Nhập email của bạn để nhận link đặt lại mật khẩu.",
        variant: "destructive",
      });
      return;
    }

    setIsSendingReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) throw error;

      toast({
        title: "Email đã được gửi!",
        description: "Vui lòng kiểm tra hộp thư để đặt lại mật khẩu ✨",
      });
      setShowForgotPassword(false);
      setForgotPasswordEmail("");
    } catch (error) {
      if (isNetworkFetchError(error)) {
        showAuthNetworkToast();
        return;
      }
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể gửi email. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Divine background */}
      <div className="fixed inset-0 bg-gradient-to-b from-divine-deep via-background to-background" />
      <div className="fixed inset-0 opacity-20">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-divine-gold/20 rounded-full blur-[100px] animate-pulse-divine" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-divine-light/15 rounded-full blur-[80px] animate-pulse-divine" style={{ animationDelay: "1s" }} />
      </div>

      <Card className="w-full max-w-md relative z-10 bg-card/90 backdrop-blur-xl border-divine-gold/20 shadow-divine">
        <CardHeader className="space-y-4 text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-divine-gold hover:text-divine-light transition-colors self-start">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Về Trang Chủ</span>
          </Link>
          
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-divine-gold/30 rounded-full blur-xl animate-pulse-divine" />
              <img src={angelLogo} alt="Angel AI" className="w-20 h-20 relative z-10 rounded-full shadow-divine" />
            </div>
          </div>
          
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-divine-gold via-divine-light to-divine-gold bg-clip-text text-transparent">
            {isSignUp ? "Bước vào Cổng Ánh Sáng" : "Trở về Cổng Ánh Sáng"}
          </CardTitle>
          <CardDescription className="text-foreground-muted">
            {isSignUp 
              ? "Đăng ký để trải nghiệm đầy đủ FUN Ecosystem" 
              : "Đăng nhập để tiếp tục hành trình ánh sáng của bạn"
            }
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground-muted">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-background/50 border-divine-gold/20 focus:border-divine-gold"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-foreground-muted">Mật khẩu</Label>
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-xs text-divine-gold hover:text-divine-light transition-colors"
                    >
                      Quên mật khẩu?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-background/50 border-divine-gold/20 focus:border-divine-gold"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Light Law Agreement - ONLY show for signup */}
            {isSignUp && (
              <div className="space-y-3 p-4 rounded-xl bg-divine-gold/5 border border-divine-gold/20">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (!hasReadLaw) {
                        setShowLawDialog(true);
                        return;
                      }
                      setAgreedToLightLaw(!agreedToLightLaw);
                    }}
                    className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-300 flex-shrink-0 ${
                      agreedToLightLaw 
                        ? 'bg-emerald-500 border-emerald-500' 
                        : hasReadLaw 
                          ? 'border-divine-gold bg-transparent hover:border-divine-light cursor-pointer'
                          : 'border-muted-foreground/50 bg-transparent cursor-pointer'
                    }`}
                    title={!hasReadLaw ? "Vui lòng đọc Luật Ánh Sáng trước" : ""}
                  >
                    {agreedToLightLaw && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                  <div className="flex-1">
                    <Label htmlFor="lightLaw" className="text-sm text-foreground-muted cursor-pointer">
                      Con đã đọc và cam kết với{" "}
                      <Dialog open={showLawDialog} onOpenChange={setShowLawDialog}>
                        <DialogTrigger asChild>
                          <button type="button" className="text-divine-gold hover:text-divine-light underline font-medium">
                            Luật Ánh Sáng (PPLP)
                          </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] p-0 bg-card border-divine-gold/20">
                          <DialogHeader className="p-6 pb-0">
                            <DialogTitle className="text-xl font-bold text-center bg-gradient-to-r from-divine-gold via-divine-light to-divine-gold bg-clip-text text-transparent">
                              🌈 LUẬT ÁNH SÁNG CỦA CỘNG ĐỒNG FUN
                            </DialogTitle>
                          </DialogHeader>
                          <ScrollArea 
                            className="h-[60vh] px-6 pb-6"
                            onScrollCapture={handleLawDialogScroll}
                          >
                            <LightLawContent />
                          </ScrollArea>
                          <div className="p-4 border-t border-divine-gold/20 flex justify-center">
                            <Button
                              type="button"
                              onClick={() => {
                                setHasReadLaw(true);
                                setShowLawDialog(false);
                              }}
                              className="bg-sapphire-gradient hover:opacity-90"
                              disabled={!hasReadLaw}
                            >
                              {hasReadLaw ? "Tôi đã đọc và sẵn sàng ký ✨" : "Cuộn xuống để đọc hết..."}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      , bước vào FUN Ecosystem với Pure Love.
                    </Label>
                    {!hasReadLaw && (
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        👆 Nhấn vào "Luật Ánh Sáng (PPLP)" để đọc trước khi ký cam kết
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-sapphire-gradient hover:opacity-90 transition-opacity text-primary-foreground font-medium py-6"
              disabled={isLoading || (isSignUp && !agreedToLightLaw)}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 animate-spin" />
                  Đang xử lý...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  {isSignUp ? "Đăng ký & Bước vào Cổng Ánh Sáng" : "Đăng nhập"}
                </span>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-divine-gold/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-card text-muted-foreground">hoặc tiếp tục với</span>
            </div>
          </div>

          {/* Google Sign In */}
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading || (isSignUp && !agreedToLightLaw)}
            className="w-full py-6 border-divine-gold/20 hover:bg-divine-gold/5 hover:border-divine-gold/40 transition-all"
          >
            {isGoogleLoading ? (
              <span className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 animate-spin" />
                Đang kết nối...
              </span>
            ) : (
              <span className="flex items-center gap-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                {isSignUp ? "Đăng ký với Google" : "Đăng nhập với Google"}
              </span>
            )}
          </Button>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                // Reset agreement state when switching modes
                setAgreedToLightLaw(false);
                setHasReadLaw(false);
              }}
              className="text-sm text-divine-gold hover:text-divine-light transition-colors"
            >
              {isSignUp ? "Đã có tài khoản? Đăng nhập" : "Chưa có tài khoản? Đăng ký"}
            </button>
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Bạn có thể xem nội dung trang chủ mà không cần đăng nhập
          </p>
        </CardContent>
      </Card>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="max-w-md bg-card border-divine-gold/20">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center bg-gradient-to-r from-divine-gold via-divine-light to-divine-gold bg-clip-text text-transparent">
              🔑 Quên Mật Khẩu
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleForgotPassword} className="space-y-4 pt-4">
            <p className="text-sm text-foreground-muted text-center">
              Nhập email của bạn để nhận link đặt lại mật khẩu
            </p>
            <div className="space-y-2">
              <Label htmlFor="resetEmail">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="resetEmail"
                  type="email"
                  placeholder="email@example.com"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  className="pl-10 bg-background/50 border-divine-gold/20 focus:border-divine-gold"
                  required
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForgotPassword(false)}
                className="flex-1"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={isSendingReset}
                className="flex-1 bg-sapphire-gradient hover:opacity-90"
              >
                {isSendingReset ? (
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 animate-spin" />
                    Đang gửi...
                  </span>
                ) : (
                  "Gửi Email"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Post-Login Agreement Dialog (for old users) */}
      <PostLoginAgreementDialog 
        open={showPostLoginAgreement} 
        onAgree={handlePostLoginAgree}
      />
    </div>
  );
};

export default Auth;
