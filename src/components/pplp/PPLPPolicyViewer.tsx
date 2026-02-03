import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { FileText, CheckCircle, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PPLPPolicyData } from "@/hooks/usePPLPPolicy";

interface PPLPPolicyViewerProps {
  policy: PPLPPolicyData;
  compact?: boolean;
}

export const PPLPPolicyViewer = ({ policy, compact = false }: PPLPPolicyViewerProps) => {
  const { weights, thresholds, base_reward } = policy.policy_json;
  
  const timeAgo = formatDistanceToNow(new Date(policy.created_at), { 
    addSuffix: true, 
    locale: vi 
  });

  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm">Policy v{policy.version}</span>
          {policy.is_active && (
            <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 text-xs">
              Active
            </Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground">{timeAgo}</span>
      </div>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5 text-primary" />
            Policy v{policy.version}
          </CardTitle>
          {policy.is_active && (
            <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">
              <CheckCircle className="w-3 h-3 mr-1" />
              Active
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3" />
          {timeAgo}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Weights */}
        <div>
          <h4 className="text-sm font-medium mb-2">Pillar Weights</h4>
          <div className="grid grid-cols-5 gap-2">
            {Object.entries(weights).map(([key, value]) => (
              <div 
                key={key}
                className="text-center p-2 bg-muted/50 rounded-lg"
              >
                <p className="text-lg font-bold text-primary">{key}</p>
                <p className="text-xs text-muted-foreground">{(value * 100).toFixed(0)}%</p>
              </div>
            ))}
          </div>
        </div>

        {/* Thresholds */}
        <div>
          <h4 className="text-sm font-medium mb-2">Thresholds</h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Min Light Score</p>
              <p className="text-lg font-bold">{thresholds.min_light_score}</p>
            </div>
            <div className="p-2 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Min Integrity (K)</p>
              <p className="text-lg font-bold">{thresholds.min_integrity_k}</p>
            </div>
          </div>
        </div>

        {/* Base Reward */}
        <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
          <span className="text-sm font-medium">Base Reward</span>
          <span className="text-lg font-bold text-primary">{base_reward} FUN</span>
        </div>

        {/* Formula */}
        <div className="p-3 bg-muted/30 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Light Score Formula:</p>
          <code className="text-xs font-mono">
            (S×{weights.S}) + (T×{weights.T}) + (H×{weights.H}) + (C×{weights.C}) + (U×{weights.U})
          </code>
          <p className="text-xs text-muted-foreground mt-2 mb-1">Reward Formula:</p>
          <code className="text-xs font-mono">
            {base_reward} × Q × I × K
          </code>
        </div>
      </CardContent>
    </Card>
  );
};
