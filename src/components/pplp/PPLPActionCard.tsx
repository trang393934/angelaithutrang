import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { CheckCircle, Clock, XCircle, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { PPLPAction } from "@/hooks/usePPLPActions";

interface PPLPActionCardProps {
  action: PPLPAction;
  score?: {
    light_score: number;
    pillar_s: number;
    pillar_t: number;
    pillar_h: number;
    pillar_c: number;
    pillar_u: number;
    final_reward: number;
    decision: string;
  } | null;
  onViewDetails?: (actionId: string) => void;
}

const ACTION_TYPE_LABELS: Record<string, { label: string; icon: string }> = {
  QUESTION_ASK: { label: "Hỏi Angel AI", icon: "💬" },
  JOURNAL_WRITE: { label: "Viết Nhật Ký", icon: "📝" },
  CONTENT_SHARE: { label: "Chia Sẻ", icon: "🔗" },
  ENGAGEMENT_LIKE: { label: "Tương Tác", icon: "❤️" },
  COMMUNITY_POST: { label: "Đăng Bài", icon: "📢" },
  COMMUNITY_COMMENT: { label: "Bình Luận", icon: "💭" },
  HELP_OTHER: { label: "Giúp Đỡ", icon: "🤝" },
  DONATION: { label: "Đóng Góp", icon: "🎁" },
  VISION_CREATE: { label: "Tạo Vision", icon: "🌟" },
};

const STATUS_CONFIG = {
  pending: { 
    label: "Đang xử lý", 
    color: "bg-amber-500/20 text-amber-600 border-amber-500/30",
    icon: Clock
  },
  scored: { 
    label: "Đã chấm điểm", 
    color: "bg-blue-500/20 text-blue-600 border-blue-500/30",
    icon: CheckCircle
  },
  minted: { 
    label: "Đã mint", 
    color: "bg-emerald-500/20 text-emerald-600 border-emerald-500/30",
    icon: Sparkles
  },
  rejected: { 
    label: "Từ chối", 
    color: "bg-red-500/20 text-red-600 border-red-500/30",
    icon: XCircle
  },
};

export const PPLPActionCard = ({ action, score, onViewDetails }: PPLPActionCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const actionType = ACTION_TYPE_LABELS[action.action_type] || { 
    label: action.action_type, 
    icon: "⚡" 
  };
  
  const status = STATUS_CONFIG[action.status] || STATUS_CONFIG.pending;
  const StatusIcon = status.icon;

  const timeAgo = formatDistanceToNow(new Date(action.created_at), { 
    addSuffix: true, 
    locale: vi 
  });

  return (
    <Card className="border-border/50 hover:border-primary/30 transition-colors">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            {/* Left: Icon + Info */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xl">
                {actionType.icon}
              </div>
              <div>
                <h4 className="font-medium text-sm">{actionType.label}</h4>
                <p className="text-xs text-muted-foreground">{timeAgo}</p>
              </div>
            </div>

            {/* Right: Status + Score */}
            <div className="flex items-center gap-2">
              {score && action.status !== "pending" && (
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">
                    {score.light_score.toFixed(0)}
                  </p>
                  <p className="text-xs text-muted-foreground">Light Score</p>
                </div>
              )}
              <Badge className={status.color}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {status.label}
              </Badge>
            </div>
          </div>

          {/* Expandable Details */}
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full mt-3 text-xs">
              {isOpen ? (
                <>Thu gọn <ChevronUp className="w-3 h-3 ml-1" /></>
              ) : (
                <>Xem chi tiết <ChevronDown className="w-3 h-3 ml-1" /></>
              )}
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent className="mt-3">
            <div className="space-y-3 pt-3 border-t border-border/50">
              {/* Action ID */}
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Action ID</span>
                <span className="font-mono">{action.id.slice(0, 8)}...</span>
              </div>

              {/* Platform */}
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Platform</span>
                <span>{action.platform_id}</span>
              </div>

              {/* Score Breakdown */}
              {score && (
                <div className="space-y-2">
                  <p className="text-xs font-medium">5-Pillar Scores:</p>
                  <div className="grid grid-cols-5 gap-1">
                    {[
                      { key: "S", value: score.pillar_s, color: "bg-emerald-500" },
                      { key: "T", value: score.pillar_t, color: "bg-blue-500" },
                      { key: "H", value: score.pillar_h, color: "bg-pink-500" },
                      { key: "C", value: score.pillar_c, color: "bg-amber-500" },
                      { key: "U", value: score.pillar_u, color: "bg-violet-500" },
                    ].map(pillar => (
                      <div key={pillar.key} className="text-center">
                        <div className={`h-1.5 rounded-full ${pillar.color} opacity-30`}>
                          <div 
                            className={`h-full rounded-full ${pillar.color}`}
                            style={{ width: `${pillar.value}%` }}
                          />
                        </div>
                        <p className="text-[10px] mt-1">
                          <span className="font-bold">{pillar.key}</span>: {pillar.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Reward */}
                  {score.final_reward > 0 && (
                    <div className="flex justify-between text-xs bg-primary/10 rounded-lg p-2 mt-2">
                      <span>Reward</span>
                      <span className="font-bold text-primary">
                        +{score.final_reward.toLocaleString()} FUN
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* View Full Details Button */}
              {onViewDetails && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-xs"
                  onClick={() => onViewDetails(action.id)}
                >
                  Xem đầy đủ
                </Button>
              )}
            </div>
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
    </Card>
  );
};
