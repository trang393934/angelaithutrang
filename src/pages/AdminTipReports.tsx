import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Download, FileSpreadsheet, Gift, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface GiftTransaction {
  id: string;
  sender_id: string;
  receiver_id: string;
  amount: number;
  message: string | null;
  gift_type: string;
  tx_hash: string | null;
  created_at: string;
  receipt_public_id: string | null;
  context_type: string;
  context_id: string | null;
  sender_name?: string;
  receiver_name?: string;
}

export default function AdminTipReports() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<GiftTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  useEffect(() => {
    fetchTransactions();
  }, [dateFrom, dateTo, filterType]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("coin_gifts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (dateFrom) query = query.gte("created_at", new Date(dateFrom).toISOString());
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        query = query.lte("created_at", endDate.toISOString());
      }
      if (filterType === "internal") query = query.eq("gift_type", "internal");
      if (filterType === "web3") query = query.eq("gift_type", "web3");
      if (filterType === "post") query = query.eq("context_type", "post");

      const { data, error } = await query;

      if (error) {
        console.error("Fetch error:", error);
        toast.error("Lỗi tải dữ liệu");
        return;
      }

      if (data && data.length > 0) {
        const userIds = [...new Set([...data.map((d) => d.sender_id), ...data.map((d) => d.receiver_id)])];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", userIds);

        const profileMap = new Map(profiles?.map((p) => [p.user_id, p.display_name]) || []);

        setTransactions(
          data.map((t) => ({
            ...t,
            sender_name: profileMap.get(t.sender_id) || "Ẩn danh",
            receiver_name: profileMap.get(t.receiver_id) || "Ẩn danh",
          }))
        );
      } else {
        setTransactions([]);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    const exportData = transactions.map((t) => ({
      "Thời gian": new Date(t.created_at).toLocaleString("vi-VN"),
      "ID": t.id,
      "Người tặng": t.sender_name,
      "Người nhận": t.receiver_name,
      "Số lượng": t.amount,
      "Loại": t.gift_type,
      "Ngữ cảnh": t.context_type,
      "TX Hash": t.tx_hash || "",
      "Lời nhắn": t.message || "",
      "Receipt ID": t.receipt_public_id || "",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Giao dịch tặng thưởng");
    XLSX.writeFile(wb, `tip-reports-${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success("Đã xuất file Excel!");
  };

  const exportToCSV = () => {
    const exportData = transactions.map((t) => ({
      created_at: t.created_at,
      id: t.id,
      sender: t.sender_name,
      receiver: t.receiver_name,
      amount: t.amount,
      gift_type: t.gift_type,
      context_type: t.context_type,
      tx_hash: t.tx_hash || "",
      message: t.message || "",
      receipt_public_id: t.receipt_public_id || "",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tip-reports-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast.success("Đã xuất file CSV!");
  };

  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate("/admin/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Admin
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Gift className="w-6 h-6 text-amber-500" />
              Báo cáo Tặng thưởng
            </h1>
            <p className="text-sm text-muted-foreground">
              {transactions.length} giao dịch • Tổng: {totalAmount.toLocaleString()} Camly Coin
            </p>
          </div>
        </div>

        {/* Filters */}
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
                    <SelectItem value="internal">Nội bộ</SelectItem>
                    <SelectItem value="web3">Web3</SelectItem>
                    <SelectItem value="post">Trên bài viết</SelectItem>
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

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Chưa có giao dịch nào
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Thời gian</TableHead>
                      <TableHead>Người tặng</TableHead>
                      <TableHead>Người nhận</TableHead>
                      <TableHead className="text-right">Số lượng</TableHead>
                      <TableHead>Loại</TableHead>
                      <TableHead>Ngữ cảnh</TableHead>
                      <TableHead>Lời nhắn</TableHead>
                      <TableHead>TX</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="text-xs whitespace-nowrap">
                          {new Date(t.created_at).toLocaleString("vi-VN")}
                        </TableCell>
                        <TableCell className="font-medium text-sm">{t.sender_name}</TableCell>
                        <TableCell className="text-sm">{t.receiver_name}</TableCell>
                        <TableCell className="text-right font-bold text-amber-700">
                          {t.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            t.gift_type === "web3" ? "bg-orange-100 text-orange-700" : "bg-amber-100 text-amber-700"
                          }`}>
                            {t.gift_type === "web3" ? "Web3" : "Nội bộ"}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs">{t.context_type}</TableCell>
                        <TableCell className="text-xs max-w-[150px] truncate">{t.message || "-"}</TableCell>
                        <TableCell>
                          {t.tx_hash ? (
                            <a
                              href={`https://bscscan.com/tx/${t.tx_hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-orange-500 hover:text-orange-700"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
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
