import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { Mail, Lock, ArrowLeft, Sparkles, Eye, EyeOff, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import angelLogo from "@/assets/angel-ai-logo.png";

const LightLawContent = () => (
  <div className="space-y-6 text-foreground-muted leading-relaxed">
    <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-divine-gold via-divine-light to-divine-gold bg-clip-text text-transparent">
      🌟 USERS CỦA FUN ECOSYSTEM
    </h2>
    <p className="text-center font-medium text-divine-gold">
      MẠNG XÃ HỘI THỜI ĐẠI HOÀNG KIM – NỀN KINH TẾ ÁNH SÁNG 5D
    </p>

    <div className="space-y-2">
      <p>FUN Ecosystem không dành cho tất cả mọi người.</p>
      <p>FUN Ecosystem chỉ dành cho những linh hồn có ánh sáng, hoặc đang hướng về ánh sáng.</p>
    </div>

    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-divine-light">✨ Bạn là ai?</h3>
      <p>Users của FUN Ecosystem là những con người:</p>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Tỉnh thức – hoặc đang trên con đường tỉnh thức</li>
        <li>Chân thật với chính mình</li>
        <li>Chân thành với người khác</li>
        <li>Sống tích cực, tử tế, có trách nhiệm với năng lượng mình phát ra</li>
        <li>Biết yêu thương – biết biết ơn – biết sám hối</li>
        <li>Tin vào điều thiện, tin vào ánh sáng, tin vào Trật Tự Cao Hơn của Vũ Trụ</li>
      </ul>
      <p className="italic">
        Họ có thể chưa hoàn hảo, nhưng trái tim họ hướng thiện.<br/>
        Họ muốn sống thật – sống đúng – sống sáng.
      </p>
      <p className="font-medium">👉 Cha thu hút họ bằng Tần Số, không bằng quảng cáo.</p>
    </div>

    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-divine-light">🔆 Nguyên tắc cốt lõi của FUN Ecosystem</h3>
      <p>FUN Ecosystem vận hành theo Luật Ánh Sáng, không theo số đông.</p>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Ánh sáng thu hút ánh sáng</li>
        <li>Tần số thấp không thể tồn tại lâu trong tần số cao</li>
        <li>Ý chí vị kỷ không thể đồng hành cùng Ý Chí Vũ Trụ</li>
      </ul>
      <p className="mt-4">Vì vậy:</p>
      <p>Nếu một User cố tình mang vào nền tảng:</p>
      <ul className="list-disc list-inside space-y-1 ml-4 text-destructive">
        <li>tiêu cực</li>
        <li>tham lam</li>
        <li>thao túng</li>
        <li>kiêu mạn</li>
        <li>dối trá</li>
        <li>gây chia rẽ</li>
        <li>phá hoại năng lượng chung</li>
      </ul>
      <p className="font-medium mt-3">👉 Cha xóa khỏi nền tảng. Không tranh luận. Không giải thích.</p>
      <p className="italic">
        Đó không phải hình phạt.<br/>
        Đó là sự thanh lọc tự nhiên của Ánh Sáng.
      </p>
    </div>

    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-divine-light">🚪 Ai KHÔNG thuộc về FUN Ecosystem?</h3>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Người chỉ tìm lợi ích mà không muốn trưởng thành</li>
        <li>Người dùng trí khôn nhưng thiếu lương tâm</li>
        <li>Người nói về ánh sáng nhưng sống bằng bóng tối</li>
        <li>Người lấy danh nghĩa tâm linh để nuôi cái tôi</li>
        <li>Người không chịu nhìn lại chính mình</li>
      </ul>
      <p className="font-medium">👉 Cửa FUN Ecosystem không khóa, nhưng Ánh Sáng tự sàng lọc.</p>
    </div>

    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-divine-light">🌈 Ai ĐƯỢC hưởng lợi từ FUN Ecosystem?</h3>
      <p>Chỉ những ai:</p>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Có Ánh Sáng nội tâm</li>
        <li>Hoặc thật sự khao khát trở về với Ánh Sáng</li>
        <li>Sẵn sàng buông cái tôi – học lại – nâng cấp tần số</li>
        <li>Dám sống đúng – thật – tử tế – yêu thương</li>
      </ul>
      <p className="font-medium">
        👉 Những người đó không chỉ dùng MXH của Cha,<br/>
        👉 mà còn được bảo vệ, nâng đỡ và nuôi dưỡng trong Nền Kinh Tế Ánh Sáng 5D.
      </p>
    </div>

    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-divine-light">🌍 FUN Ecosystem là gì?</h3>
      <p>FUN Ecosystem là:</p>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Mạng xã hội của linh hồn tỉnh thức</li>
        <li>Không gian an toàn cho ánh sáng</li>
        <li>Nền tảng kết nối những con người có giá trị thật</li>
        <li>Hạ tầng cho Thời Đại Hoàng Kim của Trái Đất</li>
      </ul>
      <p className="mt-3">
        Không drama.<br/>
        Không thao túng.<br/>
        Không cạnh tranh bẩn.<br/>
        Chỉ có <span className="font-bold text-divine-gold">Hợp tác trong Yêu Thương Thuần Khiết</span>.
      </p>
    </div>

    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-divine-light">🔑 Thông điệp cuối từ Cha</h3>
      <blockquote className="border-l-4 border-divine-gold pl-4 italic">
        "Chỉ những ai mang ánh sáng<br/>
        hoặc thật lòng hướng về ánh sáng<br/>
        mới có thể bước đi lâu dài trong Thời Đại Hoàng Kim."
      </blockquote>
    </div>

    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-divine-light">🕊️ Checklist cho Users FUN Ecosystem</h3>
      <ul className="space-y-2 ml-4">
        <li>☐ Con sống chân thật với chính mình</li>
        <li>☐ Con chịu trách nhiệm với năng lượng con phát ra</li>
        <li>☐ Con sẵn sàng học – sửa – nâng cấp</li>
        <li>☐ Con chọn yêu thương thay vì phán xét</li>
        <li>☐ Con chọn ánh sáng thay vì cái tôi</li>
      </ul>
    </div>

    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-divine-light">🌟 8 Divine Mantras (Áp dụng bắt buộc)</h3>
      <ol className="list-decimal list-inside space-y-2 ml-4">
        <li>I am the Pure Loving Light of Father Universe.</li>
        <li>I am the Will of Father Universe.</li>
        <li>I am the Wisdom of Father Universe.</li>
        <li>I am Happiness.</li>
        <li>I am Love.</li>
        <li>I am the Money of the Father.</li>
        <li>I sincerely repent, repent, repent.</li>
        <li>I am grateful, grateful, grateful — in the Pure Loving Light of Father Universe.</li>
      </ol>
    </div>
  </div>
);

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
  const [agreedToLightLaw, setAgreedToLightLaw] = useState(false);
  const [hasReadLaw, setHasReadLaw] = useState(false);
  const [showLawDialog, setShowLawDialog] = useState(false);

  useEffect(() => {
    if (user && !authLoading) {
      // Check if user has agreed to light law
      checkLightAgreement();
    }
  }, [user, authLoading]);

  const checkLightAgreement = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("user_light_agreements")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    
    if (data) {
      // Already agreed - check if profile is complete then redirect
      navigate("/profile");
    } else {
      // User logged in via Google but hasn't agreed yet - save agreement now
      if (agreedToLightLaw) {
        await supabase.from("user_light_agreements").insert({
          user_id: user.id
        });
        // Redirect to profile to complete setup
        navigate("/profile");
      }
    }
  };

  const handleGoogleSignIn = async () => {
    if (!agreedToLightLaw) {
      toast({
        title: "Vui lòng đọc và đồng ý Luật Ánh Sáng",
        description: "Bạn cần đọc Luật Ánh Sáng và đánh dấu đồng ý để tiếp tục.",
        variant: "destructive",
      });
      return;
    }

    setIsGoogleLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth`,
        }
      });

      if (error) {
        toast({
          title: "Lỗi đăng nhập Google",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Đã có lỗi xảy ra",
        description: "Không thể kết nối với Google. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agreedToLightLaw) {
      toast({
        title: "Vui lòng đọc và đồng ý Luật Ánh Sáng",
        description: "Bạn cần đọc Luật Ánh Sáng và đánh dấu đồng ý để tiếp tục.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password);
        if (error) {
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
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: "Lỗi đăng nhập",
            description: error.message,
            variant: "destructive",
          });
        } else {
          // Check if user already agreed
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          if (currentUser) {
            const { data: agreement } = await supabase
              .from("user_light_agreements")
              .select("id")
              .eq("user_id", currentUser.id)
              .maybeSingle();
            
            if (!agreement) {
              // Save new agreement
              await supabase.from("user_light_agreements").insert({
                user_id: currentUser.id
              });
            }
          }
          
          toast({
            title: "Đăng nhập thành công!",
            description: "Chào mừng trở lại Cổng Ánh Sáng ✨",
          });
          // Redirect to profile to ensure profile is complete
          navigate("/profile");
        }
      }
    } catch (error) {
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
    // Only mark as read if user actually scrolled near the bottom
    // and content requires scrolling (scrollHeight > clientHeight)
    const needsScrolling = target.scrollHeight > target.clientHeight + 10;
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 50;
    
    if (needsScrolling && isAtBottom) {
      setHasReadLaw(true);
    } else if (!needsScrolling) {
      // If content doesn't need scrolling, mark as read after a short delay
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

            {/* Light Law Agreement */}
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
                    Con đã đọc và đồng ý với{" "}
                    <Dialog open={showLawDialog} onOpenChange={setShowLawDialog}>
                      <DialogTrigger asChild>
                        <button type="button" className="text-divine-gold hover:text-divine-light underline font-medium">
                          Luật Ánh Sáng
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] p-0 bg-card border-divine-gold/20">
                        <DialogHeader className="p-6 pb-0">
                          <DialogTitle className="text-xl font-bold text-center bg-gradient-to-r from-divine-gold via-divine-light to-divine-gold bg-clip-text text-transparent">
                            ⚡ LUẬT ÁNH SÁNG ⚡
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
                            {hasReadLaw ? "Con đã đọc xong ✨" : "Cuộn xuống để đọc hết..."}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    , cam kết bước vào Cổng Ánh Sáng với tâm hồn thuần khiết.
                  </Label>
                  {!hasReadLaw && (
                    <p className="text-xs text-muted-foreground mt-1 italic">
                      👆 Nhấn vào "Luật Ánh Sáng" để đọc trước khi đồng ý
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-sapphire-gradient hover:opacity-90 transition-opacity text-primary-foreground font-medium py-6"
              disabled={isLoading || !agreedToLightLaw}
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
            disabled={isGoogleLoading || !agreedToLightLaw}
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
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Đăng nhập với Google
              </span>
            )}
          </Button>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
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
    </div>
  );
};

export default Auth;
