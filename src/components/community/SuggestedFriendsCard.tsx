import { useState, useEffect, useCallback } from "react";
import { UserPlus, Users, Loader2, X, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFriendship } from "@/hooks/useFriendship";
import { useNavigate } from "react-router-dom";
import angelAvatar from "@/assets/angel-avatar.png";
import { toast } from "sonner";

interface SuggestedUser {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  handle: string | null;
  mutualFriends?: number;
}

export function SuggestedFriendsCard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { sendFriendRequest, isLoading: isSending } = useFriendship();
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const fetchSuggestions = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Get current friends and pending requests to exclude
      const { data: friendships } = await supabase
        .from("friendships")
        .select("requester_id, addressee_id")
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

      const excludeIds = new Set<string>([user.id]);
      friendships?.forEach((f) => {
        excludeIds.add(f.requester_id);
        excludeIds.add(f.addressee_id);
      });

      // Get random users not in exclude list
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url, handle")
        .limit(50);

      if (error) throw error;

      // Filter and shuffle
      const filtered = profiles?.filter((p) => !excludeIds.has(p.user_id)) || [];
      const shuffled = filtered.sort(() => Math.random() - 0.5).slice(0, 5);

      setSuggestions(shuffled.map((p) => ({
        ...p,
        mutualFriends: Math.floor(Math.random() * 5), // Mock mutual friends for now
      })));
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const handleAddFriend = async (userId: string) => {
    const result = await sendFriendRequest(userId);
    if (result.success) {
      setPendingIds((prev) => new Set(prev).add(userId));
    }
  };

  const handleRemove = (userId: string) => {
    setRemovedIds((prev) => new Set(prev).add(userId));
  };

  const visibleSuggestions = suggestions.filter(
    (s) => !removedIds.has(s.user_id)
  );

  if (!user) return null;

  return (
    <Card className="border-white/40 bg-white/30 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center justify-between text-foreground">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            Gợi ý kết bạn
          </div>
          <Button
            variant="link"
            size="sm"
            className="text-primary text-xs p-0 h-auto"
            onClick={() => navigate("/messages")}
          >
            Xem tất cả
            <ChevronRight className="w-3 h-3 ml-0.5" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : visibleSuggestions.length === 0 ? (
          <p className="text-sm text-foreground-muted text-center py-2">
            Không có gợi ý mới
          </p>
        ) : (
          visibleSuggestions.map((suggestion) => (
            <div
              key={suggestion.user_id}
              className="flex items-center gap-3 group"
            >
              <Avatar
                className="w-10 h-10 cursor-pointer border-2 border-transparent hover:border-primary/30 transition-colors"
                onClick={() => navigate(`/user/${suggestion.handle || suggestion.user_id}`)}
              >
                <AvatarImage
                  src={suggestion.avatar_url || angelAvatar}
                  alt={suggestion.display_name}
                />
                <AvatarFallback>
                  {suggestion.display_name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p
                  className="font-medium text-sm truncate cursor-pointer hover:text-primary transition-colors"
                  onClick={() => navigate(`/user/${suggestion.handle || suggestion.user_id}`)}
                >
                  {suggestion.display_name || "Người dùng"}
                </p>
                {suggestion.mutualFriends && suggestion.mutualFriends > 0 && (
                  <p className="text-xs text-foreground-muted">
                    {suggestion.mutualFriends} bạn chung
                  </p>
                )}
              </div>

              <div className="flex gap-1 shrink-0">
                {pendingIds.has(suggestion.user_id) ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-8 text-xs"
                    disabled
                  >
                    Đã gửi
                  </Button>
                ) : (
                  <>
                    <Button
                      size="sm"
                      className="h-8 text-xs bg-primary hover:bg-primary/90"
                      onClick={() => handleAddFriend(suggestion.user_id)}
                      disabled={isSending}
                    >
                      <UserPlus className="w-3.5 h-3.5 mr-1" />
                      Thêm
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-foreground-muted hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemove(suggestion.user_id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
