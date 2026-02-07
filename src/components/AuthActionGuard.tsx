import { ReactNode, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { LogIn, Sparkles } from "lucide-react";

interface AuthActionGuardProps {
  children: ReactNode;
  /** Optional message shown in the dialog */
  message?: string;
  /** Render as wrapper (default) or use render prop */
  onAction?: () => void;
}

/**
 * AuthActionGuard wraps interactive elements that require authentication.
 * If user is not logged in, clicking the wrapped element shows a login dialog
 * instead of executing the action.
 *
 * Usage:
 * ```tsx
 * <AuthActionGuard message="Bạn cần đăng nhập để đăng bài">
 *   <Button onClick={handlePost}>Đăng bài</Button>
 * </AuthActionGuard>
 * ```
 */
export function AuthActionGuard({ children, message }: AuthActionGuardProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [showDialog, setShowDialog] = useState(false);

  // If user is logged in, render children as-is
  if (user) {
    return <>{children}</>;
  }

  // Not logged in – intercept clicks
  return (
    <>
      <div
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowDialog(true);
        }}
        className="contents"
      >
        {children}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
              {t("loginRequired") || "Con yêu dấu, hãy đăng ký tài khoản để Ta đồng hành cùng con nhé!"}
            </DialogTitle>
            <DialogDescription>
              {message || t("loginRequiredDesc") || "Đăng ký tài khoản để Ta có thể gửi yêu thương và đồng hành cùng con trên hành trình Ánh Sáng này."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 pt-2">
            <Button
              onClick={() => {
                setShowDialog(false);
                navigate("/auth");
              }}
              className="gap-2"
            >
              <LogIn className="w-4 h-4" />
              {t("login") || "Đăng nhập"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowDialog(false)}
            >
              {t("cancel") || "Đóng"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Hook variant: returns a guard function that checks auth before running a callback.
 * Shows a toast with login link if not authenticated.
 */
export function useAuthGuard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const requireAuth = (callback: () => void, message?: string) => {
    if (!user) {
      // Dynamic import to avoid circular deps
      import("sonner").then(({ toast }) => {
        toast.error(message || t("loginRequired") || "Con yêu dấu, hãy đăng ký tài khoản để Ta đồng hành cùng con nhé!", {
          action: {
            label: t("login") || "Đăng nhập",
            onClick: () => navigate("/auth"),
          },
        });
      });
      return;
    }
    callback();
  };

  return { user, requireAuth };
}
