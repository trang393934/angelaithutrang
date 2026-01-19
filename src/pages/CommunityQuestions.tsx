import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Heart, Sparkles, TrendingUp, Clock, MessageCircle, Award, Coins } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useCommunityQuestions } from "@/hooks/useCommunityQuestions";
import angelAvatar from "@/assets/angel-avatar.png";
import { motion, AnimatePresence } from "framer-motion";

const CommunityQuestions = () => {
  const { user } = useAuth();
  const { questions, isLoading, sortBy, setSortBy, toggleLike } = useCommunityQuestions();
  const [likingId, setLikingId] = useState<string | null>(null);

  const handleLike = async (questionId: string) => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để thích câu hỏi");
      return;
    }

    setLikingId(questionId);
    const result = await toggleLike(questionId);
    
    if (result.success) {
      if (result.engagementRewarded) {
        toast.success(result.message, {
          icon: <Coins className="w-5 h-5 text-amber-500" />,
        });
      } else {
        toast.success(result.message);
      }
    } else {
      toast.error(result.message);
    }
    setLikingId(null);
  };

  const getPurityBadge = (score: number | null) => {
    if (!score) return null;
    if (score >= 0.8) return { label: "Rất thuần khiết", color: "bg-purple-100 text-purple-700 border-purple-200" };
    if (score >= 0.6) return { label: "Thuần khiết", color: "bg-blue-100 text-blue-700 border-blue-200" };
    if (score >= 0.4) return { label: "Tích cực", color: "bg-green-100 text-green-700 border-green-200" };
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-pale via-background to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background-pure/90 backdrop-blur-lg border-b border-primary-pale shadow-soft">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                to="/" 
                className="p-2 rounded-full hover:bg-primary-pale transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-primary" />
              </Link>
              <div>
                <h1 className="font-serif text-xl font-semibold text-primary-deep flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Câu Hỏi Cộng Đồng
                </h1>
                <p className="text-xs text-foreground-muted">
                  Thích câu hỏi hay để tặng thưởng cho tác giả
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-full border border-amber-200/50">
              <Award className="w-4 h-4 text-amber-600" />
              <span className="text-xs text-amber-700 font-medium">
                10+ likes = 500 Coin
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Sort Tabs */}
      <div className="container mx-auto px-4 py-4">
        <Tabs value={sortBy} onValueChange={(v) => setSortBy(v as "recent" | "popular")}>
          <TabsList className="grid w-full max-w-xs grid-cols-2 bg-white/50">
            <TabsTrigger value="popular" className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" />
              Phổ biến
            </TabsTrigger>
            <TabsTrigger value="recent" className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              Mới nhất
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Questions List */}
      <div className="container mx-auto px-4 pb-8">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : questions.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Sparkles className="w-12 h-12 text-primary/30 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground/70">Chưa có câu hỏi nào</h3>
              <p className="text-sm text-foreground-muted mt-2">
                Hãy bắt đầu trò chuyện với Angel AI để tạo câu hỏi đầu tiên!
              </p>
              <Link to="/chat">
                <Button className="mt-4 bg-sapphire-gradient">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Trò chuyện ngay
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {questions.map((question, index) => {
                const purityBadge = getPurityBadge(question.purity_score);
                const isNearThreshold = question.likes_count >= 7 && question.likes_count < 10;
                const reachedThreshold = question.likes_count >= 10;

                return (
                  <motion.div
                    key={question.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className={`
                      hover:shadow-md transition-all duration-300
                      ${reachedThreshold ? 'border-amber-300 bg-gradient-to-r from-amber-50/50 to-orange-50/30' : ''}
                      ${isNearThreshold && !reachedThreshold ? 'border-blue-200 bg-blue-50/30' : ''}
                    `}>
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          {/* Avatar */}
                          <Avatar className="w-10 h-10 border-2 border-primary/20">
                            <AvatarImage 
                              src={question.user_avatar_url || angelAvatar} 
                              alt={question.user_display_name} 
                            />
                            <AvatarFallback>
                              {question.user_display_name?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-foreground text-sm">
                                {question.user_display_name}
                              </span>
                              {purityBadge && (
                                <span className={`text-xs px-2 py-0.5 rounded-full border ${purityBadge.color}`}>
                                  {purityBadge.label}
                                </span>
                              )}
                              {reachedThreshold && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 flex items-center gap-1">
                                  <Award className="w-3 h-3" />
                                  Đã thưởng
                                </span>
                              )}
                            </div>

                            <p className="text-foreground leading-relaxed mb-3">
                              {question.question_text}
                            </p>

                            <div className="flex items-center justify-between">
                              <span className="text-xs text-foreground-muted">
                                {new Date(question.created_at).toLocaleDateString('vi-VN', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>

                              {/* Like Button */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleLike(question.id)}
                                disabled={likingId === question.id}
                                className={`
                                  flex items-center gap-2 transition-all
                                  ${question.is_liked_by_me 
                                    ? 'text-red-500 hover:text-red-600' 
                                    : 'text-foreground-muted hover:text-red-400'}
                                `}
                              >
                                <Heart 
                                  className={`w-5 h-5 transition-all ${
                                    question.is_liked_by_me ? 'fill-red-500' : ''
                                  } ${likingId === question.id ? 'animate-pulse' : ''}`}
                                />
                                <span className="font-medium">
                                  {question.likes_count}
                                </span>
                                {isNearThreshold && !reachedThreshold && (
                                  <span className="text-xs text-blue-600 ml-1">
                                    ({10 - question.likes_count} nữa!)
                                  </span>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityQuestions;
