import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import AdminNavToolbar from "@/components/admin/AdminNavToolbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  Shield,
  ChevronLeft,
  Search,
  Ban,
  CheckCircle,
  Eye,
  RefreshCw,
  Siren,
  User,
  Clock,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FraudAlert {
  id: string;
  user_id: string;
  alert_type: string;
  matched_pattern: string | null;
  severity: string;
  details: Record<string, unknown>;
  is_reviewed: boolean;
  reviewed_by: string | null;
  reviewed_at: string | null;
  action_taken: string | null;
  created_at: string;
  // Joined
  display_name?: string | null;
  avatar_url?: string | null;
  handle?: string | null;
  email?: string | null;
  is_suspended?: boolean;
}

interface PatternEntry {
  id: string;
  pattern_type: string;
  pattern_value: string;
  severity: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

const SEVERITY_MAP: Record<string, { label: string; className: string }> = {
  critical: { label: "Nghiêm trọng", className: "bg-destructive text-destructive-foreground" },
  high: { label: "Cao", className: "bg-orange-500 text-white" },
  medium: { label: "Trung bình", className: "bg-amber-500 text-white" },
  low: { label: "Thấp", className: "bg-muted text-muted-foreground" },
};

const ALERT_TYPE_MAP: Record<string, string> = {
  email_pattern: "Khớp Email Pattern",
  bulk_registration: "Đăng ký hàng loạt",
  wallet_cluster: "Cụm ví nghi ngờ",
  withdrawal_spike: "Đột biến rút tiền",
};

const AdminFraudAlerts = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { toast } = useToast();

  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [patterns, setPatterns] = useState<PatternEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [reviewedFilter, setReviewedFilter] = useState<string>("unreviewed");
  const [activeTab, setActiveTab] = useState<"alerts" | "patterns">("alerts");

  // Ban dialog
  const [banTarget, setBanTarget] = useState<FraudAlert | null>(null);
  const [banning, setBanning] = useState(false);

