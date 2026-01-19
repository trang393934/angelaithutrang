import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { MissionSection } from "@/components/MissionSection";
import { CoreValuesSection } from "@/components/CoreValuesSection";
import { ConnectionSection } from "@/components/ConnectionSection";
import { Footer } from "@/components/Footer";
import { DailyLoginReward } from "@/components/earn/DailyLoginReward";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Daily Login Reward - shows popup when user logs in */}
      {user && <DailyLoginReward />}
      
      <main>
        <HeroSection />
        <MissionSection />
        <CoreValuesSection />
        <ConnectionSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
