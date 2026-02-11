import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Lock,
  Zap,
  Coins,
  Loader2,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  Wallet,
  AlertCircle,
  Repeat,
  Globe,
  Database,
} from "lucide-react";
import { useFUNMoneyContract } from "@/hooks/useFUNMoneyContract";
import { useWalletMismatch } from "@/hooks/useWalletMismatch";
import { useFUNMoneyStats } from "@/hooks/useFUNMoneyStats";
import { useAuth } from "@/hooks/useAuth";
import { useWeb3WalletContext } from "@/contexts/Web3WalletContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { ethers } from "ethers";
import { toast } from "sonner";
import { FUN_MONEY_ABI, FUN_MONEY_ADDRESSES } from "@/lib/funMoneyABI";

interface MismatchAlloc {
  locked: number;
  activated: number;
  balance: number;
}

export function TokenLifecyclePanel() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { switchToBSC } = useWeb3WalletContext();
  const dbStats = useFUNMoneyStats(user?.id);
  const {
    isConnected,
    connect,
    address,
    hasWallet,
    chainId,
    contractInfo,
    fetchContractInfo,
    activateTokens,
    claimTokens,
    mintStatus,
    networkDiagnostics,
    contractDiagnostics,
    walletError,
    resetBSCNetwork,
  } = useFUNMoneyContract();

  const [isActivating, setIsActivating] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [mismatchAlloc, setMismatchAlloc] = useState<MismatchAlloc | null>(null);

  const locked = parseFloat(contractInfo?.locked || "0");
  const activated = parseFloat(contractInfo?.activated || "0");
  const balance = parseFloat(contractInfo?.balance || "0");
  const total = locked + activated + balance;
  const allocationIsZero = isConnected && total === 0;

  const { mismatch } = useWalletMismatch(address, allocationIsZero);

  // Fetch allocation from mismatch address (read-only)
  const fetchMismatchAlloc = useCallback(async () => {
    if (!mismatch || !chainId) {
      setMismatchAlloc(null);
      return;
    }

    try {
      const contractAddress = FUN_MONEY_ADDRESSES[chainId];
      if (!contractAddress || typeof window === "undefined" || !(window as any).ethereum) return;

      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const readContract = new ethers.Contract(contractAddress, FUN_MONEY_ABI, provider);
      
      const [alloc, bal] = await Promise.all([
        readContract.alloc(mismatch.recipientAddress),
        readContract.balanceOf(mismatch.recipientAddress),
      ]);

      const decimals = 18;
      setMismatchAlloc({
        locked: parseFloat(ethers.formatUnits(alloc.locked, decimals)),
        activated: parseFloat(ethers.formatUnits(alloc.activated, decimals)),
        balance: parseFloat(ethers.formatUnits(bal, decimals)),
      });
    } catch (e) {
      console.warn("[TokenLifecycle] Could not fetch mismatch alloc:", e);
      setMismatchAlloc(null);
    }
  }, [mismatch, chainId]);

  // Fetch contract info when connected
  useEffect(() => {
    if (isConnected && address) {
      fetchContractInfo();
    }
  }, [isConnected, address, fetchContractInfo]);

  // Fetch mismatch data when detected
  useEffect(() => {
    fetchMismatchAlloc();
  }, [fetchMismatchAlloc]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchContractInfo();
    await fetchMismatchAlloc();
    setIsRefreshing(false);
  };

  const handleActivateAll = async () => {
    if (!contractInfo) return;
    const lockedWei = ethers.parseUnits(contractInfo.locked, 18);
    if (lockedWei <= 0n) {
      toast.info(t("mint.tokenLifecycle.noLocked"));
      return;
    }
    setIsActivating(true);
    await activateTokens(lockedWei);
    await fetchContractInfo();
    setIsActivating(false);
  };

  const handleClaimAll = async () => {
    if (!contractInfo) return;
    const activatedWei = ethers.parseUnits(contractInfo.activated, 18);
    if (activatedWei <= 0n) {
      toast.info(t("mint.tokenLifecycle.noActivated"));
      return;
    }
    setIsClaiming(true);
    await claimTokens(activatedWei);
    await fetchContractInfo();
    setIsClaiming(false);
  };

  // Prompt MetaMask to switch account
  const handleSwitchWallet = async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) return;
    setIsSwitching(true);
    try {
      await (window as any).ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      });
      // After user selects a different account, the wallet context will auto-update
      toast.success("Đã chuyển ví! Đang tải lại dữ liệu...");
      setTimeout(() => {
        fetchContractInfo();
        fetchMismatchAlloc();
      }, 1000);
    } catch (e: any) {
      if (!e?.message?.includes("rejected")) {
        toast.error("Không thể chuyển ví. Vui lòng đổi ví thủ công trong MetaMask.");
      }
    } finally {
      setIsSwitching(false);
    }
  };

  const hasNetworkIssue = networkDiagnostics && !networkDiagnostics.isValidChain;
  const hasContractIssue = contractDiagnostics && !contractDiagnostics.isContractValid;

  // Determine display data: if mismatch exists & current is empty, show mismatch data
  const showMismatchData = mismatch && allocationIsZero && mismatchAlloc;
  const displayLocked = showMismatchData ? mismatchAlloc.locked : locked;
  const displayActivated = showMismatchData ? mismatchAlloc.activated : activated;
  const displayBalance = showMismatchData ? mismatchAlloc.balance : balance;
  const displayTotal = displayLocked + displayActivated + displayBalance;
  const displayAddress = showMismatchData ? mismatch.recipientAddress : address;

  // Not connected state
  if (!isConnected) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Coins className="h-5 w-5 text-amber-600" />
            {t("mint.tokenLifecycle.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-3 py-4">
            <p className="text-sm text-muted-foreground">
              {t("mint.tokenLifecycle.connectPrompt")}
            </p>
            <Button
              onClick={connect}
              className="bg-gradient-to-r from-amber-500 to-orange-500"
              disabled={!hasWallet}
            >
              <Wallet className="mr-2 h-4 w-4" />
              {hasWallet ? t("mint.tokenLifecycle.connectButton") : t("mint.tokenLifecycle.installButton")}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Network/contract error
  if (hasNetworkIssue || hasContractIssue) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium text-sm">{t("mint.tokenLifecycle.networkError")}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {walletError || networkDiagnostics?.rpcError || contractDiagnostics?.error}
          </p>
          <Button size="sm" variant="outline" onClick={() => resetBSCNetwork()}>
            <RefreshCw className="mr-1 h-3 w-3" />
            {t("mint.tokenLifecycle.resetBSC")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Contract not available (wrong network, contract null)
  const contractNotAvailable = isConnected && !contractInfo && !hasNetworkIssue && !hasContractIssue;
  if (contractNotAvailable) {
    return (
      <Card className="border-amber-300 dark:border-amber-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Coins className="h-5 w-5 text-amber-600" />
            {t("mint.tokenLifecycle.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Warning banner */}
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
              <Globe className="h-4 w-4" />
              <span className="font-medium text-sm">Không thể đọc dữ liệu on-chain</span>
            </div>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Ví đang kết nối mạng <strong>chainId: {chainId || "N/A"}</strong>. 
              FUN Money contract chỉ có trên <strong>BSC Testnet (chainId: 97)</strong>. 
              Vui lòng chuyển mạng để xem và claim token.
            </p>
            <Button
              size="sm"
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white"
              onClick={async () => {
                const ok = await switchToBSC();
                if (ok) {
                  setTimeout(() => fetchContractInfo(), 1500);
                }
              }}
            >
              <Globe className="h-3.5 w-3.5 mr-1" />
              Chuyển sang BSC Testnet
            </Button>
          </div>

          {/* DB fallback stats */}
          {!dbStats.isLoading && (dbStats.totalMinted > 0 || dbStats.totalScored > 0) && (
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Database className="h-3 w-3" />
                <span>Dữ liệu từ hệ thống (chưa phải on-chain)</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center p-2 rounded bg-green-50 dark:bg-green-900/20">
                  <div className="text-xs text-muted-foreground">Đã mint on-chain</div>
                  <div className="text-sm font-bold text-green-600">
                    {dbStats.totalMinted.toLocaleString("vi-VN")} FUN
                  </div>
                </div>
                <div className="text-center p-2 rounded bg-blue-50 dark:bg-blue-900/20">
                  <div className="text-xs text-muted-foreground">Sẵn sàng claim</div>
                  <div className="text-sm font-bold text-blue-600">
                    {dbStats.totalScored.toLocaleString("vi-VN")} FUN
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Coins className="h-5 w-5 text-amber-600" />
            {t("mint.tokenLifecycle.title")}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Address display */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Wallet className="h-3 w-3" />
          <span>{displayAddress?.slice(0, 6)}...{displayAddress?.slice(-4)}</span>
          {showMismatchData && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-300 text-amber-600">
              Ví mint
            </Badge>
          )}
          {displayAddress && (
            <a
              href={`https://testnet.bscscan.com/address/${displayAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        {/* Switch wallet notice when mismatch */}
        {showMismatchData && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 space-y-2">
            <p className="text-xs text-amber-700 dark:text-amber-300">
              FUN Money đang ở ví <strong>{mismatch.recipientAddress.slice(0, 6)}...{mismatch.recipientAddress.slice(-4)}</strong>. 
              Chuyển sang ví này để Activate & Claim.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="w-full border-amber-300 text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/40"
              onClick={handleSwitchWallet}
              disabled={isSwitching}
            >
              {isSwitching ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
              ) : (
                <Repeat className="h-3.5 w-3.5 mr-1" />
              )}
              Chuyển ví trong MetaMask
            </Button>
          </div>
        )}

        {/* 3-Stage Pipeline */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
            <Lock className="h-4 w-4 mx-auto text-orange-600 mb-1" />
            <div className="text-xs text-muted-foreground">{t("mint.tokenLifecycle.locked")}</div>
            <div className="text-lg font-bold text-orange-600">
              {displayLocked.toLocaleString("vi-VN", { maximumFractionDigits: 0 })}
            </div>
          </div>

          <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <Zap className="h-4 w-4 mx-auto text-blue-600 mb-1" />
            <div className="text-xs text-muted-foreground">{t("mint.tokenLifecycle.activated")}</div>
            <div className="text-lg font-bold text-blue-600">
              {displayActivated.toLocaleString("vi-VN", { maximumFractionDigits: 0 })}
            </div>
          </div>

          <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <Coins className="h-4 w-4 mx-auto text-green-600 mb-1" />
            <div className="text-xs text-muted-foreground">{t("mint.tokenLifecycle.flowing")}</div>
            <div className="text-lg font-bold text-green-600">
              {displayBalance.toLocaleString("vi-VN", { maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        {displayTotal > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{t("mint.tokenLifecycle.pipelineProgress")}</span>
              <span>{t("mint.tokenLifecycle.flowingPercent").replace("{percent}", ((displayBalance / displayTotal) * 100).toFixed(0))}</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden flex">
              {displayLocked > 0 && (
                <div
                  className="h-full bg-orange-500"
                  style={{ width: `${(displayLocked / displayTotal) * 100}%` }}
                />
              )}
              {displayActivated > 0 && (
                <div
                  className="h-full bg-blue-500"
                  style={{ width: `${(displayActivated / displayTotal) * 100}%` }}
                />
              )}
              {displayBalance > 0 && (
                <div
                  className="h-full bg-green-500"
                  style={{ width: `${(displayBalance / displayTotal) * 100}%` }}
                />
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={handleActivateAll}
            disabled={isActivating || locked <= 0 || !!showMismatchData}
          >
            {isActivating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
            ) : (
              <Zap className="h-3.5 w-3.5 mr-1" />
            )}
            {t("mint.tokenLifecycle.activate")}
            {locked > 0 && <ArrowRight className="h-3 w-3 ml-1" />}
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500"
            onClick={handleClaimAll}
            disabled={isClaiming || activated <= 0 || !!showMismatchData}
          >
            {isClaiming ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
            ) : (
              <Coins className="h-3.5 w-3.5 mr-1" />
            )}
            {t("mint.tokenLifecycle.claim")}
            {activated > 0 && <ArrowRight className="h-3 w-3 ml-1" />}
          </Button>
        </div>

        {/* Error display */}
        {mintStatus.error && (
          <p className="text-xs text-destructive text-center">{mintStatus.error}</p>
        )}
      </CardContent>
    </Card>
  );
}
