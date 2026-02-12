import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import {
  ArrowLeft, Sparkles, LogOut, Search, Download,
  Coins, Users, ArrowUpDown, Star, Gift, CheckCircle2, XCircle, Clock, ExternalLink,
  Wallet, RefreshCw, Filter
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import angelAvatar from "@/assets/angel-avatar.png";
import ExcelJS from "exceljs";
import { LiXiCelebrationDialog } from "@/components/admin/LiXiCelebrationDialog";
import AdminNavToolbar from "@/components/admin/AdminNavToolbar";
import { useLixiClaims } from "@/hooks/useLixiClaims";
import {
  tetRewardData, TET_REWARD_SNAPSHOT_DATE, CAMLY_MULTIPLIER,
  type TetRewardUser,
} from "@/data/tetRewardData";

// ─── Constants ───────────────────────────────────────────────
const ACTION_COLS = [
  { key: "question" as const, icon: "💬", short: "Hỏi", label: "Hỏi đáp" },
  { key: "post" as const, icon: "📢", short: "Bài", label: "Đăng bài" },
  { key: "gratitude" as const, icon: "🙏", short: "Ơn", label: "Biết ơn" },
  { key: "content" as const, icon: "✍️", short: "N.dung", label: "Tạo nội dung" },
  { key: "journal" as const, icon: "📝", short: "N.ký", label: "Nhật ký" },
  { key: "learn" as const, icon: "📚", short: "Học", label: "Học tập" },
];

type SortKey = "name" | "question" | "post" | "gratitude" | "content" | "journal" | "learn" | "totalFun" | "pass" | "avgLightScore";

interface DistributionResult {
  status: "success" | "skipped" | "failed";
  txId?: string;
  camlyAmount?: number;
  reason?: string;
  createdAt?: string;
}

// ─── Component ───────────────────────────────────────────────
const AdminTetReward = () => {
  const { user, isAdmin, isLoading: authLoading, isAdminChecked, signOut } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("totalFun");
  const [sortAsc, setSortAsc] = useState(false);
  const [activeTab, setActiveTab] = useState("snapshot");
  const [claimFilter, setClaimFilter] = useState<"all" | "completed" | "failed" | "pending" | "unclaimed">("all");

  // Real-time tab state
  const [rtData, setRtData] = useState<any[]>([]);
  const [rtLoading, setRtLoading] = useState(false);
  const [rtSearch, setRtSearch] = useState("");
  const [rtSortKey, setRtSortKey] = useState<"total_fun_scored" | "camly_balance" | "total_withdrawn" | "light_score" | "display_name">("total_fun_scored");
  const [rtSortAsc, setRtSortAsc] = useState(false);
  const [rtLastUpdated, setRtLastUpdated] = useState<Date | null>(null);

  // Lì xì state
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [isDistributing, setIsDistributing] = useState(false);
  const [distributionProgress, setDistributionProgress] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [lastDistributionResult, setLastDistributionResult] = useState<{
    totalCamly: number;
    totalFun: number;
    successCount: number;
  } | null>(null);

  // Distribution results per user (keyed by display_name)
  const [distributionResults, setDistributionResults] = useState<Map<string, DistributionResult>>(new Map());

  // Name to userId mapping for claim lookup + wallet addresses
  const [nameToUserIdMap, setNameToUserIdMap] = useState<Map<string, string>>(new Map());
  const [userWalletMap, setUserWalletMap] = useState<Map<string, string>>(new Map());

  // Lixi claims hook
  const { claims: lixiClaims, updateClaimStatus } = useLixiClaims();

  // Auth guard
  useEffect(() => {
    if (!authLoading && isAdminChecked) {
      if (!user) navigate("/admin/login");
      else if (!isAdmin) {
        toast.error("Bạn không có quyền truy cập trang này");
        navigate("/");
      }
    }
  }, [user, isAdmin, authLoading, isAdminChecked, navigate]);

  // Load existing distribution records
  useEffect(() => {
    const loadDistributionStatus = async () => {
      try {
        const { data, error } = await supabase
          .from("camly_coin_transactions")
          .select("id, user_id, amount, created_at, metadata")
          .eq("transaction_type", "admin_adjustment");

        if (error) {
          console.error("Lỗi tải trạng thái phân phối:", error);
          return;
        }

        // Filter for fun_to_camly_reward source
        const rewardTxs = (data || []).filter((tx: any) => {
          const meta = tx.metadata;
          return meta && typeof meta === "object" && meta.source === "fun_to_camly_reward";
        });

        if (rewardTxs.length === 0) return;

        // Get user_ids to fetch display_names
        const userIds = [...new Set(rewardTxs.map((tx: any) => tx.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", userIds);

        const userIdToName = new Map<string, string>();
        const nameToId = new Map<string, string>();
        for (const p of profiles || []) {
          if (p.display_name) {
            userIdToName.set(p.user_id, p.display_name);
            nameToId.set(p.display_name, p.user_id);
          }
        }
        setNameToUserIdMap(prev => {
          const merged = new Map(prev);
          nameToId.forEach((v, k) => merged.set(k, v));
          return merged;
        });

        const results = new Map<string, DistributionResult>();
        for (const tx of rewardTxs) {
          const name = userIdToName.get(tx.user_id);
          if (name) {
            results.set(name, {
              status: "success",
              txId: tx.id,
              camlyAmount: tx.amount,
              createdAt: tx.created_at,
            });
          }
        }

        setDistributionResults(results);
      } catch (err) {
        console.error("Lỗi tải trạng thái Lì xì:", err);
      }
    };

    loadDistributionStatus();
  }, []);

  // Fetch wallet addresses for ALL snapshot users
  useEffect(() => {
    const loadWallets = async () => {
      try {
        // Get all display_names from snapshot data
        const allNames = tetRewardData.map(u => u.name);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("display_name", allNames);

        if (!profiles || profiles.length === 0) return;

        const nameToId = new Map<string, string>();
        for (const p of profiles) {
          if (p.display_name) nameToId.set(p.display_name, p.user_id);
        }

        // Merge into existing nameToUserIdMap
        setNameToUserIdMap(prev => {
          const merged = new Map(prev);
          nameToId.forEach((v, k) => merged.set(k, v));
          return merged;
        });

        const userIds = [...new Set(profiles.map(p => p.user_id))];
        const { data: wallets } = await supabase
          .from("user_wallet_addresses")
          .select("user_id, wallet_address")
          .in("user_id", userIds);

        const walletMap = new Map<string, string>();
        for (const w of wallets || []) {
          const name = [...nameToId.entries()].find(([, id]) => id === w.user_id)?.[0];
          if (name) walletMap.set(name, w.wallet_address);
        }
        setUserWalletMap(walletMap);
      } catch (err) {
        console.error("Lỗi tải wallet addresses:", err);
      }
    };
    loadWallets();
  }, []);

  // ─── Overview stats ────────────────────────────────────────
  const overview = useMemo(() => {
    const eligible = tetRewardData.filter(u => u.totalFun > 0);
    const totalFun = tetRewardData.reduce((s, u) => s + u.totalFun, 0);
    const avgLS = eligible.length > 0
      ? Math.round(eligible.reduce((s, u) => s + u.avgLightScore, 0) / eligible.length)
      : 0;
    return {
      totalFun,
      totalCamly: totalFun * CAMLY_MULTIPLIER,
      eligibleCount: eligible.length,
      avgLightScore: avgLS,
      totalUsers: tetRewardData.length,
    };
  }, []);

  // ─── Real-time data fetching (total FUN = sum of scored+pass from pplp) ────
  const fetchRealTimeData = useCallback(async () => {
    setRtLoading(true);
    try {
      // 1. Fetch all pplp_actions with scores (decision=pass) to get real total FUN per user
      let allActions: any[] = [];
      let from = 0;
      const PAGE = 1000;
      while (true) {
        const { data, error } = await supabase
          .from("pplp_actions")
          .select("actor_id, pplp_scores(final_reward, decision)")
          .range(from, from + PAGE - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        allActions = allActions.concat(data);
        if (data.length < PAGE) break;
        from += PAGE;
      }

      // Aggregate total FUN per user (only decision=pass)
      const funByUser = new Map<string, number>();
      allActions.forEach((a: any) => {
        const score = a.pplp_scores as { final_reward: number; decision: string } | null;
        if (!score || score.decision !== "pass") return;
        const prev = funByUser.get(a.actor_id) || 0;
        funByUser.set(a.actor_id, prev + (score.final_reward || 0));
      });

      // 2. Fetch profile + camly data from RPC
      const { data: mgmtData, error: mgmtError } = await supabase.rpc("get_admin_user_management_data");
      if (mgmtError) throw mgmtError;

      // 3. Merge: override fun_money_received with actual scored total
      const merged = (mgmtData || []).map((u: any) => ({
        ...u,
        total_fun_scored: funByUser.get(u.user_id) || 0,
      }));

      setRtData(merged);
      setRtLastUpdated(new Date());
    } catch (err) {
      console.error("Lỗi tải dữ liệu real-time:", err);
      toast.error("Lỗi khi tải dữ liệu hiện tại");
    } finally {
      setRtLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "realtime" && rtData.length === 0) {
      fetchRealTimeData();
    }
  }, [activeTab, fetchRealTimeData, rtData.length]);

  const rtOverview = useMemo(() => {
    const eligible = rtData.filter((u: any) => Number(u.total_fun_scored) > 0);
    const totalFun = rtData.reduce((s: number, u: any) => s + Number(u.total_fun_scored), 0);
    const totalCamlyBalance = rtData.reduce((s: number, u: any) => s + Number(u.camly_balance), 0);
    const totalWithdrawn = rtData.reduce((s: number, u: any) => s + Number(u.total_withdrawn), 0);
    const avgLS = eligible.length > 0
      ? Math.round(eligible.reduce((s: number, u: any) => s + Number(u.light_score), 0) / eligible.length)
      : 0;
    return { totalFun, totalCamly: totalFun * CAMLY_MULTIPLIER, eligibleCount: eligible.length, avgLightScore: avgLS, totalCamlyBalance, totalWithdrawn };
  }, [rtData]);

  const rtToggleSort = (key: typeof rtSortKey) => {
    if (rtSortKey === key) setRtSortAsc(!rtSortAsc);
    else { setRtSortKey(key); setRtSortAsc(false); }
  };

  const rtFilteredRows = useMemo(() => {
    let result = rtData.filter((u: any) => Number(u.total_fun_scored) > 0);
    if (rtSearch) {
      const q = rtSearch.toLowerCase();
      result = result.filter((u: any) => (u.display_name || "").toLowerCase().includes(q) || (u.handle || "").toLowerCase().includes(q));
    }
    result = [...result].sort((a: any, b: any) => {
      if (rtSortKey === "display_name") {
        return rtSortAsc
          ? (a.display_name || "").localeCompare(b.display_name || "")
          : (b.display_name || "").localeCompare(a.display_name || "");
      }
      const va = Number(a[rtSortKey]);
      const vb = Number(b[rtSortKey]);
      return rtSortAsc ? va - vb : vb - va;
    });
    return result;
  }, [rtData, rtSearch, rtSortKey, rtSortAsc]);

  const exportRealTimeExcel = async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Dữ liệu hiện tại");
    ws.columns = [
      { header: "#", key: "rank", width: 5 },
      { header: "User", key: "name", width: 25 },
      { header: "Handle", key: "handle", width: 15 },
      { header: "FUN Money", key: "fun", width: 14 },
      { header: "Camly quy đổi", key: "camly", width: 16 },
      { header: "Camly đang có", key: "balance", width: 16 },
      { header: "Camly đã rút", key: "withdrawn", width: 16 },
      { header: "Light Score", key: "ls", width: 12 },
    ];
    rtFilteredRows.forEach((u: any, i: number) => ws.addRow({
      rank: i + 1,
      name: u.display_name || "Ẩn danh",
      handle: u.handle || "",
      fun: Number(u.total_fun_scored),
      camly: Number(u.total_fun_scored) * CAMLY_MULTIPLIER,
      balance: Number(u.camly_balance),
      withdrawn: Number(u.total_withdrawn),
      ls: Number(u.light_score),
    }));
    ws.getRow(1).font = { bold: true };
    ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5E6" } };
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fun-money-realtime-${new Date().toISOString().split("T")[0]}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Đã xuất Excel dữ liệu hiện tại!");
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  // ─── Lì xì on-chain stats ──────────────────────────────────
  const lixiStats = useMemo(() => {
    const completed = lixiClaims.filter(c => c.status === "completed");
    const unsuccessful = lixiClaims.filter(c => c.status === "failed" || c.status === "pending");
    const totalCamlyDistributed = completed.reduce((s, c) => s + c.camly_amount, 0);
    return {
      completedCount: completed.length,
      totalCamlyDistributed,
      unsuccessfulCount: unsuccessful.length,
    };
  }, [lixiClaims]);

  const filteredRows = useMemo(() => {
    let result = tetRewardData.filter(r => {
      if (!searchQuery) return true;
      return r.name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    // Claim filter
    if (claimFilter !== "all") {
      result = result.filter(r => {
        const userId = nameToUserIdMap.get(r.name);
        const claim = userId ? lixiClaims.find(c => c.user_id === userId) : undefined;
        switch (claimFilter) {
          case "completed": return claim?.status === "completed";
          case "failed": return claim?.status === "failed";
          case "pending": return claim?.status === "pending";
          case "unclaimed": return !claim;
          default: return true;
        }
      });
    }

    result = [...result].sort((a, b) => {
      if (sortKey === "name") {
        return sortAsc
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
      const va = a[sortKey] as number;
      const vb = b[sortKey] as number;
      return sortAsc ? va - vb : vb - va;
    });

    return result;
  }, [searchQuery, sortKey, sortAsc, claimFilter, nameToUserIdMap, lixiClaims]);

  // ─── Checkbox logic ────────────────────────────────────────
  const eligibleRows = useMemo(() => filteredRows.filter(r => r.totalFun > 0), [filteredRows]);

  const toggleSelectUser = (rank: number) => {
    setSelectedUsers(prev => {
      const next = new Set(prev);
      if (next.has(rank)) next.delete(rank);
      else next.add(rank);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === eligibleRows.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(eligibleRows.map(r => r.rank)));
    }
  };

  const selectedSummary = useMemo(() => {
    const selected: TetRewardUser[] = [];
    for (const row of filteredRows) {
      if (selectedUsers.has(row.rank) && row.totalFun > 0) {
        selected.push(row);
      }
    }
    const totalFun = selected.reduce((s, r) => s + r.totalFun, 0);
    const totalCamly = totalFun * CAMLY_MULTIPLIER;
    return { totalFun, totalCamly, selected, count: selected.length };
  }, [selectedUsers, filteredRows]);

  // ─── Distribute reward (tìm user_id theo display_name) ───
  const handleDistribute = async () => {
    if (selectedSummary.count === 0) return;
    setShowConfirmDialog(false);
    setIsDistributing(true);
    setDistributionProgress(0);

    try {
      // Tìm user_id dựa trên display_name từ profiles
      const names = selectedSummary.selected.map(s => s.name);
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("display_name", names);

      if (profileError) throw profileError;

      const nameToUserId = new Map<string, string>();
      const userIdToName = new Map<string, string>();
      for (const p of profiles || []) {
        if (p.display_name) {
          nameToUserId.set(p.display_name, p.user_id);
          userIdToName.set(p.user_id, p.display_name);
        }
      }

      const recipients = selectedSummary.selected
        .filter(s => nameToUserId.has(s.name))
        .map(s => ({
          user_id: nameToUserId.get(s.name)!,
          fun_amount: s.totalFun,
        }));

      if (recipients.length === 0) {
        toast.error("Không tìm được user_id cho các user đã chọn");
        return;
      }

      // Mark users not found in profiles as failed
      const notFoundUsers = selectedSummary.selected.filter(s => !nameToUserId.has(s.name));
      const newResults = new Map(distributionResults);
      for (const u of notFoundUsers) {
        newResults.set(u.name, { status: "failed", reason: "Không tìm thấy user_id" });
      }

      const BATCH_SIZE = 20;
      let totalSuccess = 0;
      let totalSkipped = 0;
      let totalFailed = 0;
      let totalCamlyDistributed = 0;

      for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
        const batch = recipients.slice(i, i + BATCH_SIZE);
        const { data, error } = await supabase.functions.invoke("distribute-fun-camly-reward", {
          body: { recipients: batch },
        });

        if (error) {
          console.error("Lỗi chuyển thưởng batch:", error);
          totalFailed += batch.length;
          // Mark all in batch as failed
          for (const r of batch) {
            const name = userIdToName.get(r.user_id);
            if (name) {
              newResults.set(name, { status: "failed", reason: String(error.message || error) });
            }
          }
        } else if (data) {
          if (data.summary) {
            totalSuccess += data.summary.success_count || 0;
            totalSkipped += data.summary.skipped_count || 0;
            totalFailed += data.summary.failed_count || 0;
            totalCamlyDistributed += data.summary.total_camly_distributed || 0;
          }
          // Process per-user results
          if (data.results && Array.isArray(data.results)) {
            for (const r of data.results) {
              const name = userIdToName.get(r.user_id);
              if (name) {
                if (r.status === "success") {
                  newResults.set(name, {
                    status: "success",
                    txId: r.tx_id,
                    camlyAmount: r.camly_amount,
                    createdAt: new Date().toISOString(),
                  });
                } else if (r.status === "skipped") {
                  newResults.set(name, { status: "skipped", reason: r.reason });
                } else {
                  newResults.set(name, { status: "failed", reason: r.reason });
                }
              }
            }
          }
        }

        setDistributionResults(new Map(newResults));
        setDistributionProgress(Math.min(100, Math.round(((i + batch.length) / recipients.length) * 100)));
      }

      setDistributionProgress(100);
      setDistributionResults(new Map(newResults));

      if (totalSuccess > 0) {
        setLastDistributionResult({
          totalCamly: totalCamlyDistributed,
          totalFun: selectedSummary.totalFun,
          successCount: totalSuccess,
        });
        setShowCelebration(true);
        setSelectedUsers(new Set());
        toast.success(`Đã chuyển thưởng Lì xì thành công cho ${totalSuccess} người dùng!`);
      }
      if (totalSkipped > 0) toast.info(`${totalSkipped} người dùng đã được thưởng trước đó`);
      if (totalFailed > 0) toast.error(`${totalFailed} người dùng thất bại`);
    } catch (error) {
      console.error("Lỗi chuyển thưởng:", error);
      toast.error("Đã xảy ra lỗi khi chuyển thưởng Lì xì");
    } finally {
      setIsDistributing(false);
      setDistributionProgress(0);
    }
  };

  // ─── Export Excel ──────────────────────────────────────────
  const exportExcel = async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Thưởng Tết 2026");
    ws.columns = [
      { header: "#", key: "rank", width: 5 },
      { header: "User", key: "name", width: 25 },
      { header: "Hỏi đáp", key: "question", width: 10 },
      { header: "Đăng bài", key: "post", width: 10 },
      { header: "Biết ơn", key: "gratitude", width: 10 },
      { header: "Tạo nội dung", key: "content", width: 12 },
      { header: "Nhật ký", key: "journal", width: 10 },
      { header: "Học tập", key: "learn", width: 10 },
      { header: "Tổng FUN", key: "totalFun", width: 12 },
      { header: "Camly Coin", key: "camly", width: 15 },
      { header: "Pass", key: "pass", width: 8 },
      { header: "Fail", key: "fail", width: 8 },
      { header: "Avg LS", key: "avgLightScore", width: 10 },
    ];
    filteredRows.forEach(r => ws.addRow({ ...r, camly: r.totalFun * CAMLY_MULTIPLIER }));

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "thuong-tet-2026-snapshot.xlsx";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Đã xuất Excel thành công!");
  };

  // ─── Format helpers ────────────────────────────────────────
  const formatNum = (n: number) => n.toLocaleString("vi-VN");

  if (authLoading) {
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
                  <h1 className="font-serif text-lg font-semibold text-primary-deep">🧧 Thưởng Tết 2026</h1>
                  <p className="text-xs text-foreground-muted">Snapshot FUN Money — {TET_REWARD_SNAPSHOT_DATE}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={exportExcel} className="hidden sm:flex items-center gap-2">
                <Download className="w-4 h-4" />
                Excel
              </Button>
              <button
                onClick={() => signOut().then(() => navigate("/"))}
                className="flex items-center gap-2 px-3 py-2 rounded-full text-sm text-foreground-muted hover:text-primary hover:bg-primary-pale transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <AdminNavToolbar />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Banner chương trình */}
        <div
          className="mb-6 p-5 rounded-xl border-2 border-amber-400/40 shadow-lg relative overflow-hidden"
          style={{
            backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.25) 30%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.2) 70%, rgba(255,255,255,0) 100%), linear-gradient(135deg, #b8860b 0%, #daa520 15%, #ffd700 35%, #ffec8b 50%, #ffd700 65%, #daa520 85%, #b8860b 100%)`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-white/20 pointer-events-none" />
          <div className="relative z-10 text-center space-y-2">
            <p className="text-lg font-bold text-amber-900">🧧 Chương trình Lì xì Tết</p>
            <p className="text-3xl font-extrabold text-amber-900 drop-shadow-sm">26.000.000.000 VND</p>
            <p className="text-sm text-amber-800">Công thức: <strong>1 FUN = 1.000 Camly Coin</strong></p>
            <p className="text-xs text-amber-700">⏰ Áp dụng đến ngày 08/02/2026 · Dữ liệu cố định từ {TET_REWARD_SNAPSHOT_DATE}</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 w-full max-w-md">
            <TabsTrigger value="snapshot" className="flex-1">📸 Snapshot {TET_REWARD_SNAPSHOT_DATE}</TabsTrigger>
            <TabsTrigger value="realtime" className="flex-1">📊 Dữ liệu hiện tại</TabsTrigger>
          </TabsList>

          {/* ═══ Tab 1: Snapshot ═══ */}
          <TabsContent value="snapshot">
            {/* Search + Claim Filter */}
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
              <div className="flex items-center gap-3 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm user..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={claimFilter} onValueChange={(v: typeof claimFilter) => setClaimFilter(v)}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                    <SelectValue placeholder="Lọc Claim" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="completed">✅ Đã claim</SelectItem>
                    <SelectItem value="failed">❌ Thất bại</SelectItem>
                    <SelectItem value="pending">⏳ Đang chờ</SelectItem>
                    <SelectItem value="unclaimed">⬜ Chưa claim</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-foreground-muted">
                📸 Snapshot: {TET_REWARD_SNAPSHOT_DATE} · {overview.totalUsers} users
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card className="border-divine-gold/20">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-divine-gold/10">
                      <Coins className="w-5 h-5 text-divine-gold" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">{formatNum(overview.totalFun)}</p>
                      <p className="text-xs text-foreground-muted">Tổng FUN Money</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-amber-500/20">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/10">
                      <Gift className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">{formatNum(overview.totalCamly)}</p>
                      <p className="text-xs text-foreground-muted">Tổng Camly Coin</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-blue-500/20">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">{overview.eligibleCount}</p>
                      <p className="text-xs text-foreground-muted">Đủ điều kiện</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-purple-500/20">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <Star className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">{overview.avgLightScore}</p>
                      <p className="text-xs text-foreground-muted">Avg Light Score</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Lì xì on-chain stats */}
            <div className="mb-8">
              <p className="text-xs font-semibold text-foreground-muted mb-3 flex items-center gap-1.5">
                🧧 Thống kê Lì xì on-chain
              </p>
              <div className="grid grid-cols-3 gap-4">
                <Card className="border-green-500/20">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-500/10">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-foreground">{lixiStats.completedCount}</p>
                        <p className="text-xs text-foreground-muted">User đã Lì xì</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-amber-500/20">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-500/10">
                        <Gift className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-foreground">{formatNum(lixiStats.totalCamlyDistributed)}</p>
                        <p className="text-xs text-foreground-muted">Tổng Camly đã Lì xì</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-red-500/20">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-red-500/10">
                        <XCircle className="w-5 h-5 text-red-500" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-foreground">{lixiStats.unsuccessfulCount}</p>
                        <p className="text-xs text-foreground-muted">Chưa thành công</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Action Bar */}
            {selectedSummary.count > 0 && (
              <Card className="mb-4 border-amber-400/40 bg-amber-50/50 dark:bg-amber-950/20">
                <CardContent className="py-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Gift className="w-5 h-5 text-amber-600" />
                      <div>
                        <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                          🧧 Lì xì Tết — Đã chọn {selectedSummary.count} người dùng
                        </p>
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                          Tổng: {formatNum(selectedSummary.totalFun)} FUN × 1.000 = <strong>{formatNum(selectedSummary.totalCamly)} Camly Coin</strong>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedUsers(new Set())}>
                        Bỏ chọn
                      </Button>
                      <Button size="sm" onClick={() => setShowConfirmDialog(true)} disabled={isDistributing}>
                        <Gift className="w-4 h-4 mr-2" />
                        Chuyển thưởng Lì xì
                      </Button>
                    </div>
                  </div>
                  {isDistributing && (
                    <div className="mt-3">
                      <Progress value={distributionProgress} className="h-2" />
                      <p className="text-xs text-amber-600 mt-1 text-center">Đang xử lý... {distributionProgress}%</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Main Table */}
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Coins className="w-5 h-5 text-primary" />
                  Chi tiết FUN Money theo User ({filteredRows.length} users)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-muted/30 border-b">
                        <th className="px-2 py-2 text-center w-8">
                          <Checkbox
                            checked={eligibleRows.length > 0 && selectedUsers.size === eligibleRows.length}
                            onCheckedChange={toggleSelectAll}
                            aria-label="Chọn tất cả"
                          />
                        </th>
                        <th className="px-2 py-2 text-center text-muted-foreground font-medium w-8">#</th>
                        <th
                          className="px-2 py-2 text-left font-medium cursor-pointer hover:text-primary transition-colors min-w-[130px]"
                          onClick={() => toggleSort("name")}
                        >
                          <span className="flex items-center gap-0.5">
                            User
                            <ArrowUpDown className={`w-2.5 h-2.5 flex-shrink-0 ${sortKey === "name" ? "text-primary" : "text-muted-foreground/40"}`} />
                          </span>
                        </th>
                        {ACTION_COLS.map((col) => (
                          <th
                            key={col.key}
                            className="px-1.5 py-2 text-center font-medium cursor-pointer hover:text-primary transition-colors"
                            onClick={() => toggleSort(col.key)}
                            title={col.label}
                          >
                            <span className="flex flex-col items-center gap-0.5 leading-tight">
                              <span className="text-base">{col.icon}</span>
                              <span className="text-[10px] leading-none">{col.short}</span>
                              <ArrowUpDown className={`w-2 h-2 flex-shrink-0 ${sortKey === col.key ? "text-primary" : "text-muted-foreground/30"}`} />
                            </span>
                          </th>
                        ))}
                        <th
                          className="px-2 py-2 text-center font-semibold cursor-pointer hover:text-primary transition-colors"
                          onClick={() => toggleSort("totalFun")}
                        >
                          <span className="flex flex-col items-center gap-0.5 leading-tight">
                            <span className="text-base">💰</span>
                            <span className="text-[10px] leading-none">Tổng</span>
                            <ArrowUpDown className={`w-2 h-2 flex-shrink-0 ${sortKey === "totalFun" ? "text-primary" : "text-muted-foreground/30"}`} />
                          </span>
                        </th>
                        <th className="px-2 py-2 text-center font-semibold">
                          <span className="flex flex-col items-center gap-0.5 leading-tight">
                            <span className="text-base">🧧</span>
                            <span className="text-[10px] leading-none">Camly</span>
                          </span>
                        </th>
                        <th
                          className="px-2 py-2 text-center font-medium cursor-pointer hover:text-primary transition-colors"
                          onClick={() => toggleSort("pass")}
                        >
                          <span className="flex flex-col items-center gap-0.5 leading-tight">
                            <span className="text-base">✅</span>
                            <span className="text-[10px] leading-none">P/F</span>
                            <ArrowUpDown className={`w-2 h-2 flex-shrink-0 ${sortKey === "pass" ? "text-primary" : "text-muted-foreground/30"}`} />
                          </span>
                        </th>
                        <th
                          className="px-2 py-2 text-center font-medium cursor-pointer hover:text-primary transition-colors"
                          onClick={() => toggleSort("avgLightScore")}
                        >
                          <span className="flex flex-col items-center gap-0.5 leading-tight">
                            <span className="text-base">⭐</span>
                            <span className="text-[10px] leading-none">LS</span>
                            <ArrowUpDown className={`w-2 h-2 flex-shrink-0 ${sortKey === "avgLightScore" ? "text-primary" : "text-muted-foreground/30"}`} />
                          </span>
                        </th>
                        <th className="px-2 py-2 text-center font-medium min-w-[120px]">
                          <span className="flex flex-col items-center gap-0.5 leading-tight">
                            <span className="text-base">👛</span>
                            <span className="text-[10px] leading-none">Wallet</span>
                          </span>
                        </th>
                        <th className="px-2 py-2 text-center font-medium min-w-[100px]">
                          <span className="flex flex-col items-center gap-0.5 leading-tight">
                            <span className="text-base">📋</span>
                            <span className="text-[10px] leading-none">Lì xì</span>
                          </span>
                        </th>
                        <th className="px-2 py-2 text-center font-medium min-w-[100px]">
                          <span className="flex flex-col items-center gap-0.5 leading-tight">
                            <span className="text-base">🎫</span>
                            <span className="text-[10px] leading-none">Claim</span>
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.length === 0 ? (
                        <tr>
                          <td colSpan={ACTION_COLS.length + 10} className="text-center py-12 text-muted-foreground">
                            Không tìm thấy user nào
                          </td>
                        </tr>
                      ) : (
                        filteredRows.map((row) => (
                          <tr
                            key={row.rank}
                            className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${selectedUsers.has(row.rank) ? "bg-amber-50/50 dark:bg-amber-950/20" : ""}`}
                          >
                            <td className="px-2 py-2.5 text-center">
                              {row.totalFun > 0 ? (
                                <Checkbox
                                  checked={selectedUsers.has(row.rank)}
                                  onCheckedChange={() => toggleSelectUser(row.rank)}
                                  aria-label={`Chọn ${row.name}`}
                                />
                              ) : (
                                <span className="text-muted-foreground/30">—</span>
                              )}
                            </td>
                            <td className="px-2 py-2.5 text-center text-muted-foreground">{row.rank}</td>
                            <td className="px-2 py-2.5">
                              <div className="flex items-center gap-1.5">
                                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                  <Users className="w-3 h-3 text-primary" />
                                </div>
                                <span className="font-medium truncate max-w-[120px]" title={row.name}>
                                  {row.name}
                                </span>
                              </div>
                            </td>
                            {ACTION_COLS.map((col) => {
                              const val = row[col.key];
                              return (
                                <td key={col.key} className="px-1.5 py-2.5 text-center tabular-nums">
                                  {val > 0 ? (
                                    <span className="font-medium">{formatNum(val)}</span>
                                  ) : (
                                    <span className="text-muted-foreground/30">—</span>
                                  )}
                                </td>
                              );
                            })}
                            <td className="px-2 py-2.5 text-center font-bold tabular-nums text-primary">
                              {formatNum(row.totalFun)}
                            </td>
                            <td className="px-2 py-2.5 text-center tabular-nums">
                              {row.totalFun > 0 ? (
                                <span className="font-semibold text-amber-600 dark:text-amber-400">
                                  {formatNum(row.totalFun * CAMLY_MULTIPLIER)}
                                </span>
                              ) : (
                                <span className="text-muted-foreground/30">—</span>
                              )}
                            </td>
                            <td className="px-2 py-2.5 text-center">
                              <span className="text-green-600 font-medium">{row.pass}</span>
                              <span className="text-muted-foreground/30">/</span>
                              <span className="text-red-400">{row.fail}</span>
                            </td>
                            <td className="px-2 py-2.5 text-center">
                              {row.avgLightScore > 0 ? (
                                <span className={row.avgLightScore >= 60 ? "text-green-600 font-medium" : "text-amber-600"}>
                                  {row.avgLightScore}
                                </span>
                              ) : (
                                <span className="text-muted-foreground/30">—</span>
                              )}
                            </td>
                            {/* Wallet Address Column */}
                            <td className="px-2 py-2.5 text-center">
                              {(() => {
                                const wallet = userWalletMap.get(row.name);
                                if (!wallet) return <span className="text-muted-foreground/30">—</span>;
                                return (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <a
                                          href={`https://bscscan.com/address/${wallet}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-mono text-[10px]"
                                        >
                                          {wallet.slice(0, 6)}...{wallet.slice(-4)}
                                          <ExternalLink className="w-2.5 h-2.5" />
                                        </a>
                                      </TooltipTrigger>
                                      <TooltipContent side="left">
                                        <p className="font-mono text-xs break-all">{wallet}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                );
                              })()}
                            </td>
                            <td className="px-2 py-2.5 text-center">
                              {(() => {
                                const result = distributionResults.get(row.name);
                                if (!result) {
                                  return <span className="text-muted-foreground/30">—</span>;
                                }
                                if (result.status === "success") {
                                  return (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className="inline-flex items-center gap-1 text-green-600 cursor-help">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-mono">
                                              {result.txId ? result.txId.slice(0, 8) + "..." : "OK"}
                                            </span>
                                          </span>
                                        </TooltipTrigger>
                                        <TooltipContent side="left" className="max-w-xs">
                                          <div className="space-y-1 text-xs">
                                            <p className="font-semibold text-green-600">✅ Đã chuyển thành công</p>
                                            {result.txId && <p className="font-mono break-all">ID: {result.txId}</p>}
                                            {result.camlyAmount && <p>Số lượng: {result.camlyAmount.toLocaleString("vi-VN")} Camly</p>}
                                            {result.createdAt && <p>Thời gian: {new Date(result.createdAt).toLocaleString("vi-VN")}</p>}
                                          </div>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  );
                                }
                                if (result.status === "skipped") {
                                  return (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className="inline-flex items-center gap-1 text-amber-500 cursor-help">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span className="text-[10px]">Đã nhận</span>
                                          </span>
                                        </TooltipTrigger>
                                        <TooltipContent side="left">
                                          <p className="text-xs">{result.reason || "Đã được thưởng trước đó"}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  );
                                }
                                // Failed
                                return (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="inline-flex items-center gap-1 text-red-500 cursor-help">
                                          <XCircle className="w-3.5 h-3.5" />
                                          <span className="text-[10px]">Lỗi</span>
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent side="left" className="max-w-xs">
                                        <p className="text-xs text-red-500 break-all">{result.reason || "Lỗi không xác định"}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                );
                              })()}
                            </td>
                            {/* Claim Status Column */}
                            <td className="px-2 py-2.5 text-center">
                              {(() => {
                                const userId = nameToUserIdMap.get(row.name);
                                if (!userId) return <span className="text-muted-foreground/30">—</span>;
                                
                                const claim = lixiClaims.find(c => c.user_id === userId);
                                if (!claim) {
                                  return <span className="text-muted-foreground/30">—</span>;
                                }
                                
                                if (claim.status === "completed") {
                                  return (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className="inline-flex items-center gap-1 text-green-600 cursor-help">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            <span className="text-[10px]">Xong</span>
                                          </span>
                                        </TooltipTrigger>
                                        <TooltipContent side="left" className="max-w-xs">
                                          <div className="space-y-1 text-xs">
                                            <p className="font-semibold text-green-600">✅ Đã chuyển on-chain</p>
                                            {claim.tx_hash && (
                                              <p className="font-mono break-all">TX: {claim.tx_hash.slice(0, 10)}...{claim.tx_hash.slice(-6)}</p>
                                            )}
                                            {claim.wallet_address && (
                                              <p className="font-mono">Ví: {claim.wallet_address.slice(0, 6)}...{claim.wallet_address.slice(-4)}</p>
                                            )}
                                            <p>Số lượng: {claim.camly_amount.toLocaleString("vi-VN")} CAMLY</p>
                                          </div>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  );
                                }
                                
                                if (claim.status === "pending") {
                                  return (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className="inline-flex items-center gap-1 text-amber-500 cursor-help">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span className="text-[10px]">Chờ</span>
                                          </span>
                                        </TooltipTrigger>
                                        <TooltipContent side="left" className="max-w-xs">
                                          <div className="space-y-1 text-xs">
                                            <p className="font-semibold text-amber-600">⏳ User đã nhấn CLAIM</p>
                                            {claim.wallet_address && (
                                              <p className="font-mono">Ví: {claim.wallet_address.slice(0, 6)}...{claim.wallet_address.slice(-4)}</p>
                                            )}
                                            {!claim.wallet_address && (
                                              <p className="text-red-500">⚠️ Chưa có ví Web3</p>
                                            )}
                                            <p>Số lượng: {claim.camly_amount.toLocaleString("vi-VN")} CAMLY</p>
                                            <p>Thời gian: {new Date(claim.claimed_at).toLocaleString("vi-VN")}</p>
                                          </div>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  );
                                }
                                
                                if (claim.status === "failed") {
                                  return (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className="inline-flex items-center gap-1 text-red-500 cursor-help">
                                            <XCircle className="w-3.5 h-3.5" />
                                            <span className="text-[10px]">Lỗi</span>
                                          </span>
                                        </TooltipTrigger>
                                        <TooltipContent side="left" className="max-w-xs">
                                          <p className="text-xs text-red-500">{claim.error_message || "Lỗi không xác định"}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  );
                                }
                                
                                return <span className="text-muted-foreground/30">—</span>;
                              })()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══ Tab 2: Dữ liệu hiện tại ═══ */}
          <TabsContent value="realtime">
            {/* Search + Refresh */}
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm user..."
                  value={rtSearch}
                  onChange={(e) => setRtSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-3">
                {rtLastUpdated && (
                  <p className="text-xs text-foreground-muted">
                    🕐 Cập nhật: {rtLastUpdated.toLocaleTimeString("vi-VN")}
                  </p>
                )}
                <Button variant="outline" size="sm" onClick={fetchRealTimeData} disabled={rtLoading} className="gap-2">
                  <RefreshCw className={`w-4 h-4 ${rtLoading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
                <Button variant="ghost" size="sm" onClick={exportRealTimeExcel} className="gap-2">
                  <Download className="w-4 h-4" />
                  Excel
                </Button>
              </div>
            </div>

            {/* Real-time Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              <Card className="border-divine-gold/20">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-divine-gold/10">
                      <Coins className="w-5 h-5 text-divine-gold" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">{formatNum(rtOverview.totalFun)}</p>
                      <p className="text-xs text-foreground-muted">Tổng FUN</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-amber-500/20">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/10">
                      <Gift className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">{formatNum(rtOverview.totalCamly)}</p>
                      <p className="text-xs text-foreground-muted">Camly quy đổi</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-green-500/20">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <Wallet className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">{formatNum(rtOverview.totalCamlyBalance)}</p>
                      <p className="text-xs text-foreground-muted">Camly đang có</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-red-500/20">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-500/10">
                      <Download className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">{formatNum(rtOverview.totalWithdrawn)}</p>
                      <p className="text-xs text-foreground-muted">Camly đã rút</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-blue-500/20">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">{rtOverview.eligibleCount}</p>
                      <p className="text-xs text-foreground-muted">Đủ điều kiện</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-purple-500/20">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <Star className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">{rtOverview.avgLightScore}</p>
                      <p className="text-xs text-foreground-muted">Avg Light Score</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Real-time Table */}
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Coins className="w-5 h-5 text-primary" />
                  Dữ liệu FUN Money hiện tại ({rtFilteredRows.length} users có FUN {">"} 0)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {rtLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                    <p className="ml-3 text-foreground-muted">Đang tải dữ liệu...</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-muted/30 border-b">
                          <th className="px-2 py-2 text-center text-muted-foreground font-medium w-8">#</th>
                          <th
                            className="px-2 py-2 text-left font-medium cursor-pointer hover:text-primary transition-colors min-w-[150px]"
                            onClick={() => rtToggleSort("display_name")}
                          >
                            <span className="flex items-center gap-0.5">
                              User
                              <ArrowUpDown className={`w-2.5 h-2.5 flex-shrink-0 ${rtSortKey === "display_name" ? "text-primary" : "text-muted-foreground/40"}`} />
                            </span>
                          </th>
                          <th
                            className="px-2 py-2 text-center font-semibold cursor-pointer hover:text-primary transition-colors"
                            onClick={() => rtToggleSort("total_fun_scored")}
                          >
                            <span className="flex flex-col items-center gap-0.5 leading-tight">
                              <span className="text-base">💰</span>
                              <span className="text-[10px] leading-none">FUN</span>
                              <ArrowUpDown className={`w-2 h-2 flex-shrink-0 ${rtSortKey === "total_fun_scored" ? "text-primary" : "text-muted-foreground/30"}`} />
                            </span>
                          </th>
                          <th className="px-2 py-2 text-center font-semibold">
                            <span className="flex flex-col items-center gap-0.5 leading-tight">
                              <span className="text-base">🧧</span>
                              <span className="text-[10px] leading-none">Camly QĐ</span>
                            </span>
                          </th>
                          <th
                            className="px-2 py-2 text-center font-medium cursor-pointer hover:text-primary transition-colors"
                            onClick={() => rtToggleSort("camly_balance")}
                          >
                            <span className="flex flex-col items-center gap-0.5 leading-tight">
                              <span className="text-base">💳</span>
                              <span className="text-[10px] leading-none">Đang có</span>
                              <ArrowUpDown className={`w-2 h-2 flex-shrink-0 ${rtSortKey === "camly_balance" ? "text-primary" : "text-muted-foreground/30"}`} />
                            </span>
                          </th>
                          <th
                            className="px-2 py-2 text-center font-medium cursor-pointer hover:text-primary transition-colors"
                            onClick={() => rtToggleSort("total_withdrawn")}
                          >
                            <span className="flex flex-col items-center gap-0.5 leading-tight">
                              <span className="text-base">📤</span>
                              <span className="text-[10px] leading-none">Đã rút</span>
                              <ArrowUpDown className={`w-2 h-2 flex-shrink-0 ${rtSortKey === "total_withdrawn" ? "text-primary" : "text-muted-foreground/30"}`} />
                            </span>
                          </th>
                          <th
                            className="px-2 py-2 text-center font-medium cursor-pointer hover:text-primary transition-colors"
                            onClick={() => rtToggleSort("light_score")}
                          >
                            <span className="flex flex-col items-center gap-0.5 leading-tight">
                              <span className="text-base">⭐</span>
                              <span className="text-[10px] leading-none">LS</span>
                              <ArrowUpDown className={`w-2 h-2 flex-shrink-0 ${rtSortKey === "light_score" ? "text-primary" : "text-muted-foreground/30"}`} />
                            </span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {rtFilteredRows.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center py-12 text-muted-foreground">
                              Không tìm thấy user nào
                            </td>
                          </tr>
                        ) : (
                          rtFilteredRows.map((row: any, idx: number) => {
                            const fun = Number(row.total_fun_scored);
                            const camlyConverted = fun * CAMLY_MULTIPLIER;
                            const balance = Number(row.camly_balance);
                            const withdrawn = Number(row.total_withdrawn);
                            const ls = Number(row.light_score);
                            return (
                              <tr key={row.user_id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                <td className="px-2 py-2.5 text-center text-muted-foreground">{idx + 1}</td>
                                <td className="px-2 py-2.5">
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                      <Users className="w-3 h-3 text-primary" />
                                    </div>
                                    <div className="min-w-0">
                                      <span className="font-medium truncate block max-w-[120px]" title={row.display_name || "Ẩn danh"}>
                                        {row.display_name || "Ẩn danh"}
                                      </span>
                                      {row.handle && (
                                        <span className="text-[10px] text-muted-foreground">@{row.handle}</span>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-2 py-2.5 text-center font-bold tabular-nums text-primary">
                                  {formatNum(fun)}
                                </td>
                                <td className="px-2 py-2.5 text-center tabular-nums">
                                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                                    {formatNum(camlyConverted)}
                                  </span>
                                </td>
                                <td className="px-2 py-2.5 text-center tabular-nums font-medium">
                                  {formatNum(balance)}
                                </td>
                                <td className="px-2 py-2.5 text-center tabular-nums">
                                  {withdrawn > 0 ? (
                                    <span className="text-red-500 font-medium">{formatNum(withdrawn)}</span>
                                  ) : (
                                    <span className="text-muted-foreground/30">—</span>
                                  )}
                                </td>
                                <td className="px-2 py-2.5 text-center">
                                  {ls > 0 ? (
                                    <span className={ls >= 60 ? "text-green-600 font-medium" : "text-amber-600"}>
                                      {formatNum(ls)}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground/30">—</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Dialog xác nhận */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-amber-600" />
              🧧 Xác nhận chuyển thưởng Lì xì Tết
            </DialogTitle>
            <DialogDescription>
              Công thức: 1 FUN Money = 1.000 Camly Coin. Dữ liệu snapshot {TET_REWARD_SNAPSHOT_DATE}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-amber-600 text-xs">Số người nhận</p>
                  <p className="font-bold text-amber-800 dark:text-amber-200">{selectedSummary.count}</p>
                </div>
                <div>
                  <p className="text-amber-600 text-xs">Tổng FUN Money</p>
                  <p className="font-bold text-amber-800 dark:text-amber-200">{formatNum(selectedSummary.totalFun)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-amber-600 text-xs">Tổng Camly Coin sẽ chuyển</p>
                  <p className="font-bold text-xl text-amber-800 dark:text-amber-200">{formatNum(selectedSummary.totalCamly)}</p>
                </div>
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto border rounded-lg">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-muted/80">
                  <tr>
                    <th className="px-3 py-2 text-left">Người dùng</th>
                    <th className="px-3 py-2 text-right">FUN</th>
                    <th className="px-3 py-2 text-right">Camly</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSummary.selected.map((s) => (
                    <tr key={s.rank} className="border-t">
                      <td className="px-3 py-2">{s.name}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatNum(s.totalFun)}</td>
                      <td className="px-3 py-2 text-right tabular-nums font-semibold text-amber-600">
                        {formatNum(s.totalFun * CAMLY_MULTIPLIER)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowConfirmDialog(false)}>Huỷ</Button>
            <Button onClick={handleDistribute}>
              <Gift className="w-4 h-4 mr-2" />
              Xác nhận chuyển thưởng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Popup chúc mừng */}
      <LiXiCelebrationDialog
        open={showCelebration}
        onOpenChange={setShowCelebration}
        totalCamly={lastDistributionResult?.totalCamly || 0}
        totalFun={lastDistributionResult?.totalFun || 0}
        successCount={lastDistributionResult?.successCount || 0}
      />
    </div>
  );
};

export default AdminTetReward;
