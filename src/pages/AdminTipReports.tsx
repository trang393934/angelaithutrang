import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Download, FileSpreadsheet, Gift, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import ExcelJS from "exceljs";

interface UnifiedTransaction {
  id: string;
  source: "gift" | "withdrawal" | "lixi" | "donation";
  sender_id: string;
  receiver_id: string;
  amount: number;
  message: string | null;
  gift_type: string;
  tx_hash: string | null;
  created_at: string;
  context_type: string;
  sender_name?: string;
  receiver_name?: string;
}

export default function AdminTipReports() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<UnifiedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  useEffect(() => {
    fetchTransactions();
  }, [dateFrom, dateTo, filterType]);

  const buildDateFilter = (query: any) => {
    if (dateFrom) query = query.gte("created_at", new Date(dateFrom).toISOString());
    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
      query = query.lte("created_at", endDate.toISOString());
    }
    return query;
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const allTransactions: UnifiedTransaction[] = [];

      // Fetch coin_gifts
      if (filterType === "all" || filterType === "gift" || filterType === "internal" || filterType === "web3" || filterType === "post") {
        let giftQuery = supabase.from("coin_gifts").select("*").order("created_at", { ascending: false }).limit(500);
        giftQuery = buildDateFilter(giftQuery);
        if (filterType === "internal") giftQuery = giftQuery.eq("gift_type", "internal");
        if (filterType === "web3") giftQuery = giftQuery.eq("gift_type", "web3");
        if (filterType === "post") giftQuery = giftQuery.eq("context_type", "post");

        const { data } = await giftQuery;
        for (const t of data || []) {
          allTransactions.push({
            id: t.id, source: "gift", sender_id: t.sender_id, receiver_id: t.receiver_id,
            amount: t.amount, message: t.message, gift_type: t.gift_type,
            tx_hash: t.tx_hash, created_at: t.created_at, context_type: t.context_type,
          });
        }
      }

      // Fetch coin_withdrawals
      if (filterType === "all" || filterType === "withdrawal") {
        let wQuery = supabase.from("coin_withdrawals").select("*").order("created_at", { ascending: false }).limit(500);
        wQuery = buildDateFilter(wQuery);
        const { data } = await wQuery;
        for (const t of data || []) {
          allTransactions.push({
            id: t.id, source: "withdrawal", sender_id: t.user_id, receiver_id: t.user_id,
            amount: t.amount, message: t.admin_notes, gift_type: "withdrawal",
            tx_hash: t.tx_hash, created_at: t.created_at, context_type: t.status,
          });
        }
      }

      // Fetch lixi_claims
      if (filterType === "all" || filterType === "lixi") {
        let lQuery = supabase.from("lixi_claims").select("*").order("claimed_at", { ascending: false }).limit(500);
        if (dateFrom) lQuery = lQuery.gte("claimed_at", new Date(dateFrom).toISOString());
        if (dateTo) {
          const endDate = new Date(dateTo);
          endDate.setHours(23, 59, 59, 999);
          lQuery = lQuery.lte("claimed_at", endDate.toISOString());
        }
        const { data } = await lQuery;
        for (const t of data || []) {
          allTransactions.push({
            id: t.id, source: "lixi", sender_id: "system", receiver_id: t.user_id,
            amount: t.camly_amount, message: null, gift_type: "lixi",
            tx_hash: t.tx_hash, created_at: t.claimed_at, context_type: "lixi",
          });
        }
      }

      // Fetch project_donations
      if (filterType === "all" || filterType === "donation") {
        let dQuery = supabase.from("project_donations").select("*").order("created_at", { ascending: false }).limit(500);
        dQuery = buildDateFilter(dQuery);
        const { data } = await dQuery;
        for (const t of data || []) {
          allTransactions.push({
            id: t.id, source: "donation", sender_id: t.donor_id, receiver_id: "project",
            amount: t.amount, message: t.message, gift_type: "donation",
            tx_hash: t.tx_hash, created_at: t.created_at, context_type: t.donation_type || "donation",
          });
        }
      }

      // Sort by date desc
      allTransactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Resolve user names
      if (allTransactions.length > 0) {
        const userIds = [...new Set(allTransactions.map(t => t.sender_id).concat(allTransactions.map(t => t.receiver_id)).filter(id => id !== "system" && id !== "project"))];
        const { data: profiles } = await supabase.from("profiles").select("user_id, display_name").in("user_id", userIds);
        const profileMap = new Map(profiles?.map((p) => [p.user_id, p.display_name]) || []);

        for (const t of allTransactions) {
          t.sender_name = t.sender_id === "system" ? "Hệ thống" : (profileMap.get(t.sender_id) || "Ẩn danh");
          t.receiver_name = t.receiver_id === "project" ? "Dự án" : (profileMap.get(t.receiver_id) || "Ẩn danh");
        }
      }

      setTransactions(allTransactions);
    } catch (err) {
      console.error("Error:", err);
      toast.error("Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case "gift": return { label: "Tặng", className: "bg-amber-100 text-amber-700" };
      case "withdrawal": return { label: "Rút", className: "bg-blue-100 text-blue-700" };
      case "lixi": return { label: "Lì xì", className: "bg-red-100 text-red-700" };
      case "donation": return { label: "Donate", className: "bg-green-100 text-green-700" };
      default: return { label: source, className: "bg-muted text-muted-foreground" };
    }
  };

  const exportToExcel = async () => {
    const exportData = transactions.map((t) => ({
      "Thời gian": new Date(t.created_at).toLocaleString("vi-VN"),
      "ID": t.id,
      "Loại": getSourceLabel(t.source).label,
      "Người gửi": t.sender_name,
      "Người nhận": t.receiver_name,
      "Số lượng": t.amount,
      "Phương thức": t.gift_type,
      "Ngữ cảnh": t.context_type,
      "TX Hash": t.tx_hash || "",
      "Lời nhắn": t.message || "",
    }));

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Tất cả giao dịch");
    if (exportData.length > 0) {
      ws.columns = Object.keys(exportData[0]).map(key => ({ header: key, key }));
      exportData.forEach(row => ws.addRow(row));
    }
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `all-transactions-${new Date().toISOString().split("T")[0]}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Đã xuất file Excel!");
  };

  const exportToCSV = () => {
    const exportData = transactions.map((t) => ({
      created_at: t.created_at, id: t.id, source: t.source,
      sender: t.sender_name, receiver: t.receiver_name, amount: t.amount,
      gift_type: t.gift_type, context_type: t.context_type,
      tx_hash: t.tx_hash || "", message: t.message || "",
    }));

    const headers = Object.keys(exportData[0] || {});
    const csvRows = [headers.join(",")];
    exportData.forEach(row => {
      csvRows.push(headers.map(h => {
        const val = String((row as Record<string, unknown>)[h] ?? "");
        return val.includes(",") || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val;
      }).join(","));
    });
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `all-transactions-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast.success("Đã xuất file CSV!");
  };

  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
  const giftCount = transactions.filter(t => t.source === "gift").length;
  const withdrawalCount = transactions.filter(t => t.source === "withdrawal").length;
  const lixiCount = transactions.filter(t => t.source === "lixi").length;
  const donationCount = transactions.filter(t => t.source === "donation").length;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate("/admin/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Admin
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Gift className="w-6 h-6 text-amber-500" />
              Báo cáo Giao dịch Toàn diện
            </h1>
            <p className="text-sm text-muted-foreground">
              {transactions.length} giao dịch • Tổng: {totalAmount.toLocaleString()} Camly
              {" "}({giftCount} tặng • {withdrawalCount} rút • {lixiCount} lì xì • {donationCount} donate)
            </p>
          </div>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="text-sm font-medium block mb-1">Từ ngày</label>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Đến ngày</label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Loại</label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="gift">Tặng thưởng</SelectItem>
                    <SelectItem value="internal">Nội bộ</SelectItem>
                    <SelectItem value="web3">Web3</SelectItem>
                    <SelectItem value="post">Trên bài viết</SelectItem>
                    <SelectItem value="withdrawal">Rút tiền</SelectItem>
                    <SelectItem value="lixi">Lì xì</SelectItem>
                    <SelectItem value="donation">Donate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 ml-auto">
                <Button onClick={exportToCSV} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  CSV
                </Button>
                <Button onClick={exportToExcel} variant="outline" size="sm">
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Excel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">Chưa có giao dịch nào</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Thời gian</TableHead>
                      <TableHead>Loại</TableHead>
                      <TableHead>Người gửi</TableHead>
                      <TableHead>Người nhận</TableHead>
                      <TableHead className="text-right">Số lượng</TableHead>
                      <TableHead>Phương thức</TableHead>
                      <TableHead>Ngữ cảnh</TableHead>
                      <TableHead>Lời nhắn</TableHead>
                      <TableHead>TX</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((t) => {
                      const sourceInfo = getSourceLabel(t.source);
                      return (
                        <TableRow key={`${t.source}-${t.id}`}>
                          <TableCell className="text-xs whitespace-nowrap">
                            {new Date(t.created_at).toLocaleString("vi-VN")}
                          </TableCell>
                          <TableCell>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${sourceInfo.className}`}>
                              {sourceInfo.label}
                            </span>
                          </TableCell>
                          <TableCell className="font-medium text-sm">{t.sender_name}</TableCell>
                          <TableCell className="text-sm">{t.receiver_name}</TableCell>
                          <TableCell className="text-right font-bold text-amber-700">
                            {t.amount.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              t.gift_type === "web3" ? "bg-orange-100 text-orange-700" : "bg-muted text-muted-foreground"
                            }`}>
                              {t.gift_type}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs">{t.context_type}</TableCell>
                          <TableCell className="text-xs max-w-[150px] truncate">{t.message || "-"}</TableCell>
                          <TableCell>
                            {t.tx_hash ? (
                              <a href={`https://bscscan.com/tx/${t.tx_hash}`} target="_blank" rel="noopener noreferrer"
                                className="text-orange-500 hover:text-orange-700">
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
