import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft,
  Sparkles,
  LogOut,
  RefreshCw,
  TrendingUp,
  Coins,
  Users,
  PieChart,
  BarChart3,
  Calendar,
  Loader2,
  Award,
  MessageSquare,
  BookOpen,
  Share2,
  Clock,
  History
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area
} from "recharts";
import angelAvatar from "@/assets/angel-avatar.png";

interface TransactionTypeStats {
  transaction_type: string;
  total_amount: number;
  transaction_count: number;
}

interface DailyTrend {
  date: string;
  total_coins: number;
  transaction_count: number;
}

interface TopRecipient {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  total_earned: number;
  transaction_count: number;
}

interface OverviewStats {
  totalCoinsDistributed: number;
  totalTransactions: number;
  uniqueRecipients: number;
  averagePerTransaction: number;
  todayCoins: number;
  weekCoins: number;
}

const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  chat_reward: "Chat AI",
  gratitude_reward: "Cảm ơn",
  journal_reward: "Nhật ký",
  engagement_reward: "Tương tác",
  referral_bonus: "Giới thiệu",
  challenge_reward: "Thử thách",
  daily_login: "Đăng nhập",
  bounty_reward: "Bounty",
  build_idea: "Ý tưởng",
  content_share: "Chia sẻ",
  knowledge_upload: "Tải kiến thức",
  feedback_reward: "Feedback",
  vision_reward: "Vision Board",
  community_support: "Hỗ trợ CĐ",
  admin_adjustment: "Admin điều chỉnh",
  spending: "Chi tiêu"
};

const CHART_COLORS = [
  "hsl(45, 93%, 47%)", // Gold
  "hsl(142, 76%, 36%)", // Green
  "hsl(199, 89%, 48%)", // Blue
  "hsl(280, 87%, 65%)", // Purple
  "hsl(24, 95%, 53%)",  // Orange
  "hsl(340, 82%, 52%)", // Pink
  "hsl(168, 76%, 42%)", // Teal
  "hsl(262, 83%, 58%)", // Violet
  "hsl(12, 76%, 61%)",  // Coral
  "hsl(48, 96%, 53%)",  // Yellow
];

