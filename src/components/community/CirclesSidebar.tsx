import { useState } from "react";
import { useCommunityCircles } from "@/hooks/useCommunityCircles";
import { CircleCard } from "@/components/circles/CircleCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Plus, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

interface CirclesSidebarProps {
  maxVisible?: number;
}

export const CirclesSidebar = ({ maxVisible = 4 }: CirclesSidebarProps) => {
  const { circles, isLoading, joinCircle, leaveCircle, isInCircle } = useCommunityCircles();
  const [showAll, setShowAll] = useState(false);

  const visibleCircles = showAll ? circles : circles.slice(0, maxVisible);
  const officialCircles = circles.filter(c => c.is_official);

  if (isLoading) {
    return (
      <Card className="border-divine-gold/20">
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-divine-gold/20 shadow-soft">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="w-5 h-5 text-divine-gold" />
            Love Circles
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-xs">
            <Plus className="w-3 h-3 mr-1" />
            Tạo mới
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Tham gia các nhóm ánh sáng
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        {visibleCircles.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Chưa có Circle nào
          </p>
        ) : (
          visibleCircles.map((circle) => (
            <div 
              key={circle.id} 
              className="p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                  style={{ backgroundColor: (circle.color || "#FFB800") + "30" }}
                >
                  {circle.icon || "✨"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-sm truncate group-hover:text-divine-gold transition-colors">
                      {circle.name}
                    </h4>
                    {circle.is_official && (
                      <span className="text-xs bg-divine-gold/20 text-divine-gold px-1.5 py-0.5 rounded">
                        Official
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {circle.member_count || 0} thành viên
                  </p>
                </div>
                {circle.circle_type === "public" && (
                  isInCircle(circle.id) ? (
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="text-xs h-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        leaveCircle(circle.id);
                      }}
                    >
                      Đã tham gia
                    </Button>
                  ) : (
                    <Button 
                      size="sm"
                      className="text-xs h-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        joinCircle(circle.id);
                      }}
                    >
                      Tham gia
                    </Button>
                  )
                )}
              </div>
            </div>
          ))
        )}

        {circles.length > maxVisible && (
          <Button 
            variant="ghost" 
            className="w-full text-xs"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? "Thu gọn" : `Xem thêm ${circles.length - maxVisible} Circles`}
            <ChevronRight className={`w-3 h-3 ml-1 transition-transform ${showAll ? "rotate-90" : ""}`} />
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
