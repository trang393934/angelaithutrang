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
        {/* Left Sidebar - Navigation */}
        <MainSidebar />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          
          {/* Daily Login Reward - shows popup when user logs in */}
          {user && <DailyLoginReward />}
          
          <main className="flex-1">
            <div className="flex">
              {/* Center Content */}
              <div className="flex-1 min-w-0">
                <HeroSection />
                <CamlyCoinPriceChart />
                <MissionSection />
                <CoreValuesSection />
                <ConnectionSection />
              </div>
              
              {/* Right Sidebar - Leaderboard (hidden on mobile, sticky on desktop) */}
              <aside className="hidden xl:block w-80 2xl:w-96 shrink-0 p-4 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
                <Leaderboard />
              </aside>
            </div>
          </main>
          <Footer />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
