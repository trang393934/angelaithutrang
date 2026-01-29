import { useState } from "react";
import { useCommunityCircles } from "@/hooks/useCommunityCircles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, Plus, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

interface CirclesSidebarProps {
  maxVisible?: number;
}

const CIRCLE_ICONS = ["✨", "💖", "🌟", "🔥", "🌈", "🦋", "🌸", "💫", "☀️", "🌙"];
const CIRCLE_COLORS = ["#FFB800", "#FF6B6B", "#4ECDC4", "#9B59B6", "#3498DB", "#2ECC71", "#E91E63", "#FF9800"];

export const CirclesSidebar = ({ maxVisible = 4 }: CirclesSidebarProps) => {
  const { user } = useAuth();
  const { circles, isLoading, joinCircle, leaveCircle, isInCircle, createCircle } = useCommunityCircles();
  const [showAll, setShowAll] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newCircle, setNewCircle] = useState({
    name: "",
    description: "",
    icon: "✨",
    color: "#FFB800",
    circle_type: "public" as "public" | "private" | "invite_only"
  });

  const visibleCircles = showAll ? circles : circles.slice(0, maxVisible);

  const handleCreateCircle = async () => {
    if (!user) {
      toast({
        title: "Vui lòng đăng nhập",
        description: "Bạn cần đăng nhập để tạo Circle",
        variant: "destructive"
      });
      return;
    }

    if (!newCircle.name.trim()) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập tên Circle",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    const result = await createCircle({
      name: newCircle.name.trim(),
      description: newCircle.description.trim(),
      icon: newCircle.icon,
      color: newCircle.color,
      circle_type: newCircle.circle_type
    });

    setIsCreating(false);

    if (result) {
      setShowCreateDialog(false);
      setNewCircle({
        name: "",
        description: "",
        icon: "✨",
        color: "#FFB800",
        circle_type: "public"
      });
    }
  };

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
    <>
      <Card className="border-divine-gold/20 shadow-soft">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="w-5 h-5 text-divine-gold" />
              Love Circles
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs"
              onClick={() => setShowCreateDialog(true)}
            >
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

      {/* Create Circle Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-divine-gold" />
              Tạo Circle mới
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="circle-name">Tên Circle *</Label>
              <Input
                id="circle-name"
                placeholder="VD: Thiền định mỗi ngày"
                value={newCircle.name}
                onChange={(e) => setNewCircle(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="circle-desc">Mô tả</Label>
              <Textarea
                id="circle-desc"
                placeholder="Mô tả ngắn về Circle của bạn..."
                rows={3}
                value={newCircle.description}
                onChange={(e) => setNewCircle(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            {/* Icon & Color */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Biểu tượng</Label>
                <div className="flex flex-wrap gap-2">
                  {CIRCLE_ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-all ${
                        newCircle.icon === icon 
                          ? "ring-2 ring-divine-gold bg-divine-gold/20" 
                          : "bg-muted hover:bg-muted/80"
                      }`}
                      onClick={() => setNewCircle(prev => ({ ...prev, icon }))}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Màu sắc</Label>
                <div className="flex flex-wrap gap-2">
                  {CIRCLE_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-lg transition-all ${
                        newCircle.color === color 
                          ? "ring-2 ring-divine-gold scale-110" 
                          : "hover:scale-105"
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewCircle(prev => ({ ...prev, color }))}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Circle Type */}
            <div className="space-y-2">
              <Label>Loại Circle</Label>
              <Select
                value={newCircle.circle_type}
                onValueChange={(value: "public" | "private" | "invite_only") => 
                  setNewCircle(prev => ({ ...prev, circle_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">🌍 Công khai - Ai cũng có thể tham gia</SelectItem>
                  <SelectItem value="private">🔒 Riêng tư - Cần phê duyệt</SelectItem>
                  <SelectItem value="invite_only">✉️ Chỉ mời - Chỉ admin mời được</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreateCircle} disabled={isCreating}>
              {isCreating ? "Đang tạo..." : "Tạo Circle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};