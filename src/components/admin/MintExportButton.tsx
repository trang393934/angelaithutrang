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

const ACTION_LABELS: Record<string, string> = {
  QUESTION_ASK: "Hỏi AI",
  JOURNAL_WRITE: "Nhật ký",
  CONTENT_CREATE: "Đăng bài",
  POST_CREATE: "Đăng bài",
  COMMENT_CREATE: "Bình luận",
  DONATE: "Donate",
  SHARE_CONTENT: "Chia sẻ",
  DAILY_LOGIN: "Đăng nhập",
  GRATITUDE_PRACTICE: "Biết ơn",
  VISION_CREATE: "Vision",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Chờ duyệt",
  signed: "Đã ký",
  minted: "Đã mint",
  rejected: "Từ chối",
  expired: "Hết hạn",
};

interface MintRow {
  thoi_gian: string;
  hanh_dong: string;
  ten_user: string;
  so_fun: number;
  trang_thai: string;
  vi_user: string;
  tx_hash: string;
  minted_at: string;
}

async function fetchMintData(): Promise<MintRow[]> {
  const { data, error } = await supabase
    .from("pplp_mint_requests")
    .select("*, pplp_actions!inner(action_type)")
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) {
    toast.error("Lỗi tải dữ liệu mint");
    return [];
  }

  const actorIds = [...new Set((data || []).map((r: any) => r.actor_id))];
  let profileMap: Record<string, string> = {};

  if (actorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", actorIds);
    (profiles || []).forEach((p: any) => {
      profileMap[p.user_id] = p.display_name || "Ẩn danh";
    });
  }

  return (data || []).map((r: any) => {
    const actionType = r.pplp_actions?.action_type || "";
    return {
      thoi_gian: new Date(r.created_at).toLocaleString("vi-VN"),
      hanh_dong: ACTION_LABELS[actionType] || actionType,
      ten_user: profileMap[r.actor_id] || r.actor_id?.slice(0, 8) + "...",
      so_fun: r.amount,
      trang_thai: STATUS_LABELS[r.status] || r.status,
      vi_user: r.recipient_address || "",
      tx_hash: r.tx_hash || "",
      minted_at: r.minted_at ? new Date(r.minted_at).toLocaleString("vi-VN") : "",
    };
  });
}

export function MintExportButton() {
  const [isExporting, setIsExporting] = useState(false);

  const exportToExcel = async () => {
    setIsExporting(true);
    try {
      const rows = await fetchMintData();
      if (rows.length === 0) {
        toast.info("Không có dữ liệu để xuất");
        return;
      }

      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet("Mint Requests");
      ws.columns = [
        { header: "Thời gian", key: "thoi_gian", width: 20 },
        { header: "Hành động", key: "hanh_dong", width: 15 },
        { header: "Tên User", key: "ten_user", width: 20 },
        { header: "Số FUN", key: "so_fun", width: 12 },
        { header: "Trạng thái", key: "trang_thai", width: 14 },
        { header: "Ví User", key: "vi_user", width: 44 },
        { header: "TX Hash", key: "tx_hash", width: 68 },
        { header: "Thời gian Mint", key: "minted_at", width: 20 },
      ];
      rows.forEach((row) => ws.addRow(row));

      ws.getRow(1).font = { bold: true };
      ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5E6" } };

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `mint-requests-${new Date().toISOString().split("T")[0]}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success(`✅ Đã xuất ${rows.length} bản ghi mint`);
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Lỗi khi xuất file Excel");
    } finally {
      setIsExporting(false);
    }
  };

  const exportToCSV = async () => {
    setIsExporting(true);
    try {
      const rows = await fetchMintData();
      if (rows.length === 0) {
        toast.info("Không có dữ liệu để xuất");
        return;
      }

      const headers = ["Thời gian", "Hành động", "Tên User", "Số FUN", "Trạng thái", "Ví User", "TX Hash", "Thời gian Mint"];
      const csvRows = [headers.join(",")];
      rows.forEach((row) => {
        const vals = [row.thoi_gian, row.hanh_dong, row.ten_user, String(row.so_fun), row.trang_thai, row.vi_user, row.tx_hash, row.minted_at];
        csvRows.push(vals.map((v) => (v.includes(",") || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v)).join(","));
      });

      const csv = "\uFEFF" + csvRows.join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `mint-requests-${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success(`✅ Đã xuất ${rows.length} bản ghi dạng CSV`);
    } catch (err) {
      console.error("CSV export error:", err);
      toast.error("Lỗi khi xuất file CSV");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isExporting} className="gap-2">
          {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Xuất file
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToExcel} className="gap-2 cursor-pointer">
          <FileSpreadsheet className="w-4 h-4 text-green-600" />
          Xuất Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToCSV} className="gap-2 cursor-pointer">
          <Download className="w-4 h-4 text-blue-600" />
          Xuất CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
