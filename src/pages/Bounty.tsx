import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LightGate } from "@/components/LightGate";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { 
  Trophy, 
  Clock, 
  Target, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  ArrowRight,
  Send,
  ExternalLink,
  Coins
} from "lucide-react";
import camlyCoinLogo from "@/assets/camly-coin-logo.png";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

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
  created_at: string;
}

interface Submission {
  id: string;
  task_id: string;
  submission_content: string;
  submission_url: string | null;
  status: string;
  reward_earned: number | null;
  admin_feedback: string | null;
  created_at: string;
  reviewed_at: string | null;
  task?: BountyTask;
}

export default function Bounty() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [tasks, setTasks] = useState<BountyTask[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<BountyTask | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionContent, setSubmissionContent] = useState("");
  const [submissionUrl, setSubmissionUrl] = useState("");

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch active tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from("bounty_tasks")
        .select("*")
        .eq("status", "active")
        .order("reward_amount", { ascending: false });

      if (tasksError) throw tasksError;
      setTasks(tasksData || []);

      // Fetch user's submissions
      if (user) {
        const { data: subsData, error: subsError } = await supabase
          .from("bounty_submissions")
          .select("*, bounty_tasks(*)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (subsError) throw subsError;
        
        const formattedSubs = (subsData || []).map(sub => ({
          ...sub,
          task: sub.bounty_tasks as BountyTask
        }));
        setSubmissions(formattedSubs);
      }
    } catch (error) {
      console.error("Error fetching bounty data:", error);
      toast.error("Không thể tải dữ liệu nhiệm vụ");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !selectedTask) return;
    if (!submissionContent.trim()) {
      toast.error("Vui lòng nhập nội dung hoàn thành");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("bounty_submissions")
        .insert({
          user_id: user.id,
          task_id: selectedTask.id,
          submission_content: submissionContent.trim(),
          submission_url: submissionUrl.trim() || null,
        });

      if (error) throw error;

      toast.success("Đã gửi bài nộp thành công!");
      setIsDialogOpen(false);
      setSubmissionContent("");
      setSubmissionUrl("");
      setSelectedTask(null);
      fetchData();
    } catch (error: any) {
      console.error("Error submitting:", error);
      toast.error(error.message || "Không thể gửi bài nộp");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case "easy": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "medium": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "hard": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getDifficultyLabel = (level: string) => {
    switch (level) {
      case "easy": return "Dễ";
      case "medium": return "Trung bình";
      case "hard": return "Khó";
      default: return level;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Đang chờ duyệt</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle2 className="w-3 h-3 mr-1" />Đã duyệt</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1" />Từ chối</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const hasSubmittedTask = (taskId: string) => {
    return submissions.some(s => s.task_id === taskId && s.status !== "rejected");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 pt-28">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center">
              <Trophy className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold">Bounty Tasks</h1>
            <p className="text-muted-foreground">
              Đăng nhập để xem và hoàn thành các nhiệm vụ kiếm Camly Coin
            </p>
            <Button asChild size="lg" className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600">
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
    <LightGate>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 pt-28">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                Bounty Tasks
              </h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Hoàn thành các nhiệm vụ đặc biệt để nhận thưởng Camly Coin. Mỗi nhiệm vụ có phần thưởng và yêu cầu khác nhau.
              </p>
            </div>

            <Tabs defaultValue="tasks" className="w-full">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
                <TabsTrigger value="tasks" className="gap-2">
                  <Target className="w-4 h-4" />
                  Nhiệm vụ
                </TabsTrigger>
                <TabsTrigger value="submissions" className="gap-2">
                  <Send className="w-4 h-4" />
                  Bài nộp của tôi
                </TabsTrigger>
              </TabsList>

              <TabsContent value="tasks" className="mt-6">
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : tasks.length === 0 ? (
                  <Card className="text-center py-12">
                    <CardContent>
                      <Trophy className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                      <h3 className="text-lg font-medium mb-2">Chưa có nhiệm vụ nào</h3>
                      <p className="text-muted-foreground">
                        Các nhiệm vụ mới sẽ được cập nhật sớm. Hãy quay lại sau nhé!
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {tasks.map((task) => (
                      <Card key={task.id} className="flex flex-col hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-lg line-clamp-2">{task.title}</CardTitle>
                            <Badge className={getDifficultyColor(task.difficulty_level)}>
                              {getDifficultyLabel(task.difficulty_level)}
                            </Badge>
                          </div>
                          {task.category && (
                            <Badge variant="outline" className="w-fit">{task.category}</Badge>
                          )}
                        </CardHeader>
                        <CardContent className="flex-1 space-y-4">
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {task.description}
                          </p>
                          
                          <div className="flex items-center gap-2 text-lg font-bold text-orange-600">
                            <img src={camlyCoinLogo} alt="Camly" className="w-6 h-6" />
                            {task.reward_amount.toLocaleString()} Coin
                          </div>

                          {task.deadline && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="w-4 h-4" />
                              Hạn: {format(new Date(task.deadline), "dd/MM/yyyy", { locale: vi })}
                            </div>
                          )}

                          {task.max_completions && (
                            <div className="text-sm text-muted-foreground">
                              Đã hoàn thành: {task.current_completions}/{task.max_completions}
                            </div>
                          )}
                        </CardContent>
                        <CardFooter>
                          {hasSubmittedTask(task.id) ? (
                            <Button disabled className="w-full" variant="outline">
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Đã nộp
                            </Button>
                          ) : (
                            <Button 
                              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                              onClick={() => {
                                setSelectedTask(task);
                                setIsDialogOpen(true);
                              }}
                            >
                              Tham gia ngay
                            </Button>
                          )}
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="submissions" className="mt-6">
                {submissions.length === 0 ? (
                  <Card className="text-center py-12">
                    <CardContent>
                      <Send className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                      <h3 className="text-lg font-medium mb-2">Chưa có bài nộp nào</h3>
                      <p className="text-muted-foreground">
                        Hãy tham gia các nhiệm vụ để bắt đầu kiếm Camly Coin!
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {submissions.map((sub) => (
                      <Card key={sub.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <CardTitle className="text-lg">{sub.task?.title || "Nhiệm vụ"}</CardTitle>
                              <CardDescription>
                                Nộp lúc: {format(new Date(sub.created_at), "HH:mm dd/MM/yyyy", { locale: vi })}
                              </CardDescription>
                            </div>
                            {getStatusBadge(sub.status)}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Label className="text-muted-foreground">Nội dung nộp:</Label>
                            <p className="mt-1 text-sm">{sub.submission_content}</p>
                          </div>
                          
                          {sub.submission_url && (
                            <div>
                              <Label className="text-muted-foreground">Link đính kèm:</Label>
                              <a 
                                href={sub.submission_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="mt-1 text-sm text-primary hover:underline flex items-center gap-1"
                              >
                                {sub.submission_url}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          )}

                          {sub.status === "approved" && sub.reward_earned && (
                            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                              <Coins className="w-5 h-5 text-green-600" />
                              <span className="font-medium text-green-700 dark:text-green-400">
                                Đã nhận: {sub.reward_earned.toLocaleString()} Camly Coin
                              </span>
                            </div>
                          )}

                          {sub.admin_feedback && (
                            <div className="p-3 bg-muted rounded-lg">
                              <Label className="text-muted-foreground">Phản hồi từ Admin:</Label>
                              <p className="mt-1 text-sm">{sub.admin_feedback}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
        <Footer />

        {/* Submit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{selectedTask?.title}</DialogTitle>
              <DialogDescription>
                Hoàn thành nhiệm vụ để nhận {selectedTask?.reward_amount.toLocaleString()} Camly Coin
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {selectedTask?.requirements && (
                <div className="p-3 bg-muted rounded-lg">
                  <Label className="font-medium">Yêu cầu:</Label>
                  <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
                    {selectedTask.requirements}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="content">Mô tả hoàn thành *</Label>
                <Textarea
                  id="content"
                  placeholder="Mô tả chi tiết cách bạn đã hoàn thành nhiệm vụ..."
                  value={submissionContent}
                  onChange={(e) => setSubmissionContent(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">Link minh chứng (nếu có)</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://..."
                  value={submissionUrl}
                  onChange={(e) => setSubmissionUrl(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Hủy
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting || !submissionContent.trim()}
                className="bg-gradient-to-r from-orange-500 to-amber-500"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Gửi bài nộp
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </LightGate>
  );
}
