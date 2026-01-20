import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle, XCircle, Clock, Wallet, RefreshCw, Search, Filter, AlertTriangle, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import angelAvatar from "@/assets/angel-avatar.png";

interface Withdrawal {
  id: string;
  user_id: string;
  wallet_address: string;
  amount: number;
  status: string;
  tx_hash: string | null;
  admin_notes: string | null;
  created_at: string;
  processed_at: string | null;
  processed_by: string | null;
  user_email?: string;
}

interface WithdrawalStats {
  total_pending: number;
  total_processing: number;
  total_completed: number;
  total_failed: number;
  total_amount_pending: number;
  total_amount_completed: number;
}

const AdminWithdrawals = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading: authLoading, isAdminChecked } = useAuth();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [stats, setStats] = useState<WithdrawalStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Dialog states
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [txHash, setTxHash] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!authLoading && isAdminChecked) {
      if (!user) {
        navigate("/admin/login");
      } else if (!isAdmin) {
        toast.error("Bạn không có quyền truy cập trang này");
        navigate("/");
      } else {
        fetchWithdrawals();
        fetchStats();
      }
    }
  }, [user, isAdmin, authLoading, isAdminChecked, navigate]);

  const fetchWithdrawals = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("coin_withdrawals")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch user emails
      const userIds = [...new Set(data?.map(w => w.user_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.display_name]) || []);
      
      const withdrawalsWithEmail = data?.map(w => ({
        ...w,
        user_email: profileMap.get(w.user_id) || w.user_id.slice(0, 8) + "..."
      })) || [];

      setWithdrawals(withdrawalsWithEmail);
    } catch (error) {
      console.error("Error fetching withdrawals:", error);
      toast.error("Không thể tải danh sách yêu cầu rút");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from("coin_withdrawals")
        .select("status, amount");

      if (error) throw error;

      const stats: WithdrawalStats = {
        total_pending: 0,
        total_processing: 0,
        total_completed: 0,
        total_failed: 0,
        total_amount_pending: 0,
        total_amount_completed: 0,
      };

      data?.forEach(w => {
        switch (w.status) {
          case "pending":
            stats.total_pending++;
            stats.total_amount_pending += w.amount;
            break;
          case "processing":
            stats.total_processing++;
            stats.total_amount_pending += w.amount;
            break;
          case "completed":
            stats.total_completed++;
            stats.total_amount_completed += w.amount;
            break;
          case "failed":
            stats.total_failed++;
            break;
        }
      });

      setStats(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleApprove = async () => {
    if (!selectedWithdrawal || !txHash.trim()) {
      toast.error("Vui lòng nhập Transaction Hash");
      return;
    }

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("coin_withdrawals")
        .update({
          status: "completed",
          tx_hash: txHash.trim(),
          admin_notes: adminNotes.trim() || null,
          processed_at: new Date().toISOString(),
          processed_by: user?.id,
        })
        .eq("id", selectedWithdrawal.id);

      if (error) throw error;

      toast.success("Đã duyệt yêu cầu rút thành công!");
      setSelectedWithdrawal(null);
      setActionType(null);
      setTxHash("");
      setAdminNotes("");
      fetchWithdrawals();
      fetchStats();
    } catch (error) {
      console.error("Error approving withdrawal:", error);
      toast.error("Không thể duyệt yêu cầu rút");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedWithdrawal || !adminNotes.trim()) {
      toast.error("Vui lòng nhập lý do từ chối");
      return;
    }

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("coin_withdrawals")
        .update({
          status: "failed",
          admin_notes: adminNotes.trim(),
          processed_at: new Date().toISOString(),
          processed_by: user?.id,
        })
        .eq("id", selectedWithdrawal.id);

      if (error) throw error;

      toast.success("Đã từ chối yêu cầu rút");
      setSelectedWithdrawal(null);
      setActionType(null);
      setAdminNotes("");
      fetchWithdrawals();
      fetchStats();
    } catch (error) {
      console.error("Error rejecting withdrawal:", error);
      toast.error("Không thể từ chối yêu cầu rút");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSetProcessing = async (withdrawal: Withdrawal) => {
    try {
      const { error } = await supabase
        .from("coin_withdrawals")
        .update({ status: "processing" })
        .eq("id", withdrawal.id);

      if (error) throw error;

      toast.success("Đã chuyển sang trạng thái đang xử lý");
      fetchWithdrawals();
      fetchStats();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Không thể cập nhật trạng thái");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200"><Clock className="w-3 h-3 mr-1" /> Chờ duyệt</Badge>;
      case "processing":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Đang xử lý</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" /> Hoàn thành</Badge>;
      case "failed":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1" /> Từ chối</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredWithdrawals = withdrawals.filter(w => {
    const matchesStatus = statusFilter === "all" || w.status === statusFilter;
    const matchesSearch = searchQuery === "" || 
      w.wallet_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAmount = (amount: number) => {
    return Math.floor(amount).toLocaleString("vi-VN");
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-pale via-background to-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-pale via-background to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-primary-pale/30 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin/dashboard" className="p-2 rounded-full hover:bg-primary-pale transition-colors">
              <ArrowLeft className="w-5 h-5 text-primary" />
            </Link>
            <div className="flex items-center gap-3">
              <img src={angelAvatar} alt="Angel AI" className="w-10 h-10 rounded-full shadow-soft" />
              <div>
                <h1 className="font-serif text-lg font-semibold text-primary-deep">Quản lý Rút Coin</h1>
                <p className="text-xs text-foreground-muted">Duyệt yêu cầu rút Camly Coin</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/admin/activity-history"
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-full text-sm text-foreground-muted hover:text-primary hover:bg-primary/10 transition-colors"
            >
              <History className="w-4 h-4" />
              Lịch sử chat
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { fetchWithdrawals(); fetchStats(); }}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Làm mới
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 shadow-soft border border-amber-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-700">{stats.total_pending}</p>
                  <p className="text-xs text-foreground-muted">Chờ duyệt</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-soft border border-blue-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-700">{stats.total_processing}</p>
                  <p className="text-xs text-foreground-muted">Đang xử lý</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-soft border border-green-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-700">{stats.total_completed}</p>
                  <p className="text-xs text-foreground-muted">Hoàn thành</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-soft border border-red-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-700">{stats.total_failed}</p>
                  <p className="text-xs text-foreground-muted">Từ chối</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Amount Summary */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground-muted">Tổng đang chờ xử lý</p>
                  <p className="text-2xl font-bold text-amber-700">{formatAmount(stats.total_amount_pending)} CAMLY</p>
                </div>
                <Wallet className="w-10 h-10 text-amber-400" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground-muted">Tổng đã rút thành công</p>
                  <p className="text-2xl font-bold text-green-700">{formatAmount(stats.total_amount_completed)} CAMLY</p>
                </div>
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl p-4 shadow-soft border border-primary-pale/30">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
              <Input
                placeholder="Tìm theo địa chỉ ví, người dùng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-foreground-muted" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="pending">Chờ duyệt</SelectItem>
                  <SelectItem value="processing">Đang xử lý</SelectItem>
                  <SelectItem value="completed">Hoàn thành</SelectItem>
                  <SelectItem value="failed">Từ chối</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Withdrawals Table */}
        <div className="bg-white rounded-2xl shadow-soft border border-primary-pale/30 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary-pale/30">
                <TableHead className="font-semibold">Thời gian</TableHead>
                <TableHead className="font-semibold">Người dùng</TableHead>
                <TableHead className="font-semibold">Số lượng</TableHead>
                <TableHead className="font-semibold">Địa chỉ ví</TableHead>
                <TableHead className="font-semibold">Trạng thái</TableHead>
                <TableHead className="font-semibold text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWithdrawals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-foreground-muted">
                    Không có yêu cầu rút nào
                  </TableCell>
                </TableRow>
              ) : (
                filteredWithdrawals.map((withdrawal) => (
                  <TableRow key={withdrawal.id} className="hover:bg-primary-pale/10">
                    <TableCell className="text-sm">
                      {formatDate(withdrawal.created_at)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {withdrawal.user_email}
                    </TableCell>
                    <TableCell className="font-bold text-primary-deep">
                      {formatAmount(withdrawal.amount)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {withdrawal.wallet_address.slice(0, 6)}...{withdrawal.wallet_address.slice(-4)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(withdrawal.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      {withdrawal.status === "pending" && (
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSetProcessing(withdrawal)}
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedWithdrawal(withdrawal);
                              setActionType("approve");
                            }}
                            className="text-green-600 border-green-200 hover:bg-green-50"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedWithdrawal(withdrawal);
                              setActionType("reject");
                            }}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                      {withdrawal.status === "processing" && (
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedWithdrawal(withdrawal);
                              setActionType("approve");
                            }}
                            className="text-green-600 border-green-200 hover:bg-green-50"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedWithdrawal(withdrawal);
                              setActionType("reject");
                            }}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                      {withdrawal.status === "completed" && withdrawal.tx_hash && (
                        <a
                          href={`https://bscscan.com/tx/${withdrawal.tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          Xem TX
                        </a>
                      )}
                      {withdrawal.status === "failed" && withdrawal.admin_notes && (
                        <span className="text-xs text-red-500" title={withdrawal.admin_notes}>
                          <AlertTriangle className="w-4 h-4 inline" />
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </main>

      {/* Approve Dialog */}
      <Dialog open={actionType === "approve"} onOpenChange={() => { setActionType(null); setSelectedWithdrawal(null); setTxHash(""); setAdminNotes(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-5 h-5" />
              Duyệt yêu cầu rút
            </DialogTitle>
            <DialogDescription>
              Xác nhận đã chuyển {formatAmount(selectedWithdrawal?.amount || 0)} CAMLY về ví {selectedWithdrawal?.wallet_address.slice(0, 10)}...
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Transaction Hash *</label>
              <Input
                placeholder="0x..."
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Ghi chú (tùy chọn)</label>
              <Textarea
                placeholder="Ghi chú cho admin..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setActionType(null); setSelectedWithdrawal(null); }}>
              Hủy
            </Button>
            <Button 
              onClick={handleApprove} 
              disabled={isProcessing || !txHash.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? "Đang xử lý..." : "Xác nhận duyệt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={actionType === "reject"} onOpenChange={() => { setActionType(null); setSelectedWithdrawal(null); setAdminNotes(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <XCircle className="w-5 h-5" />
              Từ chối yêu cầu rút
            </DialogTitle>
            <DialogDescription>
              Từ chối yêu cầu rút {formatAmount(selectedWithdrawal?.amount || 0)} CAMLY. Số coin sẽ được hoàn lại cho người dùng.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Lý do từ chối *</label>
              <Textarea
                placeholder="Nhập lý do từ chối..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setActionType(null); setSelectedWithdrawal(null); }}>
              Hủy
            </Button>
            <Button 
              onClick={handleReject} 
              disabled={isProcessing || !adminNotes.trim()}
              variant="destructive"
            >
              {isProcessing ? "Đang xử lý..." : "Xác nhận từ chối"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminWithdrawals;
