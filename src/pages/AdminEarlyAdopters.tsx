import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Crown,
  Users,
  Gift,
  Search,
  RefreshCw,
  CheckCircle,
  Clock,
  Star,
  MessageCircle,
  Loader2,
  Trophy,
  Calendar,
  History
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import camlyCoinLogo from "@/assets/camly-coin-logo.png";

interface EarlyAdopterUser {
  id: string;
  user_id: string;
  valid_questions_count: number;
  is_rewarded: boolean;
  reward_amount: number;
  rewarded_at: string | null;
  registered_at: string;
  email?: string;
  display_name?: string | null;
}

const AdminEarlyAdopters = () => {
  const { user, isAdmin, isLoading: authLoading, isAdminChecked } = useAuth();
  const navigate = useNavigate();

  const [adopters, setAdopters] = useState<EarlyAdopterUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalRegistered: 0,
    totalRewarded: 0,
    totalCoinsAwarded: 0,
    avgQuestionsCount: 0
  });

  useEffect(() => {
    if (!authLoading && isAdminChecked) {
      if (!user) {
        navigate("/admin/login");
      } else if (!isAdmin) {
        navigate("/");
      }
    }
  }, [user, isAdmin, authLoading, isAdminChecked, navigate]);

  const fetchEarlyAdopters = async () => {
    try {
      setIsRefreshing(true);

      // Fetch users who have agreed to Law of Light (unified counting)
      const { data: lightAgreementsData, error: lightError } = await supabase
        .from("user_light_agreements")
        .select("user_id");

      if (lightError) throw lightError;

      const agreedUserIds = new Set(lightAgreementsData?.map(a => a.user_id) || []);

      // Fetch early adopter rewards with user info
      const { data: earlyAdoptersData, error } = await supabase
        .from("early_adopter_rewards")
        .select("*")
        .order("registered_at", { ascending: true });

      if (error) throw error;

      // Filter only users who have agreed to Law of Light
      const filteredEarlyAdopters = (earlyAdoptersData || []).filter(
        adopter => agreedUserIds.has(adopter.user_id)
      );

      // Fetch user emails and profiles
      const userIds = filteredEarlyAdopters.map(a => a.user_id);
      
      // Get profiles
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);

      // Map profiles to adopters
      const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);

      const adoptersWithInfo: EarlyAdopterUser[] = filteredEarlyAdopters.map((adopter, index) => {
        const profile = profilesMap.get(adopter.user_id);
        return {
          ...adopter,
          display_name: profile?.display_name || `User #${index + 1}`,
          email: `user-${adopter.user_id.slice(0, 8)}@...`
        };
      });

      setAdopters(adoptersWithInfo);

      // Calculate stats - totalRegistered now uses unified count from user_light_agreements
      const rewarded = adoptersWithInfo.filter(a => a.is_rewarded);
      const totalCoins = rewarded.reduce((sum, a) => sum + a.reward_amount, 0);
      const avgQuestions = adoptersWithInfo.length > 0
        ? adoptersWithInfo.reduce((sum, a) => sum + a.valid_questions_count, 0) / adoptersWithInfo.length
        : 0;

      setStats({
        totalRegistered: agreedUserIds.size, // Use unified count from user_light_agreements
        totalRewarded: rewarded.length,
        totalCoinsAwarded: totalCoins,
        avgQuestionsCount: Math.round(avgQuestions * 10) / 10
      });

    } catch (error) {
      console.error("Error fetching early adopters:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchEarlyAdopters();
    }
  }, [isAdmin]);

  // Filter adopters
  const filteredAdopters = adopters.filter(adopter => {
    const matchesSearch = 
      (adopter.display_name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      adopter.user_id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = 
      statusFilter === "all" ||
      (statusFilter === "rewarded" && adopter.is_rewarded) ||
      (statusFilter === "pending" && !adopter.is_rewarded && adopter.valid_questions_count >= 10) ||
      (statusFilter === "in_progress" && !adopter.is_rewarded && adopter.valid_questions_count < 10);

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (adopter: EarlyAdopterUser) => {
    if (adopter.is_rewarded) {
      return (
        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
          <CheckCircle className="h-3 w-3 mr-1" />
          Đã nhận thưởng
        </Badge>
      );
    }
    if (adopter.valid_questions_count >= 10) {
      return (
        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
          <Clock className="h-3 w-3 mr-1" />
          Đủ điều kiện
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <MessageCircle className="h-3 w-3 mr-1" />
        Đang tiến hành
      </Badge>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/admin/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <Crown className="h-6 w-6 text-amber-500" />
              <h1 className="text-xl font-semibold">Quản lý Early Adopters</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/admin/activity-history"
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-full text-sm text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            >
              <History className="w-4 h-4" />
              Lịch sử chat
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchEarlyAdopters}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Làm mới
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Tổng đăng ký
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">{stats.totalRegistered}</span>
                <span className="text-muted-foreground">/ 100</span>
              </div>
              <Progress value={(stats.totalRegistered / 100) * 100} className="mt-2 h-2" />
            </CardContent>
          </Card>

          <Card className="border-emerald-200 dark:border-emerald-800">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2 text-emerald-600">
                <Gift className="h-4 w-4" />
                Đã nhận thưởng
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-emerald-600">{stats.totalRewarded}</span>
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                  {stats.totalRegistered > 0 
                    ? Math.round((stats.totalRewarded / stats.totalRegistered) * 100) 
                    : 0}%
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200 dark:border-amber-800">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2 text-amber-600">
                <Trophy className="h-4 w-4" />
                Tổng coins đã thưởng
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <img src={camlyCoinLogo} alt="Camly" className="w-8 h-8 rounded-full" />
                <span className="text-3xl font-bold text-amber-600">
                  {stats.totalCoinsAwarded.toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                TB câu hỏi/user
              </CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-3xl font-bold">{stats.avgQuestionsCount}</span>
              <span className="text-muted-foreground ml-1">/ 10</span>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500" />
              Danh sách Early Adopters
            </CardTitle>
            <CardDescription>
              100 người dùng đầu tiên đăng ký và hoàn thành 10 câu hỏi hợp lệ
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm theo tên hoặc ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Lọc theo trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="rewarded">Đã nhận thưởng</SelectItem>
                  <SelectItem value="pending">Đủ điều kiện</SelectItem>
                  <SelectItem value="in_progress">Đang tiến hành</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Hạng</TableHead>
                    <TableHead>Người dùng</TableHead>
                    <TableHead className="text-center">Câu hỏi</TableHead>
                    <TableHead className="text-center">Tiến độ</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Phần thưởng</TableHead>
                    <TableHead>Ngày đăng ký</TableHead>
                    <TableHead>Ngày nhận thưởng</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAdopters.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        {searchQuery || statusFilter !== "all" 
                          ? "Không tìm thấy kết quả phù hợp"
                          : "Chưa có Early Adopter nào đăng ký"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAdopters.map((adopter, index) => (
                      <TableRow key={adopter.id}>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {index < 3 ? (
                              <Crown className={`h-5 w-5 ${
                                index === 0 ? "text-amber-500" :
                                index === 1 ? "text-gray-400" :
                                "text-amber-700"
                              }`} />
                            ) : (
                              <span className="w-5 text-center text-muted-foreground">
                                #{index + 1}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{adopter.display_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {adopter.user_id.slice(0, 8)}...
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-semibold">{adopter.valid_questions_count}</span>
                          <span className="text-muted-foreground"> / 10</span>
                        </TableCell>
                        <TableCell>
                          <div className="w-24">
                            <Progress 
                              value={Math.min((adopter.valid_questions_count / 10) * 100, 100)} 
                              className="h-2"
                            />
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(adopter)}</TableCell>
                        <TableCell className="text-right">
                          {adopter.is_rewarded ? (
                            <div className="flex items-center justify-end gap-1">
                              <img src={camlyCoinLogo} alt="Camly" className="w-4 h-4 rounded-full" />
                              <span className="font-semibold text-amber-600">
                                {adopter.reward_amount.toLocaleString()}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(adopter.registered_at)}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {adopter.rewarded_at ? (
                            <div className="flex items-center gap-1 text-emerald-600">
                              <CheckCircle className="h-3 w-3" />
                              {formatDate(adopter.rewarded_at)}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Summary */}
            <div className="flex items-center justify-between text-sm text-muted-foreground pt-2">
              <span>
                Hiển thị {filteredAdopters.length} / {adopters.length} người dùng
              </span>
              <span>
                Còn {100 - stats.totalRegistered} slot Early Adopter
              </span>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminEarlyAdopters;
