import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle, XCircle, Clock, Wallet, RefreshCw, Search, Filter, AlertTriangle, History, Bell, Copy, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { TreasuryBalanceCard } from "@/components/admin/TreasuryBalanceCard";
import { useNewWithdrawalNotification } from "@/components/admin/NewWithdrawalNotification";
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
  retry_count?: number;
  error_message?: string | null;
  user_email?: string;
  // Anti-fraud fields
  lifetime_earned?: number;
  chat_count?: number;
  coins_per_chat?: number;
  is_suspicious?: boolean;
  suspicious_reasons?: string[];
}

interface WithdrawalStats {
  total_pending: number;
  total_processing: number;
  total_completed: number;
  total_failed: number;
  total_amount_pending: number;
  total_amount_completed: number;
}

interface BatchProgress {
  current: number;
  total: number;
  success: number;
  failed: number;
  currentWallet?: string;
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
  
  // Batch selection states
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState<BatchProgress>({ current: 0, total: 0, success: 0, failed: 0 });
  const [showBatchApproveDialog, setShowBatchApproveDialog] = useState(false);
  const [showBatchRejectDialog, setShowBatchRejectDialog] = useState(false);
  const [batchRejectReason, setBatchRejectReason] = useState("");
  
  // Real-time withdrawal notifications
  const { newWithdrawals } = useNewWithdrawalNotification();
  
  // Auto-refresh when new withdrawals come in
  useEffect(() => {
    if (newWithdrawals.length > 0) {
      fetchWithdrawals();
      fetchStats();
    }
  }, [newWithdrawals]);

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

