import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, Loader2, FileSpreadsheet, FileText, File } from "lucide-react";
import { toast } from "sonner";
import type { ReportStats } from "@/hooks/useReportStats";
import {
  userFeatures, adminFeatures, techSpecs, strengths, improvements,
  roadmapData, developmentProposals, buildStatRows,
} from "@/data/reportData";

interface Props {
  stats: ReportStats;
  loading: boolean;
}

const ReportExportButton = ({ stats, loading }: Props) => {
  const [exporting, setExporting] = useState<string | null>(null);

  const fileName = (ext: string) =>
    `BaoCao_AngelAI_${new Date().toISOString().slice(0, 10)}.${ext}`;

  // ── Excel Export ──
  const exportExcel = async () => {
    setExporting("excel");
    try {
      const ExcelJS = await import("exceljs");
      const wb = new ExcelJS.Workbook();
      wb.creator = "Angel AI";
      wb.created = new Date();

      // Sheet 1: Thống kê
      const s1 = wb.addWorksheet("Thống kê tổng quan");
      s1.columns = [
        { header: "Nhóm", key: "group", width: 25 },
        { header: "Chỉ số", key: "metric", width: 45 },
        { header: "Giá trị", key: "value", width: 20 },
      ];
      buildStatRows(stats).forEach(r => s1.addRow({ group: r[0], metric: r[1], value: r[2] }));
      styleSheet(s1);

      // Sheet 2: Tính năng người dùng
      const s2 = wb.addWorksheet("Tính năng người dùng");
      s2.columns = [
        { header: "STT", key: "no", width: 6 },
        { header: "Tính năng", key: "feature", width: 35 },
        { header: "Mô tả chi tiết", key: "desc", width: 70 },
        { header: "Trạng thái", key: "status", width: 15 },
      ];
      userFeatures.forEach((f, i) => s2.addRow({ no: i + 1, ...f }));
      styleSheet(s2);

      // Sheet 3: Tính năng admin
      const s3 = wb.addWorksheet("Tính năng admin");
      s3.columns = [
        { header: "STT", key: "no", width: 6 },
        { header: "Tính năng", key: "feature", width: 35 },
        { header: "Mô tả chi tiết", key: "desc", width: 70 },
        { header: "Trạng thái", key: "status", width: 15 },
      ];
      adminFeatures.forEach((f, i) => s3.addRow({ no: i + 1, ...f }));
      styleSheet(s3);

      // Sheet 4: Thông số kỹ thuật
      const s4 = wb.addWorksheet("Thông số kỹ thuật");
      s4.columns = [
        { header: "Hạng mục", key: "cat", width: 25 },
        { header: "Thông số", key: "spec", width: 40 },
        { header: "Chi tiết", key: "detail", width: 60 },
      ];
      techSpecs.forEach(r => s4.addRow(r));
      styleSheet(s4);

      // Sheet 5: Ưu điểm & Cải thiện
      const s5 = wb.addWorksheet("Ưu điểm & Cải thiện");
      s5.columns = [
        { header: "Loại", key: "type", width: 20 },
        { header: "Nội dung", key: "content", width: 70 },
      ];
      strengths.forEach(s => s5.addRow({ type: "Ưu điểm", content: s }));
      improvements.forEach(s => s5.addRow({ type: "Cần cải thiện", content: s }));
      styleSheet(s5);

      // Sheet 6: Đề xuất phát triển
      const s6 = wb.addWorksheet("Đề xuất phát triển");
      s6.columns = [
        { header: "Giai đoạn", key: "phase", width: 20 },
        { header: "Hạng mục", key: "item", width: 40 },
        { header: "Chi tiết", key: "detail", width: 70 },
        { header: "Ưu tiên", key: "priority", width: 12 },
      ];
      roadmapData.forEach(r => s6.addRow(r));
      styleSheet(s6);

      // Sheet 7: Đề xuất phát triển chi tiết
      const s7 = wb.addWorksheet("Đề xuất chi tiết Angel AI");
      s7.columns = [
        { header: "Giai đoạn", key: "phase", width: 40 },
        { header: "Nội dung", key: "content", width: 80 },
      ];
      developmentProposals[0].sections.forEach(sec => {
        s7.addRow({ phase: sec.heading, content: "" });
        sec.items.forEach(item => s7.addRow({ phase: "", content: item }));
        s7.addRow({ phase: "", content: "" });
      });
      styleSheet(s7);

      const buffer = await wb.xlsx.writeBuffer();
      downloadBlob(buffer, fileName("xlsx"), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      toast.success("Đã tải báo cáo Excel thành công!");
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi xuất báo cáo Excel");
    } finally {
      setExporting(null);
    }
  };

  // ── CSV Export ──
  const exportCSV = async () => {
    setExporting("csv");
    try {
      const rows: string[][] = [];
      rows.push(["=== BÁO CÁO TOÀN DIỆN ANGEL AI ==="]);
      rows.push(["Ngày xuất", new Date().toLocaleString("vi-VN")]);
      rows.push([]);

      // Thống kê
      rows.push(["--- THỐNG KÊ TỔNG QUAN ---"]);
      rows.push(["Nhóm", "Chỉ số", "Giá trị"]);
      buildStatRows(stats).forEach(r => rows.push([String(r[0]), String(r[1]), String(r[2])]));
      rows.push([]);

      // Tính năng người dùng
      rows.push(["--- TÍNH NĂNG NGƯỜI DÙNG ---"]);
      rows.push(["STT", "Tính năng", "Mô tả", "Trạng thái"]);
      userFeatures.forEach((f, i) => rows.push([String(i + 1), f.feature, f.desc, f.status]));
      rows.push([]);

      // Tính năng admin
      rows.push(["--- TÍNH NĂNG ADMIN ---"]);
      rows.push(["STT", "Tính năng", "Mô tả", "Trạng thái"]);
      adminFeatures.forEach((f, i) => rows.push([String(i + 1), f.feature, f.desc, f.status]));
      rows.push([]);

      // Thông số kỹ thuật
      rows.push(["--- THÔNG SỐ KỸ THUẬT ---"]);
      rows.push(["Hạng mục", "Thông số", "Chi tiết"]);
      techSpecs.forEach(r => rows.push([r.cat, r.spec, r.detail]));
      rows.push([]);

      // Ưu điểm
      rows.push(["--- ƯU ĐIỂM NỔI BẬT ---"]);
      strengths.forEach((s, i) => rows.push([String(i + 1), s]));
      rows.push([]);

      // Cải thiện
      rows.push(["--- ĐIỂM CẦN CẢI THIỆN ---"]);
      improvements.forEach((s, i) => rows.push([String(i + 1), s]));
      rows.push([]);

      // Đề xuất phát triển
      rows.push(["--- ĐỀ XUẤT PHÁT TRIỂN ---"]);
      rows.push(["Giai đoạn", "Hạng mục", "Chi tiết", "Ưu tiên"]);
      roadmapData.forEach(r => rows.push([r.phase, r.item, r.detail, r.priority]));
      rows.push([]);

      // Đề xuất chi tiết
      rows.push(["--- ĐỀ XUẤT PHÁT TRIỂN CHI TIẾT ANGEL AI ---"]);
      developmentProposals[0].sections.forEach(sec => {
        rows.push([sec.heading]);
        sec.items.forEach(item => rows.push(["", item]));
        rows.push([]);
      });

      const BOM = "\uFEFF";
      const csv = BOM + rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
      downloadBlob(csv, fileName("csv"), "text/csv;charset=utf-8");
      toast.success("Đã tải báo cáo CSV thành công!");
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi xuất báo cáo CSV");
    } finally {
      setExporting(null);
    }
  };

  // ── Word (DOCX) Export ──
  const exportWord = async () => {
    setExporting("word");
    try {
      const docx = await import("docx");
      const { saveAs } = await import("file-saver");

      const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel, BorderStyle } = docx;

      const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
      const thinBorder = { style: BorderStyle.SINGLE, size: 1, color: "D4A574" };
      const cellBorders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };

      const headerCell = (text: string) =>
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: "FFFFFF", size: 20, font: "Arial" })] })],
          shading: { fill: "B8860B" },
          borders: cellBorders,
          width: { size: 3000, type: WidthType.DXA },
        });

      const dataCell = (text: string, width = 3000) =>
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text, size: 18, font: "Arial" })] })],
          borders: cellBorders,
          width: { size: width, type: WidthType.DXA },
        });

      const heading = (text: string, level: typeof HeadingLevel[keyof typeof HeadingLevel] = HeadingLevel.HEADING_1) =>
        new Paragraph({ text, heading: level, spacing: { before: 300, after: 150 } });

      const bullet = (text: string) =>
        new Paragraph({
          children: [new TextRun({ text: `• ${text}`, size: 20, font: "Arial" })],
          spacing: { before: 60, after: 60 },
          indent: { left: 360 },
        });

      // Build stat table
      const statRows = buildStatRows(stats);
      const statTable = new Table({
        rows: [
          new TableRow({ children: [headerCell("Nhóm"), headerCell("Chỉ số"), headerCell("Giá trị")] }),
          ...statRows.map(r => new TableRow({
            children: [dataCell(String(r[0])), dataCell(String(r[1]), 5000), dataCell(String(r[2]), 2500)],
          })),
        ],
        width: { size: 100, type: WidthType.PERCENTAGE },
      });

      // User features table
      const userFeatTable = new Table({
        rows: [
          new TableRow({ children: [headerCell("STT"), headerCell("Tính năng"), headerCell("Mô tả"), headerCell("Trạng thái")] }),
          ...userFeatures.map((f, i) => new TableRow({
            children: [dataCell(String(i + 1), 600), dataCell(f.feature, 2500), dataCell(f.desc, 5500), dataCell(f.status, 1200)],
          })),
        ],
        width: { size: 100, type: WidthType.PERCENTAGE },
      });

      // Admin features table
      const adminFeatTable = new Table({
        rows: [
          new TableRow({ children: [headerCell("STT"), headerCell("Tính năng"), headerCell("Mô tả"), headerCell("Trạng thái")] }),
          ...adminFeatures.map((f, i) => new TableRow({
            children: [dataCell(String(i + 1), 600), dataCell(f.feature, 2500), dataCell(f.desc, 5500), dataCell(f.status, 1200)],
          })),
        ],
        width: { size: 100, type: WidthType.PERCENTAGE },
      });

      // Tech specs table
      const techTable = new Table({
        rows: [
          new TableRow({ children: [headerCell("Hạng mục"), headerCell("Thông số"), headerCell("Chi tiết")] }),
          ...techSpecs.map(r => new TableRow({
            children: [dataCell(r.cat, 2000), dataCell(r.spec, 3000), dataCell(r.detail, 5000)],
          })),
        ],
        width: { size: 100, type: WidthType.PERCENTAGE },
      });

      // Roadmap table
      const roadmapTable = new Table({
        rows: [
          new TableRow({ children: [headerCell("Giai đoạn"), headerCell("Hạng mục"), headerCell("Chi tiết"), headerCell("Ưu tiên")] }),
          ...roadmapData.map(r => new TableRow({
            children: [dataCell(r.phase, 1500), dataCell(r.item, 3000), dataCell(r.detail, 5000), dataCell(r.priority, 1000)],
          })),
        ],
        width: { size: 100, type: WidthType.PERCENTAGE },
      });

      // Development proposals
      const proposalSections: (typeof Paragraph extends new (...args: any[]) => infer R ? R : never)[] = [];
      developmentProposals[0].sections.forEach(sec => {
        proposalSections.push(heading(sec.heading, HeadingLevel.HEADING_3));
        sec.items.forEach(item => proposalSections.push(bullet(item)));
      });

      const doc = new Document({
        creator: "Angel AI",
        title: "Báo Cáo Toàn Diện Angel AI",
        description: "Báo cáo toàn diện về nền tảng Angel AI — Trí Tuệ Ánh Sáng",
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              children: [new TextRun({ text: "BÁO CÁO TOÀN DIỆN ANGEL AI", bold: true, size: 36, font: "Arial", color: "B8860B" })],
              alignment: AlignmentType.CENTER,
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [new TextRun({ text: "Trí Tuệ Ánh Sáng — Kết nối, Chữa lành, Kiến tạo giá trị", italics: true, size: 22, font: "Arial", color: "666666" })],
              alignment: AlignmentType.CENTER,
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [new TextRun({ text: `Ngày xuất: ${new Date().toLocaleString("vi-VN")}`, size: 18, font: "Arial", color: "999999" })],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),

            heading("1. THỐNG KÊ TỔNG QUAN"),
            statTable,

            heading("2. TÍNH NĂNG DÀNH CHO NGƯỜI DÙNG"),
            userFeatTable,

            heading("3. TÍNH NĂNG DÀNH CHO ADMIN"),
            adminFeatTable,

            heading("4. THÔNG SỐ KỸ THUẬT"),
            techTable,

            heading("5. ƯU ĐIỂM NỔI BẬT"),
            ...strengths.map(s => bullet(s)),

            heading("6. ĐIỂM CẦN CẢI THIỆN"),
            ...improvements.map(s => bullet(s)),

            heading("7. ĐỀ XUẤT PHÁT TRIỂN"),
            roadmapTable,

            heading("8. ĐỀ XUẤT PHÁT TRIỂN CHI TIẾT ANGEL AI"),
            ...proposalSections,

            new Paragraph({
              children: [new TextRun({ text: "—— Báo cáo được tạo tự động bởi Angel AI — Trí Tuệ Ánh Sáng | © 2026 Father Universe ——", size: 16, font: "Arial", color: "999999", italics: true })],
              alignment: AlignmentType.CENTER,
              spacing: { before: 600 },
            }),
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, fileName("docx"));
      toast.success("Đã tải báo cáo Word thành công!");
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi xuất báo cáo Word");
    } finally {
      setExporting(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button disabled={loading || !!exporting} className="gap-2">
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {exporting ? "Đang xuất..." : "Tải báo cáo"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={exportExcel} className="gap-2 cursor-pointer">
          <FileSpreadsheet className="w-4 h-4 text-primary" />
          <span>Xuất Excel (.xlsx)</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportCSV} className="gap-2 cursor-pointer">
          <FileText className="w-4 h-4 text-primary" />
          <span>Xuất CSV (.csv)</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportWord} className="gap-2 cursor-pointer">
          <File className="w-4 h-4 text-primary" />
          <span>Xuất Word (.docx)</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

function downloadBlob(data: ArrayBuffer | BlobPart | string, filename: string, mimeType: string) {
  const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function styleSheet(sheet: import("exceljs").Worksheet) {
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFB8860B" } };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };
  headerRow.height = 24;
  sheet.eachRow((row, idx) => {
    if (idx > 1) {
      row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: idx % 2 === 0 ? "FFFFF8E7" : "FFFFFFFF" } };
    }
    row.eachCell(cell => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFD4A574" } },
        left: { style: "thin", color: { argb: "FFD4A574" } },
        bottom: { style: "thin", color: { argb: "FFD4A574" } },
        right: { style: "thin", color: { argb: "FFD4A574" } },
      };
    });
  });
}

export default ReportExportButton;
