import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Notification } from "@/hooks/useNotifications";
import { useLanguage } from "@/contexts/LanguageContext";
import angelAvatar from "@/assets/angel-avatar.png";

interface FriendRequestItemProps {
  notification: Notification;
  onAccept: (notification: Notification) => void;
  onReject: (notification: Notification) => void;
  isLoading?: boolean;
}

function getRelativeTime(dateStr: string, t: (key: string) => string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return t("notifications.justNow");
  if (diffMin < 60) return `${diffMin} ${t("notifications.minutesAgo")}`;
  if (diffHr < 24) return `${diffHr} ${t("notifications.hoursAgo")}`;
  if (diffDay < 7) return `${diffDay} ${t("notifications.daysAgo")}`;
  return new Date(dateStr).toLocaleDateString();
}

export function FriendRequestItem({
  notification,
  onAccept,
  onReject,
  isLoading = false,
}: FriendRequestItemProps) {
  const { t } = useLanguage();
  const actorName = notification.actor_profile?.display_name || t("common.anonymous");
  const actorAvatar = notification.actor_profile?.avatar_url || angelAvatar;

  return (
    <div
      className={cn(
        "p-3 flex items-start gap-3 rounded-lg",
        !notification.is_read && "bg-primary/5"
      )}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <Avatar className="h-12 w-12">
          <AvatarImage src={actorAvatar} />
          <AvatarFallback className="bg-primary-pale text-primary text-sm">
            {actorName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="absolute -bottom-0.5 -right-0.5 w-6 h-6 bg-background rounded-full flex items-center justify-center text-sm shadow-sm border border-border">
          👋
        </span>
      </div>

      {/* Content & actions */}
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm leading-snug", !notification.is_read ? "font-medium" : "text-muted-foreground")}>
          <span className="font-bold">{actorName}</span>{" "}
          {t("notifications.type.friendRequest")}
        </p>
        <p className={cn("text-xs mt-0.5 mb-2", !notification.is_read ? "text-primary font-medium" : "text-muted-foreground")}>
          {getRelativeTime(notification.created_at, t)}
        </p>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onAccept(notification);
            }}
            disabled={isLoading}
            className="h-8 px-4 font-medium"
          >
            {t("notifications.confirm")}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              onReject(notification);
            }}
            disabled={isLoading}
            className="h-8 px-4"
          >
            {t("notifications.reject")}
          </Button>
        </div>
      </div>

      {/* Unread dot */}
      {!notification.is_read && (
        <span className="mt-2 shrink-0 w-3 h-3 bg-primary rounded-full" />
      )}
    </div>
  );
}
