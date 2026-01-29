import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageSquare, ImagePlus, Eye, Paintbrush, RefreshCw, Calendar } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface UsageStats {
  usage_type: string;
  total_count: number;
  unique_users: number;
}

interface DailyUsage {
  usage_date: string;
  chat: number;
  generate_image: number;
  analyze_image: number;
  edit_image: number;
}

export default function AdminAIUsage() {
  const { isAdmin, isAdminChecked } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<UsageStats[]>([]);
  const [dailyUsage, setDailyUsage] = useState<DailyUsage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAdminChecked && !isAdmin) {
      navigate("/admin/login");
    }
  }, [isAdmin, isAdminChecked, navigate]);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      // Fetch aggregate stats
      const { data: aggregateData, error: aggError } = await supabase
        .from('ai_usage_tracking')
        .select('usage_type, usage_count, user_id');

      if (aggError) throw aggError;

      // Process aggregate data
      const statsMap: Record<string, { total: number; users: Set<string> }> = {};
      (aggregateData || []).forEach((row: any) => {
        if (!statsMap[row.usage_type]) {
          statsMap[row.usage_type] = { total: 0, users: new Set() };
        }
        statsMap[row.usage_type].total += row.usage_count;
        statsMap[row.usage_type].users.add(row.user_id);
      });

      const processedStats = Object.entries(statsMap).map(([type, data]) => ({
        usage_type: type,
        total_count: data.total,
        unique_users: data.users.size,
      }));
      setStats(processedStats);

      // Fetch daily breakdown (last 7 days)
      const { data: dailyData, error: dailyError } = await supabase
        .from('ai_usage_tracking')
        .select('usage_date, usage_type, usage_count')
        .gte('usage_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('usage_date', { ascending: false });

      if (dailyError) throw dailyError;

      // Process daily data
      const dailyMap: Record<string, DailyUsage> = {};
      (dailyData || []).forEach((row: any) => {
        if (!dailyMap[row.usage_date]) {
          dailyMap[row.usage_date] = {
            usage_date: row.usage_date,
            chat: 0,
            generate_image: 0,
            analyze_image: 0,
            edit_image: 0,
          };
        }
        if (row.usage_type in dailyMap[row.usage_date]) {
          (dailyMap[row.usage_date] as any)[row.usage_type] += row.usage_count;
        }
      });

      setDailyUsage(Object.values(dailyMap).sort((a, b) => 
        new Date(b.usage_date).getTime() - new Date(a.usage_date).getTime()
      ));

    } catch (err) {
      console.error('Error fetching AI usage stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
    }
  }, [isAdmin]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'chat': return <MessageSquare className="h-6 w-6 text-blue-500" />;
      case 'generate_image': return <ImagePlus className="h-6 w-6 text-purple-500" />;
      case 'analyze_image': return <Eye className="h-6 w-6 text-green-500" />;
      case 'edit_image': return <Paintbrush className="h-6 w-6 text-orange-500" />;
      default: return <MessageSquare className="h-6 w-6" />;
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'chat': return 'Chat AI';
      case 'generate_image': return 'Tạo ảnh';
      case 'analyze_image': return 'Phân tích ảnh';
      case 'edit_image': return 'Chỉnh sửa ảnh';
      default: return type;
    }
  };

  const getCostIndicator = (type: string) => {
    switch (type) {
      case 'chat': return { stars: 1, label: 'Thấp' };
      case 'generate_image': return { stars: 5, label: 'Rất cao' };
      case 'analyze_image': return { stars: 2, label: 'Trung bình' };
      case 'edit_image': return { stars: 6, label: 'Cao nhất' };
      default: return { stars: 1, label: 'N/A' };
    }
  };

  if (!isAdminChecked) {
    return <div className="flex items-center justify-center h-screen">Đang tải...</div>;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Thống kê sử dụng AI</h1>
          <Button variant="outline" size="sm" onClick={fetchStats} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>

        {/* Aggregate Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {['chat', 'generate_image', 'analyze_image', 'edit_image'].map(type => {
            const stat = stats.find(s => s.usage_type === type);
            const cost = getCostIndicator(type);
            return (
              <Card key={type}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">{getTypeName(type)}</CardTitle>
                  {getIcon(type)}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat?.total_count || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stat?.unique_users || 0} người dùng
                  </p>
                  <div className="mt-2 flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">Chi phí:</span>
                    <span className="text-xs text-yellow-500">
                      {'⭐'.repeat(cost.stars)}
                    </span>
                    <span className="text-xs text-muted-foreground">({cost.label})</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Daily Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Thống kê theo ngày (7 ngày gần nhất)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dailyUsage.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Chưa có dữ liệu</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">Ngày</th>
                      <th className="text-center py-2 px-4">Chat</th>
                      <th className="text-center py-2 px-4">Tạo ảnh</th>
                      <th className="text-center py-2 px-4">Phân tích</th>
                      <th className="text-center py-2 px-4">Chỉnh sửa</th>
                      <th className="text-center py-2 px-4">Tổng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyUsage.map(day => (
                      <tr key={day.usage_date} className="border-b">
                        <td className="py-2 px-4">
                          {format(new Date(day.usage_date), 'dd/MM/yyyy', { locale: vi })}
                        </td>
                        <td className="text-center py-2 px-4">{day.chat}</td>
                        <td className="text-center py-2 px-4 text-purple-500 font-medium">
                          {day.generate_image}
                        </td>
                        <td className="text-center py-2 px-4">{day.analyze_image}</td>
                        <td className="text-center py-2 px-4 text-orange-500 font-medium">
                          {day.edit_image}
                        </td>
                        <td className="text-center py-2 px-4 font-bold">
                          {day.chat + day.generate_image + day.analyze_image + day.edit_image}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cost Estimation */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Ước tính chi phí tương đối</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <div className="font-medium text-blue-500">Chat AI</div>
                <div className="text-muted-foreground">1x (chuẩn)</div>
              </div>
              <div className="p-3 bg-green-500/10 rounded-lg">
                <div className="font-medium text-green-500">Phân tích ảnh</div>
                <div className="text-muted-foreground">2-3x</div>
              </div>
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <div className="font-medium text-purple-500">Tạo ảnh</div>
                <div className="text-muted-foreground">10-20x</div>
              </div>
              <div className="p-3 bg-orange-500/10 rounded-lg">
                <div className="font-medium text-orange-500">Chỉnh sửa ảnh</div>
                <div className="text-muted-foreground">15-25x</div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              * Giới hạn hiện tại: Tạo ảnh & Chỉnh sửa ảnh: 5 lần/ngày/người dùng
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
