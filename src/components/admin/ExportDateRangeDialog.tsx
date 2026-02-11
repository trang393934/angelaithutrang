import { useState } from "react";
import { format, subDays, startOfMonth, startOfYear } from "date-fns";
import { vi } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface ExportDateRangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (range: DateRange) => void;
  title?: string;
}

const PRESETS = [
  { label: "Hôm nay", from: () => new Date(), to: () => new Date() },
  { label: "7 ngày qua", from: () => subDays(new Date(), 7), to: () => new Date() },
  { label: "30 ngày qua", from: () => subDays(new Date(), 30), to: () => new Date() },
  { label: "Tháng này", from: () => startOfMonth(new Date()), to: () => new Date() },
  { label: "Năm nay", from: () => startOfYear(new Date()), to: () => new Date() },
  { label: "Tất cả", from: () => undefined as unknown as Date, to: () => undefined as unknown as Date },
];

export function ExportDateRangeDialog({
  open,
  onOpenChange,
  onConfirm,
  title = "Chọn khoảng thời gian xuất dữ liệu",
}: ExportDateRangeDialogProps) {
  const [range, setRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [activePreset, setActivePreset] = useState<string | null>("Tất cả");

  const handlePreset = (preset: (typeof PRESETS)[0]) => {
    const from = preset.from();
    const to = preset.to();
    setRange({ from: from || undefined, to: to || undefined });
    setActivePreset(preset.label);
  };

  const handleConfirm = () => {
    onConfirm(range);
    onOpenChange(false);
  };

  const isAllTime = !range.from && !range.to;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">{title}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Chọn khoảng thời gian hoặc dùng gợi ý nhanh bên dưới
          </DialogDescription>
        </DialogHeader>

        {/* Quick presets */}
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <Badge
              key={preset.label}
              variant={activePreset === preset.label ? "default" : "outline"}
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => handlePreset(preset)}
            >
              {preset.label}
            </Badge>
          ))}
        </div>

        {/* Custom date pickers */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Từ ngày</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "w-full justify-start text-left font-normal text-xs",
                    !range.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-1 h-3 w-3" />
                  {range.from ? format(range.from, "dd/MM/yyyy", { locale: vi }) : "Không giới hạn"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={range.from}
                  onSelect={(date) => {
                    setRange((prev) => ({ ...prev, from: date }));
                    setActivePreset(null);
                  }}
                  disabled={(date) => date > new Date()}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Đến ngày</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "w-full justify-start text-left font-normal text-xs",
                    !range.to && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-1 h-3 w-3" />
                  {range.to ? format(range.to, "dd/MM/yyyy", { locale: vi }) : "Không giới hạn"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={range.to}
                  onSelect={(date) => {
                    setRange((prev) => ({ ...prev, to: date }));
                    setActivePreset(null);
                  }}
                  disabled={(date) => date > new Date()}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Summary */}
        <div className="text-xs text-muted-foreground bg-muted/50 rounded-md p-2 text-center">
          {isAllTime
            ? "📋 Xuất tất cả dữ liệu (không giới hạn thời gian)"
            : `📋 Xuất dữ liệu từ ${range.from ? format(range.from, "dd/MM/yyyy") : "đầu"} đến ${range.to ? format(range.to, "dd/MM/yyyy") : "nay"}`}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button size="sm" onClick={handleConfirm}>
            Xác nhận & Xuất
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
