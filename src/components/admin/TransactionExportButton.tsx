import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import ExcelJS from "exceljs";
import { ExportDateRangeDialog, type DateRange } from "./ExportDateRangeDialog";

interface TransactionRow {
  thoi_gian: string;
  loai_giao_dich: string;
  nguoi_gui: string;
  nguoi_nhan: string;
  so_luong: number;
  loai: string;
  trang_thai: string;
  vi_nhan: string;
  tx_hash: string;
  loi_nhan: string;
  receipt_id: string;
}

export function TransactionExportButton() {
  const [isExporting, setIsExporting] = useState(false);
  const [showDateDialog, setShowDateDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState<"excel" | "csv">("excel");

  const handleExportClick = (format: "excel" | "csv") => {
    setExportFormat(format);
    setShowDateDialog(true);
  };

  const handleDateConfirm = async (range: DateRange) => {
    if (exportFormat === "excel") {
      await exportToExcel(range);
    } else {
      await exportToCSV(range);
    }
  };

  const fetchAllTransactions = async (range: DateRange): Promise<TransactionRow[]> => {
    const rows: TransactionRow[] = [];

    // Build date filters
    const dateFrom = range.from?.toISOString();
    const dateTo = range.to ? (() => { const d = new Date(range.to); d.setHours(23, 59, 59, 999); return d.toISOString(); })() : undefined;

    // 1. Fetch coin_gifts
    let giftsQuery = supabase
      .from("coin_gifts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5000);
    if (dateFrom) giftsQuery = giftsQuery.gte("created_at", dateFrom);
    if (dateTo) giftsQuery = giftsQuery.lte("created_at", dateTo);

    const { data: gifts, error: giftsError } = await giftsQuery;

    if (giftsError) {
      console.error("Error fetching gifts:", giftsError);
      toast.error("Lỗi tải dữ liệu quà tặng");
      return [];
    }

    // 2. Fetch coin_withdrawals
    let wdQuery = supabase
      .from("coin_withdrawals")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5000);
    if (dateFrom) wdQuery = wdQuery.gte("created_at", dateFrom);
    if (dateTo) wdQuery = wdQuery.lte("created_at", dateTo);

    const { data: withdrawals, error: wdError } = await wdQuery;

    if (wdError) {
      console.error("Error fetching withdrawals:", wdError);
      toast.error("Lỗi tải dữ liệu rút tiền");
      return [];
    }

    // 3. Collect all user IDs for profile lookup
    const userIds = new Set<string>();
    gifts?.forEach((g) => {
      userIds.add(g.sender_id);
      userIds.add(g.receiver_id);
    });
    withdrawals?.forEach((w) => userIds.add(w.user_id));

    // 4. Fetch profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", [...userIds]);

    const profileMap = new Map(
      profiles?.map((p) => [p.user_id, p.display_name || "Ẩn danh"]) || []
    );
    const getName = (id: string) => profileMap.get(id) || id.slice(0, 8) + "...";

    // 5. Map gifts to rows
    gifts?.forEach((g) => {
      rows.push({
        thoi_gian: new Date(g.created_at).toLocaleString("vi-VN"),
        loai_giao_dich: "Tặng quà",
        nguoi_gui: getName(g.sender_id),
        nguoi_nhan: getName(g.receiver_id),
        so_luong: g.amount,
        loai: g.gift_type === "web3" ? "Web3" : "Nội bộ",
        trang_thai: "Hoàn thành",
        vi_nhan: g.tx_hash ? "On-chain" : "Off-chain",
        tx_hash: g.tx_hash || "",
        loi_nhan: g.message || "",
        receipt_id: g.receipt_public_id || "",
      });
    });

    // 6. Map withdrawals to rows
    const statusMap: Record<string, string> = {
      pending: "Chờ duyệt",
      processing: "Đang xử lý",
      completed: "Hoàn thành",
      failed: "Từ chối",
    };

    withdrawals?.forEach((w) => {
      rows.push({
        thoi_gian: new Date(w.created_at).toLocaleString("vi-VN"),
        loai_giao_dich: "Rút tiền",
        nguoi_gui: getName(w.user_id),
        nguoi_nhan: w.wallet_address,
        so_luong: w.amount,
        loai: "Web3 (BSC)",
        trang_thai: statusMap[w.status] || w.status,
        vi_nhan: w.wallet_address,
        tx_hash: w.tx_hash || "",
        loi_nhan: w.admin_notes || "",
        receipt_id: "",
      });
    });

    // Sort by time descending
    rows.sort(
      (a, b) =>
        new Date(b.thoi_gian.split(",").reverse().join(" ")).getTime() -
        new Date(a.thoi_gian.split(",").reverse().join(" ")).getTime()
    );

    return rows;
  };

  const COLUMNS = [
    { header: "Thời gian", key: "thoi_gian", width: 20 },
    { header: "Loại giao dịch", key: "loai_giao_dich", width: 15 },
    { header: "Người gửi", key: "nguoi_gui", width: 20 },
    { header: "Người nhận / Ví", key: "nguoi_nhan", width: 25 },
    { header: "Số lượng", key: "so_luong", width: 15 },
    { header: "Loại", key: "loai", width: 12 },
    { header: "Trạng thái", key: "trang_thai", width: 15 },
    { header: "TX Hash", key: "tx_hash", width: 30 },
    { header: "Lời nhắn", key: "loi_nhan", width: 30 },
    { header: "Receipt ID", key: "receipt_id", width: 20 },
  ];

  const exportToExcel = async (range: DateRange) => {
    setIsExporting(true);
    try {
      const rows = await fetchAllTransactions(range);
      if (rows.length === 0) {
        toast.info("Không có dữ liệu để xuất");
        return;
      }

      const wb = new ExcelJS.Workbook();

      // Sheet 1: All transactions
      const wsAll = wb.addWorksheet("Tất cả giao dịch");
      wsAll.columns = COLUMNS.map((c) => ({ ...c }));
      rows.forEach((row) => wsAll.addRow(row));
      wsAll.getRow(1).font = { bold: true };
      wsAll.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF5E6" },
      };

      // Sheet 2: Internal only
      const internalRows = rows.filter((r) => r.loai === "Nội bộ");
      if (internalRows.length > 0) {
        const wsInternal = wb.addWorksheet("Giao dịch nội bộ");
        wsInternal.columns = COLUMNS.map((c) => ({ ...c }));
        internalRows.forEach((row) => wsInternal.addRow(row));
        wsInternal.getRow(1).font = { bold: true };
      }

      // Sheet 3: Web3 only
      const web3Rows = rows.filter((r) => r.loai !== "Nội bộ");
      if (web3Rows.length > 0) {
        const wsWeb3 = wb.addWorksheet("Giao dịch Web3");
        wsWeb3.columns = COLUMNS.map((c) => ({ ...c }));
        web3Rows.forEach((row) => wsWeb3.addRow(row));
        wsWeb3.getRow(1).font = { bold: true };
      }

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `giao-dich-${new Date().toISOString().split("T")[0]}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success(
        `✅ Đã xuất ${rows.length} giao dịch (${internalRows.length} nội bộ, ${web3Rows.length} Web3)`
      );
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Lỗi khi xuất file Excel");
    } finally {
      setIsExporting(false);
    }
  };

  const exportToCSV = async (range: DateRange) => {
    setIsExporting(true);
    try {
      const rows = await fetchAllTransactions(range);
      if (rows.length === 0) {
        toast.info("Không có dữ liệu để xuất");
        return;
      }

      const headers = COLUMNS.map((c) => c.header);
      const csvRows = [headers.join(",")];
      rows.forEach((row) => {
        const values = [
          row.thoi_gian,
          row.loai_giao_dich,
          row.nguoi_gui,
          row.nguoi_nhan,
          String(row.so_luong),
          row.loai,
          row.trang_thai,
          row.tx_hash,
          row.loi_nhan,
          row.receipt_id,
        ];
        csvRows.push(
          values
            .map((val) =>
              val.includes(",") || val.includes('"')
                ? `"${val.replace(/"/g, '""')}"`
                : val
            )
            .join(",")
        );
      });

      const csv = "\uFEFF" + csvRows.join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `giao-dich-${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success(`✅ Đã xuất ${rows.length} giao dịch dạng CSV`);
    } catch (err) {
      console.error("CSV export error:", err);
      toast.error("Lỗi khi xuất file CSV");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={isExporting} className="gap-2">
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Xuất file
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleExportClick("excel")} className="gap-2 cursor-pointer">
            <FileSpreadsheet className="w-4 h-4 text-green-600" />
            Xuất Excel (.xlsx)
            <span className="text-xs text-muted-foreground ml-auto">3 sheet</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExportClick("csv")} className="gap-2 cursor-pointer">
            <Download className="w-4 h-4 text-blue-600" />
            Xuất CSV
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ExportDateRangeDialog
        open={showDateDialog}
        onOpenChange={setShowDateDialog}
        onConfirm={handleDateConfirm}
        title="Chọn thời gian xuất Giao dịch"
      />
    </>
  );
}
