import { useRef, useEffect, useCallback } from "react";
import { setCanonical, cleanupSeo, getSeoOrigin } from "@/lib/seoHelpers";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { MasterCharterShowcase } from "@/components/MasterCharterShowcase";
import { WelcomeBlock } from "@/components/WelcomeBlock";
import { BenefitsSection } from "@/components/BenefitsSection";
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
import { LightConstitutionBanner } from "@/components/LightConstitutionBanner";
import { MasterCharterBanner } from "@/components/MasterCharterBanner";
import { BackToTopButton } from "@/components/BackToTopButton";



const Index = () => {
  const { user } = useAuth();
  const mainRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  // Set homepage canonical
  useEffect(() => {
    setCanonical(`${getSeoOrigin()}/`);
    return () => cleanupSeo();
  }, []);

  // Measure header height dynamically for video positioning
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const updateHeight = () => {
      const h = el.getBoundingClientRect().height;
      document.documentElement.style.setProperty('--index-header-h', `${h}px`);
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="h-screen flex w-full overflow-hidden relative">
        {/* Left Sidebar - Navigation (sticky via Sidebar component) */}
        <MainSidebar />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative z-10">
          <div ref={headerRef}>
            <Header />
          </div>
          
          
          {/* Daily Login Reward - shows popup when user logs in */}
          {user && <DailyLoginReward />}
          
            {/* Content area with fixed sidebars and scrollable center */}
            <div className="flex-1 flex min-h-0 relative z-[2]">
            {/* Center Content - Scrollable */}
            <main ref={mainRef} className="flex-1 min-w-0 overflow-y-auto scrollbar-hide relative z-[2]">
              <HeroSection />
              
              {/* Master Charter Showcase - MOST PROMINENT POSITION */}
              <MasterCharterShowcase />
              
              {/* Welcome Block */}
              <WelcomeBlock />
              
              {/* Benefits Section - 16 Lợi ích */}
              <BenefitsSection />
              
              {/* Leaderboard for Mobile - shows only on screens below xl */}
              <div className="xl:hidden px-4 py-6">
                <Leaderboard />
              </div>
              
              {/* Master Charter & Light Constitution Banners */}
              <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-4 bg-white/60 backdrop-blur-[2px]">
                <MasterCharterBanner />
                <LightConstitutionBanner />
              </div>
              
              <CamlyCoinPriceChart />
              <MissionSection />
              <CoreValuesSection />
              <ConnectionSection />
              <Footer />
            </main>
            
            {/* Right Sidebar - Leaderboard */}
            <aside className="hidden xl:block w-80 2xl:w-96 shrink-0 overflow-y-auto scrollbar-sacred border-l border-amber-200/30 bg-white/60 backdrop-blur-sm">
              <div className="p-4 mt-2">
                <Leaderboard />
              </div>
            </aside>
          </div>
        </div>
        <BackToTopButton scrollRef={mainRef} />
        
      </div>
    </SidebarProvider>
  );
};

export default Index;
