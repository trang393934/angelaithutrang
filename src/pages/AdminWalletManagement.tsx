import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import AdminNavToolbar from "@/components/admin/AdminNavToolbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Wallet,
  Search,
  Copy,
  ExternalLink,
  Shield,
  ShieldOff,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Users,
  Ban,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface WalletEntry {
  wallet_address: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  handle: string | null;
  balance: number;
  lifetime_earned: number;
  total_withdrawn: number;
  suspension_type: string | null;
  suspended_until: string | null;
  suspension_reason: string | null;
}

const PAGE_SIZE = 25;

const AdminWalletManagement = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { toast } = useToast();

  const [wallets, setWallets] = useState<WalletEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended">("all");
  const [page, setPage] = useState(1);

  // Suspend dialog
  const [suspendTarget, setSuspendTarget] = useState<WalletEntry | null>(null);
  const [suspensionType, setSuspensionType] = useState<"temporary" | "permanent">("temporary");
  const [durationDays, setDurationDays] = useState("30");
  const [suspendReason, setSuspendReason] = useState("");
  const [healingMessage, setHealingMessage] = useState("");
  const [suspending, setSuspending] = useState(false);

  // Lift dialog
  const [liftTarget, setLiftTarget] = useState<WalletEntry | null>(null);
  const [lifting, setLifting] = useState(false);

  const fetchWallets = async () => {
    setLoading(true);
    try {
      // Fetch wallet addresses with profile and balance info
      const { data: walletData, error: walletError } = await supabase
        .from("user_wallet_addresses")
        .select("wallet_address, user_id");

      if (walletError) throw walletError;

      if (!walletData || walletData.length === 0) {
        setWallets([]);
        return;
      }

      const userIds = walletData.map((w) => w.user_id);

      // Fetch profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url, handle")
        .in("user_id", userIds);

      // Fetch balances
      const { data: balances } = await supabase
        .from("camly_coin_balances")
        .select("user_id, balance, lifetime_earned")
        .in("user_id", userIds);

      // Fetch completed withdrawals
      const { data: withdrawals } = await supabase
        .from("coin_withdrawals")
        .select("user_id, amount")
        .in("user_id", userIds)
        .eq("status", "completed");

      // Fetch active suspensions
      const { data: suspensions } = await supabase
        .from("user_suspensions")
        .select("user_id, suspension_type, suspended_until, reason")
        .in("user_id", userIds)
        .is("lifted_at", null);

      // Aggregate withdrawals per user
      const withdrawalMap: Record<string, number> = {};
      withdrawals?.forEach((w) => {
        withdrawalMap[w.user_id] = (withdrawalMap[w.user_id] || 0) + w.amount;
      });

      // Map data
      const profileMap: Record<string, (typeof profiles)[0]> = {};
      profiles?.forEach((p) => (profileMap[p.user_id] = p));

      const balanceMap: Record<string, (typeof balances)[0]> = {};
      balances?.forEach((b) => (balanceMap[b.user_id] = b));

      const suspensionMap: Record<string, (typeof suspensions)[0]> = {};
      suspensions?.forEach((s) => (suspensionMap[s.user_id] = s));

      const merged: WalletEntry[] = walletData.map((w) => {
        const profile = profileMap[w.user_id];
        const balance = balanceMap[w.user_id];
        const suspension = suspensionMap[w.user_id];
        return {
          wallet_address: w.wallet_address,
          user_id: w.user_id,
          display_name: profile?.display_name ?? null,
          avatar_url: profile?.avatar_url ?? null,
          handle: profile?.handle ?? null,
          balance: balance?.balance ?? 0,
          lifetime_earned: balance?.lifetime_earned ?? 0,
          total_withdrawn: withdrawalMap[w.user_id] ?? 0,
          suspension_type: suspension?.suspension_type ?? null,
          suspended_until: suspension?.suspended_until ?? null,
          suspension_reason: suspension?.reason ?? null,
        };
      });

      setWallets(merged);
    } catch (err) {
      console.error("Error fetching wallets:", err);
      toast({ title: "Lỗi", description: "Không thể tải danh sách ví", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, []);

  // Filtering
  const filtered = wallets.filter((w) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      (w.display_name?.toLowerCase().includes(q) ?? false) ||
      (w.handle?.toLowerCase().includes(q) ?? false) ||
      w.wallet_address.toLowerCase().includes(q);

    const isSuspended = !!w.suspension_type;
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && !isSuspended) ||
      (statusFilter === "suspended" && isSuspended);

    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalSuspended = wallets.filter((w) => !!w.suspension_type).length;
  const totalActive = wallets.length - totalSuspended;

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    toast({ title: "Đã sao chép địa chỉ ví" });
  };

  const handleSuspend = async () => {
    if (!suspendTarget || !session?.access_token) return;
    if (!suspendReason.trim()) {
      toast({ title: "Vui lòng nhập lý do tạm dừng", variant: "destructive" });
      return;
    }
    setSuspending(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/suspend-user`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            targetUserId: suspendTarget.user_id,
            suspensionType,
            reason: suspendReason,
            durationDays: suspensionType === "temporary" ? parseInt(durationDays) : undefined,
            healingMessage: healingMessage.trim() || undefined,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi tạm dừng");
      toast({ title: "Đã tạm dừng tài khoản thành công" });
      setSuspendTarget(null);
      setSuspendReason("");
      setHealingMessage("");
      setSuspensionType("temporary");
      setDurationDays("30");
      await fetchWallets();
    } catch (err: unknown) {
      toast({ title: "Lỗi", description: err instanceof Error ? err.message : "Không thể tạm dừng", variant: "destructive" });
    } finally {
      setSuspending(false);
    }
  };

  const handleLiftSuspension = async () => {
    if (!liftTarget || !session?.user?.id) return;
    setLifting(true);
    try {
      const { error } = await supabase
        .from("user_suspensions")
        .update({
          lifted_at: new Date().toISOString(),
          lifted_by: session.user.id,
        })
        .eq("user_id", liftTarget.user_id)
        .is("lifted_at", null);
      if (error) throw error;
      toast({ title: "Đã khôi phục tài khoản thành công" });
      setLiftTarget(null);
      await fetchWallets();
    } catch (err: unknown) {
      toast({ title: "Lỗi", description: err instanceof Error ? err.message : "Không thể gỡ tạm dừng", variant: "destructive" });
    } finally {
      setLifting(false);
    }
  };

  const getStatusBadge = (w: WalletEntry) => {
    if (!w.suspension_type) {
      return (
        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800">
          <CheckCircle className="w-3 h-3 mr-1" /> Hoạt động
        </Badge>
      );
    }
    if (w.suspension_type === "permanent") {
      return (
        <Badge variant="destructive">
          <Ban className="w-3 h-3 mr-1" /> Khóa vĩnh viễn
        </Badge>
      );
    }
    return (
      <Badge className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">
        <AlertTriangle className="w-3 h-3 mr-1" /> Tạm dừng
      </Badge>
    );
  };

  const fmt = (n: number) => n.toLocaleString("vi-VN");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 h-[73px] flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/dashboard")}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Wallet className="w-5 h-5 text-primary" />
          <div>
            <h1 className="font-bold text-foreground leading-tight">Quản lý Ví</h1>
            <p className="text-xs text-muted-foreground">{wallets.length} ví đã đăng ký</p>
          </div>
        </div>
      </div>

      <AdminNavToolbar />

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Tổng ví", value: wallets.length, icon: Wallet, color: "text-primary" },
            { label: "Đang hoạt động", value: totalActive, icon: Users, color: "text-emerald-600 dark:text-emerald-400" },
            { label: "Bị tạm dừng", value: totalSuspended, icon: Ban, color: "text-destructive" },
          ].map((stat) => (
            <div key={stat.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
              <stat.icon className={`w-8 h-8 ${stat.color} shrink-0`} />
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm tên, handle, hoặc địa chỉ ví..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as typeof statusFilter); setPage(1); }}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="active">Đang hoạt động</SelectItem>
              <SelectItem value="suspended">Đang tạm dừng</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground">Đang tải dữ liệu...</div>
          ) : paginated.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">Không tìm thấy kết quả nào</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Người dùng</TableHead>
                  <TableHead>Địa chỉ ví</TableHead>
                  <TableHead className="text-right">Số dư</TableHead>
                  <TableHead className="text-right">Tổng thưởng</TableHead>
                  <TableHead className="text-right">Đã rút</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-center">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((w) => (
                  <TableRow key={`${w.user_id}-${w.wallet_address}`} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={w.avatar_url ?? ""} />
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {(w.display_name ?? "?")[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p
                            className="text-sm font-medium text-foreground cursor-pointer hover:text-primary transition-colors"
                            onClick={() => navigate(`/user/${w.user_id}`)}
                          >
                            {w.display_name ?? "Chưa đặt tên"}
                          </p>
                          {w.handle && (
                            <p className="text-xs text-muted-foreground">@{w.handle}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs text-foreground/80">
                          {w.wallet_address.slice(0, 6)}...{w.wallet_address.slice(-4)}
                        </span>
                        <button
                          onClick={() => copyAddress(w.wallet_address)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={`https://bscscan.com/address/${w.wallet_address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-medium text-foreground">{fmt(w.balance)}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm text-emerald-600 dark:text-emerald-400">{fmt(w.lifetime_earned)}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm text-muted-foreground">{fmt(w.total_withdrawn)}</span>
                    </TableCell>
                    <TableCell>{getStatusBadge(w)}</TableCell>
                    <TableCell className="text-center">
                      {w.suspension_type ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setLiftTarget(w)}
                          className="text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-900/30"
                        >
                          <ShieldOff className="w-3.5 h-3.5 mr-1" />
                          Gỡ tạm dừng
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSuspendTarget(w)}
                          className="text-destructive border-destructive/30 hover:bg-destructive/10"
                        >
                          <Shield className="w-3.5 h-3.5 mr-1" />
                          Tạm dừng
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Hiển thị {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length} kết quả
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-foreground px-2">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Suspend Dialog */}
      <Dialog open={!!suspendTarget} onOpenChange={(o) => !o && setSuspendTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Tạm dừng tài khoản
            </DialogTitle>
            {suspendTarget && (
              <DialogDescription asChild>
                <div className="flex items-center gap-2 mt-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={suspendTarget.avatar_url ?? ""} />
                    <AvatarFallback className="text-xs">{(suspendTarget.display_name ?? "?")[0]}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-foreground">{suspendTarget.display_name ?? "Người dùng"}</span>
                </div>
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Loại tạm dừng</Label>
              <RadioGroup
                value={suspensionType}
                onValueChange={(v) => setSuspensionType(v as "temporary" | "permanent")}
                className="flex gap-4 mt-2"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="temporary" id="tmp" />
                  <Label htmlFor="tmp" className="cursor-pointer">Tạm thời</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="permanent" id="perm" />
                  <Label htmlFor="perm" className="cursor-pointer text-destructive">Vĩnh viễn</Label>
                </div>
              </RadioGroup>
            </div>

            {suspensionType === "temporary" && (
              <div>
                <Label htmlFor="days" className="text-sm font-medium">Số ngày tạm dừng</Label>
                <Input
                  id="days"
                  type="number"
                  min="1"
                  max="365"
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                  className="mt-1 w-32"
                />
              </div>
            )}

            <div>
              <Label htmlFor="reason" className="text-sm font-medium">
                Lý do <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="reason"
                placeholder="Nhập lý do tạm dừng tài khoản..."
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="healing" className="text-sm font-medium">
                Thông điệp chữa lành <span className="text-muted-foreground">(tùy chọn)</span>
              </Label>
              <Textarea
                id="healing"
                placeholder="Để trống sẽ dùng thông điệp mặc định từ Angel AI..."
                value={healingMessage}
                onChange={(e) => setHealingMessage(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendTarget(null)} disabled={suspending}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleSuspend} disabled={suspending}>
              {suspending ? "Đang xử lý..." : "Xác nhận tạm dừng"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lift Suspension Dialog */}
      <Dialog open={!!liftTarget} onOpenChange={(o) => !o && setLiftTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <ShieldOff className="w-5 h-5" />
              Gỡ tạm dừng tài khoản
            </DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn khôi phục tài khoản{" "}
              <strong>{liftTarget?.display_name ?? "này"}</strong> không?
              Người dùng sẽ có thể đăng nhập và sử dụng lại hệ thống.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLiftTarget(null)} disabled={lifting}>
              Hủy
            </Button>
            <Button
              onClick={handleLiftSuspension}
              disabled={lifting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {lifting ? "Đang xử lý..." : "Xác nhận khôi phục"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminWalletManagement;
