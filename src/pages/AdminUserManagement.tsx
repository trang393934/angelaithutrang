import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  ArrowLeft, Users, Coins, Sparkles, Gift, Wallet, Search,
  RefreshCw, LogOut, Loader2, ArrowUpDown, ChevronLeft, ChevronRight,
  TrendingDown, ArrowDownToLine, MessageSquare, FileText, Hash, ShieldCheck, ShieldAlert, ShieldOff
} from "lucide-react";
import AdminNavToolbar from "@/components/admin/AdminNavToolbar";
import { UserDetailDialog } from "@/components/admin/UserDetailDialog";
import { UserManagementExportButton } from "@/components/admin/UserManagementExportButton";
import angelAvatar from "@/assets/angel-avatar.png";

interface UserRow {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  handle: string | null;
  joined_at: string | null;
  post_count: number;
  comment_count: number;
  light_score: number;
  popl_score: number;
  positive_actions: number;
  negative_actions: number;
  camly_balance: number;
  camly_lifetime_earned: number;
  camly_lifetime_spent: number;
  fun_money_received: number;
  gift_internal_sent: number;
  gift_internal_received: number;
  gift_web3_sent: number;
  gift_web3_received: number;
  total_withdrawn: number;
  withdrawal_count: number;
  pplp_action_count: number;
  pplp_minted_count: number;
  wallet_address: string | null;
  account_status: "active" | "suspended" | "banned";
  suspended_until: string | null;
}

type SortField = "display_name" | "joined_at" | "light_score" | "camly_balance" | "camly_lifetime_earned" | "fun_money_received" | "total_withdrawn" | "post_count";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 25;

const formatNumber = (num: number) => {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return num.toLocaleString("vi-VN");
};

