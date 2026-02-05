 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { Skeleton } from "@/components/ui/skeleton";
 import { ExternalLink, Wallet, RefreshCw, Coins, TrendingUp } from "lucide-react";
 import { useFUNMoneyContract } from "@/hooks/useFUNMoneyContract";
 import { useWeb3Wallet } from "@/hooks/useWeb3Wallet";
 import { useEffect, useState } from "react";
 import funMoneyLogo from "@/assets/fun-money-logo.png";
 
 export function FUNMoneyBalanceCard() {
   const { isConnected, address, connect, hasWallet, shortAddress } = useWeb3Wallet();
   const { contractInfo, fetchContractInfo, getContractAddress } = useFUNMoneyContract();
   const [isLoading, setIsLoading] = useState(false);
 
   const contractAddress = getContractAddress();
 
   useEffect(() => {
     if (isConnected && contractAddress) {
       handleRefresh();
     }
   }, [isConnected, contractAddress]);
 
   const handleRefresh = async () => {
     setIsLoading(true);
     await fetchContractInfo();
     setIsLoading(false);
   };
 
   if (!hasWallet) {
     return (
       <Card className="border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
         <CardHeader className="pb-2">
           <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
             <Wallet className="h-5 w-5" />
             FUN Money On-Chain
           </CardTitle>
         </CardHeader>
         <CardContent className="space-y-4">
           <p className="text-sm text-muted-foreground">
             Cài đặt MetaMask hoặc ví Web3 để mint FUN Money về ví của bạn.
           </p>
           <Button 
             onClick={() => window.open("https://metamask.io/download/", "_blank")}
             className="w-full bg-gradient-to-r from-amber-500 to-orange-500"
           >
             <Wallet className="mr-2 h-4 w-4" />
             Cài đặt MetaMask
           </Button>
         </CardContent>
       </Card>
     );
   }
 
   if (!isConnected) {
     return (
       <Card className="border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
         <CardHeader className="pb-2">
           <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
             <img src={funMoneyLogo} alt="FUN" className="h-6 w-6" />
             FUN Money On-Chain
           </CardTitle>
         </CardHeader>
         <CardContent className="space-y-4">
           <p className="text-sm text-muted-foreground">
             Kết nối ví để xem số dư FUN Money và claim reward về ví.
           </p>
           <Button 
             onClick={connect}
             className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
           >
             <Wallet className="mr-2 h-4 w-4" />
             Kết nối ví BSC Testnet
           </Button>
         </CardContent>
       </Card>
     );
   }
 
   return (
     <Card className="border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
       <CardHeader className="pb-2">
         <div className="flex items-center justify-between">
           <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
             <img src={funMoneyLogo} alt="FUN" className="h-6 w-6" />
             FUN Money On-Chain
           </CardTitle>
           <div className="flex items-center gap-2">
             <Badge variant="outline" className="text-xs">
               {shortAddress}
             </Badge>
             <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={isLoading}>
               <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
             </Button>
           </div>
         </div>
       </CardHeader>
       <CardContent className="space-y-4">
         {isLoading || !contractInfo ? (
           <div className="space-y-3">
             <Skeleton className="h-12 w-32" />
             <Skeleton className="h-4 w-full" />
             <Skeleton className="h-4 w-2/3" />
           </div>
         ) : (
           <>
             {/* Balance */}
             <div className="flex items-center gap-3">
               <img src={funMoneyLogo} alt="FUN" className="h-12 w-12" />
               <div>
                 <div className="text-3xl font-bold text-amber-700 dark:text-amber-400">
                   {parseFloat(contractInfo.balance).toLocaleString()} FUN
                 </div>
                 <div className="text-sm text-muted-foreground">
                   Số dư trong ví của bạn
                 </div>
               </div>
             </div>
 
             {/* Epoch Caps */}
             <div className="grid grid-cols-2 gap-3 pt-2">
               <div className="rounded-lg bg-white/50 dark:bg-white/5 p-3">
                 <div className="flex items-center gap-1 text-xs text-muted-foreground">
                   <Coins className="h-3 w-3" />
                   Epoch Cap còn lại
                 </div>
                 <div className="font-semibold text-sm">
                   {parseFloat(contractInfo.remainingEpochCapacity).toLocaleString()} FUN
                 </div>
               </div>
               <div className="rounded-lg bg-white/50 dark:bg-white/5 p-3">
                 <div className="flex items-center gap-1 text-xs text-muted-foreground">
                   <TrendingUp className="h-3 w-3" />
                   User Cap còn lại
                 </div>
                 <div className="font-semibold text-sm">
                   {parseFloat(contractInfo.remainingUserCapacity).toLocaleString()} FUN
                 </div>
               </div>
             </div>
 
             {/* Contract Info */}
             <div className="flex items-center justify-between pt-2 border-t">
               <div className="text-xs text-muted-foreground">
                 Epoch: #{contractInfo.currentEpoch} | Policy v{contractInfo.policyVersion}
               </div>
               <Button 
                 variant="ghost" 
                 size="sm" 
                 className="text-xs h-7"
                 onClick={() => window.open(`https://testnet.bscscan.com/address/${contractAddress}`, "_blank")}
               >
                 <ExternalLink className="mr-1 h-3 w-3" />
                 BSCScan
               </Button>
             </div>
           </>
         )}
       </CardContent>
     </Card>
   );
 }