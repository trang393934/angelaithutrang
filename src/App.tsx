// App entry point
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { Web3WalletProvider } from "@/contexts/Web3WalletContext";
import { ProfileCompletionGate } from "@/components/ProfileCompletionGate";
import { WithdrawalCelebration } from "@/components/WithdrawalCelebration";
import { UserLiXiCelebrationPopup } from "@/components/UserLiXiCelebrationPopup";
import { ScrollToTop } from "@/components/ScrollToTop";
import { BackToTopButton } from "@/components/BackToTopButton";
import { ValentineMusicPlayer } from "@/components/ValentineMusicPlayer";
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
import AdminImageHistory from "./pages/AdminImageHistory";
import AdminIdeas from "./pages/AdminIdeas";
import AdminBounty from "./pages/AdminBounty";
import AdminProjectFund from "./pages/AdminProjectFund";
import AdminMintStats from "./pages/AdminMintStats";
import AdminMintApproval from "./pages/AdminMintApproval";
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
import LightConstitution from "./pages/docs/LightConstitution";
import CorePrompt from "./pages/docs/CorePrompt";
import PoPLWhitepaper from "./pages/docs/PoPLWhitepaper";
import MasterCharter from "./pages/docs/MasterCharter";
import FunGovernance from "./pages/docs/FunGovernance";
import UserProfile from "./pages/UserProfile";
import Messages from "./pages/Messages";
import ActivityHistory from "./pages/ActivityHistory";
import Mint from "./pages/Mint";
import Receipt from "./pages/Receipt";
import AdminTipReports from "./pages/AdminTipReports";
import AdminTetReward from "./pages/AdminTetReward";
import Notifications from "./pages/Notifications";
import HandleProfile from "./pages/HandleProfile";
import AdminReport from "./pages/AdminReport";
import AdminUserManagement from "./pages/AdminUserManagement";

// Note: Global error handling is in main.tsx (registered before React renders)

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <Web3WalletProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <WithdrawalCelebration />
          <UserLiXiCelebrationPopup />
          <BrowserRouter>
            <ScrollToTop />
            <BackToTopButton />
             <ValentineMusicPlayer />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/about" element={<About />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:tab" element={<Profile />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/earn" element={<Earn />} />
              <Route path="/vision" element={<Vision />} />
              <Route path="/ideas" element={<Ideas />} />
              <Route path="/bounty" element={<Bounty />} />
              <Route path="/content-writer" element={<ContentWriter />} />
              <Route path="/swap" element={<Swap />} />
              <Route path="/knowledge" element={<Knowledge />} />
              <Route path="/activity-history" element={<ActivityHistory />} />
              <Route path="/mint" element={<Mint />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/knowledge" element={<AdminKnowledge />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/withdrawals" element={<AdminWithdrawals />} />
              <Route path="/admin/early-adopters" element={<AdminEarlyAdopters />} />
              <Route path="/admin/statistics" element={<AdminStatistics />} />
              <Route path="/admin/activity-history" element={<AdminActivityHistory />} />
              <Route path="/admin/ai-usage" element={<AdminAIUsage />} />
              <Route path="/admin/image-history" element={<AdminImageHistory />} />
              <Route path="/admin/ideas" element={<AdminIdeas />} />
              <Route path="/admin/bounty" element={<AdminBounty />} />
              <Route path="/admin/project-fund" element={<AdminProjectFund />} />
              <Route path="/admin/mint-stats" element={<AdminMintStats />} />
              <Route path="/admin/mint-approval" element={<AdminMintApproval />} />
              <Route path="/admin/tip-reports" element={<AdminTipReports />} />
              <Route path="/admin/tet-reward" element={<AdminTetReward />} />
              <Route path="/admin/report" element={<AdminReport />} />
              <Route path="/admin/user-management" element={<AdminUserManagement />} />
              <Route path="/receipt/:receiptId" element={<Receipt />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/community-questions" element={<CommunityQuestions />} />
              <Route path="/community" element={<Community />} />
              <Route path="/user/:userId" element={<UserProfile />} />
              <Route path="/@:handle" element={<HandleProfile />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/messages/:userId" element={<Messages />} />
              <Route path="/docs/platform" element={<PlatformDocs />} />
              <Route path="/docs/light-constitution" element={<LightConstitution />} />
              <Route path="/docs/core-prompt" element={<CorePrompt />} />
              <Route path="/docs/popl" element={<PoPLWhitepaper />} />
              <Route path="/docs/master-charter" element={<MasterCharter />} />
              <Route path="/docs/fun-governance" element={<FunGovernance />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
        </Web3WalletProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
