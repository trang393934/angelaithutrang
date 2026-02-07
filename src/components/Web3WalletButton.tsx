import { useState } from "react";
import { Wallet, ChevronDown, RefreshCw, ExternalLink, Copy, LogOut } from "lucide-react";
import { useWeb3Wallet } from "@/hooks/useWeb3Wallet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import camlyCoinLogo from "@/assets/camly-coin-logo.png";

interface Web3WalletButtonProps {
  compact?: boolean;
}

export const Web3WalletButton = ({ compact = false }: Web3WalletButtonProps) => {
  const {
    isConnected,
    isConnecting,
    shortAddress,
    address,
    balances,
    isCorrectChain,
    error,
    hasWallet,
    connect,
    disconnect,
    switchToBSC,
    refreshBalances,
  } = useWeb3Wallet();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshBalances();
    setIsRefreshing(false);
    toast.success("Đã cập nhật số dư");
  };

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast.success("Đã sao chép địa chỉ ví");
    }
  };

  const openBscScan = () => {
    if (address) {
      window.open(`https://bscscan.com/address/${address}`, "_blank");
    }
  };

  // Get logo for token
  const getTokenLogo = (token: { symbol: string; logo: string }) => {
    if (token.symbol === "CAMLY") {
      return camlyCoinLogo;
    }
    return token.logo;
  };

  // Detect iframe environment
  const isInIframe = (() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  })();

  const handleConnect = async () => {
    // Show guidance when running inside iframe (e.g. Lovable preview)
    if (isInIframe) {
      toast.info(
        <div className="space-y-2">
          <p className="font-medium">Không thể kết nối ví trong preview</p>
          <p className="text-sm text-muted-foreground">
            Vui lòng mở ứng dụng trong tab mới để kết nối MetaMask.
          </p>
          <button
            onClick={() => window.open("https://angelaithutrang.lovable.app", "_blank")}
            className="text-xs underline text-primary hover:text-primary/80"
          >
            Mở trong tab mới →
          </button>
        </div>,
        { duration: 8000 }
      );
      return;
    }

    if (!hasWallet) {
      toast.info(
        <div className="space-y-2">
          <p className="font-medium">Chưa có ví Web3</p>
          <p className="text-sm text-muted-foreground">
            Con cần cài đặt MetaMask để kết nối ví. Đang mở trang tải...
          </p>
        </div>,
        { duration: 5000 }
      );
      setTimeout(() => {
        window.open("https://metamask.io/download/", "_blank");
      }, 1000);
      return;
    }
    try {
      await connect();
    } catch (err) {
      console.error("Wallet connect error caught in button:", err);
    }
  };

  if (!isConnected) {
    return (
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className={`flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold hover:from-amber-600 hover:to-orange-600 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 ${
          compact 
            ? "px-1.5 lg:px-2 xl:px-2.5 py-1 lg:py-1.5 text-[10px] lg:text-xs xl:text-sm" 
            : "px-2.5 xl:px-3 py-1.5 text-xs xl:text-sm"
        }`}
      >
        {isConnecting ? (
          <>
            <RefreshCw className={compact ? "w-3 h-3" : "w-3.5 h-3.5 animate-spin"} />
            {!compact && <span className="hidden sm:inline">Kết nối...</span>}
          </>
        ) : (
          <>
            <Wallet className={compact ? "w-3 h-3 lg:w-3.5 lg:h-3.5" : "w-3.5 h-3.5"} />
            {/* Hide text on lg when compact, show icon only */}
            {compact ? (
              <span className="hidden xl:inline">Ví</span>
            ) : (
              <span className="hidden sm:inline">Kết nối ví</span>
            )}
          </>
        )}
      </button>
    );
  }

  // Connected state with dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1.5 px-2 xl:px-3 py-1 xl:py-1.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium text-xs xl:text-sm hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span>{shortAddress}</span>
          <ChevronDown className="w-3 h-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-64 xl:w-72 bg-background border border-border shadow-xl rounded-xl p-2"
      >
        {/* Header */}
        <div className="px-3 py-2 border-b border-border mb-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">BSC Wallet</span>
            <button
              onClick={handleRefresh}
              className="p-1 hover:bg-muted rounded-full transition-colors"
              title="Làm mới số dư"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-mono text-sm font-medium">{shortAddress}</span>
            <button onClick={copyAddress} className="p-1 hover:bg-muted rounded transition-colors">
              <Copy className="w-3 h-3" />
            </button>
            <button onClick={openBscScan} className="p-1 hover:bg-muted rounded transition-colors">
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Token Balances */}
        <div className="space-y-1 max-h-60 overflow-y-auto">
          {balances.length > 0 ? (
            balances.map((token) => (
              <div
                key={token.address}
                className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <img
                    src={getTokenLogo(token)}
                    alt={token.symbol}
                    className="w-6 h-6 rounded-full object-cover bg-muted"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder.svg";
                    }}
                  />
                  <div>
                    <span className="font-medium text-sm">{token.symbol}</span>
                    <p className="text-xs text-muted-foreground">{token.name}</p>
                  </div>
                </div>
                <span className="font-mono text-sm font-semibold">
                  {parseFloat(token.balanceFormatted).toLocaleString()}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-muted-foreground text-sm">
              Không có token trong ví
            </div>
          )}
        </div>

        <DropdownMenuSeparator className="my-2" />

        {/* Actions */}
        <DropdownMenuItem
          onClick={disconnect}
          className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Ngắt kết nối</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
