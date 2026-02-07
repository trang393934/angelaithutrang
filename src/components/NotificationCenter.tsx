import { useState } from "react";
import { Bell, Check, CheckCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications, type Notification } from "@/hooks/useNotifications";
import { useLanguage } from "@/contexts/LanguageContext";
import angelAvatar from "@/assets/angel-avatar.png";

function getRelativeTime(dateStr: string, t: (key: string) => string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return t("notifications.justNow");
  if (diffMin < 60) return `${diffMin} ${t("notifications.minutesAgo")}`;
  if (diffHr < 24) return `${diffHr} ${t("notifications.hoursAgo")}`;
  if (diffDay < 7) return `${diffDay} ${t("notifications.daysAgo")}`;
  return new Date(dateStr).toLocaleDateString();
}

function getNotificationLink(notif: Notification): string | null {
  const meta = notif.metadata || {};
  if (notif.type === "gift_received" || notif.type === "gift_sent") {
    const receiptId = meta.receipt_public_id as string | undefined;
    if (receiptId) return `/receipt/${receiptId}`;
  }
  if (notif.reference_type === "post" && notif.reference_id) {
    return "/community";
  }
  return null;
}

function NotificationItem({
  notif,
  onRead,
  t,
}: {
  notif: Notification;
  onRead: (id: string, link: string | null) => void;
  t: (key: string) => string;
}) {
  const link = getNotificationLink(notif);
  const actorName = notif.actor_profile?.display_name || t("common.anonymous");
  const actorAvatar = notif.actor_profile?.avatar_url || angelAvatar;

  return (
    <button
      onClick={() => onRead(notif.id, link)}
      className={`w-full flex items-start gap-3 p-3 text-left rounded-lg transition-colors hover:bg-accent/50 ${
        !notif.is_read ? "bg-primary/5" : ""
      }`}
    >
      <div className="relative shrink-0">
        <Avatar className="h-10 w-10">
          <AvatarImage src={actorAvatar} />
          <AvatarFallback className="bg-primary-pale text-primary text-sm">
            {actorName.charAt(0)}
          </AvatarFallback>
        </Avatar>
        {!notif.is_read && (
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-background" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${!notif.is_read ? "font-semibold" : "text-muted-foreground"}`}>
          <span className="font-bold">{actorName}</span>{" "}
          {notif.content}
        </p>
        <p className={`text-xs mt-0.5 ${!notif.is_read ? "text-blue-500 font-medium" : "text-muted-foreground"}`}>
          {getRelativeTime(notif.created_at, t)}
        </p>
      </div>
    </button>
  );
}

interface NotificationCenterProps {
  variant?: "header" | "community";
}

export function NotificationCenter({ variant = "header" }: NotificationCenterProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleRead = async (id: string, link: string | null) => {
    await markAsRead(id);
    if (link) {
      setOpen(false);
      navigate(link);
    }
  };

  const unreadNotifications = notifications.filter(n => !n.is_read);

  const isCommunity = variant === "community";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={`relative p-1.5 lg:p-2 rounded-full transition-colors ${
            isCommunity
              ? "bg-white/25 hover:bg-white/40 text-black/80 shadow-[0_1px_3px_rgba(139,105,20,0.3)]"
              : "hover:bg-primary-pale"
          }`}
          title={t("notifications.title")}
        >
          <Bell className={`${isCommunity ? "w-5 h-5" : "w-3.5 h-3.5 lg:w-4 lg:h-4 xl:w-5 xl:h-5"} ${
            isCommunity ? "" : "text-foreground-muted"
          }`} />
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
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs text-primary hover:text-primary"
            >
              <CheckCheck className="w-3.5 h-3.5 mr-1" />
              {t("notifications.markAllRead")}
            </Button>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full grid grid-cols-2 rounded-none bg-muted/30 h-9">
            <TabsTrigger value="all" className="text-sm">
              {t("notifications.all")}
            </TabsTrigger>
            <TabsTrigger value="unread" className="text-sm">
              {t("notifications.unread")} {unreadCount > 0 && `(${unreadCount})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-0">
            <ScrollArea className="max-h-[400px]">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <Bell className="w-10 h-10 mb-2 opacity-30" />
                  <p className="text-sm">{t("notifications.empty")}</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map(notif => (
                    <NotificationItem
                      key={notif.id}
                      notif={notif}
                      onRead={handleRead}
                      t={t}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="unread" className="mt-0">
            <ScrollArea className="max-h-[400px]">
              {unreadNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <Check className="w-10 h-10 mb-2 opacity-30" />
                  <p className="text-sm">{t("notifications.allRead")}</p>
                </div>
              ) : (
                <div className="divide-y">
                  {unreadNotifications.map(notif => (
                    <NotificationItem
                      key={notif.id}
                      notif={notif}
                      onRead={handleRead}
                      t={t}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
