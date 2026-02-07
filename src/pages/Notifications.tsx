import { useState, useMemo, useCallback } from "react";
import { Bell, ArrowLeft, CheckCheck, Users } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useNotifications, type Notification } from "@/hooks/useNotifications";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  type FilterTab,
  groupNotificationsByTime,
  getNotificationLink,
  NotificationSection,
  FriendRequestItem,
} from "@/components/layout/notifications";

export default function NotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [isProcessingFriendRequest, setIsProcessingFriendRequest] = useState(false);

  const handleNotificationClick = useCallback(
    async (notif: Notification) => {
      await markAsRead(notif.id);
      const link = getNotificationLink(notif);
      if (link) navigate(link);
    },
    [markAsRead, navigate]
  );

  const handleAcceptFriendRequest = useCallback(
    async (notif: Notification) => {
      if (!user || isProcessingFriendRequest) return;
      setIsProcessingFriendRequest(true);
      try {
        const { data: friendship } = await supabase
          .from("friendships")
          .select("id")
          .eq("requester_id", notif.actor_id!)
          .eq("addressee_id", user.id)
          .eq("status", "pending")
          .maybeSingle();

        if (friendship) {
          await supabase
            .from("friendships")
            .update({ status: "accepted", updated_at: new Date().toISOString() })
            .eq("id", friendship.id);
          await markAsRead(notif.id);
          toast.success(t("notifications.acceptedRequest"));
        } else {
          toast.error(t("notifications.requestNotFound"));
        }
      } catch {
        toast.error(t("notifications.errorOccurred"));
      } finally {
        setIsProcessingFriendRequest(false);
      }
    },
    [user, isProcessingFriendRequest, markAsRead, t]
  );

  const handleRejectFriendRequest = useCallback(
    async (notif: Notification) => {
      if (!user || isProcessingFriendRequest) return;
      setIsProcessingFriendRequest(true);
      try {
        const { data: friendship } = await supabase
          .from("friendships")
          .select("id")
          .eq("requester_id", notif.actor_id!)
          .eq("addressee_id", user.id)
          .eq("status", "pending")
          .maybeSingle();

        if (friendship) {
          await supabase
            .from("friendships")
            .update({ status: "declined", updated_at: new Date().toISOString() })
            .eq("id", friendship.id);
          await markAsRead(notif.id);
          toast.success(t("notifications.rejectedRequest"));
        }
      } catch {
        toast.error(t("notifications.errorOccurred"));
      } finally {
        setIsProcessingFriendRequest(false);
      }
    },
    [user, isProcessingFriendRequest, markAsRead, t]
  );

  const { friendRequests, otherNotifications } = useMemo(() => {
    const filtered =
      activeTab === "unread" ? notifications.filter((n) => !n.is_read) : notifications;
    return {
      friendRequests: filtered.filter((n) => n.type === "friend_request" && !n.is_read),
      otherNotifications: filtered.filter((n) => n.type !== "friend_request" || n.is_read),
    };
  }, [notifications, activeTab]);

  const groupedNotifications = useMemo(
    () => groupNotificationsByTime(otherNotifications),
    [otherNotifications]
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b">
        <div className="container mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Link to="/" className="p-1.5 rounded-full hover:bg-muted transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-bold">{t("notifications.title")}</h1>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-primary text-xs gap-1.5"
            >
              <CheckCheck className="w-4 h-4" />
              {t("notifications.markAllRead")}
            </Button>
          )}
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="container mx-auto px-4 py-3 flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setActiveTab("all")}
          className={cn(
            "rounded-full px-5 h-9 text-sm font-medium",
            activeTab === "all"
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          {t("notifications.all")}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setActiveTab("unread")}
          className={cn(
            "rounded-full px-5 h-9 text-sm font-medium flex items-center gap-1.5",
            activeTab === "unread"
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          {t("notifications.unread")}
          {unreadCount > 0 && (
            <span className="text-[10px] bg-red-500 text-white px-1.5 rounded-full">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 pb-20">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Bell className="w-14 h-14 mb-4 opacity-20" />
            <p className="text-base">
              {activeTab === "unread"
                ? t("notifications.noUnread")
                : t("notifications.empty")}
            </p>
          </div>
        ) : (
          <div>
            {/* Friend Requests */}
            {friendRequests.length > 0 && (
              <div className="py-2">
                <div className="flex items-center gap-1.5 px-1 py-1.5">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="text-sm font-bold">{t("notifications.friendRequests")}</span>
                </div>
                {friendRequests.map((n) => (
                  <FriendRequestItem
                    key={n.id}
                    notification={n}
                    onAccept={handleAcceptFriendRequest}
                    onReject={handleRejectFriendRequest}
                    isLoading={isProcessingFriendRequest}
                  />
                ))}
              </div>
            )}

            {groupedNotifications.new.length > 0 && (
              <NotificationSection
                title={t("notifications.new")}
                notifications={groupedNotifications.new}
                onNotificationClick={handleNotificationClick}
              />
            )}
            {groupedNotifications.today.length > 0 && (
              <NotificationSection
                title={t("notifications.today")}
                notifications={groupedNotifications.today}
                onNotificationClick={handleNotificationClick}
              />
            )}
            {groupedNotifications.yesterday.length > 0 && (
              <NotificationSection
                title={t("notifications.yesterday")}
                notifications={groupedNotifications.yesterday}
                onNotificationClick={handleNotificationClick}
              />
            )}
            {groupedNotifications.thisWeek.length > 0 && (
              <NotificationSection
                title={t("notifications.thisWeek")}
                notifications={groupedNotifications.thisWeek}
                onNotificationClick={handleNotificationClick}
              />
            )}
            {groupedNotifications.earlier.length > 0 && (
              <NotificationSection
                title={t("notifications.earlier")}
                notifications={groupedNotifications.earlier}
                onNotificationClick={handleNotificationClick}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
