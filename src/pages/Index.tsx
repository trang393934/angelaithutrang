import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { MissionSection } from "@/components/MissionSection";
import { CoreValuesSection } from "@/components/CoreValuesSection";
import { ConnectionSection } from "@/components/ConnectionSection";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
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
