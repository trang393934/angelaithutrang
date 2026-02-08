import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import {
  ArrowLeft, Sparkles, LogOut, RefreshCw, Search, Download,
  Coins, Users, TrendingUp, Calendar, CheckCircle, XCircle,
  ArrowUpDown, Zap, Star, Gift
} from "lucide-react";
import angelAvatar from "@/assets/angel-avatar.png";
import ExcelJS from "exceljs";
import { LiXiCelebrationDialog } from "@/components/admin/LiXiCelebrationDialog";

// ─── Types ───────────────────────────────────────────────────
const ACTION_TYPES = [
  "QUESTION_ASK",
  "POST_CREATE",
  "COMMENT_CREATE",
  "POST_ENGAGEMENT",
  "SHARE_CONTENT",
  "GRATITUDE_PRACTICE",
  "CONTENT_CREATE",
  "JOURNAL_WRITE",
  "DONATE_SUPPORT",
  "DAILY_LOGIN",
  "HELP_COMMUNITY",
  "IDEA_SUBMIT",
  "FEEDBACK_GIVE",
] as const;

type ActionType = typeof ACTION_TYPES[number];

const ACTION_LABELS: Record<string, string> = {
  QUESTION_ASK: "Hỏi đáp",
  POST_CREATE: "Đăng bài",
  COMMENT_CREATE: "Bình luận",
  POST_ENGAGEMENT: "Tương tác",
  SHARE_CONTENT: "Chia sẻ",
  GRATITUDE_PRACTICE: "Biết ơn",
  CONTENT_CREATE: "Tạo nội dung",
  JOURNAL_WRITE: "Nhật ký",
  DONATE_SUPPORT: "Tặng quà",
  DAILY_LOGIN: "Đăng nhập",
  HELP_COMMUNITY: "Giúp đỡ",
  IDEA_SUBMIT: "Ý tưởng",
  FEEDBACK_GIVE: "Phản hồi",
};

const ACTION_SHORT: Record<string, string> = {
  QUESTION_ASK: "Hỏi",
  POST_CREATE: "Bài",
  COMMENT_CREATE: "B.luận",
  POST_ENGAGEMENT: "Like",
  SHARE_CONTENT: "Share",
  GRATITUDE_PRACTICE: "Ơn",
  CONTENT_CREATE: "N.dung",
  JOURNAL_WRITE: "N.ký",
  DONATE_SUPPORT: "Quà",
  DAILY_LOGIN: "D.nhập",
  HELP_COMMUNITY: "Giúp",
  IDEA_SUBMIT: "Ý.tưởng",
  FEEDBACK_GIVE: "P.hồi",
};

const ACTION_ICONS: Record<string, string> = {
  QUESTION_ASK: "💬",
  POST_CREATE: "📢",
  COMMENT_CREATE: "💭",
  POST_ENGAGEMENT: "❤️",
  SHARE_CONTENT: "🔗",
  GRATITUDE_PRACTICE: "🙏",
  CONTENT_CREATE: "✍️",
  JOURNAL_WRITE: "📝",
  DONATE_SUPPORT: "🎁",
  DAILY_LOGIN: "📅",
  HELP_COMMUNITY: "🤝",
  IDEA_SUBMIT: "💡",
  FEEDBACK_GIVE: "📋",
};

interface UserPPLPRow {
  actor_id: string;
  display_name: string | null;
  avatar_url: string | null;
  by_type: Record<ActionType, { fun: number; passed: number; failed: number }>;
  total_fun: number;
  total_passed: number;
  total_failed: number;
  avg_light_score: number;
  mint_status: string;
}

interface OverviewStats {
  totalFunPassed: number;
  totalActions: number;
  passRate: number;
  usersWithPass: number;
  mintRequests: { total: number; signed: number; minted: number; pending: number };
  avgLightScore: number;
}

type SortKey = "display_name" | ActionType | "total_fun" | "total_passed" | "avg_light_score";

