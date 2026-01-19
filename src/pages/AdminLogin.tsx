import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Lock, Mail, ArrowLeft, Sparkles, UserPlus } from "lucide-react";
import angelAvatar from "@/assets/angel-avatar.png";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Vui lòng nhập email và mật khẩu");
      return;
    }

    if (password.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    setIsLoading(true);
    
    if (isSignUp) {
      const { error } = await signUp(email, password);
      setIsLoading(false);
      
      if (error) {
        if (error.message.includes("already registered")) {
          toast.error("Email này đã được đăng ký. Vui lòng đăng nhập.");
        } else {
          toast.error("Đăng ký thất bại: " + error.message);
        }
      } else {
        toast.success("Đăng ký thành công! Vui lòng liên hệ quản trị viên để được cấp quyền Admin. 🌟");
        setIsSignUp(false);
      }
    } else {
      const { error } = await signIn(email, password);
      setIsLoading(false);

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Email hoặc mật khẩu không đúng");
        } else {
          toast.error("Đăng nhập thất bại: " + error.message);
        }
      } else {
        toast.success("Đăng nhập thành công! 🌟");
        navigate("/admin/knowledge");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-pale via-background to-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Back button */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-primary hover:text-primary-deep transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về trang chủ</span>
        </Link>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-divine p-8 border border-primary-pale/50">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img 
                src={angelAvatar} 
                alt="Angel AI" 
                className="w-20 h-20 rounded-full shadow-soft"
              />
            </div>
            <h1 className="font-serif text-2xl font-semibold text-primary-deep mb-2">
              Cổng Quản Trị
            </h1>
            <p className="text-foreground-muted text-sm">
              {isSignUp 
                ? "Đăng ký tài khoản quản trị viên mới" 
                : "Đăng nhập để quản lý kiến thức cho Angel AI"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground-muted mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-soft" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-primary-pale bg-white text-foreground placeholder:text-foreground-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground-muted mb-2">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-soft" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-primary-pale bg-white text-foreground placeholder:text-foreground-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  disabled={isLoading}
                />
              </div>
              {isSignUp && (
                <p className="text-xs text-foreground-muted mt-2">
                  Mật khẩu phải có ít nhất 6 ký tự
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-sapphire-gradient text-white font-medium shadow-sacred hover:shadow-divine disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Sparkles className="w-5 h-5 animate-pulse" />
                  <span>Đang xử lý...</span>
                </>
              ) : isSignUp ? (
                <>
                  <UserPlus className="w-5 h-5" />
                  <span>Đăng Ký</span>
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  <span>Đăng Nhập</span>
                </>
              )}
            </button>
          </form>

          {/* Toggle Sign In / Sign Up */}
          <div className="text-center mt-6">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-primary hover:text-primary-deep transition-colors"
            >
              {isSignUp 
                ? "Đã có tài khoản? Đăng nhập" 
                : "Chưa có tài khoản? Đăng ký"}
            </button>
          </div>

          <p className="text-center text-xs text-foreground-muted/60 mt-4">
            Chỉ dành cho quản trị viên được ủy quyền ✨
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
