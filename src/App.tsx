// App entry point
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { LanguageProvider } from "@/contexts/LanguageContext";
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
import CommunityQuestions from "./pages/CommunityQuestions";
import Earn from "./pages/Earn";
import Vision from "./pages/Vision";
import Swap from "./pages/Swap";
import Knowledge from "./pages/Knowledge";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/about" element={<About />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/earn" element={<Earn />} />
              <Route path="/vision" element={<Vision />} />
              <Route path="/swap" element={<Swap />} />
              <Route path="/knowledge" element={<Knowledge />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/knowledge" element={<AdminKnowledge />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/withdrawals" element={<AdminWithdrawals />} />
              <Route path="/admin/early-adopters" element={<AdminEarlyAdopters />} />
              <Route path="/community" element={<CommunityQuestions />} />
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
