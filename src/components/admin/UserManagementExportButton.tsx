import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import ExcelJS from "exceljs";

interface UserRow {
  user_id: string;
  display_name: string | null;
  handle: string | null;
  joined_at: string | null;
  post_count: number;
  comment_count: number;
  light_score: number;
  popl_score: number;
  camly_balance: number;
  camly_lifetime_earned: number;
  camly_lifetime_spent: number;
  fun_money_received: number;
  gift_internal_sent: number;
  gift_internal_received: number;
  gift_web3_sent: number;
  gift_web3_received: number;
  total_withdrawn: number;
  withdrawal_count: number;
  pplp_action_count: number;
  pplp_minted_count: number;
  wallet_address: string | null;
}

const COLUMNS = [
  { header: "Tên", key: "display_name", width: 20 },
  { header: "Handle", key: "handle", width: 15 },
  { header: "Ngày tham gia", key: "joined_at", width: 14 },
  { header: "Bài đăng", key: "post_count", width: 10 },
  { header: "Bình luận", key: "comment_count", width: 10 },
  { header: "Điểm Ánh sáng", key: "light_score", width: 14 },
  { header: "PoPL Score", key: "popl_score", width: 12 },
  { header: "Số dư Camly", key: "camly_balance", width: 14 },
  { header: "Tổng kiếm Camly", key: "camly_lifetime_earned", width: 16 },
  { header: "Tổng tiêu Camly", key: "camly_lifetime_spent", width: 16 },
  { header: "FUN Money", key: "fun_money_received", width: 14 },
  { header: "Tặng NB (gửi)", key: "gift_internal_sent", width: 14 },
  { header: "Tặng NB (nhận)", key: "gift_internal_received", width: 14 },
  { header: "Tặng Web3 (gửi)", key: "gift_web3_sent", width: 14 },
  { header: "Tặng Web3 (nhận)", key: "gift_web3_received", width: 14 },
  { header: "Tổng đã rút", key: "total_withdrawn", width: 14 },
  { header: "Số lần rút", key: "withdrawal_count", width: 12 },
  { header: "PPLP Actions", key: "pplp_action_count", width: 13 },
  { header: "PPLP Minted", key: "pplp_minted_count", width: 13 },
  { header: "Ví BSC", key: "wallet_address", width: 44 },
];

interface Props {
  users: UserRow[];
}

export function UserManagementExportButton({ users }: Props) {
  const [isExporting, setIsExporting] = useState(false);

  const mapRow = (u: UserRow) => ({
    display_name: u.display_name || "Ẩn danh",
    handle: u.handle || "",
    joined_at: u.joined_at ? new Date(u.joined_at).toLocaleDateString("vi-VN") : "",
    post_count: u.post_count,
    comment_count: u.comment_count,
    light_score: u.light_score,
    popl_score: Number(u.popl_score.toFixed(1)),
    camly_balance: u.camly_balance,
    camly_lifetime_earned: u.camly_lifetime_earned,
    camly_lifetime_spent: u.camly_lifetime_spent,
    fun_money_received: u.fun_money_received,
    gift_internal_sent: u.gift_internal_sent,
    gift_internal_received: u.gift_internal_received,
    gift_web3_sent: u.gift_web3_sent,
    gift_web3_received: u.gift_web3_received,
    total_withdrawn: u.total_withdrawn,
    withdrawal_count: u.withdrawal_count,
    pplp_action_count: u.pplp_action_count,
    pplp_minted_count: u.pplp_minted_count,
    wallet_address: u.wallet_address || "",
  });

  const exportExcel = async () => {
    setIsExporting(true);
    try {
      if (users.length === 0) { toast.info("Không có dữ liệu"); return; }

      const wb = new ExcelJS.Workbook();

      // Sheet 1: All users
      const ws1 = wb.addWorksheet("Tất cả người dùng");
      ws1.columns = COLUMNS.map(c => ({ ...c }));
      users.forEach(u => ws1.addRow(mapRow(u)));
      ws1.getRow(1).font = { bold: true };
      ws1.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5E6" } };

      // Sheet 2: Rewards summary
      const ws2 = wb.addWorksheet("Thưởng Camly");
      ws2.columns = [
        { header: "Tên", key: "name", width: 20 },
        { header: "Handle", key: "handle", width: 15 },
        { header: "Tổng kiếm", key: "earned", width: 16 },
        { header: "Tổng tiêu", key: "spent", width: 16 },
        { header: "Số dư", key: "balance", width: 14 },
        { header: "FUN Money", key: "fun", width: 14 },
      ];
      users.forEach(u => ws2.addRow({
        name: u.display_name || "Ẩn danh",
        handle: u.handle || "",
        earned: u.camly_lifetime_earned,
        spent: u.camly_lifetime_spent,
        balance: u.camly_balance,
        fun: u.fun_money_received,
      }));
      ws2.getRow(1).font = { bold: true };

      // Sheet 3: Gifts & Transfers
      const ws3 = wb.addWorksheet("Giao dịch & Chuyển tiền");
      ws3.columns = [
        { header: "Tên", key: "name", width: 20 },
        { header: "Tặng NB gửi", key: "is", width: 14 },
        { header: "Tặng NB nhận", key: "ir", width: 14 },
        { header: "Tặng Web3 gửi", key: "ws", width: 14 },
        { header: "Tặng Web3 nhận", key: "wr", width: 14 },
        { header: "Tổng rút", key: "wd", width: 14 },
        { header: "Số lần rút", key: "wc", width: 12 },
        { header: "Ví BSC", key: "wallet", width: 44 },
      ];
      users.forEach(u => ws3.addRow({
        name: u.display_name || "Ẩn danh",
        is: u.gift_internal_sent,
        ir: u.gift_internal_received,
        ws: u.gift_web3_sent,
        wr: u.gift_web3_received,
        wd: u.total_withdrawn,
        wc: u.withdrawal_count,
        wallet: u.wallet_address || "",
      }));
      ws3.getRow(1).font = { bold: true };

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `quan-ly-user-${new Date().toISOString().split("T")[0]}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success(`✅ Đã xuất ${users.length} người dùng (3 sheet)`);
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi xuất file");
    } finally {
      setIsExporting(false);
    }
  };

  const exportCSV = async () => {
    setIsExporting(true);
    try {
      if (users.length === 0) { toast.info("Không có dữ liệu"); return; }

      const headers = COLUMNS.map(c => c.header);
      const csvRows = [headers.join(",")];
      users.forEach(u => {
        const row = mapRow(u);
        const vals = COLUMNS.map(c => {
          const v = String((row as any)[c.key] ?? "");
          return v.includes(",") || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v;
        });
        csvRows.push(vals.join(","));
      });

      const csv = "\uFEFF" + csvRows.join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `quan-ly-user-${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success(`✅ Đã xuất ${users.length} người dùng dạng CSV`);
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi xuất CSV");
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
        <DropdownMenuItem onClick={exportExcel} className="gap-2 cursor-pointer">
          <FileSpreadsheet className="w-4 h-4 text-green-600" />
          Xuất Excel (.xlsx)
          <span className="text-xs text-muted-foreground ml-auto">3 sheet</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportCSV} className="gap-2 cursor-pointer">
          <Download className="w-4 h-4 text-blue-600" />
          Xuất CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