  // Ignore dialog
  const [ignoreTarget, setIgnoreTarget] = useState<FraudAlert | null>(null);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const { data: alertData, error } = await supabase
        .from("fraud_alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) throw error;

      if (!alertData || alertData.length === 0) {
        setAlerts([]);
        return;
      }

      const userIds = [...new Set(alertData.map((a) => a.user_id))];

      // Fetch profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url, handle")
        .in("user_id", userIds);

      // Fetch suspension status
      const { data: suspensions } = await supabase
        .from("user_suspensions")
        .select("user_id")
        .in("user_id", userIds)
        .is("lifted_at", null);

      const profileMap: Record<string, (typeof profiles extends Array<infer T> ? T : never)> = {};
      profiles?.forEach((p) => (profileMap[p.user_id] = p));

      const suspendedSet = new Set(suspensions?.map((s) => s.user_id) || []);

      const merged: FraudAlert[] = alertData.map((a) => ({
        ...a,
        details: (a.details as Record<string, unknown>) || {},
        display_name: profileMap[a.user_id]?.display_name ?? null,
        avatar_url: profileMap[a.user_id]?.avatar_url ?? null,
        handle: profileMap[a.user_id]?.handle ?? null,
        is_suspended: suspendedSet.has(a.user_id),
      }));

      setAlerts(merged);
    } catch (err) {
      console.error("Error fetching fraud alerts:", err);
      toast({ title: "Lỗi", description: "Không thể tải danh sách cảnh báo", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchPatterns = async () => {
    const { data } = await supabase
      .from("sybil_pattern_registry")
      .select("*")
      .order("created_at", { ascending: false });
    setPatterns(data || []);
  };

  useEffect(() => {
    fetchAlerts();
    fetchPatterns();
  }, []);

  const filtered = alerts.filter((a) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      (a.display_name?.toLowerCase().includes(q) ?? false) ||
      (a.handle?.toLowerCase().includes(q) ?? false) ||
      (a.matched_pattern?.toLowerCase().includes(q) ?? false) ||
      a.alert_type.toLowerCase().includes(q);

    const matchSeverity = severityFilter === "all" || a.severity === severityFilter;
    const matchReviewed =
      reviewedFilter === "all" ||
      (reviewedFilter === "unreviewed" && !a.is_reviewed) ||
      (reviewedFilter === "reviewed" && a.is_reviewed);

    return matchSearch && matchSeverity && matchReviewed;
  });

  const unreviewed = alerts.filter((a) => !a.is_reviewed).length;
  const critical = alerts.filter((a) => a.severity === "critical" && !a.is_reviewed).length;

  const handleBan = async () => {
    if (!banTarget || !session?.access_token) return;
    setBanning(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bulk-suspend-users`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userIds: [banTarget.user_id],
            reason: `Sybil farming - ${banTarget.alert_type}: ${banTarget.matched_pattern || "pattern detected"}`,
            rejectWithdrawals: true,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi ban tài khoản");

      toast({ title: "✅ Đã ban tài khoản và từ chối lệnh rút tiền" });
      setBanTarget(null);
      await fetchAlerts();
    } catch (err: unknown) {
      toast({ title: "Lỗi", description: err instanceof Error ? err.message : "Không thể ban", variant: "destructive" });
    } finally {
      setBanning(false);
    }
  };

  const handleIgnore = async (alert: FraudAlert) => {
    if (!session?.user?.id) return;
    try {
      await supabase
        .from("fraud_alerts")
        .update({
          is_reviewed: true,
          reviewed_by: session.user.id,
          reviewed_at: new Date().toISOString(),
          action_taken: "ignored",
        })
        .eq("id", alert.id);
      toast({ title: "Đã đánh dấu bỏ qua" });
      setIgnoreTarget(null);
      await fetchAlerts();
    } catch (err) {
      toast({ title: "Lỗi", variant: "destructive" });
    }
  };

  const handleTogglePattern = async (pattern: PatternEntry) => {
    await supabase
      .from("sybil_pattern_registry")
      .update({ is_active: !pattern.is_active })
      .eq("id", pattern.id);
    await fetchPatterns();
  };

  const fmt = (d: string) => new Date(d).toLocaleString("vi-VN");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 h-[73px] flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/dashboard")}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="relative">
            <Siren className="w-5 h-5 text-destructive" />
            {unreviewed > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                {unreviewed}
              </span>
            )}
          </div>
          <div>
            <h1 className="font-bold text-foreground leading-tight">🚨 Cảnh báo Gian lận</h1>
            <p className="text-xs text-muted-foreground">
              {unreviewed} chưa xem xét · {critical} nghiêm trọng
            </p>
          </div>
          <div className="ml-auto">
            <Button variant="outline" size="sm" onClick={() => { fetchAlerts(); fetchPatterns(); }}>
              <RefreshCw className="w-4 h-4 mr-1" /> Làm mới
            </Button>
          </div>
        </div>
      </div>

      <AdminNavToolbar />

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Tổng cảnh báo", value: alerts.length, color: "text-foreground" },
            { label: "Chưa xem xét", value: unreviewed, color: "text-amber-600 dark:text-amber-400" },
            { label: "Nghiêm trọng", value: critical, color: "text-destructive" },
            { label: "Đã xử lý", value: alerts.filter((a) => a.is_reviewed).length, color: "text-emerald-600 dark:text-emerald-400" },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <Button
            variant={activeTab === "alerts" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("alerts")}
          >
            <AlertTriangle className="w-4 h-4 mr-1" /> Cảnh báo
            {unreviewed > 0 && (
              <span className="ml-1.5 bg-destructive text-destructive-foreground text-[10px] rounded-full px-1.5 py-0.5">
                {unreviewed}
              </span>
            )}
          </Button>
          <Button
            variant={activeTab === "patterns" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("patterns")}
          >
            <Shield className="w-4 h-4 mr-1" /> Pattern Registry ({patterns.length})
          </Button>
        </div>

        {activeTab === "alerts" && (
          <>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm tên, handle, pattern..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Mức độ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả mức độ</SelectItem>
                  <SelectItem value="critical">Nghiêm trọng</SelectItem>
                  <SelectItem value="high">Cao</SelectItem>
                  <SelectItem value="medium">Trung bình</SelectItem>
                  <SelectItem value="low">Thấp</SelectItem>
                </SelectContent>
              </Select>
              <Select value={reviewedFilter} onValueChange={setReviewedFilter}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="unreviewed">Chưa xem xét</SelectItem>
                  <SelectItem value="reviewed">Đã xem xét</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Đang tải...</div>
            ) : (
              <div className="border border-border rounded-xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead>Tài khoản</TableHead>
                      <TableHead>Loại cảnh báo</TableHead>
                      <TableHead>Pattern khớp</TableHead>
                      <TableHead>Mức độ</TableHead>
                      <TableHead>Chi tiết</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Thời gian</TableHead>
                      <TableHead className="text-right">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                          Không có cảnh báo nào
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((alert) => (
                        <TableRow
                          key={alert.id}
                          className={
                            !alert.is_reviewed && alert.severity === "critical"
                              ? "bg-destructive/5 border-l-2 border-l-destructive"
                              : !alert.is_reviewed
                              ? "bg-amber-50/50 dark:bg-amber-950/10"
                              : "opacity-60"
                          }
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="w-7 h-7">
                                <AvatarImage src={alert.avatar_url || undefined} />
                                <AvatarFallback className="text-xs">
                                  {alert.display_name?.charAt(0) ?? "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm leading-tight">
                                  {alert.display_name || "Unknown"}
                                </p>
                                {alert.handle && (
                                  <p className="text-xs text-muted-foreground">@{alert.handle}</p>
                                )}
                                {alert.is_suspended && (
                                  <Badge variant="destructive" className="text-[10px] px-1 py-0 h-4">
                                    Đã ban
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-medium">
                              {ALERT_TYPE_MAP[alert.alert_type] || alert.alert_type}
                            </span>
                          </TableCell>
                          <TableCell>
                            {alert.matched_pattern ? (
                              <code className="bg-muted px-2 py-0.5 rounded text-xs font-mono">
                                {alert.matched_pattern}
                              </code>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                SEVERITY_MAP[alert.severity]?.className ||
                                "bg-muted text-muted-foreground"
                              }
                            >
                              {SEVERITY_MAP[alert.severity]?.label || alert.severity}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs text-muted-foreground max-w-[160px]">
                              {alert.details?.email && (
                                <p className="font-mono truncate">{String(alert.details.email)}</p>
                              )}
                              {alert.details?.message && (
                                <p className="truncate">{String(alert.details.message)}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {alert.is_reviewed ? (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                {alert.action_taken === "banned" ? "Đã ban" : "Bỏ qua"}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                                <Clock className="w-3.5 h-3.5" />
                                Chờ xử lý
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-muted-foreground">
                              {fmt(alert.created_at)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            {!alert.is_reviewed && !alert.is_suspended && (
                              <div className="flex justify-end gap-1.5">
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => setBanTarget(alert)}
                                >
                                  <Ban className="w-3 h-3 mr-1" /> Ban
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => handleIgnore(alert)}
                                >
                                  <Eye className="w-3 h-3 mr-1" /> Bỏ qua
                                </Button>
                              </div>
                            )}
                            {!alert.is_reviewed && alert.is_suspended && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs"
                                onClick={() => handleIgnore(alert)}
                              >
                                <CheckCircle className="w-3 h-3 mr-1" /> Đóng
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}

        {activeTab === "patterns" && (
          <div className="border border-border rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Loại</TableHead>
                  <TableHead>Giá trị</TableHead>
                  <TableHead>Mức độ</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead>Ngày thêm</TableHead>
                  <TableHead className="text-right">Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patterns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      Không có pattern nào
                    </TableCell>
                  </TableRow>
                ) : (
                  patterns.map((p) => (
                    <TableRow key={p.id} className={!p.is_active ? "opacity-50" : ""}>
                      <TableCell>
                        <Badge variant="outline" className="text-xs font-mono">
                          {p.pattern_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <code className="bg-muted px-2 py-0.5 rounded text-sm font-mono font-bold">
                          {p.pattern_value}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            SEVERITY_MAP[p.severity]?.className || "bg-muted text-muted-foreground"
                          }
                        >
                          {SEVERITY_MAP[p.severity]?.label || p.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">{p.description}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">{fmt(p.created_at)}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant={p.is_active ? "outline" : "secondary"}
                          className="h-7 px-2 text-xs"
                          onClick={() => handleTogglePattern(p)}
                        >
                          {p.is_active ? "Tắt" : "Bật"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Ban Dialog */}
      <Dialog open={!!banTarget} onOpenChange={(o) => !o && setBanTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Ban className="w-5 h-5" /> Ban vĩnh viễn tài khoản
            </DialogTitle>
            <DialogDescription>
              Ban tài khoản <strong>{banTarget?.display_name}</strong> và từ chối tất cả lệnh rút tiền đang chờ.
              <br />
              Lý do: <strong>{banTarget?.alert_type}</strong> — pattern{" "}
              <code>{banTarget?.matched_pattern}</code>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanTarget(null)} disabled={banning}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleBan} disabled={banning}>
              {banning ? "Đang xử lý..." : "Xác nhận Ban"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminFraudAlerts;
