import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLightAgreement } from "@/hooks/useLightAgreement";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles, LogIn } from "lucide-react";

interface LightGateProps {
  children: ReactNode;
}

export function LightGate({ children }: LightGateProps) {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { hasAgreed, isChecking } = useLightAgreement();
  const { t } = useLanguage();

  // Loading state
  if (authLoading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/20">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">{t("loading") || "Đang tải..."}</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/20 p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <LogIn className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">
            {t("loginRequired") || "Vui lòng đăng nhập"}
          </h1>
          <p className="text-muted-foreground">
            {t("loginRequiredDesc") || "Bạn cần đăng nhập để sử dụng tính năng này."}
          </p>
          <Button 
            onClick={() => navigate("/auth")} 
            className="gap-2"
          >
            <LogIn className="w-4 h-4" />
            {t("login") || "Đăng nhập"}
          </Button>
        </div>
      </div>
    );
  }

  // Logged in but hasn't agreed to Law of Light
  if (hasAgreed === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/20 p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto">
            <Lock className="w-10 h-10 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold">
            {t("lightGateClosed") || "Cổng Ánh Sáng Đang Đóng"}
          </h1>
          <p className="text-muted-foreground">
            {t("lightGateDesc") || "Bạn cần đồng ý với Luật Ánh Sáng để sử dụng tính năng này. Đây là cam kết thiêng liêng để duy trì năng lượng tích cực trong cộng đồng."}
          </p>
          <div className="flex flex-col gap-3">
            <Button 
              onClick={() => navigate("/auth")} 
              className="gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {t("agreeToLawOfLight") || "Đồng ý Luật Ánh Sáng"}
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => navigate("/")}
            >
              {t("backToHome") || "Quay về Trang chủ"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // User has agreed - render children
  return <>{children}</>;
}
