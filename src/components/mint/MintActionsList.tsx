 import { useAuth } from "@/hooks/useAuth";
 import { usePPLPActions } from "@/hooks/usePPLPActions";
 import { FUNMoneyMintCard } from "./FUNMoneyMintCard";
 import { Skeleton } from "@/components/ui/skeleton";
 import { Button } from "@/components/ui/button";
 import { RefreshCw, Sparkles, Inbox, AlertCircle } from "lucide-react";
import { useEffect } from "react";
 
 export function MintActionsList() {
   const { user } = useAuth();
  const { actions, isLoading, fetchActions } = usePPLPActions();

  // Fetch actions on mount
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
 
  // Helper to resolve one-to-one joined data (object or array)
  const resolveScore = (a: any) => {
    const s = a.pplp_scores;
    if (!s) return null;
    return Array.isArray(s) ? s[0] : s;
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

  // Failed: scored but decision != pass (Light Score < 60)
  const failedActions = actions?.filter((a: any) => {
    if (a.status === "scored") {
      const score = resolveScore(a);
      return score?.decision !== "pass";
    }
    return false;
  }) || [];

  const pendingActions = actions?.filter((a: any) => a.status === "pending") || [];
 
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
       <div className="flex items-center justify-between">
         <div className="flex items-center gap-2">
           <Sparkles className="h-5 w-5 text-amber-600" />
           <h3 className="font-semibold">Light Actions của bạn</h3>
          <span className="text-sm text-muted-foreground">
            ({claimableActions.length} sẵn sàng{failedActions.length > 0 ? `, ${failedActions.length} không đạt` : ""}, {pendingActions.length} đang xử lý)
          </span>
         </div>
        <Button variant="outline" size="sm" onClick={() => fetchActions()}>
           <RefreshCw className="h-4 w-4 mr-1" />
           Làm mới
         </Button>
       </div>
 
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

      {/* Failed actions - Light Score < 60 */}
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