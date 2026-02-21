import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import AdminNavToolbar from "@/components/admin/AdminNavToolbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
  Clock,
  Users,
  Wallet,
  Coins,
  AlertCircle,
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

interface SybilMember {
  userId: string;
  name: string;
  email: string;
  balance: number;
  lifetimeEarned: number;
  pendingMint: number;
  pendingWithdrawal: number;
}

interface SybilGroup {
  groupName: string;
  walletAddress: string;
  severity: "critical" | "high";
  note: string;
  members: SybilMember[];
}

interface SuspendedUser {
  id: string;
  user_id: string;
  suspension_type: string;
  reason: string;
  healing_message: string | null;
  suspended_until: string | null;
  created_at: string;
  lifted_at: string | null;
  display_name: string | null;
  avatar_url: string | null;
  handle: string | null;
  email: string | null;
  balance: number;
  lifetime_earned: number;
  wallet_address: string | null;
  pending_mint: number;
  pending_withdrawal: number;
}

// ============================================================
// 📋 DANH SÁCH SYBIL — DỮ LIỆU ĐÃ XÁC MINH TỪ DB
// Cập nhật: 6 nhóm, 21 tài khoản (Trần Nhung chỉ đếm 1 lần)
// Tổng pending rút ~4.5M Camly | Tổng pending mint ~1,059 requests
// Cập nhật 20/02/2026: Thêm Nhóm Lưu Dung & Nguyễn Viết Soạn (5 TK)
// ============================================================
const SYBIL_GROUPS: SybilGroup[] = [
  {
    groupName: "Nhóm 7786 — Ví tổng 0x1BC4...446",
    walletAddress: "0x1BC43AA93a9Cf9880eBb000B15A7de87F6Bf1446",
    severity: "critical",
    note: "3 tài khoản cùng suffix email '7786', chuyển tiền về 1 ví tổng",
    members: [
      {
        userId: "efb81db9-52dd-4af6-a9d1-aff044bf37b7",
        name: "Thanh Thùy",
        email: "anhnguyet7786@gmail.com",
        balance: 1550641,
        lifetimeEarned: 2317354,
        pendingMint: 72,
        pendingWithdrawal: 250000,
      },
      {
        userId: "37f87d2a-111f-4988-a74b-6f6ef6041d4c",
        name: "Xuân Nguyễn",
        email: "xuannguyen77786@gmail.com",
        balance: 1858930,
        lifetimeEarned: 2308716,
        pendingMint: 40,
        pendingWithdrawal: 0,
      },
      {
        userId: "5182148f-1999-43b5-83db-09560e25c688",
        name: "Trần Nhung",
        email: "trannhung7786@gmail.com",
        balance: 1548380,
        lifetimeEarned: 2066010,
        pendingMint: 34,
        pendingWithdrawal: 290000,
      },
    ],
  },
  {
    groupName: "Nhóm Ví Tổng le quang — 0xAdF1...e24",
    walletAddress: "0xAdF192cee80f68d5bE8A78a6c9e9b8692748e24",
    severity: "critical",
    note: "7 tài khoản chuyển tiền về ví tổng 'le quang' (Trần Nhung tính ở nhóm 7786), dấu hiệu sybil farming có tổ chức",
    members: [
      {
        userId: "c4d884f7-23e0-4da5-8735-50bf1202a529",
        name: "tinhthan",
        email: "tinhthan331@gmail.com",
        balance: 1233300,
        lifetimeEarned: 2132659,
        pendingMint: 54,
        pendingWithdrawal: 292424,
      },
      {
        userId: "71bdc8b3-ae19-45d7-a1f5-ebdd716c464f",
        name: "nguyen sinh 4",
        email: "nguyensinh6921@gmail.com",
        balance: 1666100,
        lifetimeEarned: 1895938,
        pendingMint: 42,
        pendingWithdrawal: 229838,
      },
      {
        userId: "b5621395-32ba-4974-b27e-3c2c39c09a90",
        name: "le bong",
        email: "lebong3441@gmail.com",
        balance: 927100,
        lifetimeEarned: 1753486,
        pendingMint: 46,
        pendingWithdrawal: 257905,
      },
      {
        userId: "ebe0a17e-b0ac-4042-9440-527bca4d0248",
        name: "Lê sang",
        email: "sangle12111@gmail.com",
        balance: 101296,
        lifetimeEarned: 898917,
        pendingMint: 75,
        pendingWithdrawal: 200187,
      },
      {
        userId: "4be73a80-c89c-4690-bae7-ba0ec3a43380",
        name: "Nguyễn Chính",
        email: "namleanh2211@gmail.com",
        balance: 200,
        lifetimeEarned: 852141,
        pendingMint: 24,
        pendingWithdrawal: 257232,
      },
      {
        userId: "bc604f2f-46d3-445b-a3cf-39b25c261382",
        name: "quynh anh",
        email: "quynhanh070820188@gmail.com",
        balance: 170771,
        lifetimeEarned: 409169,
        pendingMint: 43,
        pendingWithdrawal: 0,
      },
      {
        userId: "98ef9564-e581-429b-9b53-9b340b1c4d57",
        name: "trung binh",
        email: "trung1211121@gmail.com",
        balance: 95984,
        lifetimeEarned: 334489,
        pendingMint: 46,
        pendingWithdrawal: 238505,
      },
    ],
  },
  {
    groupName: "Nhóm wanting2308 — Cùng địa chỉ ví",
    walletAddress: "0x5c56eE4C...",
    severity: "high",
    note: "2 tài khoản tên giống nhau (Thu Nguyễn), cùng 1 địa chỉ ví = cùng 1 người",
    members: [
      {
        userId: "2fa4f884-3b65-4762-b12e-e469b92090fb",
        name: "Thu Nguyễn",
        email: "wanting23081962@gmail.com",
        balance: 509600,
        lifetimeEarned: 511700,
        pendingMint: 0,
        pendingWithdrawal: 0,
      },
      {
        userId: "708c1c0d-e0c3-4892-867c-52d36ab648e6",
        name: "Thu Nguyễn (tài khoản 2)",
        email: "wanting23081861@gmail.com",
        balance: 16500,
        lifetimeEarned: 16500,
        pendingMint: 0,
        pendingWithdrawal: 0,
      },
    ],
  },
  {
    groupName: "Nhóm Ngọc na — Liên kết ví tổng le quang",
    walletAddress: "0x350340d8...8733Ced5C",
    severity: "high",
    note: "Giao dịch liên kết với ví tổng le quang",
    members: [
      {
        userId: "55ec5ce5-6986-4be0-b7b2-f9ec1511059f",
        name: "Ngọc na",
        email: "ngocnamc466@gmail.com",
        balance: 1475100,
        lifetimeEarned: 1704727,
        pendingMint: 40,
        pendingWithdrawal: 229627,
      },
    ],
  },
  {
    groupName: "Nhóm PHAM — Email pattern 3112021",
    walletAddress: "0x75be0d3Bd905ecF6188F26B430cE6483d3905278",
    severity: "critical",
    note: "3 tài khoản email prefix 'pham', suffix trùng '3112021'. Pending rút tổng ~989,065 Camly — MỨC ĐỘ KHẨN CẤP CAO",
    members: [
      {
        userId: "4986011b-6669-4374-aa50-ef67710e33aa",
        name: "Trung Kiên (Minh Quân)",
        email: "phamminhquan2782016@gmail.com",
        balance: 1386039,
        lifetimeEarned: 2609201,
        pendingMint: 61,
        pendingWithdrawal: 500000,
      },
      {
        userId: "266f8c06-df49-47df-ae3e-0dbef1d17c59",
        name: "Minh kiên",
        email: "phamlong3112021@gmail.com",
        balance: 1549300,
        lifetimeEarned: 2382324,
        pendingMint: 103,
        pendingWithdrawal: 209065,
      },
      {
        userId: "1eeb2750-272b-49c3-8b13-1894b12f7cf7",
        name: "Kim Xuyen",
        email: "phamminhlong3112021@gmail.com",
        balance: 1552074,
        lifetimeEarned: 2386921,
        pendingMint: 93,
        pendingWithdrawal: 280000,
      },
    ],
  },
  {
    groupName: "Nhóm Lưu Dung & Nguyễn Viết Soạn — Đăng ký 20/01 cùng joni",
    walletAddress: "0x77dfa842... | 0x848393bc... | 0x68ae9ad0... (tinhthan)",
    severity: "critical",
    note: "5 tài khoản gia đình Lưu đăng ký cùng ngày 20/01 trong 50 phút với joni (đã ban). Lưu Quang Trung rút về ví 0x68ae9ad0 = ví tinhthan trong mạng le quang — hai nhóm là một mạng lưới duy nhất. Tổng pending rút: ~1.33M Camly.",
    members: [
      { userId: "bb52286d-5a6b-4908-99e2-7c2795856f9a", name: "luu dung", email: "dungluu1717@gmail.com", balance: 1997696, lifetimeEarned: 2825722, pendingMint: 81, pendingWithdrawal: 207744 },
      { userId: "afa4b518-c75d-4692-8b5c-f4b5cfb11b6a", name: "Lưu Hiếu", email: "builoi1131@gmail.com", balance: 200, lifetimeEarned: 915964, pendingMint: 66, pendingWithdrawal: 299369 },
      { userId: "c86cae53-4692-485d-a2b5-6e1f2464bcba", name: "Lưu Quang Trung", email: "chung121112@gmail.com", balance: 300, lifetimeEarned: 951350, pendingMint: 89, pendingWithdrawal: 348155 },
      { userId: "4122bb9f-7d76-436f-862a-aab1a974906c", name: "thuy dung", email: "dunganh2223@gmail.com", balance: 1471100, lifetimeEarned: 1949003, pendingMint: 54, pendingWithdrawal: 262448 },
      { userId: "c20b1112-38ca-44ea-862e-b07b1d59a668", name: "thuy thuy", email: "thuydungluu626@gmail.com", balance: 300, lifetimeEarned: 412429, pendingMint: 36, pendingWithdrawal: 208235 },
    ],
  },
];

