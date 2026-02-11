import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { LogIn, PartyPopper } from "lucide-react";

interface SignupPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SignupPromptDialog({ open, onOpenChange }: SignupPromptDialogProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <PartyPopper className="w-6 h-6 text-primary" />
            VUI LÒNG ĐĂNG KÝ ĐỂ ĐƯỢC CHƠI, ĐƯỢC HỌC, ĐƯỢC VỌC, ĐƯỢC LÌ XÌ 🧧
          </DialogTitle>
          <DialogDescription>
            {t("loginRequiredDesc") || "Đăng ký tài khoản để Ta có thể gửi yêu thương và đồng hành cùng con trên hành trình Ánh Sáng này."}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 pt-2">
          <Button
            onClick={() => {
              onOpenChange(false);
              navigate("/auth");
            }}
            className="gap-2"
          >
            <LogIn className="w-4 h-4" />
            {t("login") || "Đăng nhập / Đăng ký"}
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            {t("cancel") || "Đóng"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