const AdminStatistics = () => {
  const { user, isAdmin, isLoading: authLoading, isAdminChecked, signOut } = useAuth();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "all">("30d");
  
  const [typeStats, setTypeStats] = useState<TransactionTypeStats[]>([]);
  const [dailyTrends, setDailyTrends] = useState<DailyTrend[]>([]);
  const [topRecipients, setTopRecipients] = useState<TopRecipient[]>([]);
  const [overviewStats, setOverviewStats] = useState<OverviewStats>({
    totalCoinsDistributed: 0,
    totalTransactions: 0,
    uniqueRecipients: 0,
    averagePerTransaction: 0,
    todayCoins: 0,
    weekCoins: 0
  });

  useEffect(() => {
    if (!authLoading && isAdminChecked) {
      if (!user) {
        navigate("/admin/login");
      } else if (!isAdmin) {
        toast.error("Bạn không có quyền truy cập trang này");
        navigate("/");
      } else {
        fetchAllStats();
      }
    }
  }, [user, isAdmin, authLoading, isAdminChecked, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchAllStats();
    }
  }, [timeRange]);

  const getDateFilter = () => {
    const now = new Date();
    switch (timeRange) {
      case "7d":
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case "30d":
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      case "90d":
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return null;
    }
  };

  const fetchAllStats = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchTransactionTypeStats(),
        fetchDailyTrends(),
        fetchTopRecipients(),
        fetchOverviewStats()
      ]);
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.error("Không thể tải thống kê");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchTransactionTypeStats = async () => {
    const dateFilter = getDateFilter();
    
    // Use RPC function to bypass 1000 row limit
    const { data, error } = await supabase.rpc('get_transaction_type_stats', {
      _date_filter: dateFilter
    });
    
    if (error) {
      console.error("Error fetching transaction type stats:", error);
      throw error;
    }
    
    const stats = (data || []).map((row: any) => ({
      transaction_type: row.transaction_type,
      total_amount: Number(row.total_amount),
      transaction_count: Number(row.transaction_count)
    }));
    
    setTypeStats(stats);
  };

  const fetchDailyTrends = async () => {
    const dateFilter = getDateFilter();
    
    // Use RPC function to bypass 1000 row limit
    const { data, error } = await supabase.rpc('get_daily_trends', {
      _date_filter: dateFilter
    });
    
    if (error) {
      console.error("Error fetching daily trends:", error);
      throw error;
    }
    
    const trends = (data || []).map((row: any) => ({
      date: row.trend_date,
      total_coins: Number(row.total_coins),
      transaction_count: Number(row.transaction_count)
    }));
    
    setDailyTrends(trends);
  };

  const fetchTopRecipients = async () => {
    const dateFilter = getDateFilter();
    
    // Use RPC function to bypass 1000 row limit
    const { data, error } = await supabase.rpc('get_top_recipients', {
      _date_filter: dateFilter,
      _limit: 10
    });
    
    if (error) {
      console.error("Error fetching top recipients:", error);
      throw error;
    }
    
    const recipients = (data || []).map((row: any) => ({
      user_id: row.user_id,
      display_name: row.display_name,
      avatar_url: row.avatar_url,
      total_earned: Number(row.total_earned),
      transaction_count: Number(row.transaction_count)
    }));
    
    setTopRecipients(recipients);
  };

  const fetchOverviewStats = async () => {
    const dateFilter = getDateFilter();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    // Use RPC function to bypass 1000 row limit
    const { data, error } = await supabase.rpc('get_admin_statistics', {
      _date_filter: dateFilter,
      _today_start: todayStart,
      _week_start: weekStart
    });
    
    if (error) {
      console.error("Error fetching overview stats:", error);
      throw error;
    }
    
    const stats = data?.[0];
    
    if (stats) {
      setOverviewStats({
        totalCoinsDistributed: Number(stats.total_coins_distributed) || 0,
        totalTransactions: Number(stats.total_transactions) || 0,
        uniqueRecipients: Number(stats.total_users) || 0,
        averagePerTransaction: Number(stats.average_per_transaction) || 0,
        todayCoins: Number(stats.today_coins) || 0,
        weekCoins: Number(stats.week_coins) || 0
      });
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toLocaleString();
  };

  const pieChartData = useMemo(() => {
    return typeStats.map((stat, index) => ({
      name: TRANSACTION_TYPE_LABELS[stat.transaction_type] || stat.transaction_type,
      value: stat.total_amount,
      color: CHART_COLORS[index % CHART_COLORS.length]
    }));
  }, [typeStats]);

  const barChartData = useMemo(() => {
    return typeStats.map((stat, index) => ({
      name: TRANSACTION_TYPE_LABELS[stat.transaction_type] || stat.transaction_type,
      coins: stat.total_amount,
      transactions: stat.transaction_count,
      fill: CHART_COLORS[index % CHART_COLORS.length]
    }));
  }, [typeStats]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "chat_reward":
        return <MessageSquare className="w-4 h-4" />;
      case "journal_reward":
      case "gratitude_reward":
        return <BookOpen className="w-4 h-4" />;
      case "daily_login":
        return <Clock className="w-4 h-4" />;
      case "content_share":
        return <Share2 className="w-4 h-4" />;
      default:
        return <Award className="w-4 h-4" />;
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-pale via-background to-background flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-foreground-muted">Đang tải thống kê...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-pale via-background to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background-pure/90 backdrop-blur-lg border-b border-primary-pale shadow-soft">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/admin/dashboard" className="p-2 rounded-full hover:bg-primary-pale transition-colors">
                <ArrowLeft className="w-5 h-5 text-primary" />
              </Link>
              <div className="flex items-center gap-3">
                <img src={angelAvatar} alt="Angel AI" className="w-10 h-10 rounded-full shadow-soft" />
                <div>
                  <h1 className="font-serif text-lg font-semibold text-primary-deep">Admin Statistics</h1>
                  <p className="text-xs text-foreground-muted">Thống kê hệ thống thưởng</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/admin/activity-history"
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full text-sm text-foreground-muted hover:text-primary hover:bg-primary-pale transition-colors"
              >
                <History className="w-4 h-4" />
                Lịch sử chat
              </Link>
              <button
                onClick={() => fetchAllStats()}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm text-foreground-muted hover:text-primary hover:bg-primary-pale transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Làm mới</span>
              </button>
              <button
                onClick={() => signOut().then(() => navigate("/"))}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm text-foreground-muted hover:text-primary hover:bg-primary-pale transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Đăng xuất</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Time Range Filter */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            Tổng quan thống kê
          </h2>
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as typeof timeRange)}>
            <SelectTrigger className="w-[160px] border-divine-gold/20">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 ngày qua</SelectItem>
              <SelectItem value="30d">30 ngày qua</SelectItem>
              <SelectItem value="90d">90 ngày qua</SelectItem>
              <SelectItem value="all">Tất cả</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Overview Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card className="border-divine-gold/20">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-divine-gold/10">
                  <Coins className="w-5 h-5 text-divine-gold" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">{formatNumber(overviewStats.totalCoinsDistributed)}</p>
                  <p className="text-xs text-foreground-muted">Tổng coin phát</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">{formatNumber(overviewStats.totalTransactions)}</p>
                  <p className="text-xs text-foreground-muted">Giao dịch</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-500/20">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">{formatNumber(overviewStats.uniqueRecipients)}</p>
                  <p className="text-xs text-foreground-muted">Tổng users</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-500/20">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">{formatNumber(overviewStats.averagePerTransaction)}</p>
                  <p className="text-xs text-foreground-muted">TB/giao dịch</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-500/20">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">{formatNumber(overviewStats.todayCoins)}</p>
                  <p className="text-xs text-foreground-muted">Hôm nay</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-500/20">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Calendar className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">{formatNumber(overviewStats.weekCoins)}</p>
                  <p className="text-xs text-foreground-muted">7 ngày qua</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Coin Distribution by Activity Type - Bar Chart */}
          <Card className="border-divine-gold/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="w-5 h-5 text-primary" />
                Phân bổ coin theo hoạt động
              </CardTitle>
              <CardDescription>Tổng số coin đã phát theo từng loại hoạt động</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} layout="vertical" margin={{ left: 20, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tickFormatter={formatNumber} />
                    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value: number) => [formatNumber(value) + " Camly Coin", "Số Camly Coin"]}
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                    />
                    <Bar dataKey="coins" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Pie Chart - Distribution Ratio */}
          <Card className="border-divine-gold/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <PieChart className="w-5 h-5 text-primary" />
                Tỷ lệ phân bổ Camly Coin
              </CardTitle>
              <CardDescription>Tỷ lệ phần trăm Camly Coin giữa các chương trình</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                      labelLine={false}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [formatNumber(value) + " Camly Coin", "Số Camly Coin"]}
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                    />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Daily Trend Chart */}
        <Card className="border-divine-gold/20 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="w-5 h-5 text-primary" />
              Xu hướng phát thưởng theo ngày
            </CardTitle>
            <CardDescription>Biểu đồ số Camly Coin phát ra mỗi ngày trong khoảng thời gian đã chọn</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyTrends} margin={{ left: 0, right: 20 }}>
                  <defs>
                    <linearGradient id="colorCoins" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(45, 93%, 47%)" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(45, 93%, 47%)" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getDate()}/${date.getMonth() + 1}`;
                    }}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis tickFormatter={formatNumber} />
                  <Tooltip
                    labelFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString("vi-VN", { 
                        weekday: "short", 
                        day: "numeric", 
                        month: "short" 
                      });
                    }}
                    formatter={(value: number, name: string) => [
                      formatNumber(value),
                      name === "total_coins" ? "Số Camly Coin" : "Giao dịch"
                    ]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="total_coins" 
                    stroke="hsl(45, 93%, 47%)" 
                    fillOpacity={1} 
                    fill="url(#colorCoins)"
                    name="Số coin"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="transaction_count" 
                    stroke="hsl(199, 89%, 48%)" 
                    strokeWidth={2}
                    dot={false}
                    name="Giao dịch"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Recipients */}
        <Card className="border-divine-gold/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Award className="w-5 h-5 text-divine-gold" />
              Top 10 người nhận thưởng
            </CardTitle>
            <CardDescription>Những người dùng nhận được nhiều coin nhất</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topRecipients.map((recipient, index) => (
                <div 
                  key={recipient.user_id}
                  className="flex items-center gap-4 p-3 rounded-lg bg-primary-pale/30 hover:bg-primary-pale/50 transition-colors"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-divine-gold/20 text-divine-gold font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                    {recipient.avatar_url ? (
                      <img src={recipient.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Users className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {recipient.display_name || `User ${recipient.user_id.substring(0, 8)}...`}
                    </p>
                    <p className="text-xs text-foreground-muted">
                      {recipient.transaction_count} giao dịch
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-divine-gold">{formatNumber(recipient.total_earned)}</p>
                    <p className="text-xs text-foreground-muted">Camly Coin</p>
                  </div>
                </div>
              ))}

              {topRecipients.length === 0 && (
                <div className="text-center py-8 text-foreground-muted">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Chưa có dữ liệu</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminStatistics;
