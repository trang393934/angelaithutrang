import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { CamlyCoinPriceChart } from "@/components/CamlyCoinPriceChart";
import { MissionSection } from "@/components/MissionSection";
import { CoreValuesSection } from "@/components/CoreValuesSection";
import { ConnectionSection } from "@/components/ConnectionSection";
import { Footer } from "@/components/Footer";
import { DailyLoginReward } from "@/components/earn/DailyLoginReward";
import { useAuth } from "@/hooks/useAuth";
import { SidebarProvider } from "@/components/ui/sidebar";
import { MainSidebar } from "@/components/MainSidebar";
import Leaderboard from "@/components/Leaderboard";

const Index = () => {
  const { user } = useAuth();

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen bg-background flex w-full">
        {/* Left Sidebar - Navigation (sticky via Sidebar component) */}
        <MainSidebar />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          
          {/* Daily Login Reward - shows popup when user logs in */}
          {user && <DailyLoginReward />}
          
          {/* Content area with fixed sidebars and scrollable center */}
          <div className="flex-1 flex">
            {/* Center Content - Scrollable */}
            <main className="flex-1 min-w-0 overflow-y-auto">
              <HeroSection />
              <CamlyCoinPriceChart />
              <MissionSection />
              <CoreValuesSection />
              <ConnectionSection />
              <Footer />
            </main>
            
            {/* Right Sidebar - Leaderboard (fixed position, hidden on mobile) */}
            <aside className="hidden xl:block w-80 2xl:w-96 shrink-0 sticky top-0 h-screen overflow-y-auto p-4 border-l border-amber-200/30 bg-gradient-to-b from-amber-50/80 via-white to-amber-50/50">
              <Leaderboard />
            </aside>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
