 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { Progress } from "@/components/ui/progress";
 import {
   Sparkles,
   Coins,
   Clock,
   CheckCircle2,
   AlertCircle,
   Loader2,
   ExternalLink,
   Wallet,
   RefreshCw,
 } from "lucide-react";
 import { useFUNMoneyContract } from "@/hooks/useFUNMoneyContract";
 import { toast } from "sonner";
 import { useState } from "react";
 import { formatDistanceToNow } from "date-fns";
 import { vi } from "date-fns/locale";
 
interface ScoreData {
  light_score: number;
  final_reward: number;
  pillar_s: number;
  pillar_t: number;
  pillar_h: number;
  pillar_c: number;
  pillar_u: number;
  decision: string;
}

interface MintRequestData {
  tx_hash: string | null;
  status: string;
  minted_at: string | null;
}

interface PPLPAction {
  id: string;
  action_type: string;
  platform_id: string;
  status: string;
  created_at: string;
  minted_at?: string;
  mint_request_hash?: string | null;
  pplp_scores?: ScoreData | ScoreData[];
  pplp_mint_requests?: MintRequestData | MintRequestData[];
}

// Helper to extract single object from one-to-one joined data (can be object or array)
function resolveOne<T>(data: T | T[] | undefined | null): T | undefined {
  if (!data) return undefined;
  return Array.isArray(data) ? data[0] : data;
}
 
 interface Props {
   action: PPLPAction;
   onMintSuccess?: () => void;
 }
 
