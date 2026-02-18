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

// Verified via BSCScan: Both withdrawal types use the SAME sender wallet
// coin_withdrawals (Ví 1) & lixi_claims (Ví 2) → From: 0x416336c3b7ACAe89A47EAD2707412f20DA159ac8
const TREASURY_WALLET_1 = "0x416336c3b7ACAe89A47EAD2707412f20DA159ac8"; // Ví 1: Rút thưởng Camly (coin_withdrawals)
const TREASURY_WALLET_2 = "0x416336c3b7ACAe89A47EAD2707412f20DA159ac8"; // Ví 2: Lì Xì Tết (lixi_claims) — cùng ví 1
const TREASURY_WALLET_RESERVE = "0x02D5578173bd0DB25462BB32A254Cd4b2E6D9a0D"; // Ví dự phòng (chưa có tx ghi nhận)
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
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [lixiClaims, setLixiClaims] = useState<LixiClaim[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<Withdrawal[]>([]);
  const [pendingLixi, setPendingLixi] = useState<LixiClaim[]>([]);
  const [loading, setLoading] = useState(true);

  const [wSearch, setWSearch] = useState("");
  const [lSearch, setLSearch] = useState("");

  // Fetch all data in parallel
  useEffect(() => {
    async function load() {
      setLoading(true);

      // Fetch withdrawals + profiles via separate join on user_id -> profiles
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

      setWithdrawals(((wRes.data || []) as { user_id: string }[]).map(attachProfile) as unknown as Withdrawal[]);
      setPendingWithdrawals(((wPRes.data || []) as { user_id: string }[]).map(attachProfile) as unknown as Withdrawal[]);
      setLixiClaims(((lRes.data || []) as { user_id: string }[]).map(attachProfile) as unknown as LixiClaim[]);
      setPendingLixi(((lPRes.data || []) as { user_id: string }[]).map(attachProfile) as unknown as LixiClaim[]);
      setLoading(false);
    }
    load();
  }, []);

  // Stats
  const wStats = useMemo(() => {
    if (!withdrawals.length) return null;
    const totalCamly = withdrawals.reduce((s, w) => s + w.amount, 0);
    const first = withdrawals[withdrawals.length - 1]?.created_at;
    const last = withdrawals[0]?.created_at;
    const days = first && last ? differenceInDays(new Date(last), new Date(first)) + 1 : 0;
    return { totalTx: withdrawals.length, totalCamly, first, last, days, pending: pendingWithdrawals.length };
  }, [withdrawals, pendingWithdrawals]);

  const lStats = useMemo(() => {
    if (!lixiClaims.length) return null;
    const totalCamly = lixiClaims.reduce((s, l) => s + l.camly_amount, 0);
    const totalFun = lixiClaims.reduce((s, l) => s + (l.fun_amount || 0), 0);
    const first = lixiClaims[lixiClaims.length - 1]?.claimed_at || "";
    const last = lixiClaims[0]?.claimed_at || "";
    const days = first && last ? differenceInDays(new Date(last), new Date(first)) + 1 : 0;
    return { totalTx: lixiClaims.length, totalCamly, totalFun, first, last, days, pending: pendingLixi.length };
  }, [lixiClaims, pendingLixi]);

  // Chart data for withdrawals
  const wChartData = useMemo(() =>
    groupByDate(withdrawals.map(w => ({
      date: fmtDateShort(w.created_at),
      amount: w.amount / 1_000_000,
    }))), [withdrawals]);

  // Chart data for lixi
  const lChartData = useMemo(() =>
    groupByDate(lixiClaims.map(l => ({
      date: fmtDateShort(l.claimed_at || ""),
      amount: l.camly_amount / 1_000_000,
    }))), [lixiClaims]);

  // Combined chart
  const combinedChart = useMemo(() => {
    const wMap: Record<string, number> = {};
    const lMap: Record<string, number> = {};
    withdrawals.forEach(w => {
      const d = fmtDateShort(w.created_at);
      wMap[d] = (wMap[d] || 0) + w.amount / 1_000_000;
    });
    lixiClaims.forEach(l => {
      const d = fmtDateShort(l.claimed_at || "");
      lMap[d] = (lMap[d] || 0) + l.camly_amount / 1_000_000;
    });
    const allDates = [...new Set([...Object.keys(wMap), ...Object.keys(lMap)])].sort();
    return allDates.map(date => ({
      date,
      "Ví 1": +(wMap[date] || 0).toFixed(2),
      "Ví 2": +(lMap[date] || 0).toFixed(2),
    }));
  }, [withdrawals, lixiClaims]);

  // Filtered withdrawals
  const filteredW = useMemo(() => {
    if (!wSearch) return withdrawals;
    const q = wSearch.toLowerCase();
    return withdrawals.filter(w =>
      (w.profiles?.display_name?.toLowerCase().includes(q)) ||
      (w.profiles?.handle?.toLowerCase().includes(q)) ||
      (w.wallet_address?.toLowerCase().includes(q))
    );
  }, [withdrawals, wSearch]);

  // Filtered lixi
  const filteredL = useMemo(() => {
    if (!lSearch) return lixiClaims;
    const q = lSearch.toLowerCase();
    return lixiClaims.filter(l =>
      (l.profiles?.display_name?.toLowerCase().includes(q)) ||
      (l.profiles?.handle?.toLowerCase().includes(q)) ||
      (l.wallet_address?.toLowerCase().includes(q))
    );
  }, [lixiClaims, lSearch]);

  const wPagination = usePagination(filteredW, PAGE_SIZE);
  const lPagination = usePagination(filteredL, PAGE_SIZE);

  // Export handlers
  const exportWithdrawals = () => exportCSV(
    filteredW.map(w => ({
      "Thời gian": fmtDate(w.created_at),
      "Người nhận": w.profiles?.display_name || w.profiles?.handle || "—",
      "Ví nhận": w.wallet_address,
      "Camly": w.amount,
      "Tx Hash": w.tx_hash || "",
    })),
    `ví-rút-thưởng-${format(new Date(), "yyyyMMdd")}.csv`
  );
  const exportLixi = () => exportCSV(
    filteredL.map(l => ({
      "Thời gian": fmtDate(l.claimed_at || ""),
      "Người nhận": l.profiles?.display_name || l.profiles?.handle || "—",
      "Ví nhận": l.wallet_address || "",
      "Camly": l.camly_amount,
      "FUN": l.fun_amount || 0,
      "Tx Hash": l.tx_hash || "",
    })),
    `ví-lì-xì-tết-${format(new Date(), "yyyyMMdd")}.csv`
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

        {/* Verified wallet notice */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <span className="font-semibold">Đã xác minh qua BSCScan:</span> Cả 2 loại phát thưởng (Rút thưởng Camly và Lì Xì Tết) đều được gửi từ cùng 1 ví{" "}
            <code className="bg-emerald-100 dark:bg-emerald-900/50 px-1 rounded font-mono">0x4163...9ac8</code>.
            Ví <code className="bg-emerald-100 dark:bg-emerald-900/50 px-1 rounded font-mono">0x02D5...9a0D</code> là ví dự phòng (chưa có giao dịch ghi nhận).
          </div>
        </div>

        {/* Summary Cards — 2 ví */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Ví 1 — Rút thưởng Camly */}
          <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Wallet className="w-4 h-4 text-blue-500" />
                Ví 1 — Rút Thưởng Camly
              </CardTitle>
              <WalletAddressChip address={TREASURY_WALLET_1} label="Sender (BSCScan):" />
              <p className="text-[11px] text-muted-foreground mt-0.5">Nguồn: bảng <code className="bg-muted px-1 rounded">coin_withdrawals</code></p>
              {wStats && (
                <p className="text-xs text-muted-foreground mt-1">
                  🗓️ Hoạt động: {fmtDate(wStats.first!)} → {fmtDate(wStats.last!)} ({wStats.days} ngày)
                </p>
              )}
            </CardHeader>
            <CardContent>
              {wStats ? (
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{fmt(wStats.totalTx)}</div>
                    <div className="text-xs text-muted-foreground">GD hoàn thành</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{fmt(wStats.totalCamly)}</div>
                    <div className="text-xs text-muted-foreground">Camly phát ra</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-amber-500">{fmt(wStats.pending)}</div>
                    <div className="text-xs text-muted-foreground">Chờ xử lý</div>
                  </div>
                </div>
              ) : <div className="text-sm text-muted-foreground">Không có dữ liệu</div>}
            </CardContent>
          </Card>

          {/* Ví 2 — Lì Xì Tết */}
          <Card className="border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Gift className="w-4 h-4 text-red-500" />
                Ví 2 — Lì Xì Tết
              </CardTitle>
              <WalletAddressChip address={TREASURY_WALLET_2} label="Sender (BSCScan):" />
              <p className="text-[11px] text-muted-foreground mt-0.5">Nguồn: bảng <code className="bg-muted px-1 rounded">lixi_claims</code></p>
              {lStats && (
                <p className="text-xs text-muted-foreground mt-1">
                  🗓️ Hoạt động: {fmtDate(lStats.first!)} → {fmtDate(lStats.last!)} ({lStats.days} ngày)
                </p>
              )}
            </CardHeader>
            <CardContent>
              {lStats ? (
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">{fmt(lStats.totalTx)}</div>
                    <div className="text-xs text-muted-foreground">GD hoàn thành</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">{fmt(lStats.totalCamly)}</div>
                    <div className="text-xs text-muted-foreground">Camly phát ra</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-amber-500">{fmt(lStats.pending)}</div>
                    <div className="text-xs text-muted-foreground">Chờ xử lý</div>
                  </div>
                </div>
              ) : <div className="text-sm text-muted-foreground">Không có dữ liệu</div>}
            </CardContent>
          </Card>
        </div>

        {/* Grand Total Banner */}
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800">
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center justify-center gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                  {fmt((wStats?.totalTx || 0) + (lStats?.totalTx || 0))}
                </div>
                <div className="text-xs text-muted-foreground">Tổng giao dịch hệ thống</div>
              </div>
              <div className="w-px h-10 bg-amber-200 dark:bg-amber-700 hidden sm:block" />
              <div>
                <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                  {fmt((wStats?.totalCamly || 0) + (lStats?.totalCamly || 0))}
                </div>
                <div className="text-xs text-muted-foreground">Tổng Camly đã phát ra</div>
              </div>
              <div className="w-px h-10 bg-amber-200 dark:bg-amber-700 hidden sm:block" />
              <div>
                <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">2</div>
                <div className="text-xs text-muted-foreground">Ví treasury hoạt động</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs chi tiết */}
        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">📊 Tổng hợp</TabsTrigger>
            <TabsTrigger value="withdrawal">💰 Ví 1 — Rút Thưởng</TabsTrigger>
            <TabsTrigger value="lixi">🧧 Ví 2 — Lì Xì Tết</TabsTrigger>
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
                    <Bar dataKey="Ví 2" fill="#ef4444" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Bảng so sánh 2 ví */}
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
                        <th className="text-center py-2 px-3 text-red-600 dark:text-red-400 font-semibold">💰 Ví 2</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {[
                        ["Địa chỉ ví", shortAddr(TREASURY_WALLET_1), shortAddr(TREASURY_WALLET_2)],
                        ["GD hoàn thành", fmt(wStats?.totalTx || 0), fmt(lStats?.totalTx || 0)],
                        ["Tổng Camly phát ra", fmt(wStats?.totalCamly || 0), fmt(lStats?.totalCamly || 0)],
                        ["Chờ xử lý", fmt(wStats?.pending || 0), fmt(lStats?.pending || 0)],
                        ["Ngày bắt đầu", wStats?.first ? format(new Date(wStats.first), "dd/MM/yyyy") : "—", lStats?.first ? format(new Date(lStats.first), "dd/MM/yyyy") : "—"],
                        ["Ngày cuối", wStats?.last ? format(new Date(wStats.last), "dd/MM/yyyy") : "—", lStats?.last ? format(new Date(lStats.last), "dd/MM/yyyy") : "—"],
                        ["Số ngày hoạt động", wStats?.days ? `${wStats.days} ngày` : "—", lStats?.days ? `${lStats.days} ngày` : "—"],
                      ].map(([label, w, l]) => (
                        <tr key={label as string} className="hover:bg-muted/30">
                          <td className="py-2 px-3 text-muted-foreground">{label}</td>
                          <td className="py-2 px-3 text-center font-mono text-xs">{w}</td>
                          <td className="py-2 px-3 text-center font-mono text-xs">{l}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Tab: Ví Rút Thưởng ─── */}
          <TabsContent value="withdrawal" className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="GD hoàn thành" value={wStats?.totalTx || 0} icon={CheckCircle2} color="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20" />
              <StatCard label="Camly phát ra" value={wStats?.totalCamly || 0} icon={Wallet} color="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20" />
              <StatCard label="Chờ xử lý" value={wStats?.pending || 0} icon={Clock} color="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20" />
              <StatCard label="Ngày hoạt động" value={wStats?.days || 0} sub="ngày" icon={TrendingUp} color="border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20" />
            </div>

            {/* Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">Camly phát theo ngày (triệu Camly)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={wChartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v: number) => [`${v.toFixed(2)}M Camly`]} />
                    <Bar dataKey="amount" fill="#3b82f6" name="Camly" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <CardTitle className="text-base">Lịch sử chi tiết ({filteredW.length} giao dịch)</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input placeholder="Tìm tên / địa chỉ..." value={wSearch}
                        onChange={e => { setWSearch(e.target.value); wPagination.setPage(0); }}
                        className="pl-8 h-8 text-xs w-48" />
                    </div>
                    <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={exportWithdrawals}>
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
                      {wPagination.paged.map(w => (
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
                      {wPagination.paged.length === 0 && (
                        <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">Không có dữ liệu</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {/* Pagination */}
                {wPagination.total > 1 && (
                  <div className="flex items-center justify-between px-3 py-2 border-t">
                    <span className="text-xs text-muted-foreground">
                      Trang {wPagination.page + 1}/{wPagination.total} · {filteredW.length} GD
                    </span>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="h-7 w-7 p-0"
                        disabled={wPagination.page === 0}
                        onClick={() => wPagination.setPage(p => p - 1)}>
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 w-7 p-0"
                        disabled={wPagination.page >= wPagination.total - 1}
                        onClick={() => wPagination.setPage(p => p + 1)}>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Tab: Ví Lì Xì Tết ─── */}
          <TabsContent value="lixi" className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="GD hoàn thành" value={lStats?.totalTx || 0} icon={CheckCircle2} color="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20" />
              <StatCard label="Camly phát ra" value={lStats?.totalCamly || 0} icon={Gift} color="border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20" />
              <StatCard label="FUN phát ra" value={lStats?.totalFun || 0} icon={AlertCircle} color="border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20" />
              <StatCard label="Ngày hoạt động" value={lStats?.days || 0} sub="ngày" icon={TrendingUp} color="border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20" />
            </div>

            {/* Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">Camly phát theo ngày (triệu Camly)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={lChartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v: number) => [`${v.toFixed(2)}M Camly`]} />
                    <Bar dataKey="amount" fill="#ef4444" name="Camly" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <CardTitle className="text-base">Lịch sử chi tiết ({filteredL.length} giao dịch)</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input placeholder="Tìm tên / địa chỉ..." value={lSearch}
                        onChange={e => { setLSearch(e.target.value); lPagination.setPage(0); }}
                        className="pl-8 h-8 text-xs w-48" />
                    </div>
                    <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={exportLixi}>
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
                        {["Thời gian", "Người nhận", "Ví nhận", "Camly", "FUN", "Tx Hash", "Trạng thái"].map(h => (
                          <th key={h} className="text-left py-2.5 px-3 text-muted-foreground font-medium whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {lPagination.paged.map(l => (
                        <tr key={l.id} className="hover:bg-muted/30">
                          <td className="py-2 px-3 whitespace-nowrap text-muted-foreground">{fmtDate(l.claimed_at || "")}</td>
                          <td className="py-2 px-3 font-medium">{l.profiles?.display_name || l.profiles?.handle || "—"}</td>
                          <td className="py-2 px-3 font-mono">
                            {l.wallet_address ? (
                              <div className="flex items-center gap-1">
                                <span>{shortAddr(l.wallet_address)}</span>
                                <button onClick={() => copyToClipboard(l.wallet_address!)} className="text-muted-foreground hover:text-foreground">
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            ) : <span className="text-muted-foreground">—</span>}
                          </td>
                          <td className="py-2 px-3 text-right font-semibold text-red-600 dark:text-red-400 whitespace-nowrap">
                            {fmt(l.camly_amount)}
                          </td>
                          <td className="py-2 px-3 text-right text-orange-600 dark:text-orange-400 whitespace-nowrap">
                            {l.fun_amount ? fmt(l.fun_amount) : "—"}
                          </td>
                          <td className="py-2 px-3 font-mono">
                            {l.tx_hash ? (
                              <a href={`${BSCSCAN_TX}${l.tx_hash}`} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1 text-primary hover:underline">
                                {shortHash(l.tx_hash)} <ExternalLink className="w-3 h-3" />
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
                      {lPagination.paged.length === 0 && (
                        <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">Không có dữ liệu</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {/* Pagination */}
                {lPagination.total > 1 && (
                  <div className="flex items-center justify-between px-3 py-2 border-t">
                    <span className="text-xs text-muted-foreground">
                      Trang {lPagination.page + 1}/{lPagination.total} · {filteredL.length} GD
                    </span>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="h-7 w-7 p-0"
                        disabled={lPagination.page === 0}
                        onClick={() => lPagination.setPage(p => p - 1)}>
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 w-7 p-0"
                        disabled={lPagination.page >= lPagination.total - 1}
                        onClick={() => lPagination.setPage(p => p + 1)}>
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