const AdminUserManagement = () => {
  const { user, isAdmin, isLoading: authLoading, isAdminChecked, signOut } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState<UserRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [searchText, setSearchText] = useState("");
  const [lightFilter, setLightFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [funFilter, setFunFilter] = useState<"all" | "has" | "none">("all");
  const [withdrawFilter, setWithdrawFilter] = useState<"all" | "has" | "none">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended" | "banned">("all");

  // Sort
  const [sortField, setSortField] = useState<SortField>("joined_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Pagination
  const [page, setPage] = useState(1);

  // Detail dialog
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);

  useEffect(() => {
    if (!authLoading) {
      fetchUsers();
    }
  }, [authLoading]);

  const fetchUsers = async () => {
    setIsRefreshing(true);
    try {
      const [{ data, error }, { data: suspensions }] = await Promise.all([
        supabase.rpc("get_admin_user_management_data" as any),
        supabase.from("user_suspensions").select("user_id, suspension_type, suspended_until, lifted_at").is("lifted_at", null),
      ]);
      if (error) throw error;

      // Build suspension map
      const suspMap = new Map<string, { type: string; until: string | null }>();
      (suspensions || []).forEach((s: any) => {
        const isActive = s.suspension_type === "permanent" || (s.suspended_until && new Date(s.suspended_until) > new Date());
        if (isActive) {
          suspMap.set(s.user_id, { type: s.suspension_type, until: s.suspended_until });
        }
      });

      setUsers((data as any[])?.map((d: any) => {
        const susp = suspMap.get(d.user_id);
        const account_status: "active" | "suspended" | "banned" = susp
          ? susp.type === "permanent" ? "banned" : "suspended"
          : "active";
        return {
          user_id: d.user_id,
          display_name: d.display_name,
          avatar_url: d.avatar_url,
          handle: d.handle,
          joined_at: d.joined_at,
          post_count: Number(d.post_count) || 0,
          comment_count: Number(d.comment_count) || 0,
          light_score: Number(d.light_score) || 0,
          popl_score: Number(d.popl_score) || 0,
          positive_actions: Number(d.positive_actions) || 0,
          negative_actions: Number(d.negative_actions) || 0,
          camly_balance: Number(d.camly_balance) || 0,
          camly_lifetime_earned: Number(d.camly_lifetime_earned) || 0,
          camly_lifetime_spent: Number(d.camly_lifetime_spent) || 0,
          fun_money_received: Number(d.fun_money_received) || 0,
          gift_internal_sent: Number(d.gift_internal_sent) || 0,
          gift_internal_received: Number(d.gift_internal_received) || 0,
          gift_web3_sent: Number(d.gift_web3_sent) || 0,
          gift_web3_received: Number(d.gift_web3_received) || 0,
          total_withdrawn: Number(d.total_withdrawn) || 0,
          withdrawal_count: Number(d.withdrawal_count) || 0,
          pplp_action_count: Number(d.pplp_action_count) || 0,
          pplp_minted_count: Number(d.pplp_minted_count) || 0,
          wallet_address: d.wallet_address,
          account_status,
          suspended_until: susp?.until || null,
        };
      }) || []);
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải dữ liệu người dùng");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Filtered & sorted data
  const filteredUsers = useMemo(() => {
    let result = [...users];

    // Search
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      result = result.filter(u =>
        (u.display_name?.toLowerCase().includes(q)) ||
        (u.handle?.toLowerCase().includes(q)) ||
        (u.user_id.toLowerCase().includes(q))
      );
    }

    // Light score filter
    if (lightFilter === "high") result = result.filter(u => u.light_score >= 1000);
    else if (lightFilter === "medium") result = result.filter(u => u.light_score >= 100 && u.light_score < 1000);
    else if (lightFilter === "low") result = result.filter(u => u.light_score < 100);

    // FUN Money filter
    if (funFilter === "has") result = result.filter(u => u.fun_money_received > 0);
    else if (funFilter === "none") result = result.filter(u => u.fun_money_received === 0);

    // Withdrawal filter
    if (withdrawFilter === "has") result = result.filter(u => u.total_withdrawn > 0);
    else if (withdrawFilter === "none") result = result.filter(u => u.total_withdrawn === 0);

    // Account status filter
    if (statusFilter !== "all") result = result.filter(u => u.account_status === statusFilter);

    // Sort
    result.sort((a, b) => {
      let va: any = a[sortField];
      let vb: any = b[sortField];
      if (sortField === "joined_at") { va = va ? new Date(va).getTime() : 0; vb = vb ? new Date(vb).getTime() : 0; }
      if (sortField === "display_name") { va = (va || "").toLowerCase(); vb = (vb || "").toLowerCase(); }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [users, searchText, lightFilter, funFilter, withdrawFilter, statusFilter, sortField, sortDir]);

  const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE);
  const pagedUsers = filteredUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [searchText, lightFilter, funFilter, withdrawFilter, statusFilter]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  };

  // Stats
  const stats = useMemo(() => ({
    totalUsers: users.length,
    totalCamlyBalance: users.reduce((s, u) => s + u.camly_balance, 0),
    totalCamlyDistributed: users.reduce((s, u) => s + u.camly_lifetime_earned, 0),
    totalCamlySpent: users.reduce((s, u) => s + u.camly_lifetime_spent, 0),
    totalWithdrawn: users.reduce((s, u) => s + u.total_withdrawn, 0),
    totalFunMoney: users.reduce((s, u) => s + u.fun_money_received, 0),
    totalInternalGiftsSent: users.reduce((s, u) => s + u.gift_internal_sent, 0),
    totalInternalGiftsReceived: users.reduce((s, u) => s + u.gift_internal_received, 0),
    totalWeb3GiftsSent: users.reduce((s, u) => s + u.gift_web3_sent, 0),
    totalWeb3GiftsReceived: users.reduce((s, u) => s + u.gift_web3_received, 0),
    totalPosts: users.reduce((s, u) => s + u.post_count, 0),
    totalComments: users.reduce((s, u) => s + u.comment_count, 0),
    totalWithdrawalCount: users.reduce((s, u) => s + u.withdrawal_count, 0),
  }), [users]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-pale via-background to-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-foreground-muted">Đang tải dữ liệu quản lý user...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-pale via-background to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background-pure/90 backdrop-blur-lg border-b border-primary-pale shadow-soft">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/admin/dashboard" className="p-2 rounded-full hover:bg-primary-pale transition-colors">
                <ArrowLeft className="w-5 h-5 text-primary" />
              </Link>
              <img src={angelAvatar} alt="Angel AI" className="w-9 h-9 rounded-full shadow-soft" />
              <div>
                <h1 className="font-serif text-lg font-semibold text-primary-deep">Quản lý User</h1>
                <p className="text-xs text-foreground-muted">{formatNumber(stats.totalUsers)} người dùng</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <UserManagementExportButton users={filteredUsers} />
              <Button variant="ghost" size="sm" onClick={fetchUsers} disabled={isRefreshing}>
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
              </Button>
              {user && (
                <Button variant="ghost" size="sm" onClick={() => signOut().then(() => navigate("/"))}>
                  <LogOut className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {user && isAdmin && <AdminNavToolbar />}

      <main className="container mx-auto px-2 sm:px-4 py-6 max-w-[1400px]">
        {/* Stats Row 1: Users & Camly Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-3">
          <Card className="border-purple-500/20">
            <CardContent className="pt-3 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600 shrink-0" />
                <div>
                  <p className="text-lg font-bold">{formatNumber(stats.totalUsers)}</p>
                  <p className="text-[10px] text-foreground-muted">Tổng users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-emerald-500/20">
            <CardContent className="pt-3 pb-3">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-lg font-bold">{formatNumber(stats.totalCamlyBalance)}</p>
                  <p className="text-[10px] text-foreground-muted">Camly còn lại</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-amber-500/20">
            <CardContent className="pt-3 pb-3">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <p className="text-lg font-bold">{formatNumber(stats.totalCamlyDistributed)}</p>
                  <p className="text-[10px] text-foreground-muted">Camly đã phát</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-orange-500/20">
            <CardContent className="pt-3 pb-3">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-orange-600 shrink-0" />
                <div>
                  <p className="text-lg font-bold">{formatNumber(stats.totalCamlySpent)}</p>
                  <p className="text-[10px] text-foreground-muted">Camly đã tiêu</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-rose-500/20">
            <CardContent className="pt-3 pb-3">
              <div className="flex items-center gap-2">
                <ArrowDownToLine className="w-5 h-5 text-rose-600 shrink-0" />
                <div>
                  <p className="text-lg font-bold">{formatNumber(stats.totalWithdrawn)}</p>
                  <p className="text-[10px] text-foreground-muted">Tổng đã rút</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Row 2: FUN Money & Gifts */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-3">
          <Card className="border-indigo-500/20">
            <CardContent className="pt-3 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600 shrink-0" />
                <div>
                  <p className="text-lg font-bold">{formatNumber(stats.totalFunMoney)}</p>
                  <p className="text-[10px] text-foreground-muted">FUN Money</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-500/20">
            <CardContent className="pt-3 pb-3">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-green-600 shrink-0" />
                <div>
                  <p className="text-lg font-bold">{formatNumber(stats.totalInternalGiftsSent)}</p>
                  <p className="text-[10px] text-foreground-muted">Tặng nội bộ (gửi)</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-500/20">
            <CardContent className="pt-3 pb-3">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-blue-600 shrink-0" />
                <div>
                  <p className="text-lg font-bold">{formatNumber(stats.totalInternalGiftsReceived)}</p>
                  <p className="text-[10px] text-foreground-muted">Tặng nội bộ (nhận)</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-cyan-500/20">
            <CardContent className="pt-3 pb-3">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-cyan-600 shrink-0" />
                <div>
                  <p className="text-lg font-bold">{formatNumber(stats.totalWeb3GiftsSent)}</p>
                  <p className="text-[10px] text-foreground-muted">Tặng Web3 (gửi)</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-teal-500/20">
            <CardContent className="pt-3 pb-3">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-teal-600 shrink-0" />
                <div>
                  <p className="text-lg font-bold">{formatNumber(stats.totalWeb3GiftsReceived)}</p>
                  <p className="text-[10px] text-foreground-muted">Tặng Web3 (nhận)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Row 3: Community Activity */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="border-violet-500/20">
            <CardContent className="pt-3 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-violet-600 shrink-0" />
                <div>
                  <p className="text-lg font-bold">{formatNumber(stats.totalPosts)}</p>
                  <p className="text-[10px] text-foreground-muted">Tổng bài đăng</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-sky-500/20">
            <CardContent className="pt-3 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-sky-600 shrink-0" />
                <div>
                  <p className="text-lg font-bold">{formatNumber(stats.totalComments)}</p>
                  <p className="text-[10px] text-foreground-muted">Tổng bình luận</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-pink-500/20">
            <CardContent className="pt-3 pb-3">
              <div className="flex items-center gap-2">
                <Hash className="w-5 h-5 text-pink-600 shrink-0" />
                <div>
                  <p className="text-lg font-bold">{formatNumber(stats.totalWithdrawalCount)}</p>
                  <p className="text-[10px] text-foreground-muted">Tổng yêu cầu rút</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
            <Input
              placeholder="Tìm theo tên, handle hoặc ID..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <Select value={lightFilter} onValueChange={v => setLightFilter(v as any)}>
            <SelectTrigger className="w-[140px] h-9 text-xs">
              <SelectValue placeholder="Điểm Ánh sáng" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả điểm</SelectItem>
              <SelectItem value="high">Cao (≥1000)</SelectItem>
              <SelectItem value="medium">TB (100-999)</SelectItem>
              <SelectItem value="low">Thấp (&lt;100)</SelectItem>
            </SelectContent>
          </Select>
          <Select value={funFilter} onValueChange={v => setFunFilter(v as any)}>
            <SelectTrigger className="w-[140px] h-9 text-xs">
              <SelectValue placeholder="FUN Money" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="has">Có FUN Money</SelectItem>
              <SelectItem value="none">Chưa có</SelectItem>
            </SelectContent>
          </Select>
          <Select value={withdrawFilter} onValueChange={v => setWithdrawFilter(v as any)}>
            <SelectTrigger className="w-[140px] h-9 text-xs">
              <SelectValue placeholder="Rút tiền" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="has">Đã rút</SelectItem>
              <SelectItem value="none">Chưa rút</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={v => setStatusFilter(v as any)}>
            <SelectTrigger className="w-[160px] h-9 text-xs">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="active">🟢 Hoạt động</SelectItem>
              <SelectItem value="suspended">🟠 Đình chỉ</SelectItem>
              <SelectItem value="banned">🔴 Cấm vĩnh viễn</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-foreground-muted">
            Hiển thị {pagedUsers.length} / {filteredUsers.length} người dùng
          </p>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-border bg-background-pure/80 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="w-[200px] sticky left-0 bg-muted/30 z-10">
                    <button onClick={() => toggleSort("display_name")} className="flex items-center gap-1 text-xs font-semibold">
                      Người dùng <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-xs font-semibold">Trạng thái</TableHead>
                  <TableHead className="text-xs">
                    <button onClick={() => toggleSort("joined_at")} className="flex items-center gap-1 font-semibold">
                      Tham gia <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-xs">
                    <button onClick={() => toggleSort("post_count")} className="flex items-center gap-1 font-semibold">
                      Bài/BL <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-xs">
                    <button onClick={() => toggleSort("light_score")} className="flex items-center gap-1 font-semibold">
                      Ánh sáng <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-xs">
                    <button onClick={() => toggleSort("camly_balance")} className="flex items-center gap-1 font-semibold">
                      Số dư <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-xs">
                    <button onClick={() => toggleSort("camly_lifetime_earned")} className="flex items-center gap-1 font-semibold">
                      Tổng thưởng <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-xs">
                    <button onClick={() => toggleSort("fun_money_received")} className="flex items-center gap-1 font-semibold">
                      FUN Money <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-xs">Tặng nội bộ</TableHead>
                  <TableHead className="text-xs">Tặng Web3</TableHead>
                  <TableHead className="text-xs">
                    <button onClick={() => toggleSort("total_withdrawn")} className="flex items-center gap-1 font-semibold">
                      Đã rút <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-xs">Ví BSC</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-8 text-foreground-muted">
                      Không tìm thấy người dùng nào
                    </TableCell>
                  </TableRow>
                ) : (
                  pagedUsers.map(u => (
                    <TableRow
                      key={u.user_id}
                      className="cursor-pointer hover:bg-primary-pale/30 transition-colors"
                      onClick={() => {
                        if (!user) {
                          toast.info("Vui lòng đăng nhập để xem chi tiết người dùng", {
                            action: { label: "Đăng nhập", onClick: () => navigate("/auth") }
                          });
                          return;
                        }
                        setSelectedUser(u);
                      }}
                    >
                      <TableCell className="sticky left-0 bg-background-pure/80 z-10">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-7 h-7">
                            <AvatarImage src={u.avatar_url || ""} />
                            <AvatarFallback className="text-[10px] bg-primary-pale text-primary">
                              {(u.display_name || "?")[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-xs font-medium truncate max-w-[120px]">{u.display_name || "Ẩn danh"}</p>
                            {u.handle && <p className="text-[10px] text-foreground-muted">@{u.handle}</p>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        {u.account_status === "active" && (
                          <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30 text-[10px] px-1.5 py-0">
                            <ShieldCheck className="w-3 h-3 mr-0.5" /> Hoạt động
                          </Badge>
                        )}
                        {u.account_status === "suspended" && (
                          <Badge className="bg-orange-500/15 text-orange-700 border-orange-500/30 text-[10px] px-1.5 py-0">
                            <ShieldAlert className="w-3 h-3 mr-0.5" /> Đình chỉ
                          </Badge>
                        )}
                        {u.account_status === "banned" && (
                          <Badge className="bg-red-500/15 text-red-700 border-red-500/30 text-[10px] px-1.5 py-0">
                            <ShieldOff className="w-3 h-3 mr-0.5" /> Cấm vĩnh viễn
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-foreground-muted whitespace-nowrap">
                        {u.joined_at ? new Date(u.joined_at).toLocaleDateString("vi-VN") : "—"}
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className="font-medium">{u.post_count}</span>
                        <span className="text-foreground-muted"> / {u.comment_count}</span>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="flex items-center gap-1">
                          <span className="font-medium">{formatNumber(u.light_score)}</span>
                          {u.popl_score > 0 && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                              PoPL {u.popl_score.toFixed(0)}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-medium">{formatNumber(u.camly_balance)}</TableCell>
                      <TableCell className="text-xs font-medium text-amber-600">{formatNumber(u.camly_lifetime_earned)}</TableCell>
                      <TableCell className="text-xs">
                        {u.fun_money_received > 0 ? (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{formatNumber(u.fun_money_received)}</Badge>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className="text-green-600">↑{formatNumber(u.gift_internal_sent)}</span>
                        {" / "}
                        <span className="text-blue-600">↓{formatNumber(u.gift_internal_received)}</span>
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className="text-green-600">↑{formatNumber(u.gift_web3_sent)}</span>
                        {" / "}
                        <span className="text-blue-600">↓{formatNumber(u.gift_web3_received)}</span>
                      </TableCell>
                      <TableCell className="text-xs">
                        {u.total_withdrawn > 0 ? (
                          <span className="font-medium text-rose-600">{formatNumber(u.total_withdrawn)}</span>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-foreground-muted">
                        {u.wallet_address ? (
                          <span className="font-mono text-[10px]">{u.wallet_address.slice(0, 6)}...{u.wallet_address.slice(-4)}</span>
                        ) : "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-foreground-muted">
              Trang {page} / {totalPages}
            </span>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </main>

      {/* User Detail Dialog */}
      <UserDetailDialog
        user={selectedUser}
        open={!!selectedUser}
        onOpenChange={open => { if (!open) setSelectedUser(null); }}
      />
    </div>
  );
};

export default AdminUserManagement;