const ACTION_LABELS: Record<string, string> = {
  QUESTION_ASK: "Hỏi Angel AI",
  JOURNAL_WRITE: "Viết nhật ký biết ơn",
  CONTENT_CREATE: "Đăng bài cộng đồng",
  POST_CREATE: "Đăng bài cộng đồng",
  COMMENT_CREATE: "Bình luận bài viết",
  POST_ENGAGEMENT: "Tương tác bài viết",
  SHARE_CONTENT: "Chia sẻ nội dung",
  DONATE: "Đóng góp/Tặng quà",
  DONATE_SUPPORT: "Đóng góp/Tặng quà",
  CONTENT_SHARE: "Chia sẻ nội dung",
  COMMUNITY_HELP: "Giúp đỡ cộng đồng",
  HELP_COMMUNITY: "Xây dựng cộng đồng",
  MENTOR_HELP: "Hỗ trợ người mới",
  IDEA_SUBMIT: "Đề xuất ý tưởng",
  FEEDBACK_GIVE: "Góp ý cải thiện",
  DAILY_LOGIN: "Đăng nhập hàng ngày",
  GRATITUDE_PRACTICE: "Thực hành biết ơn",
  VISION_CREATE: "Tạo Vision Board",
};
 
 const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
   pending: { label: "Đang xử lý", color: "bg-yellow-100 text-yellow-700", icon: Clock },
   scored: { label: "Sẵn sàng claim", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
   minted: { label: "Đã nhận FUN", color: "bg-blue-100 text-blue-700", icon: CheckCircle2 },
   failed: { label: "Thất bại", color: "bg-red-100 text-red-700", icon: AlertCircle },
 };
 
 export function FUNMoneyMintCard({ action, onMintSuccess }: Props) {
   // Use unified wallet/contract state from useFUNMoneyContract
   const {
     isConnected,
     connect,
     address,
     hasWallet,
     executeMint,
     mintStatus,
     contractDiagnostics,
     networkDiagnostics,
     walletError,
     resetBSCNetwork,
   } = useFUNMoneyContract();
 
   const [isMinting, setIsMinting] = useState(false);
   const [txHash, setTxHash] = useState<string | null>(null);
   const [isResettingNetwork, setIsResettingNetwork] = useState(false);
 
  const score = resolveOne(action.pplp_scores);
  const mintRequest = resolveOne(action.pplp_mint_requests);
   const statusConfig = STATUS_CONFIG[action.status] || STATUS_CONFIG.pending;
   const StatusIcon = statusConfig.icon;
 
   // Determine if we have a valid on-chain transaction hash
   const actualTxHash = txHash || mintRequest?.tx_hash;
   const hasOnChainTx = actualTxHash && actualTxHash !== "null" && actualTxHash.startsWith("0x");
 
   // Check for network/contract issues
   const hasNetworkIssue = networkDiagnostics && !networkDiagnostics.isValidChain;
   const hasContractIssue = contractDiagnostics && !contractDiagnostics.isContractValid;
   const networkError = networkDiagnostics?.rpcError || contractDiagnostics?.error || walletError;
 
   const handleMint = async () => {
     if (!isConnected) {
       await connect();
       return; // Stop here, user needs to click again after connecting
     }
 
     // Double-check address after connect
     if (!address || address.startsWith("0x1234567890")) {
       toast.error("Ví chưa kết nối đúng. Vui lòng thử lại.");
       return;
     }
 
     // Check for network issues before minting
     if (hasNetworkIssue || hasContractIssue) {
       toast.error(networkError || "Network hoặc contract không hợp lệ. Vui lòng reset network.");
       return;
     }
 
     setIsMinting(true);
     const hash = await executeMint(action.id);
     setIsMinting(false);
 
     if (hash) {
       setTxHash(hash);
       onMintSuccess?.();
     }
   };
 
   const handleResetNetwork = async () => {
     setIsResettingNetwork(true);
     try {
       const success = await resetBSCNetwork();
       if (success) {
         toast.success("Đã reset BSC Testnet. Vui lòng kết nối lại.");
         // Reconnect after reset
         await connect();
       } else {
         toast.error("Không thể reset network. Vui lòng reset thủ công trong MetaMask.");
       }
     } finally {
       setIsResettingNetwork(false);
     }
   };
 
   const canMint =
     action.status === "scored" && score?.decision === "pass" && !isMinting && !hasNetworkIssue && !hasContractIssue;
   const isMinted = action.status === "minted" || txHash || mintRequest?.status === "minted";
 
   return (
     <Card className={`transition-all ${canMint ? "hover:shadow-lg hover:border-amber-400" : ""}`}>
       <CardHeader className="pb-2">
         <div className="flex items-center justify-between">
           <div className="flex items-center gap-2">
             <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30">
               <Sparkles className="h-4 w-4 text-amber-600" />
             </div>
             <div>
               <CardTitle className="text-sm font-medium">
                 {ACTION_LABELS[action.action_type] || action.action_type}
               </CardTitle>
               <div className="text-xs text-muted-foreground">
                 {formatDistanceToNow(new Date(action.created_at), { addSuffix: true, locale: vi })}
               </div>
             </div>
           </div>
           <Badge className={statusConfig.color}>
             <StatusIcon className="h-3 w-3 mr-1" />
             {statusConfig.label}
           </Badge>
         </div>
       </CardHeader>
 
       <CardContent className="space-y-4">
         {/* Light Score */}
         {score && (
           <div className="space-y-2">
             <div className="flex items-center justify-between text-sm">
               <span className="text-muted-foreground">Light Score</span>
               <span className="font-bold text-amber-600">{score.light_score}/100</span>
             </div>
             <Progress value={score.light_score} className="h-2" />
 
             {/* 5 Pillars mini view */}
             <div className="grid grid-cols-5 gap-1 text-xs">
               <div className="text-center p-1 rounded bg-red-50 dark:bg-red-900/20">
                 <div className="font-medium text-red-600">S</div>
                 <div>{score.pillar_s}</div>
               </div>
               <div className="text-center p-1 rounded bg-blue-50 dark:bg-blue-900/20">
                 <div className="font-medium text-blue-600">T</div>
                 <div>{score.pillar_t}</div>
               </div>
               <div className="text-center p-1 rounded bg-green-50 dark:bg-green-900/20">
                 <div className="font-medium text-green-600">H</div>
                 <div>{score.pillar_h}</div>
               </div>
               <div className="text-center p-1 rounded bg-yellow-50 dark:bg-yellow-900/20">
                 <div className="font-medium text-yellow-600">C</div>
                 <div>{score.pillar_c}</div>
               </div>
               <div className="text-center p-1 rounded bg-purple-50 dark:bg-purple-900/20">
                 <div className="font-medium text-purple-600">U</div>
                 <div>{score.pillar_u}</div>
               </div>
             </div>
           </div>
         )}
 
         {/* Reward Amount */}
         {score && (
           <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
             <div className="flex items-center gap-2">
               <Coins className="h-5 w-5 text-amber-600" />
               <span className="text-sm font-medium">Reward</span>
             </div>
             <span className="text-xl font-bold text-amber-600">+{score.final_reward.toLocaleString()} FUN</span>
           </div>
         )}
 
         {/* Network/Contract Error Warning */}
         {isConnected && (hasNetworkIssue || hasContractIssue) && (
           <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 space-y-2">
             <div className="flex items-start gap-2">
               <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
               <div className="text-sm text-red-700 dark:text-red-300">
                 <p className="font-medium">Network/Contract không hợp lệ</p>
                 <p className="text-xs mt-1">{networkError}</p>
                 {contractDiagnostics?.blockNumber && (
                   <p className="text-xs mt-1">Block: {contractDiagnostics.blockNumber.toLocaleString()}</p>
                 )}
               </div>
             </div>
             <Button
               variant="outline"
               size="sm"
               className="w-full text-red-600 border-red-300 hover:bg-red-100"
               onClick={handleResetNetwork}
               disabled={isResettingNetwork}
             >
               {isResettingNetwork ? (
                 <>
                   <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                   Đang reset...
                 </>
               ) : (
                 <>
                   <RefreshCw className="mr-2 h-3 w-3" />
                   Reset BSC Testnet Network
                 </>
               )}
             </Button>
           </div>
         )}
 
         {/* Action Button */}
         {isMinted ? (
           <div className="space-y-2">
             <Button variant="outline" className="w-full" disabled>
               <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
               {hasOnChainTx ? "Đã mint on-chain" : "Đã nhận FUN (off-chain)"}
             </Button>
             {hasOnChainTx ? (
               <Button
                 variant="ghost"
                 size="sm"
                 className="w-full text-xs"
                 onClick={() => window.open(`https://testnet.bscscan.com/tx/${actualTxHash}`, "_blank")}
               >
                 <ExternalLink className="mr-1 h-3 w-3" />
                 Xem trên BSCScan
               </Button>
             ) : (
               <Button
                 variant="ghost"
                 size="sm"
                 className="w-full text-xs text-amber-600 hover:text-amber-700"
                 onClick={handleMint}
                 disabled={isMinting}
               >
                 {isMinting ? (
                   <>
                     <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                     Đang mint...
                   </>
                 ) : (
                   <>
                     <Coins className="mr-1 h-3 w-3" />
                     Mint lên blockchain (tùy chọn)
                   </>
                 )}
               </Button>
             )}
           </div>
         ) : canMint ? (
           <Button
             onClick={handleMint}
             disabled={isMinting}
             className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
           >
             {isMinting ? (
               <>
                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                 Đang mint...
               </>
             ) : !isConnected ? (
               <>
                 <Wallet className="mr-2 h-4 w-4" />
                 Kết nối ví để Claim
               </>
             ) : (
               <>
                 <Coins className="mr-2 h-4 w-4" />
                 Claim FUN Money
               </>
             )}
           </Button>
         ) : action.status === "pending" ? (
           <Button variant="outline" className="w-full" disabled>
             <Clock className="mr-2 h-4 w-4" />
             Đang chờ chấm điểm...
           </Button>
         ) : (
           <Button variant="outline" className="w-full" disabled>
             <AlertCircle className="mr-2 h-4 w-4" />
             Không đủ điều kiện mint
           </Button>
         )}
 
         {/* Error message */}
         {mintStatus.error && <p className="text-xs text-red-500 text-center">{mintStatus.error}</p>}
       </CardContent>
     </Card>
   );
 }