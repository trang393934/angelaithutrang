import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { VisionBoardForm } from "@/components/vision/VisionBoardForm";
import { VisionBoardCard } from "@/components/vision/VisionBoardCard";
import { useVisionBoard } from "@/hooks/useVisionBoard";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { 
  Target, 
  Plus, 
  Sparkles, 
  ArrowRight,
  Trophy,
  Eye
} from "lucide-react";
import camlyCoinLogo from "@/assets/camly-coin-logo.png";

export default function Vision() {
  const { user } = useAuth();
  const { 
    boards, 
    isLoading, 
    isCreating, 
    hasFirstBoard,
    createBoard,
    deleteBoard,
    toggleGoal 
  } = useVisionBoard();
  
  const [showForm, setShowForm] = useState(false);

  const handleCreateBoard = async (data: {
    title: string;
    description?: string;
    goals: string[];
    is_public?: boolean;
  }) => {
    const result = await createBoard(data);
    if (result.success) {
      setShowForm(false);
    }
  };

  // Stats
  const totalGoals = boards.reduce((sum, b) => sum + b.total_goals_count, 0);
  const completedGoals = boards.reduce((sum, b) => sum + b.completed_goals_count, 0);
  const completedBoards = boards.filter(b => b.completed_goals_count === b.total_goals_count && b.total_goals_count > 0).length;

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
              <Target className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold">Vision Board</h1>
            <p className="text-muted-foreground">
              Tạo bảng tầm nhìn để định hình mục tiêu và theo dõi tiến độ của bạn
            </p>
            <div className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400">
              <img src={camlyCoinLogo} alt="Camly Coin" className="w-6 h-6" />
              <span className="font-medium">Nhận 1000 Camly Coin khi tạo Vision Board đầu tiên!</span>
            </div>
            <Button asChild size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
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
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Vision Board
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Định hình tầm nhìn, đặt mục tiêu và theo dõi hành trình đạt được ước mơ của bạn
            </p>
          </div>

          {/* Stats */}
          {boards.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="bg-gradient-to-br from-purple-500 to-pink-500 text-white border-0">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Eye className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-white/80 text-sm">Vision Boards</p>
                    <p className="text-2xl font-bold">{boards.length}</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white border-0">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Target className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-white/80 text-sm">Mục tiêu hoàn thành</p>
                    <p className="text-2xl font-bold">{completedGoals}/{totalGoals}</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-green-500 to-emerald-500 text-white border-0">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Trophy className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-white/80 text-sm">Boards hoàn thành</p>
                    <p className="text-2xl font-bold">{completedBoards}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* First board reward banner */}
          {!hasFirstBoard && !showForm && (
            <Card className="bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800">
              <CardContent className="p-6 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                    <img src={camlyCoinLogo} alt="Camly Coin" className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-amber-800 dark:text-amber-200">
                      Nhận ngay 1000 Camly Coin!
                    </h3>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      Tạo Vision Board đầu tiên của bạn để nhận phần thưởng
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={() => setShowForm(true)}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Tạo ngay
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Create form or button */}
          {showForm ? (
            <VisionBoardForm
              isFirstBoard={!hasFirstBoard}
              isSubmitting={isCreating}
              onSubmit={handleCreateBoard}
              onCancel={() => setShowForm(false)}
            />
          ) : hasFirstBoard && (
            <Button 
              onClick={() => setShowForm(true)}
              className="w-full py-6 border-dashed border-2 bg-transparent hover:bg-purple-50 dark:hover:bg-purple-950/20 text-purple-600 dark:text-purple-400 border-purple-300 dark:border-purple-700"
              variant="outline"
            >
              <Plus className="h-5 w-5 mr-2" />
              Tạo Vision Board mới
            </Button>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6 space-y-4">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Vision boards list */}
          {!isLoading && boards.length > 0 && (
            <div className="space-y-4">
              {boards.map(board => (
                <VisionBoardCard
                  key={board.id}
                  board={board}
                  onToggleGoal={toggleGoal}
                  onDelete={deleteBoard}
                />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && boards.length === 0 && !showForm && (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 mx-auto rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
                  <Target className="h-10 w-10 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Chưa có Vision Board nào</h3>
                <p className="text-muted-foreground mb-6">
                  Bắt đầu tạo Vision Board đầu tiên để định hình tầm nhìn và theo dõi mục tiêu
                </p>
                <Button 
                  onClick={() => setShowForm(true)}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Tạo Vision Board đầu tiên
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
