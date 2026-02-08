import { AlertTriangle, Copy, Zap, ShieldAlert, Wifi, XOctagon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface OnChainErrorBannerProps {
  error: string;
  signerAddress?: string | null;
  actionType?: string;
}

const ERROR_CONFIG: Record<
  string,
  {
    icon: React.ElementType;
    label: string;
    colorClass: string;
    bgClass: string;
    borderClass: string;
    getDescription: (props: OnChainErrorBannerProps) => string;
    getFixCommand: (props: OnChainErrorBannerProps) => string | null;
  }
> = {
  ATTESTER_NOT_REGISTERED: {
    icon: ShieldAlert,
    label: "Attester chưa đăng ký",
    colorClass: "text-red-700 dark:text-red-300",
    bgClass: "bg-red-50 dark:bg-red-950/30",
    borderClass: "border-red-200 dark:border-red-800",
    getDescription: (p) =>
      `Signer ${p.signerAddress ? p.signerAddress.slice(0, 10) + "..." : "unknown"} chưa được đăng ký làm Attester trên hợp đồng. guardianGov cần gọi govSetAttester().`,
    getFixCommand: (p) =>
      `govSetAttester("${p.signerAddress || "SIGNER_ADDRESS"}", true)`,
  },
  ACTION_NOT_REGISTERED: {
    icon: XOctagon,
    label: "Action chưa đăng ký",
    colorClass: "text-orange-700 dark:text-orange-300",
    bgClass: "bg-orange-50 dark:bg-orange-950/30",
    borderClass: "border-orange-200 dark:border-orange-800",
    getDescription: (p) =>
      `Action "${p.actionType || "unknown"}" chưa được đăng ký trên hợp đồng. guardianGov cần gọi govRegisterAction().`,
    getFixCommand: (p) =>
      `govRegisterAction("${p.actionType || "ACTION_TYPE"}", 1)`,
  },
  INSUFFICIENT_GAS: {
    icon: Zap,
    label: "Thiếu tBNB (gas)",
    colorClass: "text-amber-700 dark:text-amber-300",
    bgClass: "bg-amber-50 dark:bg-amber-950/30",
    borderClass: "border-amber-200 dark:border-amber-800",
    getDescription: (p) =>
      `Ví Treasury (${p.signerAddress ? p.signerAddress.slice(0, 10) + "..." : "unknown"}) không đủ tBNB để trả gas. Cần nạp thêm tBNB.`,
    getFixCommand: () => null,
  },
  RPC_FAILURE: {
    icon: Wifi,
    label: "RPC thất bại",
    colorClass: "text-purple-700 dark:text-purple-300",
    bgClass: "bg-purple-50 dark:bg-purple-950/30",
    borderClass: "border-purple-200 dark:border-purple-800",
    getDescription: () =>
      `Tất cả RPC BSC Testnet đều thất bại. Có thể mạng BSC Testnet đang gặp sự cố. Thử lại sau.`,
    getFixCommand: () => null,
  },
  CONTRACT_REVERT: {
    icon: AlertTriangle,
    label: "Contract Revert",
    colorClass: "text-red-700 dark:text-red-300",
    bgClass: "bg-red-50 dark:bg-red-950/30",
    borderClass: "border-red-200 dark:border-red-800",
    getDescription: () =>
      `Hợp đồng từ chối giao dịch. Kiểm tra log chi tiết hoặc thử lại.`,
    getFixCommand: () => null,
  },
};

export function OnChainErrorBanner({ error, signerAddress, actionType }: OnChainErrorBannerProps) {
  const config = ERROR_CONFIG[error] || ERROR_CONFIG.CONTRACT_REVERT;
  const Icon = config.icon;
  const fixCommand = config.getFixCommand({ error, signerAddress, actionType });

  const handleCopy = () => {
    if (fixCommand) {
      navigator.clipboard.writeText(fixCommand);
      toast.success("Đã copy lệnh fix!");
    }
  };

  return (
    <Alert className={`${config.bgClass} ${config.borderClass} mt-2 py-2`}>
      <Icon className={`h-4 w-4 ${config.colorClass}`} />
      <AlertDescription className={`${config.colorClass} text-xs`}>
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5">
            <span className="font-semibold">⚠️ {config.label}</span>
            <p className="opacity-90">
              {config.getDescription({ error, signerAddress, actionType })}
            </p>
          </div>
          {fixCommand && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="shrink-0 h-7 text-xs gap-1 hover:bg-white/50"
            >
              <Copy className="h-3 w-3" />
              Copy lệnh
            </Button>
          )}
        </div>
        {fixCommand && (
          <code className="mt-1 block text-[10px] bg-black/10 dark:bg-white/10 rounded px-2 py-1 font-mono break-all">
            {fixCommand}
          </code>
        )}
      </AlertDescription>
    </Alert>
  );
}

// Error summary for the top banner
interface ErrorSummaryProps {
  requests: Array<{ status: string; on_chain_error: string | null }>;
}

export function OnChainErrorSummary({ requests }: ErrorSummaryProps) {
  const signedWithErrors = requests.filter(
    (r) => r.status === "signed" && r.on_chain_error
  );

  if (signedWithErrors.length === 0) return null;

  const errorCounts: Record<string, number> = {};
  signedWithErrors.forEach((r) => {
    const err = r.on_chain_error!;
    errorCounts[err] = (errorCounts[err] || 0) + 1;
  });

  const summaryParts = Object.entries(errorCounts).map(([errType, count]) => {
    const config = ERROR_CONFIG[errType];
    const label = config?.label || errType;
    return `${count} lỗi ${label}`;
  });

  return (
    <Alert className="border-red-200 bg-red-50 dark:bg-red-950/30">
      <AlertTriangle className="h-4 w-4 text-red-600" />
      <AlertDescription className="text-red-700 dark:text-red-300 text-sm">
        <strong>🔴 {signedWithErrors.length} yêu cầu bị lỗi on-chain:</strong>{" "}
        {summaryParts.join(", ")}.
        <span className="block mt-1 text-xs opacity-80">
          Xem chi tiết lỗi trên từng card trong tab "Đã ký" để biết cách khắc phục.
        </span>
      </AlertDescription>
    </Alert>
  );
}
