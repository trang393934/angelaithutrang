import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Trophy,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Gift,
  User,
  Calendar,
  ExternalLink,
  Loader2,
  Plus,
  Target,
} from "lucide-react";
import camlyCoinLogo from "@/assets/camly-coin-logo.png";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface Submission {
  id: string;
  user_id: string;
  task_id: string;
  submission_content: string;
  submission_url: string | null;
  status: string;
  reward_earned: number | null;
  admin_feedback: string | null;
  created_at: string;
  reviewed_at: string | null;
  user_display_name?: string;
  task_title?: string;
  task_reward?: number;
}

interface BountyTask {
  id: string;
  title: string;
  description: string;
  requirements: string | null;
  reward_amount: number;
  difficulty_level: string;
  category: string | null;
  deadline: string | null;
  max_completions: number | null;
  current_completions: number;
  status: string;
}

export default function AdminBounty() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [tasks, setTasks] = useState<BountyTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");

  // Review dialog
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [rewardAmount, setRewardAmount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Create task dialog
  const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    requirements: "",
    reward_amount: 1000,
    difficulty_level: "easy",
    category: "",
    deadline: "",
    max_completions: "",
  });
  const [isCreatingTask, setIsCreatingTask] = useState(false);

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

  // Fetch data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch submissions
      const { data: subsData, error: subsError } = await supabase
        .from("bounty_submissions")
        .select("*, bounty_tasks(title, reward_amount)")
        .order("created_at", { ascending: false });

      if (subsError) throw subsError;

      // Fetch tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from("bounty_tasks")
        .select("*")
        .order("created_at", { ascending: false });

      if (tasksError) throw tasksError;

      // Get user profiles
      if (subsData && subsData.length > 0) {
        const userIds = [...new Set(subsData.map((s) => s.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", userIds);

        const profileMap = new Map(
          profiles?.map((p) => [p.user_id, p.display_name]) || []
        );

        const enrichedSubs = subsData.map((sub) => ({
          ...sub,
          user_display_name: profileMap.get(sub.user_id) || "Ẩn danh",
          task_title: (sub.bounty_tasks as any)?.title || "Nhiệm vụ",
          task_reward: (sub.bounty_tasks as any)?.reward_amount || 0,
        }));

        setSubmissions(enrichedSubs);
      } else {
        setSubmissions([]);
      }

      setTasks(tasksData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Không thể tải dữ liệu");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const openReviewDialog = (sub: Submission, action: "approve" | "reject") => {
    setSelectedSubmission(sub);
    setFeedback("");
    setRewardAmount(action === "approve" ? sub.task_reward || 0 : 0);
    setReviewDialogOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedSubmission || !user) return;

    setIsProcessing(true);
    try {
      // Update submission status
      const { error: updateError } = await supabase
        .from("bounty_submissions")
        .update({
          status: "approved",
          admin_feedback: feedback || null,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
          reward_earned: rewardAmount,
        })
        .eq("id", selectedSubmission.id);

      if (updateError) throw updateError;

      // Update task completions count directly
      const currentTask = tasks.find(t => t.id === selectedSubmission.task_id);
      if (currentTask) {
        await supabase
          .from("bounty_tasks")
          .update({ current_completions: currentTask.current_completions + 1 })
          .eq("id", selectedSubmission.task_id);
      }

      // Award coins if amount > 0
      if (rewardAmount > 0) {
        const { error: txError } = await supabase
          .from("camly_coin_transactions")
          .insert({
            user_id: selectedSubmission.user_id,
            amount: rewardAmount,
            transaction_type: "bounty_reward",
            description: `Thưởng hoàn thành nhiệm vụ: ${selectedSubmission.task_title}`,
          });

        if (txError) throw txError;

        // Update balance
        const { data: currentBalance } = await supabase
          .from("camly_coin_balances")
          .select("balance, lifetime_earned")
          .eq("user_id", selectedSubmission.user_id)
          .single();

        if (currentBalance) {
          await supabase
            .from("camly_coin_balances")
            .update({
              balance: currentBalance.balance + rewardAmount,
              lifetime_earned: currentBalance.lifetime_earned + rewardAmount,
            })
            .eq("user_id", selectedSubmission.user_id);
        } else {
          await supabase.from("camly_coin_balances").insert({
            user_id: selectedSubmission.user_id,
            balance: rewardAmount,
            lifetime_earned: rewardAmount,
          });
        }

        // Send notification
        await supabase.from("healing_messages").insert({
          user_id: selectedSubmission.user_id,
          title: "🏆 Nhiệm vụ được duyệt!",
          content: `Bài nộp cho "${selectedSubmission.task_title}" đã được duyệt và bạn nhận được ${rewardAmount.toLocaleString()} Camly Coin!${
            feedback ? ` Phản hồi: ${feedback}` : ""
          }`,
          message_type: "reward",
          triggered_by: "bounty_approved",
        });
      }

      toast.success("Đã duyệt bài nộp thành công!", {
        description: rewardAmount > 0 ? `Đã thưởng ${rewardAmount.toLocaleString()} Camly Coin` : undefined,
      });

      setReviewDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error approving submission:", error);
      toast.error("Có lỗi xảy ra khi duyệt bài nộp");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedSubmission || !user) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("bounty_submissions")
        .update({
          status: "rejected",
          admin_feedback: feedback || "Bài nộp chưa đáp ứng yêu cầu của nhiệm vụ.",
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq("id", selectedSubmission.id);

      if (error) throw error;

      // Send notification
      await supabase.from("healing_messages").insert({
        user_id: selectedSubmission.user_id,
        title: "Phản hồi nhiệm vụ",
        content: `Bài nộp cho "${selectedSubmission.task_title}" chưa được duyệt. ${
          feedback || "Bài nộp chưa đáp ứng yêu cầu của nhiệm vụ."
        } Hãy thử lại nhé!`,
        message_type: "info",
        triggered_by: "bounty_reviewed",
      });

      toast.success("Đã từ chối bài nộp");
      setReviewDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error rejecting submission:", error);
      toast.error("Có lỗi xảy ra");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.title.trim() || !newTask.description.trim()) {
      toast.error("Vui lòng nhập tiêu đề và mô tả");
      return;
    }

    setIsCreatingTask(true);
    try {
      const { error } = await supabase.from("bounty_tasks").insert({
        title: newTask.title.trim(),
        description: newTask.description.trim(),
        requirements: newTask.requirements.trim() || null,
        reward_amount: newTask.reward_amount,
        difficulty_level: newTask.difficulty_level,
        category: newTask.category.trim() || null,
        deadline: newTask.deadline || null,
        max_completions: newTask.max_completions ? parseInt(newTask.max_completions) : null,
        created_by: user?.id,
      });

      if (error) throw error;

      toast.success("Đã tạo nhiệm vụ mới!");
      setCreateTaskDialogOpen(false);
      setNewTask({
        title: "",
        description: "",
        requirements: "",
        reward_amount: 1000,
        difficulty_level: "easy",
        category: "",
        deadline: "",
        max_completions: "",
      });
      fetchData();
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error("Có lỗi xảy ra khi tạo nhiệm vụ");
    } finally {
      setIsCreatingTask(false);
    }
  };

  const toggleTaskStatus = async (task: BountyTask) => {
    try {
      const newStatus = task.status === "active" ? "inactive" : "active";
      const { error } = await supabase
        .from("bounty_tasks")
        .update({ status: newStatus })
        .eq("id", task.id);

      if (error) throw error;

      toast.success(`Đã ${newStatus === "active" ? "kích hoạt" : "tạm dừng"} nhiệm vụ`);
      fetchData();
    } catch (error) {
      console.error("Error toggling task status:", error);
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

  const filteredSubmissions = submissions.filter((sub) => {
    if (activeTab === "all") return true;
    return sub.status === activeTab;
  });

  const stats = {
    totalSubmissions: submissions.length,
    pending: submissions.filter((s) => s.status === "pending").length,
    approved: submissions.filter((s) => s.status === "approved").length,
    rejected: submissions.filter((s) => s.status === "rejected").length,
    activeTasks: tasks.filter((t) => t.status === "active").length,
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-background">
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
                  <Trophy className="h-5 w-5 text-orange-600" />
                  Quản lý Bounty Tasks
                </h1>
                <p className="text-sm text-muted-foreground">
                  Duyệt bài nộp và quản lý nhiệm vụ
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={fetchData}>
                Làm mới
              </Button>
              <Button onClick={() => setCreateTaskDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Tạo nhiệm vụ
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{stats.activeTasks}</p>
              <p className="text-sm text-muted-foreground">Nhiệm vụ active</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{stats.totalSubmissions}</p>
              <p className="text-sm text-muted-foreground">Tổng bài nộp</p>
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
          <Card className="border-red-200 bg-red-50/50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-700">{stats.rejected}</p>
              <p className="text-sm text-red-600">Từ chối</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full max-w-md">
            <TabsTrigger value="pending">Chờ duyệt</TabsTrigger>
            <TabsTrigger value="approved">Đã duyệt</TabsTrigger>
            <TabsTrigger value="rejected">Từ chối</TabsTrigger>
            <TabsTrigger value="all">Tất cả</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Submissions List */}
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
        ) : filteredSubmissions.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <Target className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                Không có bài nộp nào trong danh mục này
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredSubmissions.map((sub) => (
              <Card key={sub.id} className="overflow-hidden">
                <CardContent className="p-4 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{sub.task_title}</h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {sub.user_display_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(sub.created_at), "HH:mm dd/MM/yyyy", { locale: vi })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-orange-50 text-orange-700">
                        <img src={camlyCoinLogo} alt="" className="w-4 h-4 mr-1" />
                        {sub.task_reward?.toLocaleString()}
                      </Badge>
                      {getStatusBadge(sub.status)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm">{sub.submission_content}</p>
                  </div>

                  {/* URL */}
                  {sub.submission_url && (
                    <a
                      href={sub.submission_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {sub.submission_url}
                    </a>
                  )}

                  {/* Reward info */}
                  {sub.status === "approved" && sub.reward_earned && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 text-green-700">
                      <img src={camlyCoinLogo} alt="" className="w-5 h-5" />
                      <span className="text-sm font-medium">
                        Đã thưởng {sub.reward_earned.toLocaleString()} Camly Coin
                      </span>
                    </div>
                  )}

                  {/* Feedback */}
                  {sub.admin_feedback && (
                    <div className="p-3 rounded-lg bg-muted/50 text-sm">
                      <p className="font-medium text-xs text-muted-foreground mb-1">
                        Phản hồi Admin:
                      </p>
                      <p>{sub.admin_feedback}</p>
                    </div>
                  )}

                  {/* Actions */}
                  {sub.status === "pending" && (
                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => openReviewDialog(sub, "approve")}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Duyệt & Thưởng
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => openReviewDialog(sub, "reject")}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Từ chối
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Tasks List */}
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Target className="h-5 w-5" />
            Danh sách nhiệm vụ ({tasks.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {tasks.map((task) => (
              <Card key={task.id} className={task.status !== "active" ? "opacity-60" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{task.title}</CardTitle>
                    <Badge variant={task.status === "active" ? "default" : "secondary"}>
                      {task.status === "active" ? "Active" : "Tạm dừng"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {task.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-sm font-medium text-orange-600">
                      <img src={camlyCoinLogo} alt="" className="w-4 h-4" />
                      {task.reward_amount.toLocaleString()} Coin
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {task.current_completions}{task.max_completions ? `/${task.max_completions}` : ""} hoàn thành
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => toggleTaskStatus(task)}
                  >
                    {task.status === "active" ? "Tạm dừng" : "Kích hoạt"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {rewardAmount > 0 ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Duyệt bài nộp
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  Từ chối bài nộp
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedSubmission?.task_title}
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
                    max={50000}
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

      {/* Create Task Dialog */}
      <Dialog open={createTaskDialogOpen} onOpenChange={setCreateTaskDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Tạo nhiệm vụ mới
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="title">Tiêu đề *</Label>
              <Input
                id="title"
                placeholder="Tên nhiệm vụ..."
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Mô tả *</Label>
              <Textarea
                id="description"
                placeholder="Mô tả chi tiết nhiệm vụ..."
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requirements">Yêu cầu</Label>
              <Textarea
                id="requirements"
                placeholder="Yêu cầu cụ thể để hoàn thành..."
                value={newTask.requirements}
                onChange={(e) => setNewTask({ ...newTask, requirements: e.target.value })}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reward">Phần thưởng (Coin)</Label>
                <Input
                  id="reward"
                  type="number"
                  value={newTask.reward_amount}
                  onChange={(e) => setNewTask({ ...newTask, reward_amount: Number(e.target.value) })}
                  min={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty">Độ khó</Label>
                <select
                  id="difficulty"
                  value={newTask.difficulty_level}
                  onChange={(e) => setNewTask({ ...newTask, difficulty_level: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border bg-background"
                >
                  <option value="easy">Dễ</option>
                  <option value="medium">Trung bình</option>
                  <option value="hard">Khó</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Phân loại</Label>
                <Input
                  id="category"
                  placeholder="VD: Social, Content..."
                  value={newTask.category}
                  onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max">Số lượng tối đa</Label>
                <Input
                  id="max"
                  type="number"
                  placeholder="Không giới hạn"
                  value={newTask.max_completions}
                  onChange={(e) => setNewTask({ ...newTask, max_completions: e.target.value })}
                  min={1}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateTaskDialogOpen(false)}
              disabled={isCreatingTask}
            >
              Hủy
            </Button>
            <Button onClick={handleCreateTask} disabled={isCreatingTask}>
              {isCreatingTask ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Tạo nhiệm vụ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
