import { useState, useMemo, useCallback } from "react";
import { Bell, MoreHorizontal, Settings, CheckCheck, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications, type Notification } from "@/hooks/useNotifications";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useFriendRequestActions } from "@/hooks/useFriendRequestActions";
import { useLiXiCelebration } from "@/hooks/useLiXiCelebration";
import { cn } from "@/lib/utils";
import {
  type FilterTab,
  groupNotificationsByTime,
  getNotificationLink,
  NotificationSection,
  FriendRequestItem,
} from "./notifications";

interface NotificationDropdownProps {
  variant?: "header" | "community";
}

export function NotificationDropdown({ variant = "header" }: NotificationDropdownProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const { handleAccept, handleReject, isProcessing } = useFriendRequestActions(markAsRead);
  const { openPopupForNotification } = useLiXiCelebration();

  const handleNotificationClick = useCallback(
    async (notif: Notification) => {
      await markAsRead(notif.id);
      if (notif.type === "tet_lixi_reward") {
        setOpen(false);
        openPopupForNotification(notif.id);
        return;
      }
      const link = getNotificationLink(notif);
      if (link) {
        setOpen(false);
        navigate(link);
      }
    },
    [markAsRead, navigate, openPopupForNotification]
  );

  // Filter + group
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

  const hasVisibleNotifications =
    friendRequests.length > 0 ||
    groupedNotifications.new.length > 0 ||
    groupedNotifications.today.length > 0 ||
    groupedNotifications.yesterday.length > 0 ||
    groupedNotifications.thisWeek.length > 0 ||
    groupedNotifications.earlier.length > 0;

  const isCommunity = variant === "community";

  // On mobile, just navigate to full page
  const handleBellClick = () => {
    if (isMobile) {
      navigate("/notifications");
    }
  };

  // Mobile: simple button
  if (isMobile) {
    return (
      <button
        onClick={handleBellClick}
        className={cn(
          "relative p-1.5 rounded-full transition-colors",
          isCommunity
            ? "bg-white/25 hover:bg-white/40 text-black/80 shadow-[0_1px_3px_rgba(139,105,20,0.3)]"
            : "hover:bg-primary-pale"
        )}
        title={t("notifications.title")}
      >
        <Bell className={cn("w-5 h-5", !isCommunity && "text-foreground-muted")} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
    );
  }

  // Desktop: Popover
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "relative p-1.5 lg:p-2 rounded-full transition-colors",
            isCommunity
              ? "bg-white/25 hover:bg-white/40 text-black/80 shadow-[0_1px_3px_rgba(139,105,20,0.3)]"
              : "hover:bg-primary-pale"
          )}
          title={t("notifications.title")}
        >
          <Bell
            className={cn(
              isCommunity ? "w-5 h-5" : "w-3.5 h-3.5 lg:w-4 lg:h-4 xl:w-5 xl:h-5",
              !isCommunity && "text-foreground-muted"
            )}
          />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] lg:text-[10px] font-bold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[360px] sm:w-[400px] p-0 shadow-lg"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-bold text-lg">{t("notifications.title")}</h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={markAllAsRead} className="gap-2">
                <CheckCheck className="w-4 h-4" />
                {t("notifications.markAllRead")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setOpen(false);
                  navigate("/notifications");
                }}
                className="gap-2"
              >
                <Settings className="w-4 h-4" />
                {t("notifications.settings")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 px-4 py-2 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab("all")}
            className={cn(
              "rounded-full px-4 h-8 text-sm font-medium",
              activeTab === "all"
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {t("notifications.all")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab("unread")}
            className={cn(
              "rounded-full px-4 h-8 text-sm font-medium flex items-center gap-1.5",
              activeTab === "unread"
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "text-muted-foreground hover:bg-muted"
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

        {/* Notifications List */}
        <ScrollArea className="max-h-[420px]">
          {!hasVisibleNotifications ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">
                {activeTab === "unread"
                  ? t("notifications.noUnread")
                  : t("notifications.empty")}
              </p>
            </div>
          ) : (
            <div className="px-1">
              {/* Friend Requests */}
              {friendRequests.length > 0 && (
                <div className="py-1">
                  <div className="flex items-center justify-between px-3 py-1.5">
                    <span className="text-sm font-bold flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-primary" />
                      {t("notifications.friendRequests")}
                    </span>
                  </div>
                  {friendRequests.slice(0, 3).map((n) => (
                    <FriendRequestItem
                      key={n.id}
                      notification={n}
                      onAccept={handleAccept}
                      onReject={handleReject}
                      isLoading={isProcessing}
                    />
                  ))}
                </div>
              )}

              {/* Grouped notifications */}
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
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t p-2 text-center">
            <Button
              variant="ghost"
              className="text-primary text-sm w-full hover:bg-primary/5"
              onClick={() => {
                setOpen(false);
                navigate("/notifications");
              }}
            >
              {t("notifications.viewAllNotifications")}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
