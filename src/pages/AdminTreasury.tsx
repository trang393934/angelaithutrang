import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminNavToolbar from "@/components/admin/AdminNavToolbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from "recharts";
import {
  Wallet, Gift, ExternalLink, Copy, Search, ChevronLeft, ChevronRight,
  TrendingUp, CheckCircle2, Clock, AlertCircle, Download, Vault
} from "lucide-react";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import { vi } from "date-fns/locale";

// Ví 1: 0x416336... — hoạt động TRƯỚC 12/02/2026 (chỉ rút thưởng Camly, đã dừng)
// Ví 2: 0x02D557... — hoạt động TỪ 12/02/2026 (cả lì xì Tết + rút thưởng mới)
// Phân tách dữ liệu theo ngày processed_at/claimed_at
const TREASURY_WALLET_1 = "0x416336c3b7ACAe89F47EAD2707412f20DA159ac8";
const TREASURY_WALLET_2 = "0x02D5578173bd0DB25462BB32A254Cd4b2E6D9a0D";
// Ngày ví 2 bắt đầu hoạt động
const VI2_START_DATE = new Date("2026-02-12T00:00:00Z");
const BSCSCAN_TX = "https://bscscan.com/tx/";
const BSCSCAN_ADDR = "https://bscscan.com/address/";
const PAGE_SIZE = 20;

// --- Helpers ---
const fmt = (n: number) => n.toLocaleString("vi-VN");
const shortAddr = (addr: string) =>
  addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "—";
const shortHash = (hash: string) =>
  hash ? `${hash.slice(0, 8)}...${hash.slice(-6)}` : "—";
const fmtDate = (dt: string) =>
  dt ? format(new Date(dt), "dd/MM HH:mm", { locale: vi }) : "—";
const fmtDateShort = (dt: string) =>
  dt ? format(new Date(dt), "dd/MM", { locale: vi }) : "—";

type Withdrawal = {
  id: string;
  wallet_address: string;
  amount: number;
  tx_hash: string | null;
  created_at: string;
  processed_at: string | null;
  status: string;
  profiles: { display_name: string | null; handle: string | null; avatar_url: string | null } | null;
};

type LixiClaim = {
  id: string;
  wallet_address: string | null;
  camly_amount: number;
  fun_amount: number | null;
  tx_hash: string | null;
  claimed_at: string | null;
  status: string;
  profiles: { display_name: string | null; handle: string | null; avatar_url: string | null } | null;
};

// Group records by date for chart
function groupByDate(records: { date: string; amount: number }[]) {
  const map: Record<string, number> = {};
  records.forEach(({ date, amount }) => {
    map[date] = (map[date] || 0) + amount;
  });
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, amount]) => ({ date, amount }));
}

// Copy to clipboard
function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).then(() => toast.success("Đã copy!"));
}

