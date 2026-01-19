import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DailyLoginReward } from "@/components/earn/DailyLoginReward";
import { EarnProgress } from "@/components/earn/EarnProgress";
import { StreakCalendar } from "@/components/earn/StreakCalendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useCamlyCoin } from "@/hooks/useCamlyCoin";
import { Link } from "react-router-dom";
import { 
  Coins, 
  Trophy, 
  Target, 
  Sparkles,
  MessageCircle,
  BookOpen,
  Lightbulb,
  Gift,
  ArrowRight,
  Eye
} from "lucide-react";
import camlyCoinLogo from "@/assets/camly-coin-logo.png";

export default function Earn() {
  const { user } = useAuth();
  const { balance, lifetimeEarned, isLoading } = useCamlyCoin();

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <img src={camlyCoinLogo} alt="Camly Coin" className="w-16 h-16" />
            </div>
            <h1 className="text-3xl font-bold">Tích Lũy Ánh Sáng</h1>
            <p className="text-muted-foreground">
              Đăng nhập để bắt đầu kiếm Camly Coin thông qua các hoạt động hữu ích
            </p>
            <Button asChild size="lg" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
              <Link to="/auth">
                Đăng nhập ngay
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      {/* Daily Login Reward Popup */}
      <DailyLoginReward />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              Tích Lũy Ánh Sáng
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Tham gia các hoạt động để kiếm Camly Coin - đồng tiền của sự biết ơn và tích cực
            </p>
          </div>

          {/* Balance Overview */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-white/80 text-sm font-medium flex items-center gap-2">
                  <Coins className="h-4 w-4" />
                  Số dư hiện tại
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <img src={camlyCoinLogo} alt="Camly Coin" className="w-12 h-12" />
                  <span className="text-4xl font-bold">
                    {isLoading ? "..." : balance.toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-white/80 text-sm font-medium flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Tổng đã kiếm
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Sparkles className="w-12 h-12" />
                  <span className="text-4xl font-bold">
                    {isLoading ? "..." : lifetimeEarned.toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-pink-500 text-white border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-white/80 text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Mục tiêu hôm nay
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Gift className="w-12 h-12" />
                  <div>
                    <span className="text-4xl font-bold">50K</span>
                    <span className="text-white/80 text-sm ml-1">coin</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main content grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Earn Progress - takes 2 columns */}
            <div className="lg:col-span-2">
              <EarnProgress />
            </div>

            {/* Streak Calendar */}
            <div>
              <StreakCalendar />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardContent className="p-6 text-center">
                <Link to="/chat" className="space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <MessageCircle className="h-7 w-7 text-purple-600" />
                  </div>
                  <h3 className="font-semibold">Đặt câu hỏi</h3>
                  <p className="text-xs text-muted-foreground">1000-5000 coin/câu</p>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardContent className="p-6 text-center">
                <Link to="/profile" className="space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <BookOpen className="h-7 w-7 text-emerald-600" />
                  </div>
                  <h3 className="font-semibold">Viết nhật ký</h3>
                  <p className="text-xs text-muted-foreground">5000-9000 coin/bài</p>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardContent className="p-6 text-center">
                <Link to="/ideas" className="space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Lightbulb className="h-7 w-7 text-yellow-600" />
                  </div>
                  <h3 className="font-semibold">Góp ý tưởng</h3>
                  <p className="text-xs text-muted-foreground">1000 coin khi duyệt</p>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardContent className="p-6 text-center">
                <Link to="/vision" className="space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Eye className="h-7 w-7 text-pink-600" />
                  </div>
                  <h3 className="font-semibold">Vision Board</h3>
                  <p className="text-xs text-muted-foreground">1000 coin lần đầu</p>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardContent className="p-6 text-center">
                <Link to="/bounty" className="space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Trophy className="h-7 w-7 text-orange-600" />
                  </div>
                  <h3 className="font-semibold">Bounty Tasks</h3>
                  <p className="text-xs text-muted-foreground">500-10000 coin/task</p>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
