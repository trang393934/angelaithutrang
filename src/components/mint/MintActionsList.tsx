import { useAuth } from "@/hooks/useAuth";
import { usePPLPActions } from "@/hooks/usePPLPActions";
import { useMintRequest } from "@/hooks/useMintRequest";
import { FUNMoneyMintCard } from "./FUNMoneyMintCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, Sparkles, Inbox, AlertCircle, Send, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useWeb3WalletContext as useWeb3Wallet } from "@/contexts/Web3WalletContext";
import { toast } from "sonner";

export function MintActionsList() {
  const { user } = useAuth();
  const { actions, isLoading, fetchActions, fetchUnmintedActions } = usePPLPActions();
  const { requestMintBatch, isRequesting, batchProgress } = useMintRequest();
  const { isConnected, connect, address } = useWeb3Wallet();
  const [viewMode, setViewMode] = useState<"all" | "unminted">("all");

  useEffect(() => {
    if (user) {
      fetchActions();
    }
  }, [user, fetchActions]);

  if (!user) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Vui lòng đăng nhập để xem Light Actions
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  // Helper to resolve one-to-one joined data
  const resolveScore = (a: any) => {
    const s = a.pplp_scores;
    if (!s) return null;
    return Array.isArray(s) ? s[0] : s;
  };

  const resolveMintRequest = (a: any) => {
    const mr = a.pplp_mint_requests;
    if (!mr) return null;
    return Array.isArray(mr) ? mr[0] : mr;
  };

  // Claimable: scored with decision=pass, or already minted
  const claimableActions = actions?.filter((a: any) => {
    if (a.status === "minted") return true;
    if (a.status === "scored") {
      const score = resolveScore(a);
      return score?.decision === "pass";
    }
    return false;
  }) || [];

  // Unminted: scored+pass but NO mint request
  const unmintedActions = claimableActions.filter((a: any) => {
    if (a.status === "minted") return false;
    const mr = resolveMintRequest(a);
    return !mr;
  });

  // Failed: scored but decision != pass
  const failedActions = actions?.filter((a: any) => {
    if (a.status === "scored") {
      const score = resolveScore(a);
      return score?.decision !== "pass";
    }
    return false;
  }) || [];

  const pendingActions = actions?.filter((a: any) => a.status === "pending") || [];

  // Handle "Request Mint All" 
  const handleMintAll = async () => {
    if (!isConnected || !address) {
      await connect();
      return;
    }

    // Fetch ALL unminted actions (not just the 50 loaded)
    const allUnminted = await fetchUnmintedActions();
    if (allUnminted.length === 0) {
      toast.info("Không có action nào cần gửi yêu cầu mint");
      return;
    }

    const result = await requestMintBatch(
      allUnminted.map((a: any) => ({
        id: a.id,
        action_type: a.action_type,
        evidence_hash: a.evidence_hash,
        pplp_scores: a.pplp_scores,
      })),
      address
    );

    if (result.success > 0) {
      fetchActions();
    }
  };

  if (claimableActions.length === 0 && failedActions.length === 0 && pendingActions.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
          <Inbox className="h-8 w-8 text-amber-600" />
        </div>
        <div>
          <h3 className="font-medium">Chưa có Light Action nào</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Thực hiện các hành động yêu thương (chat, đăng bài, viết nhật ký) để tích lũy Light Actions
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-600" />
          <h3 className="font-semibold">Light Actions của bạn</h3>
          <span className="text-sm text-muted-foreground">
            ({claimableActions.length} sẵn sàng{failedActions.length > 0 ? `, ${failedActions.length} không đạt` : ""}, {pendingActions.length} đang xử lý)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchActions()}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Batch Mint All Button */}
      {unmintedActions.length > 0 && (
        <div className="p-4 rounded-lg border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="font-medium text-sm">
                ⚡ {unmintedActions.length} action chưa gửi yêu cầu mint
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Gửi tất cả cùng lúc để Admin duyệt nhanh hơn
              </p>
            </div>
            <Button
              onClick={handleMintAll}
              disabled={isRequesting}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              size="sm"
            >
              {isRequesting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-1" />
                  Gửi tất cả yêu cầu mint
                </>
              )}
            </Button>
          </div>

          {/* Progress bar */}
          {batchProgress && (
            <div className="space-y-1">
              <Progress value={(batchProgress.current / batchProgress.total) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground text-right">
                {batchProgress.current}/{batchProgress.total} đã gửi
              </p>
            </div>
          )}
        </div>
      )}

      {/* Scored/Ready to claim */}
      {claimableActions.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {claimableActions.map((action: any) => (
            <FUNMoneyMintCard 
              key={action.id} 
              action={action} 
              onMintSuccess={() => fetchActions()}
            />
          ))}
        </div>
      )}

      {/* Failed actions */}
      {failedActions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-red-500 flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4" />
            Không đạt điểm ({failedActions.length})
          </h4>
          <div className="grid gap-4 md:grid-cols-2 opacity-60">
            {failedActions.map((action: any) => (
              <FUNMoneyMintCard key={action.id} action={action} />
            ))}
          </div>
        </div>
      )}

      {/* Pending actions */}
      {pendingActions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Đang xử lý</h4>
          <div className="grid gap-4 md:grid-cols-2 opacity-70">
            {pendingActions.slice(0, 4).map((action: any) => (
              <FUNMoneyMintCard key={action.id} action={action} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