// Export CSV
function exportCSV(rows: Record<string, unknown>[], filename: string) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv = [keys.join(","), ...rows.map(r => keys.map(k => `"${r[k] ?? ""}"`).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// --- Sub-components ---
function WalletAddressChip({ address, label }: { address: string; label: string }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-muted-foreground text-xs">{label}</span>
      <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono">{shortAddr(address)}</code>
      <button onClick={() => copyToClipboard(address)} className="text-muted-foreground hover:text-foreground">
        <Copy className="w-3.5 h-3.5" />
      </button>
      <a href={`${BSCSCAN_ADDR}${address}`} target="_blank" rel="noopener noreferrer"
        className="text-primary hover:underline flex items-center gap-1 text-xs">
        BSCScan <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className={`rounded-xl border p-4 flex items-center gap-3 ${color}`}>
      <div className="rounded-lg p-2 bg-background/50">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-xl font-bold">{typeof value === "number" ? fmt(value) : value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
        {sub && <div className="text-[11px] text-muted-foreground/70">{sub}</div>}
      </div>
    </div>
  );
}

// Paginated table wrapper
function usePagination<T>(items: T[], pageSize: number) {
  const [page, setPage] = useState(0);
  const total = Math.ceil(items.length / pageSize);
  const paged = items.slice(page * pageSize, (page + 1) * pageSize);
  return { paged, page, total, setPage };
}

// --- Main Component ---
export default function AdminTreasury() {
  // All coin_withdrawals (completed)
  const [allWithdrawals, setAllWithdrawals] = useState<Withdrawal[]>([]);
  // All lixi_claims (completed)
  const [lixiClaims, setLixiClaims] = useState<LixiClaim[]>([]);
  // Pending
  const [pendingWithdrawals, setPendingWithdrawals] = useState<Withdrawal[]>([]);
  const [pendingLixi, setPendingLixi] = useState<LixiClaim[]>([]);
  const [loading, setLoading] = useState(true);

  const [v1Search, setV1Search] = useState("");
  const [v2Search, setV2Search] = useState("");

  // Fetch all data in parallel
  useEffect(() => {
    async function load() {
      setLoading(true);

      const [wRes, wPRes, lRes, lPRes] = await Promise.all([
        supabase
          .from("coin_withdrawals")
          .select("id, wallet_address, amount, tx_hash, created_at, processed_at, status, user_id")
          .eq("status", "completed")
          .order("created_at", { ascending: false })
          .limit(1000),
        supabase
          .from("coin_withdrawals")
          .select("id, wallet_address, amount, tx_hash, created_at, processed_at, status, user_id")
          .in("status", ["pending", "processing"])
          .order("created_at", { ascending: false })
          .limit(200),
        supabase
          .from("lixi_claims")
          .select("id, wallet_address, camly_amount, fun_amount, tx_hash, claimed_at, status, user_id")
          .eq("status", "completed")
          .order("claimed_at", { ascending: false })
          .limit(1000),
        supabase
          .from("lixi_claims")
          .select("id, wallet_address, camly_amount, fun_amount, tx_hash, claimed_at, status, user_id")
          .in("status", ["pending", "processing"])
          .order("claimed_at", { ascending: false })
          .limit(200),
      ]);

      // Collect all user_ids
      const allUserIds = [
        ...(wRes.data || []).map((r: { user_id: string }) => r.user_id),
        ...(wPRes.data || []).map((r: { user_id: string }) => r.user_id),
        ...(lRes.data || []).map((r: { user_id: string }) => r.user_id),
        ...(lPRes.data || []).map((r: { user_id: string }) => r.user_id),
      ].filter(Boolean);
      const uniqueIds = [...new Set(allUserIds)];

      // Fetch profiles
      const profileMap: Record<string, { display_name: string | null; handle: string | null; avatar_url: string | null }> = {};
      if (uniqueIds.length) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name, handle, avatar_url")
          .in("user_id", uniqueIds);
        (profiles || []).forEach((p: { user_id: string; display_name: string | null; handle: string | null; avatar_url: string | null }) => {
          profileMap[p.user_id] = { display_name: p.display_name, handle: p.handle, avatar_url: p.avatar_url };
        });
      }

      const attachProfile = (r: { user_id: string }) => ({ ...r, profiles: profileMap[r.user_id] || null });

      setAllWithdrawals(((wRes.data || []) as { user_id: string }[]).map(attachProfile) as unknown as Withdrawal[]);
      setPendingWithdrawals(((wPRes.data || []) as { user_id: string }[]).map(attachProfile) as unknown as Withdrawal[]);
      setLixiClaims(((lRes.data || []) as { user_id: string }[]).map(attachProfile) as unknown as LixiClaim[]);
      setPendingLixi(((lPRes.data || []) as { user_id: string }[]).map(attachProfile) as unknown as LixiClaim[]);
      setLoading(false);
    }
    load();
  }, []);

  // ─── Phân tách dữ liệu theo ví ───
  // Ví 1 (0x416336...): coin_withdrawals được tạo TRƯỚC 12/02/2026
  const vi1Records = useMemo(() =>
    allWithdrawals.filter(w => new Date(w.created_at) < VI2_START_DATE),
  [allWithdrawals]);

  // Ví 2 (0x02D557...): coin_withdrawals từ 12/02 + tất cả lixi_claims
  const vi2Withdrawals = useMemo(() =>
    allWithdrawals.filter(w => new Date(w.created_at) >= VI2_START_DATE),
  [allWithdrawals]);

  // Pending cho Ví 1 (tạo trước 12/02) vs Ví 2 (từ 12/02)
  const pendingV1 = useMemo(() =>
    pendingWithdrawals.filter(w => new Date(w.created_at) < VI2_START_DATE),
  [pendingWithdrawals]);
  const pendingV2Withdrawals = useMemo(() =>
    pendingWithdrawals.filter(w => new Date(w.created_at) >= VI2_START_DATE),
  [pendingWithdrawals]);

  // Stats Ví 1
  const v1Stats = useMemo(() => {
    if (!vi1Records.length) return null;
    const totalCamly = vi1Records.reduce((s, w) => s + w.amount, 0);
    const sorted = [...vi1Records].sort((a, b) => a.created_at.localeCompare(b.created_at));
    const first = sorted[0]?.created_at;
    const last = sorted[sorted.length - 1]?.created_at;
    const days = first && last ? differenceInDays(new Date(last), new Date(first)) + 1 : 0;
    return { totalTx: vi1Records.length, totalCamly, first, last, days, pending: pendingV1.length };
  }, [vi1Records, pendingV1]);

  // Stats Ví 2: rút thưởng mới + lì xì
  const v2Stats = useMemo(() => {
    const totalCamlyW = vi2Withdrawals.reduce((s, w) => s + w.amount, 0);
    const totalCamlyL = lixiClaims.reduce((s, l) => s + l.camly_amount, 0);
    const totalFun = lixiClaims.reduce((s, l) => s + (l.fun_amount || 0), 0);
    const totalTx = vi2Withdrawals.length + lixiClaims.length;
    const totalCamly = totalCamlyW + totalCamlyL;
    const allDates = [
      ...vi2Withdrawals.map(w => w.created_at),
      ...lixiClaims.map(l => l.claimed_at || ""),
    ].filter(Boolean).sort();
    const first = allDates[0];
    const last = allDates[allDates.length - 1];
    const days = first && last ? differenceInDays(new Date(last), new Date(first)) + 1 : 0;
    const pending = pendingV2Withdrawals.length + pendingLixi.length;
    return { totalTx, totalCamly, totalCamlyW, totalCamlyL, totalFun, first, last, days, pending };
  }, [vi2Withdrawals, lixiClaims, pendingV2Withdrawals, pendingLixi]);

  // Chart Ví 1: rút thưởng theo ngày (dùng created_at)
  const v1ChartData = useMemo(() =>
    groupByDate(vi1Records.map(w => ({
      date: fmtDateShort(w.created_at),
      amount: w.amount / 1_000_000,
    }))), [vi1Records]);

  // Chart Ví 2: rút thưởng mới + lì xì theo ngày
  const v2ChartData = useMemo(() => {
    const entries = [
      ...vi2Withdrawals.map(w => ({ date: fmtDateShort(w.created_at), amount: w.amount / 1_000_000 })),
      ...lixiClaims.map(l => ({ date: fmtDateShort(l.claimed_at || ""), amount: l.camly_amount / 1_000_000 })),
    ];
    return groupByDate(entries);
  }, [vi2Withdrawals, lixiClaims]);

  // Combined chart
  const combinedChart = useMemo(() => {
    const v1Map: Record<string, number> = {};
    const v2Map: Record<string, number> = {};
    vi1Records.forEach(w => {
      const d = fmtDateShort(w.created_at);
      v1Map[d] = (v1Map[d] || 0) + w.amount / 1_000_000;
    });
    vi2Withdrawals.forEach(w => {
      const d = fmtDateShort(w.created_at);
      v2Map[d] = (v2Map[d] || 0) + w.amount / 1_000_000;
    });
    lixiClaims.forEach(l => {
      const d = fmtDateShort(l.claimed_at || "");
      v2Map[d] = (v2Map[d] || 0) + l.camly_amount / 1_000_000;
    });
    const allDates = [...new Set([...Object.keys(v1Map), ...Object.keys(v2Map)])].sort();
    return allDates.map(date => ({
      date,
      "Ví 1": +(v1Map[date] || 0).toFixed(2),
      "Ví 2": +(v2Map[date] || 0).toFixed(2),
    }));
  }, [vi1Records, vi2Withdrawals, lixiClaims]);

  // Ví 1: chỉ có coin_withdrawals trước 12/02
  const filteredV1 = useMemo(() => {
    const base = vi1Records;
    if (!v1Search) return base;
    const q = v1Search.toLowerCase();
    return base.filter(w =>
      (w.profiles?.display_name?.toLowerCase().includes(q)) ||
      (w.profiles?.handle?.toLowerCase().includes(q)) ||
      (w.wallet_address?.toLowerCase().includes(q))
    );
  }, [vi1Records, v1Search]);

  // Ví 2: coin_withdrawals mới + tất cả lixi_claims, gộp và sort theo ngày
  const v2AllRecords = useMemo(() => {
    type V2Row = {
      id: string;
      date: string;
      wallet_address: string | null;
      camly: number;
      fun?: number | null;
      tx_hash: string | null;
      profiles: { display_name: string | null; handle: string | null; avatar_url: string | null } | null;
      type: "withdrawal" | "lixi";
    };
    const rows: V2Row[] = [
      ...vi2Withdrawals.map(w => ({
        id: w.id,
        date: w.created_at,
        wallet_address: w.wallet_address,
        camly: w.amount,
        fun: null as null,
        tx_hash: w.tx_hash,
        profiles: w.profiles,
        type: "withdrawal" as const,
      })),
      ...lixiClaims.map(l => ({
        id: l.id,
        date: l.claimed_at || "",
        wallet_address: l.wallet_address,
        camly: l.camly_amount,
        fun: l.fun_amount,
        tx_hash: l.tx_hash,
        profiles: l.profiles,
        type: "lixi" as const,
      })),
    ];
    rows.sort((a, b) => b.date.localeCompare(a.date));
    return rows;
  }, [vi2Withdrawals, lixiClaims]);

  const filteredV2 = useMemo(() => {
    if (!v2Search) return v2AllRecords;
    const q = v2Search.toLowerCase();
    return v2AllRecords.filter(r =>
      (r.profiles?.display_name?.toLowerCase().includes(q)) ||
      (r.profiles?.handle?.toLowerCase().includes(q)) ||
      (r.wallet_address?.toLowerCase().includes(q))
    );
  }, [v2AllRecords, v2Search]);

  const v1Pagination = usePagination(filteredV1, PAGE_SIZE);
  const v2Pagination = usePagination(filteredV2, PAGE_SIZE);

  // Export handlers
  const exportV1 = () => exportCSV(
    filteredV1.map(w => ({
      "Thời gian": fmtDate(w.created_at),
      "Người nhận": w.profiles?.display_name || w.profiles?.handle || "—",
      "Ví nhận": w.wallet_address,
      "Camly": w.amount,
      "Tx Hash": w.tx_hash || "",
    })),
    `vi-1-phat-thuong-${format(new Date(), "yyyyMMdd")}.csv`
  );
  const exportV2 = () => exportCSV(
    filteredV2.map(r => ({
      "Thời gian": fmtDate(r.date),
      "Loại": r.type === "lixi" ? "Lì xì Tết" : "Rút thưởng",
      "Người nhận": r.profiles?.display_name || r.profiles?.handle || "—",
      "Ví nhận": r.wallet_address || "",
      "Camly": r.camly,
      "FUN": r.fun || "",
      "Tx Hash": r.tx_hash || "",
    })),
    `vi-2-phat-thuong-${format(new Date(), "yyyyMMdd")}.csv`
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminNavToolbar />
        <div className="container mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNavToolbar />
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/30">
            <Vault className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Ví Phát Thưởng Treasury</h1>
            <p className="text-sm text-muted-foreground">Tổng hợp toàn bộ lịch sử phát thưởng on-chain của hệ thống Angel AI</p>
          </div>
        </div>

        {/* Summary Cards — 2 ví */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Ví 1 */}
          <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Wallet className="w-4 h-4 text-blue-500" />
                Ví 1
                <span className="text-xs font-normal text-muted-foreground ml-1">(đã dừng hoạt động)</span>
              </CardTitle>
              <WalletAddressChip address={TREASURY_WALLET_1} label="Địa chỉ:" />
              {v1Stats && (
                <p className="text-xs text-muted-foreground mt-1">
                  🗓️ {fmtDate(v1Stats.first!)} → {fmtDate(v1Stats.last!)} ({v1Stats.days} ngày)
                </p>
              )}
            </CardHeader>
            <CardContent>
              {v1Stats ? (
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{fmt(v1Stats.totalTx)}</div>
                    <div className="text-xs text-muted-foreground">GD hoàn thành</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{fmt(v1Stats.totalCamly)}</div>
                    <div className="text-xs text-muted-foreground">Camly phát ra</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-amber-500">{fmt(v1Stats.pending)}</div>
                    <div className="text-xs text-muted-foreground">Chờ xử lý</div>
                  </div>
                </div>
              ) : <div className="text-sm text-muted-foreground">Không có dữ liệu</div>}
            </CardContent>
          </Card>

          {/* Ví 2 */}
          <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-500" />
                Ví 2
                <span className="text-xs font-normal text-muted-foreground ml-1">(đang hoạt động)</span>
              </CardTitle>
              <WalletAddressChip address={TREASURY_WALLET_2} label="Địa chỉ:" />
              {v2Stats.first && (
                <p className="text-xs text-muted-foreground mt-1">
                  🗓️ {fmtDate(v2Stats.first)} → {fmtDate(v2Stats.last!)} ({v2Stats.days} ngày)
                </p>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{fmt(v2Stats.totalTx)}</div>
                  <div className="text-xs text-muted-foreground">GD hoàn thành</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{fmt(v2Stats.totalCamly)}</div>
                  <div className="text-xs text-muted-foreground">Camly phát ra</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-amber-500">{fmt(v2Stats.pending)}</div>
                  <div className="text-xs text-muted-foreground">Chờ xử lý</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Grand Total Banner */}
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800">
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center justify-center gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                  {fmt((v1Stats?.totalTx || 0) + v2Stats.totalTx)}
                </div>
                <div className="text-xs text-muted-foreground">Tổng giao dịch hệ thống</div>
              </div>
              <div className="w-px h-10 bg-amber-200 dark:bg-amber-700 hidden sm:block" />
              <div>
                <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                  {fmt((v1Stats?.totalCamly || 0) + v2Stats.totalCamly)}
                </div>
                <div className="text-xs text-muted-foreground">Tổng Camly đã phát ra</div>
              </div>
              <div className="w-px h-10 bg-amber-200 dark:bg-amber-700 hidden sm:block" />
              <div>
                <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">{fmt(v2Stats.totalFun)}</div>
                <div className="text-xs text-muted-foreground">Tổng FUN đã phát (Lì Xì)</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs chi tiết */}
        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">📊 Tổng hợp</TabsTrigger>
            <TabsTrigger value="vi1">💰 Ví 1</TabsTrigger>
            <TabsTrigger value="vi2">💰 Ví 2</TabsTrigger>
          </TabsList>

          {/* ─── Tab: Tổng hợp ─── */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Biểu đồ phát thưởng theo ngày (triệu Camly)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={combinedChart} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => [`${v.toFixed(2)}M Camly`]} />
                    <Legend />
                    <Bar dataKey="Ví 1" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Ví 2" fill="#10b981" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">So sánh 2 ví treasury</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 text-muted-foreground font-medium">Chỉ số</th>
                        <th className="text-center py-2 px-3 text-blue-600 dark:text-blue-400 font-semibold">💰 Ví 1</th>
                        <th className="text-center py-2 px-3 text-emerald-600 dark:text-emerald-400 font-semibold">💰 Ví 2</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {[
                        ["Địa chỉ ví", shortAddr(TREASURY_WALLET_1), shortAddr(TREASURY_WALLET_2)],
                        ["GD hoàn thành", fmt(v1Stats?.totalTx || 0), fmt(v2Stats.totalTx)],
                        ["Tổng Camly phát ra", fmt(v1Stats?.totalCamly || 0), fmt(v2Stats.totalCamly)],
                        ["Chờ xử lý", fmt(v1Stats?.pending || 0), fmt(v2Stats.pending)],
                        ["Ngày bắt đầu", v1Stats?.first ? format(new Date(v1Stats.first), "dd/MM/yyyy") : "—", v2Stats.first ? format(new Date(v2Stats.first), "dd/MM/yyyy") : "—"],
                        ["Ngày cuối", v1Stats?.last ? format(new Date(v1Stats.last), "dd/MM/yyyy") : "—", v2Stats.last ? format(new Date(v2Stats.last), "dd/MM/yyyy") : "—"],
                        ["Trạng thái", "Đã dừng", "Đang hoạt động"],
                      ].map(([label, v1, v2]) => (
                        <tr key={label as string} className="hover:bg-muted/30">
                          <td className="py-2 px-3 text-muted-foreground">{label}</td>
                          <td className="py-2 px-3 text-center font-mono text-xs">{v1}</td>
                          <td className="py-2 px-3 text-center font-mono text-xs">{v2}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Tab: Ví 1 ─── */}
          <TabsContent value="vi1" className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="GD hoàn thành" value={v1Stats?.totalTx || 0} icon={CheckCircle2} color="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20" />
              <StatCard label="Camly phát ra" value={v1Stats?.totalCamly || 0} icon={Wallet} color="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20" />
              <StatCard label="Chờ xử lý" value={v1Stats?.pending || 0} icon={Clock} color="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20" />
              <StatCard label="Ngày hoạt động" value={v1Stats?.days || 0} sub="ngày" icon={TrendingUp} color="border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20" />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">Camly phát theo ngày — Ví 1 (triệu Camly)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={v1ChartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v: number) => [`${v.toFixed(2)}M Camly`]} />
                    <Bar dataKey="amount" fill="#3b82f6" name="Camly" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <CardTitle className="text-base">Lịch sử Ví 1 ({filteredV1.length} giao dịch)</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input placeholder="Tìm tên / địa chỉ..." value={v1Search}
                        onChange={e => { setV1Search(e.target.value); v1Pagination.setPage(0); }}
                        className="pl-8 h-8 text-xs w-48" />
                    </div>
                    <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={exportV1}>
                      <Download className="w-3.5 h-3.5" /> CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50">
                      <tr>
                        {["Thời gian", "Người nhận", "Ví nhận", "Camly", "Tx Hash", "Trạng thái"].map(h => (
                          <th key={h} className="text-left py-2.5 px-3 text-muted-foreground font-medium whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {v1Pagination.paged.map((w: Withdrawal) => (
                        <tr key={w.id} className="hover:bg-muted/30">
                          <td className="py-2 px-3 whitespace-nowrap text-muted-foreground">{fmtDate(w.created_at)}</td>
                          <td className="py-2 px-3 font-medium">{w.profiles?.display_name || w.profiles?.handle || "—"}</td>
                          <td className="py-2 px-3 font-mono">
                            <div className="flex items-center gap-1">
                              <span>{shortAddr(w.wallet_address)}</span>
                              <button onClick={() => copyToClipboard(w.wallet_address)} className="text-muted-foreground hover:text-foreground">
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                          <td className="py-2 px-3 text-right font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                            {fmt(w.amount)}
                          </td>
                          <td className="py-2 px-3 font-mono">
                            {w.tx_hash ? (
                              <a href={`${BSCSCAN_TX}${w.tx_hash}`} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1 text-primary hover:underline">
                                {shortHash(w.tx_hash)} <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : <span className="text-muted-foreground">—</span>}
                          </td>
                          <td className="py-2 px-3">
                            <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800">
                              ✅ Hoàn thành
                            </Badge>
                          </td>
                        </tr>
                      ))}
                      {v1Pagination.paged.length === 0 && (
                        <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">Không có dữ liệu</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {v1Pagination.total > 1 && (
                  <div className="flex items-center justify-between px-3 py-2 border-t">
                    <span className="text-xs text-muted-foreground">
                      Trang {v1Pagination.page + 1}/{v1Pagination.total} · {filteredV1.length} GD
                    </span>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="h-7 w-7 p-0"
                        disabled={v1Pagination.page === 0}
                        onClick={() => v1Pagination.setPage(p => p - 1)}>
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 w-7 p-0"
                        disabled={v1Pagination.page >= v1Pagination.total - 1}
                        onClick={() => v1Pagination.setPage(p => p + 1)}>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Tab: Ví 2 ─── */}
          <TabsContent value="vi2" className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="GD hoàn thành" value={v2Stats.totalTx} icon={CheckCircle2} color="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20" />
              <StatCard label="Camly phát ra" value={v2Stats.totalCamly} icon={Wallet} color="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20" />
              <StatCard label="FUN phát ra" value={v2Stats.totalFun} icon={Gift} color="border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20" />
              <StatCard label="Chờ xử lý" value={v2Stats.pending} icon={Clock} color="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20" />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">Camly phát theo ngày — Ví 2 (triệu Camly)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={v2ChartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v: number) => [`${v.toFixed(2)}M Camly`]} />
                    <Bar dataKey="amount" fill="#10b981" name="Camly" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <CardTitle className="text-base">Lịch sử Ví 2 ({filteredV2.length} giao dịch)</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input placeholder="Tìm tên / địa chỉ..." value={v2Search}
                        onChange={e => { setV2Search(e.target.value); v2Pagination.setPage(0); }}
                        className="pl-8 h-8 text-xs w-48" />
                    </div>
                    <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={exportV2}>
                      <Download className="w-3.5 h-3.5" /> CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50">
                      <tr>
                        {["Thời gian", "Loại", "Người nhận", "Ví nhận", "Camly", "FUN", "Tx Hash", "Trạng thái"].map(h => (
                          <th key={h} className="text-left py-2.5 px-3 text-muted-foreground font-medium whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {v2Pagination.paged.map(r => (
                        <tr key={r.id} className="hover:bg-muted/30">
                          <td className="py-2 px-3 whitespace-nowrap text-muted-foreground">{fmtDate(r.date)}</td>
                          <td className="py-2 px-3">
                            <Badge variant="outline" className={`text-[10px] ${r.type === "lixi" ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800" : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800"}`}>
                              {r.type === "lixi" ? "🧧 Lì Xì" : "💰 Rút thưởng"}
                            </Badge>
                          </td>
                          <td className="py-2 px-3 font-medium">{r.profiles?.display_name || r.profiles?.handle || "—"}</td>
                          <td className="py-2 px-3 font-mono">
                            {r.wallet_address ? (
                              <div className="flex items-center gap-1">
                                <span>{shortAddr(r.wallet_address)}</span>
                                <button onClick={() => copyToClipboard(r.wallet_address!)} className="text-muted-foreground hover:text-foreground">
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            ) : <span className="text-muted-foreground">—</span>}
                          </td>
                          <td className="py-2 px-3 text-right font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                            {fmt(r.camly)}
                          </td>
                          <td className="py-2 px-3 text-right text-orange-600 dark:text-orange-400 whitespace-nowrap">
                            {r.fun ? fmt(r.fun) : "—"}
                          </td>
                          <td className="py-2 px-3 font-mono">
                            {r.tx_hash ? (
                              <a href={`${BSCSCAN_TX}${r.tx_hash}`} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1 text-primary hover:underline">
                                {shortHash(r.tx_hash)} <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : <span className="text-muted-foreground">—</span>}
                          </td>
                          <td className="py-2 px-3">
                            <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800">
                              ✅ Hoàn thành
                            </Badge>
                          </td>
                        </tr>
                      ))}
                      {v2Pagination.paged.length === 0 && (
                        <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">Không có dữ liệu</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {v2Pagination.total > 1 && (
                  <div className="flex items-center justify-between px-3 py-2 border-t">
                    <span className="text-xs text-muted-foreground">
                      Trang {v2Pagination.page + 1}/{v2Pagination.total} · {filteredV2.length} GD
                    </span>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="h-7 w-7 p-0"
                        disabled={v2Pagination.page === 0}
                        onClick={() => v2Pagination.setPage(p => p - 1)}>
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 w-7 p-0"
                        disabled={v2Pagination.page >= v2Pagination.total - 1}
                        onClick={() => v2Pagination.setPage(p => p + 1)}>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