      // Fetch user emails and names
      const userIds = [...new Set(data?.map(w => w.user_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);

      // Fetch balance data for anti-fraud detection
      const { data: balances } = await supabase
        .from("camly_coin_balances")
        .select("user_id, lifetime_earned")
        .in("user_id", userIds);

      // Fetch chat count for each user
      const { data: chatCounts } = await supabase
        .from("chat_history")
        .select("user_id")
        .in("user_id", userIds);

      // Count chats per user
      const chatCountMap = new Map<string, number>();
      chatCounts?.forEach(c => {
        chatCountMap.set(c.user_id, (chatCountMap.get(c.user_id) || 0) + 1);
      });

      // Find duplicate wallets
      const walletUserMap = new Map<string, string[]>();
      data?.forEach(w => {
        const users = walletUserMap.get(w.wallet_address) || [];
        if (!users.includes(w.user_id)) {
          users.push(w.user_id);
        }
        walletUserMap.set(w.wallet_address, users);
      });

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.display_name]) || []);
      const balanceMap = new Map(balances?.map(b => [b.user_id, b.lifetime_earned]) || []);
      
      const withdrawalsWithData = data?.map(w => {
        const lifetimeEarned = balanceMap.get(w.user_id) || 0;
        const chatCount = chatCountMap.get(w.user_id) || 0;
        const coinsPerChat = chatCount > 0 ? lifetimeEarned / chatCount : 0;
        const walletUsers = walletUserMap.get(w.wallet_address) || [];
        const isDuplicateWallet = walletUsers.length > 1;
        
        // Determine suspicious status
        const suspiciousReasons: string[] = [];
        if (coinsPerChat > 6000) {
          suspiciousReasons.push(`Coins/Chat cao bất thường: ${Math.round(coinsPerChat).toLocaleString()}`);
        }
        if (isDuplicateWallet) {
          suspiciousReasons.push(`Ví dùng chung bởi ${walletUsers.length} users`);
        }
        if (chatCount > 0 && chatCount < 5 && lifetimeEarned > 50000) {
          suspiciousReasons.push(`Ít chat (${chatCount}) nhưng kiếm nhiều (${lifetimeEarned.toLocaleString()})`);
        }

        return {
          ...w,
          user_email: profileMap.get(w.user_id) || w.user_id.slice(0, 8) + "...",
          lifetime_earned: lifetimeEarned,
          chat_count: chatCount,
          coins_per_chat: coinsPerChat,
          is_suspicious: suspiciousReasons.length > 0,
          suspicious_reasons: suspiciousReasons,
        };
      }) || [];

      setWithdrawals(withdrawalsWithData);
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

  // Get selectable withdrawals (pending or processing)
  const selectableWithdrawals = withdrawals.filter(w => 
    w.status === "pending" || w.status === "processing"
  );

  // Toggle single selection
  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Toggle all selection
  const toggleSelectAll = () => {
    if (selectedIds.size === selectableWithdrawals.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableWithdrawals.map(w => w.id)));
    }
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // Get selected withdrawals
  const getSelectedWithdrawals = () => {
    return withdrawals.filter(w => selectedIds.has(w.id) && (w.status === "pending" || w.status === "processing"));
  };

  // Calculate total amount of selected
  const selectedTotalAmount = getSelectedWithdrawals().reduce((sum, w) => sum + w.amount, 0);

  // Batch approve handler
  const handleBatchApprove = async () => {
    const selectedWithdrawals = getSelectedWithdrawals();
    if (selectedWithdrawals.length === 0) return;

    setIsBatchProcessing(true);
    setBatchProgress({ current: 0, total: selectedWithdrawals.length, success: 0, failed: 0 });

    for (const withdrawal of selectedWithdrawals) {
      setBatchProgress(prev => ({ ...prev, currentWallet: withdrawal.wallet_address }));
      
      try {
        const { data, error } = await supabase.functions.invoke('process-withdrawal', {
          body: { withdrawal_id: withdrawal.id }
        });

        if (error || !data?.success) {
          setBatchProgress(prev => ({ 
            ...prev, 
            current: prev.current + 1, 
            failed: prev.failed + 1 
          }));
        } else {
          setBatchProgress(prev => ({ 
            ...prev, 
            current: prev.current + 1, 
            success: prev.success + 1 
          }));
        }
      } catch (error) {
        setBatchProgress(prev => ({ 
          ...prev, 
          current: prev.current + 1, 
          failed: prev.failed + 1 
        }));
      }
    }

    // Finish batch processing
    setTimeout(() => {
      setIsBatchProcessing(false);
      setShowBatchApproveDialog(false);
      setSelectedIds(new Set());
      fetchWithdrawals();
      fetchStats();
      
      const finalProgress = batchProgress;
      toast.success(`Hoàn thành xử lý hàng loạt`, {
        description: `Thành công: ${batchProgress.success + 1}, Thất bại: ${batchProgress.failed}`
      });
    }, 500);
  };

  // Batch reject handler
  const handleBatchReject = async () => {
    const selectedWithdrawals = getSelectedWithdrawals();
    if (selectedWithdrawals.length === 0 || !batchRejectReason.trim()) return;

    setIsBatchProcessing(true);
    setBatchProgress({ current: 0, total: selectedWithdrawals.length, success: 0, failed: 0 });

    for (const withdrawal of selectedWithdrawals) {
      try {
        const { error } = await supabase
          .from("coin_withdrawals")
          .update({
            status: "failed",
            admin_notes: batchRejectReason.trim(),
            processed_at: new Date().toISOString(),
            processed_by: user?.id,
          })
          .eq("id", withdrawal.id);

        if (error) {
          setBatchProgress(prev => ({ ...prev, current: prev.current + 1, failed: prev.failed + 1 }));
        } else {
          setBatchProgress(prev => ({ ...prev, current: prev.current + 1, success: prev.success + 1 }));
        }
      } catch (error) {
        setBatchProgress(prev => ({ ...prev, current: prev.current + 1, failed: prev.failed + 1 }));
      }
    }

    // Finish batch processing
    setTimeout(() => {
      setIsBatchProcessing(false);
      setShowBatchRejectDialog(false);
      setBatchRejectReason("");
      setSelectedIds(new Set());
      fetchWithdrawals();
      fetchStats();
      toast.success(`Đã từ chối ${batchProgress.success + 1} yêu cầu rút`);
    }, 500);
  };

  const handleApprove = async () => {
    if (!selectedWithdrawal) {
      toast.error("Vui lòng chọn yêu cầu rút");
      return;
    }

    setIsProcessing(true);
    try {
      // Call the process-withdrawal edge function
      const { data, error } = await supabase.functions.invoke('process-withdrawal', {
        body: { withdrawal_id: selectedWithdrawal.id }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`Đã chuyển ${selectedWithdrawal.amount.toLocaleString()} CAMLY thành công!`, {
          description: `TX: ${data.tx_hash?.slice(0, 20)}...`
        });
      } else {
        throw new Error(data?.error || 'Unknown error');
      }

      setSelectedWithdrawal(null);
      setActionType(null);
      setTxHash("");
      setAdminNotes("");
      fetchWithdrawals();
      fetchStats();
    } catch (error: unknown) {
      console.error("Error approving withdrawal:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error("Lỗi xử lý rút tiền", {
        description: errorMessage
      });
      // Refresh to show updated status
      fetchWithdrawals();
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

  const getStatusBadge = (status: string, retryCount?: number) => {
    switch (status) {
      case "pending":
        return (
          <div className="flex flex-col gap-1">
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              <Clock className="w-3 h-3 mr-1" /> Chờ duyệt
            </Badge>
            {retryCount && retryCount > 0 && (
              <span className="text-xs text-amber-600">Retry: {retryCount}/3</span>
            )}
          </div>
        );
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

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6 pb-24">
        {/* Treasury Balance Card */}
        <TreasuryBalanceCard />
        
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
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectableWithdrawals.length > 0 && selectedIds.size === selectableWithdrawals.length}
                    onCheckedChange={toggleSelectAll}
                    disabled={selectableWithdrawals.length === 0}
                  />
                </TableHead>
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
                  <TableCell colSpan={7} className="text-center py-8 text-foreground-muted">
                    Không có yêu cầu rút nào
                  </TableCell>
                </TableRow>
              ) : (
                filteredWithdrawals.map((withdrawal) => (
                  <TableRow 
                    key={withdrawal.id} 
                    className={`hover:bg-primary-pale/10 ${selectedIds.has(withdrawal.id) ? 'bg-primary-pale/20' : ''} ${withdrawal.is_suspicious ? 'bg-red-50/50' : ''}`}
                  >
                    <TableCell>
                      {(withdrawal.status === "pending" || withdrawal.status === "processing") && (
                        <Checkbox
                          checked={selectedIds.has(withdrawal.id)}
                          onCheckedChange={() => toggleSelection(withdrawal.id)}
                        />
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(withdrawal.created_at)}
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex flex-col gap-1">
                        <span>{withdrawal.user_email}</span>
                        {withdrawal.is_suspicious && (
                          <div className="flex flex-col gap-0.5">
                            {withdrawal.suspicious_reasons?.map((reason, idx) => (
                              <span key={idx} className="text-xs text-red-600 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                {reason}
                              </span>
                            ))}
                          </div>
                        )}
                        {withdrawal.chat_count !== undefined && (
                          <span className="text-xs text-foreground-muted">
                            {withdrawal.chat_count} chats | {withdrawal.coins_per_chat ? Math.round(withdrawal.coins_per_chat).toLocaleString() : 0}/chat
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-primary-deep">
                      {formatAmount(withdrawal.amount)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      <div className="flex items-center gap-1">
                        <span>{withdrawal.wallet_address.slice(0, 6)}...{withdrawal.wallet_address.slice(-4)}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(withdrawal.wallet_address);
                            toast.success("Đã sao chép địa chỉ ví");
                          }}
                          className="p-1 rounded hover:bg-primary-pale/50 transition-colors"
                          title="Copy địa chỉ ví"
                        >
                          <Copy className="w-3.5 h-3.5 text-foreground-muted hover:text-primary" />
                        </button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {getStatusBadge(withdrawal.status, withdrawal.retry_count)}
                        {withdrawal.is_suspicious && withdrawal.status === "pending" && (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                            ⚠️ Cần kiểm tra
                          </Badge>
                        )}
                      </div>
                      {withdrawal.error_message && (
                        <p className="text-xs text-red-500 mt-1 max-w-[200px] truncate" title={withdrawal.error_message}>
                          {withdrawal.error_message}
                        </p>
                      )}
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

      {/* Batch Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Checkbox checked={true} disabled />
                <span className="font-medium">Đã chọn: {selectedIds.size} yêu cầu</span>
              </div>
              <div className="text-sm text-foreground-muted">
                Tổng: <span className="font-bold text-primary">{formatAmount(selectedTotalAmount)} CAMLY</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearSelection}
                className="gap-1"
              >
                <X className="w-4 h-4" />
                Bỏ chọn
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowBatchRejectDialog(true)}
                className="gap-1"
              >
                <XCircle className="w-4 h-4" />
                Từ chối tất cả
              </Button>
              <Button
                size="sm"
                onClick={() => setShowBatchApproveDialog(true)}
                className="gap-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4" />
                Duyệt tất cả
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Approve Dialog */}
      <Dialog open={showBatchApproveDialog} onOpenChange={(open) => !isBatchProcessing && setShowBatchApproveDialog(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-5 h-5" />
              Duyệt hàng loạt
            </DialogTitle>
            <DialogDescription>
              Bạn sắp duyệt <span className="font-bold">{selectedIds.size}</span> yêu cầu rút với tổng cộng <span className="font-bold">{formatAmount(selectedTotalAmount)} CAMLY</span>
            </DialogDescription>
          </DialogHeader>
          
          {isBatchProcessing ? (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between text-sm">
                <span>Tiến độ: {batchProgress.current}/{batchProgress.total}</span>
                <span className="text-green-600">✓ {batchProgress.success} | ✕ {batchProgress.failed}</span>
              </div>
              <Progress value={(batchProgress.current / batchProgress.total) * 100} className="h-3" />
              {batchProgress.currentWallet && (
                <p className="text-xs text-foreground-muted text-center">
                  Đang xử lý: {batchProgress.currentWallet.slice(0, 10)}...{batchProgress.currentWallet.slice(-6)}
                </p>
              )}
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 my-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800">Lưu ý quan trọng</p>
                  <p className="text-amber-700 mt-1">
                    Hệ thống sẽ tuần tự xử lý từng yêu cầu rút và chuyển CAMLY từ ví Treasury. 
                    Quá trình này không thể hủy sau khi bắt đầu.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowBatchApproveDialog(false)}
              disabled={isBatchProcessing}
            >
              Hủy
            </Button>
            <Button 
              onClick={handleBatchApprove} 
              disabled={isBatchProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isBatchProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Xác nhận duyệt tất cả"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Reject Dialog */}
      <Dialog open={showBatchRejectDialog} onOpenChange={(open) => !isBatchProcessing && setShowBatchRejectDialog(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <XCircle className="w-5 h-5" />
              Từ chối hàng loạt
            </DialogTitle>
            <DialogDescription>
              Từ chối <span className="font-bold">{selectedIds.size}</span> yêu cầu rút. Số coin sẽ được hoàn lại cho người dùng.
            </DialogDescription>
          </DialogHeader>
          
          {isBatchProcessing ? (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between text-sm">
                <span>Tiến độ: {batchProgress.current}/{batchProgress.total}</span>
              </div>
              <Progress value={(batchProgress.current / batchProgress.total) * 100} className="h-3" />
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Lý do từ chối (áp dụng cho tất cả) *</label>
                <Textarea
                  placeholder="Nhập lý do từ chối..."
                  value={batchRejectReason}
                  onChange={(e) => setBatchRejectReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowBatchRejectDialog(false)}
              disabled={isBatchProcessing}
            >
              Hủy
            </Button>
            <Button 
              onClick={handleBatchReject} 
              disabled={isBatchProcessing || !batchRejectReason.trim()}
              variant="destructive"
            >
              {isBatchProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Xác nhận từ chối tất cả"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog - Automated */}
      <Dialog open={actionType === "approve"} onOpenChange={() => { setActionType(null); setSelectedWithdrawal(null); setTxHash(""); setAdminNotes(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-5 h-5" />
              Phê duyệt & Chuyển tự động
            </DialogTitle>
            <DialogDescription>
              Hệ thống sẽ tự động chuyển <span className="font-bold">{formatAmount(selectedWithdrawal?.amount || 0)} CAMLY</span> về ví:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-primary-pale/30 rounded-xl p-4">
              <p className="text-xs text-foreground-muted mb-1">Địa chỉ ví nhận</p>
              <p className="font-mono text-sm break-all">{selectedWithdrawal?.wallet_address}</p>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800">Lưu ý quan trọng</p>
                  <p className="text-amber-700 mt-1">
                    Sau khi bấm xác nhận, hệ thống sẽ tự động chuyển CAMLY từ ví Treasury về ví người dùng thông qua blockchain BSC.
                  </p>
                </div>
              </div>
            </div>

            {selectedWithdrawal?.retry_count && selectedWithdrawal.retry_count > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-sm text-red-700">
                  ⚠️ Đây là lần thử thứ {selectedWithdrawal.retry_count + 1}/3
                </p>
                {selectedWithdrawal.error_message && (
                  <p className="text-xs text-red-600 mt-1">
                    Lỗi trước: {selectedWithdrawal.error_message}
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setActionType(null); setSelectedWithdrawal(null); }}>
              Hủy
            </Button>
            <Button 
              onClick={handleApprove} 
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Đang chuyển...
                </>
              ) : (
                "Xác nhận & Chuyển tự động"
              )}
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