const ALL_SYBIL_USER_IDS = [...new Set(SYBIL_GROUPS.flatMap((g) => g.members.map((m) => m.userId)))];

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
  const [activeTab, setActiveTab] = useState<"alerts" | "patterns" | "sybil_groups" | "suspended">("alerts");

  // Suspended users state
  const [suspendedUsers, setSuspendedUsers] = useState<SuspendedUser[]>([]);
  const [loadingSuspended, setLoadingSuspended] = useState(false);
  const [suspendedSearch, setSuspendedSearch] = useState("");

  // Sybil groups state
  const [suspendedIds, setSuspendedIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkBanning, setBulkBanning] = useState(false);
  const [loadingSybil, setLoadingSybil] = useState(false);
  const [confirmBulkBan, setConfirmBulkBan] = useState(false);

  // Ban dialog
  const [banTarget, setBanTarget] = useState<FraudAlert | null>(null);
  const [banning, setBanning] = useState(false);
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

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url, handle")
        .in("user_id", userIds);

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

  const fetchSybilStatus = async () => {
    setLoadingSybil(true);
    try {
      const { data } = await supabase
        .from("user_suspensions")
        .select("user_id")
        .in("user_id", ALL_SYBIL_USER_IDS)
        .is("lifted_at", null);
      setSuspendedIds(new Set(data?.map((s) => s.user_id) || []));
    } finally {
      setLoadingSybil(false);
    }
  };

  const fetchSuspendedUsers = async () => {
    setLoadingSuspended(true);
    try {
      const { data: suspensions, error } = await supabase
        .from("user_suspensions")
        .select("*")
        .is("lifted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!suspensions || suspensions.length === 0) { setSuspendedUsers([]); return; }

      const userIds = [...new Set(suspensions.map((s) => s.user_id))];

      const [{ data: profiles }, { data: balances }, { data: wallets }, { data: pendingWithdrawals }, { data: mintActions }] = await Promise.all([
        supabase.from("profiles").select("user_id, display_name, avatar_url, handle").in("user_id", userIds),
        supabase.from("camly_coin_balances").select("user_id, balance, lifetime_earned").in("user_id", userIds),
        supabase.from("user_wallet_addresses").select("user_id, wallet_address").in("user_id", userIds),
        supabase.from("coin_withdrawals").select("user_id, amount").in("user_id", userIds).in("status", ["pending", "processing"]),
        supabase.from("pplp_actions").select("actor_id").in("actor_id", userIds).in("status", ["scored", "pending"]),
      ]);

      const profileMap: Record<string, any> = {};
      profiles?.forEach((p) => (profileMap[p.user_id] = p));
      const balanceMap: Record<string, any> = {};
      balances?.forEach((b) => (balanceMap[b.user_id] = b));
      const walletMap: Record<string, string> = {};
      wallets?.forEach((w) => (walletMap[w.user_id] = w.wallet_address));
      
      // Pending withdrawal by user
      const withdrawalMap: Record<string, number> = {};
      pendingWithdrawals?.forEach((w) => { withdrawalMap[w.user_id] = (withdrawalMap[w.user_id] || 0) + w.amount; });
      // Pending mint count by user
      const mintMap: Record<string, number> = {};
      mintActions?.forEach((a) => { mintMap[a.actor_id] = (mintMap[a.actor_id] || 0) + 1; });

      // Deduplicate by user_id (keep latest suspension)
      const seenUserIds = new Set<string>();
      const merged: SuspendedUser[] = [];
      for (const s of suspensions) {
        if (seenUserIds.has(s.user_id)) continue;
        seenUserIds.add(s.user_id);
        merged.push({
          ...s,
          display_name: profileMap[s.user_id]?.display_name ?? null,
          avatar_url: profileMap[s.user_id]?.avatar_url ?? null,
          handle: profileMap[s.user_id]?.handle ?? null,
          email: null,
          balance: balanceMap[s.user_id]?.balance ?? 0,
          lifetime_earned: balanceMap[s.user_id]?.lifetime_earned ?? 0,
          wallet_address: walletMap[s.user_id] ?? null,
          pending_mint: mintMap[s.user_id] ?? 0,
          pending_withdrawal: withdrawalMap[s.user_id] ?? 0,
        });
      }
      setSuspendedUsers(merged);
    } catch (err) {
      console.error("Error fetching suspended users:", err);
    } finally {
      setLoadingSuspended(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    fetchPatterns();
  }, []);

  useEffect(() => {
    if (activeTab === "sybil_groups") {
      fetchSybilStatus();
    }
    if (activeTab === "suspended") {
      fetchSuspendedUsers();
    }
  }, [activeTab]);

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

  // Sybil helpers
  const notBannedCount = ALL_SYBIL_USER_IDS.filter((id) => !suspendedIds.has(id)).length;
  const uniqueAllIds = [...new Set(ALL_SYBIL_USER_IDS)];

  const toggleUser = (userId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(userId) ? next.delete(userId) : next.add(userId);
      return next;
    });
  };

  const toggleGroup = (group: SybilGroup) => {
    const groupIds = group.members.map((m) => m.userId).filter((id) => !suspendedIds.has(id));
    const allSelected = groupIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        groupIds.forEach((id) => next.delete(id));
      } else {
        groupIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const selectAllNotBanned = () => {
    const toSelect = uniqueAllIds.filter((id) => !suspendedIds.has(id));
    setSelectedIds(new Set(toSelect));
  };

  const handleBulkBan = async () => {
    if (!session?.access_token || selectedIds.size === 0) return;
    setBulkBanning(true);
    setConfirmBulkBan(false);
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
            userIds: [...selectedIds],
            reason: "Sybil farming — tài khoản thuộc nhóm đã phân tích và xác minh",
            healingMessage: "Tài khoản của bạn bị phát hiện farming sybil — vi phạm điều khoản sử dụng Angel AI nên hệ thống đã đóng vĩnh viễn tài khoản này.",
            rejectWithdrawals: true,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi ban tài khoản");

      toast({
        title: `✅ Đã ban ${data.banned_count} tài khoản`,
        description: `Từ chối ${data.withdrawals_rejected} lệnh rút tiền. Thất bại: ${data.failed_count}`,
      });
      setSelectedIds(new Set());
      await fetchSybilStatus();
    } catch (err: unknown) {
      toast({
        title: "Lỗi",
        description: err instanceof Error ? err.message : "Không thể ban",
        variant: "destructive",
      });
    } finally {
      setBulkBanning(false);
    }
  };

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
            healingMessage: "Tài khoản của bạn bị phát hiện farming sybil — vi phạm điều khoản sử dụng Angel AI nên hệ thống đã đóng vĩnh viễn tài khoản này.",
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
    } catch {
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
  const fmtNum = (n: number) => n.toLocaleString("vi-VN");

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
            <Button variant="outline" size="sm" onClick={() => { fetchAlerts(); fetchPatterns(); if (activeTab === "sybil_groups") fetchSybilStatus(); if (activeTab === "suspended") fetchSuspendedUsers(); }}>
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
        <div className="flex gap-2 flex-wrap">
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
          <Button
            variant={activeTab === "sybil_groups" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("sybil_groups")}
            className={activeTab !== "sybil_groups" && notBannedCount > 0 ? "border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground" : ""}
          >
            <Users className="w-4 h-4 mr-1" /> 🚫 Nhóm Sybil
            {notBannedCount > 0 && (
              <span className="ml-1.5 bg-destructive text-destructive-foreground text-[10px] rounded-full px-1.5 py-0.5">
                {notBannedCount}
              </span>
            )}
          </Button>
          <Button
            variant={activeTab === "suspended" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("suspended")}
          >
            <Ban className="w-4 h-4 mr-1" /> Đã đình chỉ
            {suspendedUsers.length > 0 && (
              <span className="ml-1.5 bg-destructive text-destructive-foreground text-[10px] rounded-full px-1.5 py-0.5">
                {suspendedUsers.length}
              </span>
            )}
          </Button>
        </div>

        {/* ============ TAB: ALERTS ============ */}
        {activeTab === "alerts" && (
          <>
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
                            <Badge className={SEVERITY_MAP[alert.severity]?.className || "bg-muted text-muted-foreground"}>
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
                            <span className="text-xs text-muted-foreground">{fmt(alert.created_at)}</span>
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

        {/* ============ TAB: PATTERNS ============ */}
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
                        <Badge className={SEVERITY_MAP[p.severity]?.className || "bg-muted text-muted-foreground"}>
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

        {/* ============ TAB: SYBIL GROUPS ============ */}
        {activeTab === "sybil_groups" && (
          <div className="space-y-5">
            {/* Action bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-destructive/10 border border-destructive/30 rounded-xl p-4">
              <div>
                <p className="font-semibold text-destructive flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {notBannedCount} tài khoản chưa bị ban — đã xác minh sybil farming
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Đã chọn: <strong>{selectedIds.size}</strong> tài khoản
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAllNotBanned}
                  disabled={loadingSybil}
                >
                  Chọn tất cả chưa ban ({notBannedCount})
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setConfirmBulkBan(true)}
                  disabled={selectedIds.size === 0 || bulkBanning}
                >
                  <Ban className="w-4 h-4 mr-1" />
                  {bulkBanning ? "Đang xử lý..." : `Ban ${selectedIds.size} tài khoản đã chọn`}
                </Button>
              </div>
            </div>

            {/* Groups */}
            {loadingSybil ? (
              <div className="text-center py-12 text-muted-foreground">Đang tải trạng thái...</div>
            ) : (
              SYBIL_GROUPS.map((group, gi) => {
                const groupActiveIds = group.members.map((m) => m.userId).filter((id) => !suspendedIds.has(id));
                const allGroupSelected = groupActiveIds.length > 0 && groupActiveIds.every((id) => selectedIds.has(id));
                const someGroupSelected = groupActiveIds.some((id) => selectedIds.has(id));
                const groupBannedCount = group.members.filter((m) => suspendedIds.has(m.userId)).length;
                const groupTotalBalance = group.members.reduce((s, m) => s + m.balance, 0);
                const groupTotalPendingMint = group.members.reduce((s, m) => s + m.pendingMint, 0);

                // Deduplicate members by userId for display
                const uniqueMembers = group.members.filter(
                  (m, idx, arr) => arr.findIndex((x) => x.userId === m.userId) === idx
                );

                return (
                  <div
                    key={gi}
                    className={`border rounded-xl overflow-hidden ${
                      group.severity === "critical"
                        ? "border-destructive/40"
                        : "border-amber-400/40"
                    }`}
                  >
                    {/* Group header */}
                    <div
                      className={`px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                        group.severity === "critical"
                          ? "bg-destructive/10"
                          : "bg-amber-500/10"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={allGroupSelected}
                          onCheckedChange={() => toggleGroup(group)}
                          className="border-muted-foreground"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm">{group.groupName}</span>
                            <Badge
                              className={
                                group.severity === "critical"
                                  ? "bg-destructive text-destructive-foreground text-[10px]"
                                  : "bg-amber-500 text-white text-[10px]"
                              }
                            >
                              {group.severity === "critical" ? "🔴 Nghiêm trọng" : "🟡 Cao"}
                            </Badge>
                            {groupBannedCount === group.members.length && (
                              <Badge className="bg-emerald-500 text-white text-[10px]">✅ Đã ban hết</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{group.note}</p>
                          <p className="text-xs font-mono text-muted-foreground mt-0.5 truncate max-w-xs">
                            <Wallet className="w-3 h-3 inline mr-1" />
                            {group.walletAddress}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {uniqueMembers.length} TK ({groupBannedCount} đã ban)
                        </span>
                        <span className="flex items-center gap-1">
                          <Coins className="w-3 h-3" />
                          {fmtNum(groupTotalBalance)}
                        </span>
                        {groupTotalPendingMint > 0 && (
                          <span className="text-amber-600 dark:text-amber-400">
                            {groupTotalPendingMint} mint pending
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Members table */}
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="w-10"></TableHead>
                          <TableHead>Tên / Email</TableHead>
                          <TableHead>Số dư</TableHead>
                          <TableHead>Lifetime Earned</TableHead>
                          <TableHead>Mint pending</TableHead>
                          <TableHead>Rút chờ</TableHead>
                          <TableHead className="text-right">Trạng thái</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {uniqueMembers.map((member) => {
                          const isBanned = suspendedIds.has(member.userId);
                          const isSelected = selectedIds.has(member.userId);
                          return (
                            <TableRow
                              key={member.userId}
                              className={isBanned ? "opacity-50 bg-muted/20" : isSelected ? "bg-destructive/5" : ""}
                            >
                              <TableCell>
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => !isBanned && toggleUser(member.userId)}
                                  disabled={isBanned}
                                />
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium text-sm">{member.name}</p>
                                  <p className="text-xs text-muted-foreground font-mono">{member.email}</p>
                                  <p className="text-[10px] text-muted-foreground/60 font-mono">{member.userId.slice(0, 8)}...</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="font-mono text-sm font-medium">
                                  {fmtNum(member.balance)}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="font-mono text-sm text-muted-foreground">
                                  {fmtNum(member.lifetimeEarned)}
                                </span>
                              </TableCell>
                              <TableCell>
                                {member.pendingMint > 0 ? (
                                  <Badge variant="outline" className="text-xs text-amber-600 border-amber-400">
                                    {member.pendingMint}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground text-xs">—</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {member.pendingWithdrawal > 0 ? (
                                  <span className="text-xs font-mono text-destructive font-medium">
                                    {fmtNum(member.pendingWithdrawal)}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground text-xs">—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {isBanned ? (
                                  <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px]">
                                    ✅ Đã ban
                                  </Badge>
                                ) : (
                                  <Badge className="bg-destructive/10 text-destructive border border-destructive/30 text-[10px]">
                                    🔴 Chờ xử lý
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ============ TAB: SUSPENDED ============ */}
        {activeTab === "suspended" && (
          <div className="space-y-4">
            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm tên, handle, lý do..."
                value={suspendedSearch}
                onChange={(e) => setSuspendedSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Summary */}
            <div className="flex gap-4 flex-wrap">
              <div className="bg-card border border-border rounded-xl px-4 py-3">
                <p className="text-xl font-bold text-destructive">{suspendedUsers.filter(u => u.suspension_type === "permanent").length}</p>
                <p className="text-xs text-muted-foreground">Vĩnh viễn</p>
              </div>
              <div className="bg-card border border-border rounded-xl px-4 py-3">
                <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{suspendedUsers.filter(u => u.suspension_type === "temporary").length}</p>
                <p className="text-xs text-muted-foreground">Tạm thời</p>
              </div>
              <div className="bg-card border border-border rounded-xl px-4 py-3">
                <p className="text-xl font-bold text-foreground">{suspendedUsers.length}</p>
                <p className="text-xs text-muted-foreground">Tổng đình chỉ</p>
              </div>
            </div>

            {/* Aggregate Stats */}
            {!loadingSuspended && suspendedUsers.length > 0 && (() => {
              const totals = suspendedUsers.reduce((acc, u) => ({
                balance: acc.balance + u.balance,
                earned: acc.earned + u.lifetime_earned,
                mint: acc.mint + u.pending_mint,
                withdrawal: acc.withdrawal + u.pending_withdrawal,
              }), { balance: 0, earned: 0, mint: 0, withdrawal: 0 });
              return (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-card border border-border rounded-xl px-4 py-3">
                    <p className="text-lg font-bold font-mono text-foreground">{fmtNum(totals.balance)}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Coins className="w-3 h-3" /> Tổng Số dư</p>
                  </div>
                  <div className="bg-card border border-border rounded-xl px-4 py-3">
                    <p className="text-lg font-bold font-mono text-muted-foreground">{fmtNum(totals.earned)}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Wallet className="w-3 h-3" /> Tổng Lifetime Earned</p>
                  </div>
                  <div className="bg-card border border-border rounded-xl px-4 py-3">
                    <p className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400">{fmtNum(totals.mint)}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> Tổng Mint Pending</p>
                  </div>
                  <div className="bg-card border border-border rounded-xl px-4 py-3">
                    <p className="text-lg font-bold font-mono text-destructive">{fmtNum(totals.withdrawal)}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Tổng Rút chờ</p>
                  </div>
                </div>
              );
            })()}

            {loadingSuspended ? (
              <div className="text-center py-12 text-muted-foreground">Đang tải danh sách...</div>
            ) : (
              <div className="border border-border rounded-xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead>Tài khoản</TableHead>
                      <TableHead>Loại</TableHead>
                      <TableHead>Lý do đình chỉ</TableHead>
                      <TableHead>Số dư</TableHead>
                      <TableHead>Lifetime Earned</TableHead>
                      <TableHead>Mint pending</TableHead>
                      <TableHead>Rút chờ</TableHead>
                      <TableHead>Ví BSC</TableHead>
                      <TableHead>Ngày đình chỉ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      const q = suspendedSearch.toLowerCase();
                      const filteredSuspended = suspendedUsers.filter(u => {
                        if (!q) return true;
                        return (
                          (u.display_name?.toLowerCase().includes(q)) ||
                          (u.handle?.toLowerCase().includes(q)) ||
                          (u.reason?.toLowerCase().includes(q)) ||
                          u.user_id.toLowerCase().includes(q)
                        );
                      });

                      if (filteredSuspended.length === 0) {
                        return (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                              Không có tài khoản bị đình chỉ
                            </TableCell>
                          </TableRow>
                        );
                      }

                      return filteredSuspended.map((user) => (
                        <TableRow key={user.id} className={user.suspension_type === "permanent" ? "bg-destructive/5" : ""}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="w-7 h-7">
                                <AvatarImage src={user.avatar_url || undefined} />
                                <AvatarFallback className="text-xs">
                                  {user.display_name?.charAt(0) ?? "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm leading-tight">
                                  {user.display_name || "Ẩn danh"}
                                </p>
                                {user.handle && (
                                  <p className="text-xs text-muted-foreground">@{user.handle}</p>
                                )}
                                <p className="text-[10px] text-muted-foreground/60 font-mono">{user.user_id.slice(0, 8)}...</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={user.suspension_type === "permanent" 
                              ? "bg-destructive text-destructive-foreground text-[10px]" 
                              : "bg-amber-500 text-white text-[10px]"
                            }>
                              {user.suspension_type === "permanent" ? "🔴 Vĩnh viễn" : "🟡 Tạm thời"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <p className="text-xs text-foreground max-w-[250px] line-clamp-3">
                              {user.reason}
                            </p>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-sm font-medium">
                              {fmtNum(user.balance)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-sm text-muted-foreground">
                              {fmtNum(user.lifetime_earned)}
                            </span>
                          </TableCell>
                          <TableCell>
                            {user.pending_mint > 0 ? (
                              <Badge variant="outline" className="font-mono text-xs border-amber-500/50 text-amber-600 dark:text-amber-400">
                                {fmtNum(user.pending_mint)}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {user.pending_withdrawal > 0 ? (
                              <span className="font-mono text-sm font-medium text-destructive">
                                {fmtNum(user.pending_withdrawal)}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {user.wallet_address ? (
                              <a
                                href={`https://bscscan.com/address/${user.wallet_address}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-mono text-primary hover:underline"
                              >
                                {user.wallet_address.slice(0, 6)}...{user.wallet_address.slice(-4)}
                              </a>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-muted-foreground">{fmt(user.created_at)}</span>
                          </TableCell>
                        </TableRow>
                      ));
                    })()}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Ban Dialog (single from alerts tab) */}
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
            <Button variant="outline" onClick={() => setBanTarget(null)} disabled={banning}>Hủy</Button>
            <Button variant="destructive" onClick={handleBan} disabled={banning}>
              {banning ? "Đang xử lý..." : "Xác nhận Ban"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Bulk Ban Dialog */}
      <Dialog open={confirmBulkBan} onOpenChange={(o) => !o && setConfirmBulkBan(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Ban className="w-5 h-5" /> Xác nhận Ban hàng loạt
            </DialogTitle>
            <DialogDescription className="space-y-2">
              <p>
                Bạn sắp ban vĩnh viễn <strong>{selectedIds.size} tài khoản</strong> đã được xác minh là sybil farming.
              </p>
              <p>Hành động này sẽ:</p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Ban vĩnh viễn tất cả tài khoản đã chọn</li>
                <li>Từ chối tất cả lệnh rút tiền đang chờ</li>
                <li>Gửi thông điệp healing đến từng tài khoản</li>
              </ul>
              <p className="text-destructive font-medium">Hành động này không thể hoàn tác!</p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmBulkBan(false)} disabled={bulkBanning}>Hủy</Button>
            <Button variant="destructive" onClick={handleBulkBan} disabled={bulkBanning}>
              {bulkBanning ? "Đang ban..." : `✅ Xác nhận Ban ${selectedIds.size} tài khoản`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminFraudAlerts;
