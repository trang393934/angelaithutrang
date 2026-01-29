// App entry point
import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ProfileCompletionGate } from "@/components/ProfileCompletionGate";
import { WithdrawalCelebration } from "@/components/WithdrawalCelebration";
import Index from "./pages/Index";
import Chat from "./pages/Chat";
import About from "./pages/About";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Onboarding from "./pages/Onboarding";
import AdminLogin from "./pages/AdminLogin";
import AdminKnowledge from "./pages/AdminKnowledge";
import AdminDashboard from "./pages/AdminDashboard";
import AdminWithdrawals from "./pages/AdminWithdrawals";
import AdminEarlyAdopters from "./pages/AdminEarlyAdopters";
import AdminStatistics from "./pages/AdminStatistics";
import AdminActivityHistory from "./pages/AdminActivityHistory";
import AdminAIUsage from "./pages/AdminAIUsage";
import CommunityQuestions from "./pages/CommunityQuestions";
import Community from "./pages/Community";
import Earn from "./pages/Earn";
import Vision from "./pages/Vision";
import Ideas from "./pages/Ideas";
import Bounty from "./pages/Bounty";
import ContentWriter from "./pages/ContentWriter";
import Swap from "./pages/Swap";
import Knowledge from "./pages/Knowledge";
import NotFound from "./pages/NotFound";
import PlatformDocs from "./pages/docs/Platform";
import UserProfile from "./pages/UserProfile";
import Messages from "./pages/Messages";
import ActivityHistory from "./pages/ActivityHistory";
import { toast } from "sonner";

const queryClient = new QueryClient();

// Global unhandled rejection handler component
const GlobalErrorHandler = () => {
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const errorMessage = event.reason?.message || String(event.reason);
      console.error("Unhandled promise rejection:", event.reason);
      
      // Handle MetaMask specific errors gracefully
      if (errorMessage.includes("MetaMask") || errorMessage.includes("ethereum")) {
        toast.error("Không thể kết nối ví. Vui lòng thử lại.", {
          description: "Hãy đảm bảo MetaMask đã được mở khóa và cho phép kết nối."
        });
        event.preventDefault();
        return;
      }
      
      // Handle other wallet connection errors
      if (errorMessage.includes("wallet") || errorMessage.includes("connect")) {
        toast.error("Lỗi kết nối ví", {
          description: "Vui lòng kiểm tra ví của bạn và thử lại."
        });
        event.preventDefault();
        return;
      }
      
      // Prevent app crash for other unhandled rejections
      event.preventDefault();
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    
    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <GlobalErrorHandler />
          <Toaster />
          <Sonner />
          <WithdrawalCelebration />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/chat" element={<ProfileCompletionGate><Chat /></ProfileCompletionGate>} />
              <Route path="/about" element={<About />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/earn" element={<ProfileCompletionGate><Earn /></ProfileCompletionGate>} />
              <Route path="/vision" element={<ProfileCompletionGate><Vision /></ProfileCompletionGate>} />
              <Route path="/ideas" element={<ProfileCompletionGate><Ideas /></ProfileCompletionGate>} />
              <Route path="/bounty" element={<ProfileCompletionGate><Bounty /></ProfileCompletionGate>} />
              <Route path="/content-writer" element={<ProfileCompletionGate><ContentWriter /></ProfileCompletionGate>} />
              <Route path="/swap" element={<Swap />} />
              <Route path="/knowledge" element={<Knowledge />} />
              <Route path="/activity-history" element={<ProfileCompletionGate><ActivityHistory /></ProfileCompletionGate>} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/knowledge" element={<AdminKnowledge />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/withdrawals" element={<AdminWithdrawals />} />
              <Route path="/admin/early-adopters" element={<AdminEarlyAdopters />} />
              <Route path="/admin/statistics" element={<AdminStatistics />} />
              <Route path="/admin/activity-history" element={<AdminActivityHistory />} />
              <Route path="/admin/ai-usage" element={<AdminAIUsage />} />
              <Route path="/community-questions" element={<ProfileCompletionGate><CommunityQuestions /></ProfileCompletionGate>} />
              <Route path="/community" element={<ProfileCompletionGate><Community /></ProfileCompletionGate>} />
              <Route path="/user/:userId" element={<UserProfile />} />
              <Route path="/messages" element={<ProfileCompletionGate><Messages /></ProfileCompletionGate>} />
              <Route path="/messages/:userId" element={<ProfileCompletionGate><Messages /></ProfileCompletionGate>} />
              <Route path="/docs/platform" element={<PlatformDocs />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
