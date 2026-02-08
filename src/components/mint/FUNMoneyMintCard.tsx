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
  Send,
} from "lucide-react";
import { useMintRequest } from "@/hooks/useMintRequest";
import { useWeb3Wallet } from "@/hooks/useWeb3Wallet";
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

// Helper to extract single object from one-to-one joined data
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

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "Đang xử lý", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  scored: { label: "Sẵn sàng mint", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  minted: { label: "Đã nhận FUN", color: "bg-blue-100 text-blue-700", icon: CheckCircle2 },
  failed: { label: "Thất bại", color: "bg-red-100 text-red-700", icon: AlertCircle },
};

export function FUNMoneyMintCard({ action, onMintSuccess }: Props) {
  const { isConnected, connect, address, hasWallet } = useWeb3Wallet();
  const { requestMint, isRequesting } = useMintRequest();
  const [requestSent, setRequestSent] = useState(false);

  const score = resolveOne(action.pplp_scores);
  const mintRequest = resolveOne(action.pplp_mint_requests);
  const statusConfig = STATUS_CONFIG[action.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;

  // Determine mint request status
  const mintRequestStatus = mintRequest?.status;
  const hasTxHash = mintRequest?.tx_hash && mintRequest.tx_hash.startsWith("0x");
  const isPendingApproval = mintRequestStatus === "pending" || requestSent;
  const isSigned = mintRequestStatus === "signed";
  const isMintedOnChain = mintRequestStatus === "minted" || action.status === "minted";

  const canRequestMint =
    action.status === "scored" &&
    score?.decision === "pass" &&
    !isPendingApproval &&
    !isSigned &&
    !isMintedOnChain;

  const handleRequestMint = async () => {
    if (!isConnected || !address) {
      await connect();
      return;
    }

    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      toast.error("Vui lòng kết nối ví MetaMask trước");
      return;
    }

    const success = await requestMint(action.id, address);
    if (success) {
      setRequestSent(true);
      onMintSuccess?.();
    }
  };

  return (
    <Card className={`transition-all ${canRequestMint ? "hover:shadow-lg hover:border-amber-400" : ""}`}>
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
            <span className="text-xl font-bold text-amber-600">
              +{score.final_reward.toLocaleString()} FUN
            </span>
          </div>
        )}

        {/* Mint Request Status Badges */}
        {isPendingApproval && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
            <Clock className="h-4 w-4 text-yellow-600" />
            <span className="text-sm text-yellow-700 dark:text-yellow-300">
              Đang chờ Admin phê duyệt
            </span>
          </div>
        )}

        {isSigned && !hasTxHash && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <CheckCircle2 className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-700 dark:text-blue-300">
              Đã ký, đang chờ giao dịch on-chain
            </span>
          </div>
        )}

        {/* Action Button */}
        {isMintedOnChain ? (
          <div className="space-y-2">
            <Button variant="outline" className="w-full" disabled>
              <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
              {hasTxHash ? "Đã mint on-chain" : "Đã nhận FUN"}
            </Button>
            {hasTxHash && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() =>
                  window.open(`https://testnet.bscscan.com/tx/${mintRequest?.tx_hash}`, "_blank")
                }
              >
                <ExternalLink className="mr-1 h-3 w-3" />
                Xem trên BSCScan
              </Button>
            )}
          </div>
        ) : canRequestMint ? (
          <Button
            onClick={handleRequestMint}
            disabled={isRequesting}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
          >
            {isRequesting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang gửi...
              </>
            ) : !isConnected ? (
              <>
                <Wallet className="mr-2 h-4 w-4" />
                Kết nối ví để Mint
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Request Mint FUN
              </>
            )}
          </Button>
        ) : isPendingApproval || isSigned ? (
          <Button variant="outline" className="w-full" disabled>
            <Clock className="mr-2 h-4 w-4" />
            Đang xử lý...
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
      </CardContent>
    </Card>
  );
}
