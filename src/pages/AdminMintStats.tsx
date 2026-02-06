import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  ArrowLeft, Sparkles, LogOut, RefreshCw, Search, Download,
  Coins, Users, TrendingUp, Calendar, CheckCircle, XCircle,
  ArrowUpDown, Zap, Star
} from "lucide-react";
import angelAvatar from "@/assets/angel-avatar.png";
import * as XLSX from "xlsx";

// ─── Types ───────────────────────────────────────────────────
const ACTION_TYPES = [
  "QUESTION_ASK",
  "POST_CREATE",
  "GRATITUDE_PRACTICE",
  "CONTENT_CREATE",
  "JOURNAL_WRITE",
  "LEARN_COMPLETE",
] as const;

type ActionType = typeof ACTION_TYPES[number];

const ACTION_LABELS: Record<string, string> = {
  QUESTION_ASK: "Hỏi đáp",
  POST_CREATE: "Đăng bài",
  GRATITUDE_PRACTICE: "Biết ơn",
  CONTENT_CREATE: "Tạo nội dung",
  JOURNAL_WRITE: "Nhật ký",
  LEARN_COMPLETE: "Học tập",
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

      // 1) Fetch pplp_actions + pplp_scores
      let actionsQuery = supabase
        .from("pplp_actions")
        .select("id, actor_id, action_type, created_at");
      if (dateFilter) actionsQuery = actionsQuery.gte("created_at", dateFilter);
      const { data: actionsRaw, error: actionsErr } = await actionsQuery;
      if (actionsErr) throw actionsErr;

      const actionIds = (actionsRaw || []).map((a) => a.id);

      // Fetch scores in batches of 500 to stay under limits
      let allScores: Array<{
        action_id: string;
        decision: string;
        final_reward: number;
        light_score: number;
      }> = [];
      for (let i = 0; i < actionIds.length; i += 500) {
        const batch = actionIds.slice(i, i + 500);
        const { data: scoresData, error: scoresErr } = await supabase
          .from("pplp_scores")
          .select("action_id, decision, final_reward, light_score")
          .in("action_id", batch);
        if (scoresErr) throw scoresErr;
        allScores = allScores.concat((scoresData || []) as typeof allScores);
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
        // Keep best status per user
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

  // ─── Export Excel ──────────────────────────────────────────
  const exportExcel = () => {
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

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "FUN Money Stats");
    XLSX.writeFile(wb, `fun-money-stats-${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success("Đã xuất Excel thành công!");
  };

  // ─── Format helpers ────────────────────────────────────────
  const formatNum = (n: number) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
    if (n >= 1000) return (n / 1000).toFixed(1) + "K";
    return n.toLocaleString();
  };

  const getMintBadge = (status: string) => {
    switch (status) {
      case "minted": return <Badge className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30 text-xs">✅ Minted</Badge>;
      case "signed": return <Badge className="bg-blue-500/20 text-blue-700 border-blue-500/30 text-xs">🔑 Signed</Badge>;
      case "pending": return <Badge className="bg-amber-500/20 text-amber-700 border-amber-500/30 text-xs">⏳ Pending</Badge>;
      case "expired": return <Badge className="bg-red-500/20 text-red-700 border-red-500/30 text-xs">⌛ Expired</Badge>;
      default: return <Badge variant="outline" className="text-xs">—</Badge>;
    }
  };

  const SortHeader = ({ label, sortKeyName, className = "" }: { label: string; sortKeyName: SortKey; className?: string }) => (
    <TableHead
      className={`cursor-pointer hover:text-primary transition-colors select-none whitespace-nowrap ${className}`}
      onClick={() => toggleSort(sortKeyName)}
    >
      <span className="flex items-center gap-1">
        {label}
        <ArrowUpDown className={`w-3 h-3 ${sortKey === sortKeyName ? "text-primary" : "text-muted-foreground/40"}`} />
      </span>
    </TableHead>
  );

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
                  <p className="text-xs text-foreground-muted">Thống kê PPLP On-Chain (KHÔNG phải Camly Coin)</p>
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
            <span className="ml-2 text-xs opacity-70">KHÔNG phải Camly Coin off-chain.</span>
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

        {/* Main Table */}
        <Card className="border-divine-gold/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Coins className="w-5 h-5 text-divine-gold" />
              Chi tiết FUN Money theo User ({filteredRows.length} users)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-12 text-center">#</TableHead>
                    <SortHeader label="User" sortKeyName="display_name" className="min-w-[160px]" />
                    {ACTION_TYPES.map((at) => (
                      <SortHeader
                        key={at}
                        label={ACTION_LABELS[at]}
                        sortKeyName={at}
                        className="text-right"
                      />
                    ))}
                    <SortHeader label="Tổng FUN" sortKeyName="total_fun" className="text-right" />
                    <SortHeader label="Pass" sortKeyName="total_passed" className="text-center" />
                    <SortHeader label="Avg LS" sortKeyName="avg_light_score" className="text-center" />
                    <TableHead className="text-center whitespace-nowrap">Mint</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={ACTION_TYPES.length + 5} className="text-center py-12 text-muted-foreground">
                        {searchQuery ? "Không tìm thấy user nào" : "Chưa có dữ liệu PPLP"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRows.map((row, idx) => (
                      <TableRow key={row.actor_id} className="hover:bg-muted/30">
                        <TableCell className="text-center text-muted-foreground text-sm">{idx + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {row.avatar_url ? (
                              <img src={row.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                                <Users className="w-3.5 h-3.5 text-primary" />
                              </div>
                            )}
                            <span className="font-medium text-sm truncate max-w-[120px]">
                              {row.display_name || row.actor_id.slice(0, 8) + "..."}
                            </span>
                          </div>
                        </TableCell>
                        {ACTION_TYPES.map((at) => {
                          const d = row.by_type[at];
                          return (
                            <TableCell key={at} className="text-right text-sm tabular-nums">
                              {d && d.fun > 0 ? (
                                <span className="font-medium">{formatNum(d.fun)}</span>
                              ) : (
                                <span className="text-muted-foreground/40">—</span>
                              )}
                              {d && (d.passed > 0 || d.failed > 0) && (
                                <div className="text-[10px] text-muted-foreground">
                                  <span className="text-green-600">{d.passed}✓</span>
                                  {d.failed > 0 && <span className="text-red-400 ml-1">{d.failed}✗</span>}
                                </div>
                              )}
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-right font-bold text-sm tabular-nums text-divine-gold">
                          {formatNum(row.total_fun)}
                        </TableCell>
                        <TableCell className="text-center text-sm">
                          <span className="text-green-600 font-medium">{row.total_passed}</span>
                          <span className="text-muted-foreground/40 mx-0.5">/</span>
                          <span className="text-red-400">{row.total_failed}</span>
                        </TableCell>
                        <TableCell className="text-center text-sm">
                          {row.avg_light_score > 0 ? (
                            <span className={row.avg_light_score >= 60 ? "text-green-600 font-medium" : "text-amber-600"}>
                              {row.avg_light_score}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {getMintBadge(row.mint_status)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminMintStats;
