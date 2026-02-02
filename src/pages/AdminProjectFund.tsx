import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Heart,
  Send,
  Search,
  RefreshCw,
  Loader2,
  Sparkles,
  Gift,
  Users,
  TrendingUp,
  TrendingDown,
  Clock,
  User,
  ExternalLink
} from "lucide-react";
import angelAvatar from "@/assets/angel-avatar.png";
import camlyCoinLogo from "@/assets/camly-coin-logo.png";

interface ProjectFund {
  balance: number;
  total_received: number;
  total_distributed: number;
  updated_at: string;
}

interface Donation {
  id: string;
  donor_id: string;
  amount: number;
  message: string | null;
  created_at: string;
  donor_name?: string;
  donor_avatar?: string;
}

interface UserProfile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
}

const AdminProjectFund = () => {
  const { user, isAdmin, isLoading: authLoading, isAdminChecked, signOut } = useAuth();
  const navigate = useNavigate();

  const [fund, setFund] = useState<ProjectFund | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Distribution dialog
  const [showDistributeDialog, setShowDistributeDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [distributeAmount, setDistributeAmount] = useState("");
  const [distributeReason, setDistributeReason] = useState("");
  const [isDistributing, setIsDistributing] = useState(false);

  useEffect(() => {
    if (!authLoading && isAdminChecked) {
      if (!user) {
        navigate("/admin/login");
      } else if (!isAdmin) {
        toast.error("Bạn không có quyền truy cập trang này");
        navigate("/");
      } else {
        fetchData();
      }
    }
  }, [user, isAdmin, authLoading, isAdminChecked, navigate]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch fund balance
      const { data: fundData, error: fundError } = await supabase
        .from("project_fund")
        .select("*")
        .eq("id", "00000000-0000-0000-0000-000000000001")
        .single();

      if (fundError) throw fundError;
      setFund(fundData);

      // Fetch recent donations
      const { data: donationsData, error: donationsError } = await supabase
        .from("project_donations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (donationsError) throw donationsError;

      // Get donor profiles
      const donorIds = [...new Set(donationsData?.map(d => d.donor_id) || [])];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", donorIds);

      const enrichedDonations = (donationsData || []).map(d => ({
        ...d,
        donor_name: profilesData?.find(p => p.user_id === d.donor_id)?.display_name || "Ẩn danh",
        donor_avatar: profilesData?.find(p => p.user_id === d.donor_id)?.avatar_url
      }));

      setDonations(enrichedDonations);

      // Fetch users for distribution
      const { data: usersData } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .order("display_name", { ascending: true });

      setUsers(usersData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Không thể tải dữ liệu quỹ");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(u => {
    if (!searchQuery) return true;
    return u.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           u.user_id.includes(searchQuery);
  });

  const openDistributeDialog = (userProfile: UserProfile) => {
    setSelectedUser(userProfile);
    setDistributeAmount("");
    setDistributeReason("");
    setShowDistributeDialog(true);
  };

  const handleDistribute = async () => {
    if (!selectedUser || !distributeAmount || !distributeReason) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    const amount = Number(distributeAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Số lượng không hợp lệ");
      return;
    }

    if (fund && amount > fund.balance) {
      toast.error("Số dư quỹ không đủ");
      return;
    }

    setIsDistributing(true);
    try {
      const { data, error } = await supabase.functions.invoke("distribute-project-fund", {
        body: {
          recipient_id: selectedUser.user_id,
          amount,
          reason: distributeReason
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(data.message);
        setShowDistributeDialog(false);
        fetchData(); // Refresh data
      } else {
        toast.error(data?.error || "Không thể phân phối");
      }
    } catch (error) {
      console.error("Distribution error:", error);
      toast.error("Lỗi khi phân phối quỹ");
    } finally {
      setIsDistributing(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-pale via-background to-background flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-foreground-muted">Đang tải...</p>
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
                  <h1 className="font-serif text-lg font-semibold text-primary-deep">Quỹ Dự Án</h1>
                  <p className="text-xs text-foreground-muted">Quản lý & phân phối coin donate</p>
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Làm mới
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Fund Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Current Balance */}
          <Card className="border-rose-500/20 bg-gradient-to-br from-rose-50 to-pink-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-rose-500/10">
                  <Heart className="w-8 h-8 text-rose-500 fill-rose-500" />
                </div>
                <div>
                  <p className="text-sm text-rose-600">Số dư hiện tại</p>
                  <div className="flex items-center gap-2">
                    <img src={camlyCoinLogo} alt="CAMLY" className="w-6 h-6" />
                    <p className="text-2xl font-bold text-rose-700">
                      {fund?.balance.toLocaleString() || 0}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Received */}
          <Card className="border-green-500/20 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-500/10">
                  <TrendingUp className="w-8 h-8 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-green-600">Tổng nhận được</p>
                  <p className="text-2xl font-bold text-green-700">
                    {fund?.total_received.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Distributed */}
          <Card className="border-blue-500/20 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-blue-500/10">
                  <Gift className="w-8 h-8 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-blue-600">Đã phân phối</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {fund?.total_distributed.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Donations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500" />
                Donations gần đây
              </CardTitle>
              <CardDescription>
                {donations.length} lượt donate từ cộng đồng
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {donations.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Chưa có donations nào
                    </p>
                  ) : (
                    donations.map((d) => (
                      <div key={d.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={d.donor_avatar || undefined} />
                          <AvatarFallback>
                            <User className="w-5 h-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm truncate">{d.donor_name}</p>
                            <Badge variant="secondary" className="bg-rose-100 text-rose-700">
                              +{d.amount.toLocaleString()}
                            </Badge>
                          </div>
                          {d.message && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              "{d.message}"
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(d.created_at).toLocaleString("vi-VN")}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Distribute to Contributors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-blue-500" />
                Phân phối cho Contributors
              </CardTitle>
              <CardDescription>
                Tìm và thưởng coin cho những người đóng góp
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo tên hoặc ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <ScrollArea className="h-[350px]">
                <div className="space-y-2">
                  {filteredUsers.slice(0, 50).map((u) => (
                    <div
                      key={u.user_id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={u.avatar_url || undefined} />
                          <AvatarFallback>
                            <User className="w-5 h-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">
                            {u.display_name || "Chưa đặt tên"}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {u.user_id.substring(0, 8)}...
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => openDistributeDialog(u)}
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                      >
                        <Gift className="w-4 h-4 mr-1" />
                        Thưởng
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Distribute Dialog */}
      <Dialog open={showDistributeDialog} onOpenChange={setShowDistributeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-blue-500" />
              Phân phối từ Quỹ Dự Án
            </DialogTitle>
            <DialogDescription>
              Thưởng coin cho contributor từ quỹ donate
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4">
              {/* Selected User */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={selectedUser.avatar_url || undefined} />
                  <AvatarFallback>
                    <User className="w-6 h-6" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedUser.display_name || "Chưa đặt tên"}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {selectedUser.user_id}
                  </p>
                </div>
              </div>

              {/* Fund Balance */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-rose-50 border border-rose-200">
                <span className="text-sm text-rose-600">Số dư quỹ:</span>
                <span className="font-bold text-rose-700">
                  {fund?.balance.toLocaleString()} Camly Coin
                </span>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Số lượng coin</label>
                <Input
                  type="number"
                  placeholder="1000"
                  value={distributeAmount}
                  onChange={(e) => setDistributeAmount(e.target.value)}
                  min={1}
                  max={fund?.balance}
                />
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Lý do thưởng</label>
                <Textarea
                  placeholder="Ví dụ: Đóng góp code, tìm bug, đề xuất ý tưởng hay..."
                  value={distributeReason}
                  onChange={(e) => setDistributeReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDistributeDialog(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleDistribute}
              disabled={isDistributing || !distributeAmount || !distributeReason}
              className="bg-gradient-to-r from-blue-500 to-indigo-500"
            >
              {isDistributing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Gift className="w-4 h-4 mr-2" />
              )}
              Phân phối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProjectFund;
