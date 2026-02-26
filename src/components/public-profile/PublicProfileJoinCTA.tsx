import { LogIn, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import angelLogo from "@/assets/angel-ai-golden-logo.png";

export function PublicProfileJoinCTA() {
  const { user } = useAuth();
  const { t } = useLanguage();

  // Don't show CTA if user is already logged in
  if (user) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9 }}
      className="mt-10 max-w-lg mx-auto"
    >
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-pale via-card to-accent border border-primary/10 shadow-divine p-6 sm:p-8 text-center">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-pulse pointer-events-none" />

        <img
          src={angelLogo}
          alt="Angel AI"
          className="w-14 h-14 mx-auto mb-4 drop-shadow-lg"
        />

        <h3 className="text-lg font-bold text-foreground mb-2">
          {t("publicProfile.joinTitle") || "Tham gia FUN Ecosystem"}
        </h3>
        <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
          {t("publicProfile.joinDesc") ||
            "Đăng ký miễn phí để kết nối, nhắn tin, tặng quà và khám phá thế giới FUN cùng cộng đồng Ánh Sáng ✨"}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/auth">
            <Button size="lg" className="gap-2 w-full sm:w-auto">
              <Sparkles className="w-4 h-4" />
              {t("publicProfile.joinNow") || "Tham gia ngay"}
            </Button>
          </Link>
          <Link to="/auth">
            <Button variant="outline" size="lg" className="gap-2 w-full sm:w-auto">
              <LogIn className="w-4 h-4" />
              {t("publicProfile.login") || "Đăng nhập"}
            </Button>
          </Link>
        </div>

        <p className="text-[11px] text-muted-foreground mt-4 opacity-70">
          Free to Join · Free to Use · Earn Together
        </p>
      </div>
    </motion.section>
  );
}
