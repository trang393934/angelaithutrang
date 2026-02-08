import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
} from "lucide-react";
import { useFUNMoneyContract } from "@/hooks/useFUNMoneyContract";
import { ethers } from "ethers";
import { toast } from "sonner";

export function TokenLifecyclePanel() {
  const {
    isConnected,
    connect,
    address,
    hasWallet,
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

  // Fetch contract info when connected
  useEffect(() => {
    if (isConnected && address) {
      fetchContractInfo();
    }
  }, [isConnected, address, fetchContractInfo]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchContractInfo();
    setIsRefreshing(false);
  };

  const handleActivateAll = async () => {
    if (!contractInfo) return;
    const lockedWei = ethers.parseUnits(contractInfo.locked, 18);
    if (lockedWei <= 0n) {
      toast.info("Không có FUN nào đang locked");
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
      toast.info("Không có FUN nào đang activated");
      return;
    }
    setIsClaiming(true);
    await claimTokens(activatedWei);
    await fetchContractInfo();
    setIsClaiming(false);
  };

  const hasNetworkIssue = networkDiagnostics && !networkDiagnostics.isValidChain;
  const hasContractIssue = contractDiagnostics && !contractDiagnostics.isContractValid;

  // Not connected state
  if (!isConnected) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Coins className="h-5 w-5 text-amber-600" />
            Token Lifecycle
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-3 py-4">
            <p className="text-sm text-muted-foreground">
              Kết nối ví để quản lý FUN Money on-chain
            </p>
            <Button
              onClick={connect}
              className="bg-gradient-to-r from-amber-500 to-orange-500"
              disabled={!hasWallet}
            >
              <Wallet className="mr-2 h-4 w-4" />
              {hasWallet ? "Kết nối MetaMask" : "Cài đặt MetaMask"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Network/contract error
  if (hasNetworkIssue || hasContractIssue) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium text-sm">Network/Contract không hợp lệ</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {walletError || networkDiagnostics?.rpcError || contractDiagnostics?.error}
          </p>
          <Button size="sm" variant="outline" onClick={() => resetBSCNetwork()}>
            <RefreshCw className="mr-1 h-3 w-3" />
            Reset BSC Testnet
          </Button>
        </CardContent>
      </Card>
    );
  }

  const locked = parseFloat(contractInfo?.locked || "0");
  const activated = parseFloat(contractInfo?.activated || "0");
  const balance = parseFloat(contractInfo?.balance || "0");
  const total = locked + activated + balance;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Coins className="h-5 w-5 text-amber-600" />
            Token Lifecycle
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Address */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Wallet className="h-3 w-3" />
          <span>{address?.slice(0, 6)}...{address?.slice(-4)}</span>
          {address && (
            <a
              href={`https://testnet.bscscan.com/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        {/* 3-Stage Pipeline */}
        <div className="grid grid-cols-3 gap-2">
          {/* LOCKED */}
          <div className="text-center p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
            <Lock className="h-4 w-4 mx-auto text-orange-600 mb-1" />
            <div className="text-xs text-muted-foreground">Locked</div>
            <div className="text-lg font-bold text-orange-600">
              {locked.toLocaleString("vi-VN", { maximumFractionDigits: 0 })}
            </div>
          </div>

          {/* ACTIVATED */}
          <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <Zap className="h-4 w-4 mx-auto text-blue-600 mb-1" />
            <div className="text-xs text-muted-foreground">Activated</div>
            <div className="text-lg font-bold text-blue-600">
              {activated.toLocaleString("vi-VN", { maximumFractionDigits: 0 })}
            </div>
          </div>

          {/* FLOWING (spendable) */}
          <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <Coins className="h-4 w-4 mx-auto text-green-600 mb-1" />
            <div className="text-xs text-muted-foreground">Flowing</div>
            <div className="text-lg font-bold text-green-600">
              {balance.toLocaleString("vi-VN", { maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        {total > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Pipeline Progress</span>
              <span>{((balance / total) * 100).toFixed(0)}% Flowing</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden flex">
              {locked > 0 && (
                <div
                  className="h-full bg-orange-500"
                  style={{ width: `${(locked / total) * 100}%` }}
                />
              )}
              {activated > 0 && (
                <div
                  className="h-full bg-blue-500"
                  style={{ width: `${(activated / total) * 100}%` }}
                />
              )}
              {balance > 0 && (
                <div
                  className="h-full bg-green-500"
                  style={{ width: `${(balance / total) * 100}%` }}
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
            disabled={isActivating || locked <= 0}
          >
            {isActivating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
            ) : (
              <Zap className="h-3.5 w-3.5 mr-1" />
            )}
            Activate
            {locked > 0 && <ArrowRight className="h-3 w-3 ml-1" />}
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500"
            onClick={handleClaimAll}
            disabled={isClaiming || activated <= 0}
          >
            {isClaiming ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
            ) : (
              <Coins className="h-3.5 w-3.5 mr-1" />
            )}
            Claim
            {activated > 0 && <ArrowRight className="h-3 w-3 ml-1" />}
          </Button>
        </div>

        {/* Error display */}
        {mintStatus.error && (
          <p className="text-xs text-red-500 text-center">{mintStatus.error}</p>
        )}
      </CardContent>
    </Card>
  );
}
