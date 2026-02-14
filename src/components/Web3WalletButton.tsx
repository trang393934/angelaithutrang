import { useState, useEffect } from "react";
import { Wallet, ChevronDown, RefreshCw, ExternalLink, Copy, LogOut, Database } from "lucide-react";
import { useWeb3WalletContext as useWeb3Wallet } from "@/contexts/Web3WalletContext";
import { useAuth } from "@/hooks/useAuth";
import { useSavedWalletAddress } from "@/hooks/useSavedWalletAddress";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import camlyCoinLogo from "@/assets/camly-coin-logo.png";
import { WalletSelectorModal } from "@/components/wallet/WalletSelectorModal";

interface Web3WalletButtonProps {
  compact?: boolean;
}

export const Web3WalletButton = ({ compact = false }: Web3WalletButtonProps) => {
  const { user } = useAuth();
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
    selectProvider,
  } = useWeb3Wallet();

  const { savedAddress, shortSavedAddress, refetch: refetchSaved } = useSavedWalletAddress();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showWalletSelector, setShowWalletSelector] = useState(false);

  // Auto-save wallet address to database when connected
  useEffect(() => {
    if (!isConnected || !address || !user?.id) return;

    const saveWalletAddress = async () => {
      try {
        const { data: existing } = await supabase
          .from("user_wallet_addresses")
          .select("id, wallet_address")
          .eq("user_id", user.id)
          .maybeSingle();

        if (existing) {
          if (existing.wallet_address !== address) {
            await supabase
              .from("user_wallet_addresses")
              .update({ wallet_address: address })
              .eq("user_id", user.id);
            console.log("[Web3] Auto-saved updated wallet address to DB");
            refetchSaved();
          }
        } else {
          await supabase
            .from("user_wallet_addresses")
            .insert({ user_id: user.id, wallet_address: address });
          console.log("[Web3] Auto-saved new wallet address to DB");
          refetchSaved();
        }
      } catch (err) {
        console.warn("[Web3] Failed to auto-save wallet address:", err);
      }
    };

    saveWalletAddress();
  }, [isConnected, address, user?.id]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshBalances();
    setIsRefreshing(false);
    toast.success("Đã cập nhật số dư");
  };

  const copyAddress = (addr?: string | null) => {
    const toCopy = addr || address;
    if (toCopy) {
      navigator.clipboard.writeText(toCopy);
      toast.success("Đã sao chép địa chỉ ví");
    }
  };

  const openBscScan = (addr?: string | null) => {
    const toOpen = addr || address;
    if (toOpen) {
      window.open(`https://bscscan.com/address/${toOpen}`, "_blank");
    }
  };

  const getTokenLogo = (token: { symbol: string; logo: string }) => {
    if (token.symbol === "CAMLY") return camlyCoinLogo;
    return token.logo;
  };

  const isInIframe = (() => {
    try { return window.self !== window.top; } catch { return true; }
  })();

  const handleConnect = async () => {
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
    setShowWalletSelector(true);
  };

  const handleWalletSelected = async (provider: any) => {
    selectProvider(provider);
    setShowWalletSelector(false);
    try {
      await connect();
    } catch (err) {
      console.error("Wallet connect error caught in button:", err);
    }
  };

  // --- STATE: Not connected to MetaMask, but has a saved wallet address ---
  if (!isConnected && savedAddress && user) {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={`flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-medium hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 shadow-sm ${
              compact
                ? "px-1.5 lg:px-2 xl:px-2.5 py-1 lg:py-1.5 text-[10px] lg:text-xs xl:text-sm"
                : "px-2.5 xl:px-3 py-1.5 text-xs xl:text-sm"
            }`}>
              <Database className={compact ? "w-3 h-3 lg:w-3.5 lg:h-3.5" : "w-3.5 h-3.5"} />
              <span className="hidden sm:inline">{shortSavedAddress}</span>
              <ChevronDown className="w-3 h-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 bg-background border border-border shadow-xl rounded-xl p-2">
            <div className="px-3 py-2 border-b border-border mb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Ví đã lưu</span>
                <span className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-1.5 py-0.5 rounded-full font-medium">Offline</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-sm font-medium">{shortSavedAddress}</span>
                <button onClick={() => copyAddress(savedAddress)} className="p-1 hover:bg-muted rounded transition-colors">
                  <Copy className="w-3 h-3" />
                </button>
                <button onClick={() => openBscScan(savedAddress)} className="p-1 hover:bg-muted rounded transition-colors">
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
            <DropdownMenuItem onClick={handleConnect} className="gap-2 cursor-pointer">
              <Wallet className="w-4 h-4" />
              <span>Kết nối MetaMask để giao dịch</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <WalletSelectorModal
          open={showWalletSelector}
          onOpenChange={setShowWalletSelector}
          onSelect={handleWalletSelected}
          isConnecting={isConnecting}
        />
      </>
    );
  }

  // --- STATE: Not connected, no saved address ---
  if (!isConnected) {
    return (
      <>
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
              {compact ? (
                <span className="hidden xl:inline">Ví</span>
              ) : (
                <span className="hidden sm:inline">Kết nối ví</span>
              )}
            </>
          )}
        </button>
        <WalletSelectorModal
          open={showWalletSelector}
          onOpenChange={setShowWalletSelector}
          onSelect={handleWalletSelected}
          isConnecting={isConnecting}
        />
      </>
    );
  }

  // --- STATE: Connected via MetaMask (live) ---
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
        <div className="px-3 py-2 border-b border-border mb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">BSC Wallet</span>
              <span className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 px-1.5 py-0.5 rounded-full font-medium">Live</span>
            </div>
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
            <button onClick={() => copyAddress()} className="p-1 hover:bg-muted rounded transition-colors">
              <Copy className="w-3 h-3" />
            </button>
            <button onClick={() => openBscScan()} className="p-1 hover:bg-muted rounded transition-colors">
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>

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