const CAMLY_MULTIPLIER = 1000;

// ─── Component ───────────────────────────────────────────────
const AdminMintStats = () => {
  const { user, isAdmin, isLoading: authLoading, isAdminChecked, signOut } = useAuth();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("total_fun");
  const [sortAsc, setSortAsc] = useState(false);

  const [rows, setRows] = useState<UserPPLPRow[]>([]);
  const [overview, setOverview] = useState<OverviewStats>({
    totalFunPassed: 0,
    totalActions: 0,
    passRate: 0,
    usersWithPass: 0,
    mintRequests: { total: 0, signed: 0, minted: 0, pending: 0 },
    avgLightScore: 0,
  });

  // ─── Lì xì state ──────────────────────────────────────────
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [isDistributing, setIsDistributing] = useState(false);
  const [distributionProgress, setDistributionProgress] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [lastDistributionResult, setLastDistributionResult] = useState<{
    totalCamly: number;
    totalFun: number;
    successCount: number;
  } | null>(null);

  // ─── Auth guard ────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && isAdminChecked) {
      if (!user) navigate("/admin/login");
      else if (!isAdmin) {
        toast.error("Bạn không có quyền truy cập trang này");
        navigate("/");
      }
    }
  }, [user, isAdmin, authLoading, isAdminChecked, navigate]);

  // ─── Date filter helper ────────────────────────────────────
  const getDateFilter = useCallback(() => {
    const now = new Date();
    switch (timeRange) {
      case "7d": return new Date(now.getTime() - 7 * 86400000).toISOString();
      case "30d": return new Date(now.getTime() - 30 * 86400000).toISOString();
      case "90d": return new Date(now.getTime() - 90 * 86400000).toISOString();
      default: return null;
    }
  }, [timeRange]);

  // ─── Fetch all data ────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!user || !isAdmin) return;
    setIsRefreshing(true);
    try {
      const dateFilter = getDateFilter();
      const PAGE_SIZE = 1000;

      // 1) Fetch ALL pplp_actions với pagination tự động
      type ActionRow = { id: string; actor_id: string; action_type: string; created_at: string };
      let actionsRaw: ActionRow[] = [];
      let from = 0;
      while (true) {
        let query = supabase
          .from("pplp_actions")
          .select("id, actor_id, action_type, created_at")
          .range(from, from + PAGE_SIZE - 1);
        if (dateFilter) query = query.gte("created_at", dateFilter);
        const { data, error } = await query;
        if (error) throw error;
        if (!data || data.length === 0) break;
        actionsRaw = actionsRaw.concat(data);
        if (data.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
      }

      const actionIds = actionsRaw.map((a) => a.id);

      // 2) Fetch ALL pplp_scores với pagination
      type ScoreRow = { action_id: string; decision: string; final_reward: number; light_score: number };
      let allScores: ScoreRow[] = [];
      for (let i = 0; i < actionIds.length; i += 500) {
        const batchIds = actionIds.slice(i, i + 500);
        let scoreFrom = 0;
        while (true) {
          const { data, error } = await supabase
            .from("pplp_scores")
            .select("action_id, decision, final_reward, light_score")
            .in("action_id", batchIds)
            .range(scoreFrom, scoreFrom + PAGE_SIZE - 1);
          if (error) throw error;
          if (!data || data.length === 0) break;
          allScores = allScores.concat(data as ScoreRow[]);
          if (data.length < PAGE_SIZE) break;
          scoreFrom += PAGE_SIZE;
        }
      }

      // Build score map
      const scoreMap = new Map<string, typeof allScores[0]>();
      for (const s of allScores) scoreMap.set(s.action_id, s);

      // 2) Aggregate per user per action_type
      const userMap = new Map<string, {
        by_type: Record<string, { fun: number; passed: number; failed: number }>;
        lightScores: number[];
      }>();

      for (const action of actionsRaw || []) {
        if (!userMap.has(action.actor_id)) {
          userMap.set(action.actor_id, { by_type: {}, lightScores: [] });
        }
        const entry = userMap.get(action.actor_id)!;
        if (!entry.by_type[action.action_type]) {
          entry.by_type[action.action_type] = { fun: 0, passed: 0, failed: 0 };
        }
        const score = scoreMap.get(action.id);
        if (score) {
          if (score.decision === "pass") {
            entry.by_type[action.action_type].passed++;
            entry.by_type[action.action_type].fun += score.final_reward || 0;
            if (score.light_score) entry.lightScores.push(score.light_score);
          } else {
            entry.by_type[action.action_type].failed++;
          }
        }
      }

      // 3) Fetch profiles
      const actorIds = Array.from(userMap.keys());
      let profilesMap = new Map<string, { display_name: string | null; avatar_url: string | null }>();
      if (actorIds.length > 0) {
        for (let i = 0; i < actorIds.length; i += 500) {
          const batch = actorIds.slice(i, i + 500);
          const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id, display_name, avatar_url")
            .in("user_id", batch);
          for (const p of profiles || []) {
            profilesMap.set(p.user_id, { display_name: p.display_name, avatar_url: p.avatar_url });
          }
        }
      }

      // 4) Fetch mint requests
      const { data: mintReqs } = await supabase
        .from("pplp_mint_requests")
        .select("actor_id, status");
      const mintByUser = new Map<string, string>();
      const mintOverview = { total: 0, signed: 0, minted: 0, pending: 0 };
      for (const mr of mintReqs || []) {
        mintOverview.total++;
        if (mr.status === "signed") mintOverview.signed++;
        else if (mr.status === "minted") mintOverview.minted++;
        else if (mr.status === "pending") mintOverview.pending++;
        const current = mintByUser.get(mr.actor_id);
        if (!current || mr.status === "minted" || (mr.status === "signed" && current !== "minted")) {
          mintByUser.set(mr.actor_id, mr.status);
        }
      }

      // 5) Build rows
      let totalFunPassed = 0;
      let totalPassed = 0;
      let totalFailed = 0;
      let usersWithPass = 0;
      let allLightScores: number[] = [];

      const resultRows: UserPPLPRow[] = actorIds.map((actorId) => {
        const data = userMap.get(actorId)!;
        const profile = profilesMap.get(actorId);
        const byType = {} as UserPPLPRow["by_type"];
        let userTotalFun = 0;
        let userPassed = 0;
        let userFailed = 0;

        for (const at of ACTION_TYPES) {
          const d = data.by_type[at] || { fun: 0, passed: 0, failed: 0 };
          byType[at] = d;
          userTotalFun += d.fun;
          userPassed += d.passed;
          userFailed += d.failed;
        }

        totalFunPassed += userTotalFun;
        totalPassed += userPassed;
        totalFailed += userFailed;
        if (userPassed > 0) usersWithPass++;
        allLightScores = allLightScores.concat(data.lightScores);

        const avgLS = data.lightScores.length > 0
          ? Math.round(data.lightScores.reduce((a, b) => a + b, 0) / data.lightScores.length)
          : 0;

        return {
          actor_id: actorId,
          display_name: profile?.display_name || null,
          avatar_url: profile?.avatar_url || null,
          by_type: byType,
          total_fun: userTotalFun,
          total_passed: userPassed,
          total_failed: userFailed,
          avg_light_score: avgLS,
          mint_status: mintByUser.get(actorId) || "none",
        };
      });

      const totalActions = totalPassed + totalFailed;
      const avgLightScoreAll = allLightScores.length > 0
        ? Math.round(allLightScores.reduce((a, b) => a + b, 0) / allLightScores.length)
        : 0;

      setRows(resultRows);
      setOverview({
        totalFunPassed,
        totalActions,
        passRate: totalActions > 0 ? Math.round((totalPassed / totalActions) * 1000) / 10 : 0,
        usersWithPass,
        mintRequests: mintOverview,
        avgLightScore: avgLightScoreAll,
      });
    } catch (error) {
      console.error("Error fetching PPLP stats:", error);
      toast.error("Không thể tải dữ liệu FUN Money");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user, isAdmin, getDateFilter]);

  useEffect(() => {
    if (user && isAdmin) fetchData();
  }, [user, isAdmin, fetchData]);

  // ─── Realtime subscription ─────────────────────────────────
  useEffect(() => {
    if (!user || !isAdmin) return;

    const channel = supabase
      .channel("pplp-stats-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "pplp_actions" },
        () => fetchData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pplp_scores" },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isAdmin, fetchData]);

  // ─── Sorting & filtering ──────────────────────────────────
  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const filteredRows = useMemo(() => {
    let result = rows.filter((r) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        r.display_name?.toLowerCase().includes(q) ||
        r.actor_id.toLowerCase().includes(q)
      );
    });

    result.sort((a, b) => {
      let va: number | string = 0;
      let vb: number | string = 0;

      if (sortKey === "display_name") {
        va = a.display_name || "";
        vb = b.display_name || "";
        return sortAsc
          ? (va as string).localeCompare(vb as string)
          : (vb as string).localeCompare(va as string);
      }

      if (sortKey === "total_fun") { va = a.total_fun; vb = b.total_fun; }
      else if (sortKey === "total_passed") { va = a.total_passed; vb = b.total_passed; }
      else if (sortKey === "avg_light_score") { va = a.avg_light_score; vb = b.avg_light_score; }
      else {
        va = a.by_type[sortKey as ActionType]?.fun || 0;
        vb = b.by_type[sortKey as ActionType]?.fun || 0;
      }

      return sortAsc ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });

    return result;
  }, [rows, searchQuery, sortKey, sortAsc]);

  // ─── Checkbox logic ───────────────────────────────────────
  const eligibleRows = useMemo(() => filteredRows.filter(r => r.total_fun > 0), [filteredRows]);

  const toggleSelectUser = (actorId: string) => {
    setSelectedUsers(prev => {
      const next = new Set(prev);
      if (next.has(actorId)) next.delete(actorId);
      else next.add(actorId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === eligibleRows.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(eligibleRows.map(r => r.actor_id)));
    }
  };

  const selectedSummary = useMemo(() => {
    let totalFun = 0;
    let totalCamly = 0;
    const selected: Array<{ actor_id: string; display_name: string | null; fun: number; camly: number }> = [];
    for (const row of filteredRows) {
      if (selectedUsers.has(row.actor_id) && row.total_fun > 0) {
        totalFun += row.total_fun;
        const camly = row.total_fun * CAMLY_MULTIPLIER;
        totalCamly += camly;
        selected.push({
          actor_id: row.actor_id,
          display_name: row.display_name,
          fun: row.total_fun,
          camly,
        });
      }
    }
    return { totalFun, totalCamly, selected, count: selected.length };
  }, [selectedUsers, filteredRows]);

  // ─── Distribute reward ────────────────────────────────────
  const handleDistribute = async () => {
    if (selectedSummary.count === 0) return;
    setShowConfirmDialog(false);
    setIsDistributing(true);
    setDistributionProgress(0);

    try {
      const recipients = selectedSummary.selected.map(s => ({
        user_id: s.actor_id,
        fun_amount: s.fun,
      }));

      // Xử lý theo batch 20 user mỗi lần để tránh timeout
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
        } else if (data?.summary) {
          totalSuccess += data.summary.success_count || 0;
          totalSkipped += data.summary.skipped_count || 0;
          totalFailed += data.summary.failed_count || 0;
          totalCamlyDistributed += data.summary.total_camly_distributed || 0;
        }

        const progress = Math.min(100, Math.round(((i + batch.length) / recipients.length) * 100));
        setDistributionProgress(progress);
      }

      setDistributionProgress(100);

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

      if (totalSkipped > 0) {
        toast.info(`${totalSkipped} người dùng đã được thưởng trước đó (bỏ qua)`);
      }

      if (totalFailed > 0) {
        toast.error(`${totalFailed} người dùng thất bại`);
      }

      // Làm mới dữ liệu
      fetchData();
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
    const data = filteredRows.map((r, i) => {
      const row: Record<string, unknown> = {
        "#": i + 1,
        "User": r.display_name || r.actor_id.slice(0, 8),
      };
      for (const at of ACTION_TYPES) {
        row[ACTION_LABELS[at]] = r.by_type[at]?.fun || 0;
      }
      row["Tổng FUN"] = r.total_fun;
      row["Pass"] = r.total_passed;
      row["Fail"] = r.total_failed;
      row["Avg Light Score"] = r.avg_light_score;
      row["Mint Status"] = r.mint_status;
      return row;
    });

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("FUN Money Stats");
    if (data.length > 0) {
      ws.columns = Object.keys(data[0]).map(key => ({ header: key, key }));
      data.forEach(row => ws.addRow(row));
    }
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `fun-money-stats-${new Date().toISOString().slice(0, 10)}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Đã xuất Excel thành công!");
  };

  // ─── Format helpers ────────────────────────────────────────
  const formatNum = (n: number) => n.toLocaleString("vi-VN");

  const getMintBadge = (status: string) => {
    switch (status) {
      case "minted": return <Badge className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30 text-xs">✅ Minted</Badge>;
      case "signed": return <Badge className="bg-blue-500/20 text-blue-700 border-blue-500/30 text-xs">🔑 Signed</Badge>;
      case "pending": return <Badge className="bg-amber-500/20 text-amber-700 border-amber-500/30 text-xs">⏳ Pending</Badge>;
      case "expired": return <Badge className="bg-red-500/20 text-red-700 border-red-500/30 text-xs">⌛ Expired</Badge>;
      default: return <Badge variant="outline" className="text-xs">—</Badge>;
    }
  };

  // ─── Loading ───────────────────────────────────────────────
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-pale via-background to-background flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-foreground-muted">Đang tải dữ liệu FUN Money...</p>
        </div>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────
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
                  <h1 className="font-serif text-lg font-semibold text-primary-deep">FUN Money Stats</h1>
                  <p className="text-xs text-foreground-muted">Thống kê PPLP On-Chain</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={exportExcel}
                className="hidden sm:flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Excel
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchData()}
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline ml-1">Làm mới</span>
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

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Info Banner */}
        <div className="mb-6 p-4 rounded-xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-800/50">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>⚡ FUN Money (On-Chain)</strong> — Token BEP-20 được đánh giá qua giao thức PPLP (Light Score ≥ 60).
            Dữ liệu từ <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">pplp_actions</code> + <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">pplp_scores</code>.
            
          </p>
        </div>

        {/* Time Range Filter */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm user..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as typeof timeRange)}>
            <SelectTrigger className="w-[160px]">
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

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card className="border-divine-gold/20">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-divine-gold/10">
                  <Coins className="w-5 h-5 text-divine-gold" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">{formatNum(overview.totalFunPassed)}</p>
                  <p className="text-xs text-foreground-muted">FUN (Pass)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">{formatNum(overview.totalActions)}</p>
                  <p className="text-xs text-foreground-muted">Hành động PPLP</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-500/20">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">{overview.passRate}%</p>
                  <p className="text-xs text-foreground-muted">Tỷ lệ Pass</p>
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
                  <p className="text-lg font-bold text-foreground">{overview.usersWithPass}</p>
                  <p className="text-xs text-foreground-muted">Users đủ ĐK</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-500/20">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">
                    {overview.mintRequests.total} <span className="text-xs font-normal">({overview.mintRequests.signed} signed)</span>
                  </p>
                  <p className="text-xs text-foreground-muted">Mint Requests</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-500/20">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Star className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">{overview.avgLightScore}</p>
                  <p className="text-xs text-foreground-muted">Avg Light Score</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Bar — hiện khi có user được chọn */}
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedUsers(new Set())}
                  >
                    Bỏ chọn
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setShowConfirmDialog(true)}
                    disabled={isDistributing}
                  >
                    <Gift className="w-4 h-4 mr-2" />
                    Chuyển thưởng Lì xì
                  </Button>
                </div>
              </div>
              {isDistributing && (
                <div className="mt-3">
                  <Progress value={distributionProgress} className="h-2" />
                  <p className="text-xs text-amber-600 mt-1 text-center">
                    Đang xử lý... {distributionProgress}%
                  </p>
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
                    {/* Checkbox chọn tất cả */}
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
                      onClick={() => toggleSort("display_name")}
                    >
                      <span className="flex items-center gap-0.5">
                        User
                        <ArrowUpDown className={`w-2.5 h-2.5 flex-shrink-0 ${sortKey === "display_name" ? "text-primary" : "text-muted-foreground/40"}`} />
                      </span>
                    </th>
                    {ACTION_TYPES.map((at) => (
                      <th
                        key={at}
                        className="px-1.5 py-2 text-center font-medium cursor-pointer hover:text-primary transition-colors"
                        onClick={() => toggleSort(at)}
                        title={ACTION_LABELS[at]}
                      >
                        <span className="flex flex-col items-center gap-0.5 leading-tight">
                          <span className="text-base">{ACTION_ICONS[at]}</span>
                          <span className="text-[10px] leading-none">{ACTION_SHORT[at]}</span>
                          <ArrowUpDown className={`w-2 h-2 flex-shrink-0 ${sortKey === at ? "text-primary" : "text-muted-foreground/30"}`} />
                        </span>
                      </th>
                    ))}
                    <th
                      className="px-2 py-2 text-center font-semibold cursor-pointer hover:text-primary transition-colors"
                      onClick={() => toggleSort("total_fun")}
                    >
                      <span className="flex flex-col items-center gap-0.5 leading-tight">
                        <span className="text-base">💰</span>
                        <span className="text-[10px] leading-none">Tổng</span>
                        <ArrowUpDown className={`w-2 h-2 flex-shrink-0 ${sortKey === "total_fun" ? "text-primary" : "text-muted-foreground/30"}`} />
                      </span>
                    </th>
                    <th
                      className="px-2 py-2 text-center font-medium cursor-pointer hover:text-primary transition-colors"
                      onClick={() => toggleSort("total_passed")}
                    >
                      <span className="flex flex-col items-center gap-0.5 leading-tight">
                        <span className="text-base">✅</span>
                        <span className="text-[10px] leading-none">P/F</span>
                        <ArrowUpDown className={`w-2 h-2 flex-shrink-0 ${sortKey === "total_passed" ? "text-primary" : "text-muted-foreground/30"}`} />
                      </span>
                    </th>
                    <th
                      className="px-2 py-2 text-center font-medium cursor-pointer hover:text-primary transition-colors"
                      onClick={() => toggleSort("avg_light_score")}
                    >
                      <span className="flex flex-col items-center gap-0.5 leading-tight">
                        <span className="text-base">⭐</span>
                        <span className="text-[10px] leading-none">LS</span>
                        <ArrowUpDown className={`w-2 h-2 flex-shrink-0 ${sortKey === "avg_light_score" ? "text-primary" : "text-muted-foreground/30"}`} />
                      </span>
                    </th>
                    <th className="px-2 py-2 text-center font-medium">
                      <span className="flex flex-col items-center gap-0.5 leading-tight">
                        <span className="text-base">⛏️</span>
                        <span className="text-[10px] leading-none">Mint</span>
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={ACTION_TYPES.length + 7} className="text-center py-12 text-muted-foreground">
                        {searchQuery ? "Không tìm thấy user nào" : "Chưa có dữ liệu PPLP"}
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row, idx) => (
                      <tr key={row.actor_id} className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${selectedUsers.has(row.actor_id) ? "bg-amber-50/50 dark:bg-amber-950/20" : ""}`}>
                        {/* Checkbox */}
                        <td className="px-2 py-2.5 text-center">
                          {row.total_fun > 0 ? (
                            <Checkbox
                              checked={selectedUsers.has(row.actor_id)}
                              onCheckedChange={() => toggleSelectUser(row.actor_id)}
                              aria-label={`Chọn ${row.display_name || row.actor_id}`}
                            />
                          ) : (
                            <span className="text-muted-foreground/30">—</span>
                          )}
                        </td>
                        <td className="px-2 py-2.5 text-center text-muted-foreground">{idx + 1}</td>
                        <td className="px-2 py-2.5">
                          <div className="flex items-center gap-1.5">
                            {row.avatar_url ? (
                              <img src={row.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Users className="w-3 h-3 text-primary" />
                              </div>
                            )}
                            <span className="font-medium truncate max-w-[100px]" title={row.display_name || row.actor_id}>
                              {row.display_name || row.actor_id.slice(0, 8) + "..."}
                            </span>
                          </div>
                        </td>
                        {ACTION_TYPES.map((at) => {
                          const d = row.by_type[at];
                          return (
                            <td key={at} className="px-1.5 py-2.5 text-center tabular-nums">
                              {d && d.fun > 0 ? (
                                <span className="font-medium">{formatNum(d.fun)}</span>
                              ) : (
                                <span className="text-muted-foreground/30">—</span>
                              )}
                              {d && (d.passed > 0 || d.failed > 0) && (
                                <div className="text-[9px] leading-none mt-0.5">
                                  <span className="text-green-600">{d.passed}✓</span>
                                  {d.failed > 0 && <span className="text-red-400 ml-0.5">{d.failed}✗</span>}
                                </div>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-2 py-2.5 text-center font-bold tabular-nums text-primary">
                          {formatNum(row.total_fun)}
                        </td>
                        <td className="px-2 py-2.5 text-center">
                          <span className="text-green-600 font-medium">{row.total_passed}</span>
                          <span className="text-muted-foreground/30">/</span>
                          <span className="text-red-400">{row.total_failed}</span>
                        </td>
                        <td className="px-2 py-2.5 text-center">
                          {row.avg_light_score > 0 ? (
                            <span className={row.avg_light_score >= 60 ? "text-green-600 font-medium" : "text-amber-600"}>
                              {row.avg_light_score}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/30">—</span>
                          )}
                        </td>
                        <td className="px-2 py-2.5 text-center">
                          {getMintBadge(row.mint_status)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Dialog xác nhận chuyển thưởng */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-amber-600" />
              🧧 Xác nhận chuyển thưởng Lì xì Tết
            </DialogTitle>
            <DialogDescription>
              Công thức: 1 FUN Money = 1.000 Camly Coin. Áp dụng đến ngày 08/02/2026.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Tóm tắt */}
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

            {/* Danh sách user */}
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
                    <tr key={s.actor_id} className="border-t">
                      <td className="px-3 py-2">{s.display_name || s.actor_id.slice(0, 8) + "..."}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatNum(s.fun)}</td>
                      <td className="px-3 py-2 text-right tabular-nums font-semibold text-amber-600">{formatNum(s.camly)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowConfirmDialog(false)}>
              Huỷ
            </Button>
            <Button onClick={handleDistribute}>
              <Gift className="w-4 h-4 mr-2" />
              Xác nhận chuyển thưởng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Popup chúc mừng Lì xì */}
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

export default AdminMintStats;
