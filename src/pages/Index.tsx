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
      <div className="h-screen bg-background flex w-full overflow-hidden">
        {/* Left Sidebar - Navigation (sticky via Sidebar component) */}
        <MainSidebar />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          <Header />
          
          {/* Daily Login Reward - shows popup when user logs in */}
          {user && <DailyLoginReward />}
          
          {/* Content area with fixed sidebars and scrollable center */}
          <div className="flex-1 flex min-h-0">
            {/* Center Content - Scrollable */}
            <main className="flex-1 min-w-0 overflow-y-auto scrollbar-hide">
              <HeroSection />
              
              {/* Leaderboard for Mobile - shows only on screens below xl */}
              <div className="xl:hidden px-4 py-6">
                <Leaderboard />
              </div>
              
              <CamlyCoinPriceChart />
              <MissionSection />
              <CoreValuesSection />
              <ConnectionSection />
              <Footer />
            </main>
            
            {/* Right Sidebar - Leaderboard (sticky with own scroll) */}
            <aside className="hidden xl:block w-80 2xl:w-96 shrink-0 overflow-y-auto scrollbar-sacred border-l border-amber-200/30 bg-gradient-to-b from-amber-50/80 via-white to-amber-50/50">
              <div className="p-4">
                <Leaderboard />
              </div>
            </aside>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
