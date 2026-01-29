import { Users, Lock, Globe, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CircleCardProps {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  circleType: "public" | "private" | "invite_only";
  memberCount?: number;
  maxMembers?: number;
  isOfficial?: boolean;
  isMember?: boolean;
  onJoin?: (circleId: string) => void;
  onLeave?: (circleId: string) => void;
  onView?: (circleId: string) => void;
}

export const CircleCard = ({
  id,
  name,
  description,
  icon,
  color,
  circleType,
  memberCount = 0,
  maxMembers = 1000,
  isOfficial = false,
  isMember = false,
  onJoin,
  onLeave,
  onView
}: CircleCardProps) => {
  const getTypeIcon = () => {
    switch (circleType) {
      case "private":
        return <Lock className="w-3 h-3" />;
      case "invite_only":
        return <Star className="w-3 h-3" />;
      default:
        return <Globe className="w-3 h-3" />;
    }
  };

  const getTypeLabel = () => {
    switch (circleType) {
      case "private":
        return "Riêng tư";
      case "invite_only":
        return "Chỉ mời";
      default:
        return "Công khai";
    }
  };

  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
      onClick={() => onView?.(id)}
    >
      {/* Colored Header */}
      <div 
        className="h-16 relative"
        style={{ backgroundColor: color + "30" }}
      >
        <div 
          className="absolute -bottom-6 left-4 w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-lg"
          style={{ backgroundColor: color }}
        >
          {icon}
        </div>
        {isOfficial && (
          <Badge className="absolute top-2 right-2 bg-divine-gold text-white text-xs">
            Official
          </Badge>
        )}
      </div>

      <CardContent className="pt-8 pb-4">
        {/* Title & Type */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-bold text-lg group-hover:text-divine-gold transition-colors">
            {name}
          </h3>
          <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
            {getTypeIcon()}
            <span>{getTypeLabel()}</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{memberCount.toLocaleString()}</span>
            <span className="text-xs">/ {maxMembers.toLocaleString()}</span>
          </div>

          {circleType === "public" && (
            isMember ? (
              <Button 
                size="sm" 
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onLeave?.(id);
                }}
              >
                Đã tham gia
              </Button>
            ) : (
              <Button 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onJoin?.(id);
                }}
              >
                Tham gia
              </Button>
            )
          )}

          {circleType === "invite_only" && !isMember && (
            <Button size="sm" variant="secondary" disabled>
              Chỉ mời
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
