 import { useAuth } from "@/hooks/useAuth";
 import { usePPLPActions } from "@/hooks/usePPLPActions";
 import { FUNMoneyMintCard } from "./FUNMoneyMintCard";
 import { Skeleton } from "@/components/ui/skeleton";
 import { Button } from "@/components/ui/button";
 import { RefreshCw, Sparkles, Inbox } from "lucide-react";
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
 
   // Filter actions that are scored or minted (can be claimed or already claimed)
   const mintableActions = actions?.filter(
     (a: any) => a.status === "scored" || a.status === "minted"
   ) || [];
 
   const pendingActions = actions?.filter((a: any) => a.status === "pending") || [];
 
   if (mintableActions.length === 0 && pendingActions.length === 0) {
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
             ({mintableActions.length} sẵn sàng, {pendingActions.length} đang xử lý)
           </span>
         </div>
        <Button variant="outline" size="sm" onClick={() => fetchActions()}>
           <RefreshCw className="h-4 w-4 mr-1" />
           Làm mới
         </Button>
       </div>
 
       {/* Scored/Ready to claim */}
       {mintableActions.length > 0 && (
         <div className="grid gap-4 md:grid-cols-2">
           {mintableActions.map((action: any) => (
             <FUNMoneyMintCard 
               key={action.id} 
               action={action} 
              onMintSuccess={() => fetchActions()}
             />
           ))}
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