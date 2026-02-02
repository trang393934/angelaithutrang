import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Lightbulb,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Gift,
  MessageSquare,
  User,
  Calendar,
  ThumbsUp,
  Loader2,
} from "lucide-react";
import camlyCoinLogo from "@/assets/camly-coin-logo.png";

interface Idea {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string | null;
  status: string;
  votes_count: number;
  is_rewarded: boolean;
  reward_amount: number | null;
  admin_feedback: string | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  user_display_name?: string;
  user_email?: string;
}

export default function AdminIdeas() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");
  
  // Review dialog state
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [rewardAmount, setRewardAmount] = useState(1000);
  const [isProcessing, setIsProcessing] = useState(false);

  // Check admin status
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        navigate("/admin/login");
        return;
      }

      const { data, error } = await supabase.rpc("is_admin");
      if (error || !data) {
        navigate("/admin/login");
        return;
      }

      setIsAdmin(true);
    };

    checkAdmin();
  }, [user, navigate]);

  // Fetch ideas
  const fetchIdeas = async () => {
    setIsLoading(true);
    try {
      const { data: ideasData, error } = await supabase
        .from("build_ideas")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch user profiles for display names
      if (ideasData && ideasData.length > 0) {
        const userIds = [...new Set(ideasData.map((idea) => idea.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", userIds);

        const profileMap = new Map(
          profiles?.map((p) => [p.user_id, p.display_name]) || []
        );

        const enrichedIdeas = ideasData.map((idea) => ({
          ...idea,
          user_display_name: profileMap.get(idea.user_id) || "Ẩn danh",
        }));

        setIdeas(enrichedIdeas);
      } else {
        setIdeas([]);
      }
    } catch (error) {
      console.error("Error fetching ideas:", error);
      toast.error("Không thể tải danh sách ý tưởng");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchIdeas();
    }
  }, [isAdmin]);

  const openReviewDialog = (idea: Idea, action: "approve" | "reject") => {
    setSelectedIdea(idea);
    setFeedback("");
    setRewardAmount(action === "approve" ? 1000 : 0);
    setReviewDialogOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedIdea || !user) return;

    setIsProcessing(true);
    try {
      // Update idea status
      const { error: updateError } = await supabase
        .from("build_ideas")
        .update({
          status: "approved",
          admin_feedback: feedback || null,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
          is_rewarded: rewardAmount > 0,
          reward_amount: rewardAmount > 0 ? rewardAmount : null,
        })
        .eq("id", selectedIdea.id);

      if (updateError) throw updateError;

      // If reward amount > 0, add coin reward
      if (rewardAmount > 0) {
        // Insert transaction
        const { error: txError } = await supabase
          .from("camly_coin_transactions")
          .insert({
            user_id: selectedIdea.user_id,
            amount: rewardAmount,
            transaction_type: "build_idea",
            description: `Thưởng ý tưởng: ${selectedIdea.title}`,
          });

        if (txError) throw txError;

        // Update balance
        const { data: currentBalance } = await supabase
          .from("camly_coin_balances")
          .select("balance, lifetime_earned")
          .eq("user_id", selectedIdea.user_id)
          .single();

        if (currentBalance) {
          await supabase
            .from("camly_coin_balances")
            .update({
              balance: currentBalance.balance + rewardAmount,
              lifetime_earned: currentBalance.lifetime_earned + rewardAmount,
            })
            .eq("user_id", selectedIdea.user_id);
        } else {
          await supabase.from("camly_coin_balances").insert({
            user_id: selectedIdea.user_id,
            balance: rewardAmount,
            lifetime_earned: rewardAmount,
          });
        }

        // Send healing message notification
        await supabase.from("healing_messages").insert({
          user_id: selectedIdea.user_id,
          title: "🎉 Ý tưởng được duyệt!",
          content: `Ý tưởng "${selectedIdea.title}" của bạn đã được Admin duyệt và bạn nhận được ${rewardAmount.toLocaleString()} Camly Coin!${
            feedback ? ` Phản hồi: ${feedback}` : ""
          }`,
          message_type: "reward",
          triggered_by: "idea_approved",
        });
      }

      toast.success("Đã duyệt ý tưởng thành công!", {
        description: rewardAmount > 0 ? `Đã thưởng ${rewardAmount.toLocaleString()} Camly Coin` : undefined,
      });

      setReviewDialogOpen(false);
      fetchIdeas();
    } catch (error) {
      console.error("Error approving idea:", error);
      toast.error("Có lỗi xảy ra khi duyệt ý tưởng");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedIdea || !user) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("build_ideas")
        .update({
          status: "rejected",
          admin_feedback: feedback || "Ý tưởng chưa phù hợp với định hướng hiện tại của dự án.",
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq("id", selectedIdea.id);

      if (error) throw error;

      // Send notification
      await supabase.from("healing_messages").insert({
        user_id: selectedIdea.user_id,
        title: "Phản hồi ý tưởng",
        content: `Ý tưởng "${selectedIdea.title}" của bạn đã được xem xét. ${
          feedback || "Ý tưởng chưa phù hợp với định hướng hiện tại của dự án."
        } Cảm ơn bạn đã đóng góp!`,
        message_type: "info",
        triggered_by: "idea_reviewed",
      });

      toast.success("Đã từ chối ý tưởng");
      setReviewDialogOpen(false);
      fetchIdeas();
    } catch (error) {
      console.error("Error rejecting idea:", error);
      toast.error("Có lỗi xảy ra");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkImplemented = async (idea: Idea) => {
    try {
      const { error } = await supabase
        .from("build_ideas")
        .update({
          status: "implemented",
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq("id", idea.id);

      if (error) throw error;

      toast.success("Đã đánh dấu là đã thực hiện!");
      fetchIdeas();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Có lỗi xảy ra");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Chờ duyệt
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Đã duyệt
          </Badge>
        );
      case "implemented":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Sparkles className="h-3 w-3 mr-1" />
            Đã thực hiện
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Từ chối
          </Badge>
        );
      default:
        return null;
    }
  };

  const filteredIdeas = ideas.filter((idea) => {
    if (activeTab === "all") return true;
    return idea.status === activeTab;
  });

  const stats = {
    total: ideas.length,
    pending: ideas.filter((i) => i.status === "pending").length,
    approved: ideas.filter((i) => i.status === "approved").length,
    implemented: ideas.filter((i) => i.status === "implemented").length,
    rejected: ideas.filter((i) => i.status === "rejected").length,
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/admin/dashboard")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-600" />
                  Quản lý Ý tưởng
                </h1>
                <p className="text-sm text-muted-foreground">
                  Duyệt và thưởng coin cho các ý tưởng đóng góp
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={fetchIdeas}>
              Làm mới
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Tổng cộng</p>
            </CardContent>
          </Card>
          <Card className="border-yellow-200 bg-yellow-50/50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
              <p className="text-sm text-yellow-600">Chờ duyệt</p>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-700">{stats.approved}</p>
              <p className="text-sm text-green-600">Đã duyệt</p>
            </CardContent>
          </Card>
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-700">{stats.implemented}</p>
              <p className="text-sm text-blue-600">Đã thực hiện</p>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50/50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-700">{stats.rejected}</p>
              <p className="text-sm text-red-600">Từ chối</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 w-full max-w-lg">
            <TabsTrigger value="pending">Chờ duyệt</TabsTrigger>
            <TabsTrigger value="approved">Đã duyệt</TabsTrigger>
            <TabsTrigger value="implemented">Đã TH</TabsTrigger>
            <TabsTrigger value="rejected">Từ chối</TabsTrigger>
            <TabsTrigger value="all">Tất cả</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Ideas List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredIdeas.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                Không có ý tưởng nào trong danh mục này
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredIdeas.map((idea) => (
              <Card key={idea.id} className="overflow-hidden">
                <CardContent className="p-4 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{idea.title}</h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {idea.user_display_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(idea.created_at).toLocaleDateString("vi-VN")}
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="h-3 w-3" />
                          {idea.votes_count} votes
                        </span>
                      </div>
                    </div>
                    {getStatusBadge(idea.status)}
                  </div>

                  {/* Description */}
                  <p className="text-muted-foreground">{idea.description}</p>

                  {/* Category */}
                  {idea.category && (
                    <Badge variant="secondary">{idea.category}</Badge>
                  )}

                  {/* Reward info */}
                  {idea.is_rewarded && idea.reward_amount && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 text-amber-700">
                      <img src={camlyCoinLogo} alt="Camly Coin" className="w-5 h-5" />
                      <span className="text-sm font-medium">
                        Đã thưởng {idea.reward_amount.toLocaleString()} Camly Coin
                      </span>
                    </div>
                  )}

                  {/* Admin feedback */}
                  {idea.admin_feedback && (
                    <div className="p-3 rounded-lg bg-muted/50 text-sm">
                      <p className="font-medium text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        Phản hồi Admin:
                      </p>
                      <p>{idea.admin_feedback}</p>
                    </div>
                  )}

                  {/* Actions */}
                  {idea.status === "pending" && (
                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => openReviewDialog(idea, "approve")}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Duyệt & Thưởng
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => openReviewDialog(idea, "reject")}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Từ chối
                      </Button>
                    </div>
                  )}

                  {idea.status === "approved" && (
                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        onClick={() => handleMarkImplemented(idea)}
                      >
                        <Sparkles className="h-4 w-4 mr-1" />
                        Đánh dấu đã thực hiện
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {rewardAmount > 0 ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Duyệt ý tưởng
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  Từ chối ý tưởng
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedIdea?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {rewardAmount > 0 && (
              <div className="space-y-2">
                <Label htmlFor="reward">Số coin thưởng</Label>
                <div className="flex items-center gap-2">
                  <img src={camlyCoinLogo} alt="Camly Coin" className="w-6 h-6" />
                  <Input
                    id="reward"
                    type="number"
                    value={rewardAmount}
                    onChange={(e) => setRewardAmount(Number(e.target.value))}
                    min={0}
                    max={10000}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="feedback">Phản hồi (tùy chọn)</Label>
              <Textarea
                id="feedback"
                placeholder="Nhập phản hồi cho người dùng..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReviewDialogOpen(false)}
              disabled={isProcessing}
            >
              Hủy
            </Button>
            <Button
              onClick={rewardAmount > 0 ? handleApprove : handleReject}
              disabled={isProcessing}
              className={rewardAmount > 0 ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : rewardAmount > 0 ? (
                <Gift className="h-4 w-4 mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              {rewardAmount > 0 ? "Duyệt & Thưởng" : "Từ chối"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
