import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Notification } from "@/hooks/useNotifications";
import { getNotificationIcon, getNotificationActionText } from "./utils";
import { useLanguage } from "@/contexts/LanguageContext";
import angelAvatar from "@/assets/angel-avatar.png";

interface NotificationItemProps {
  notification: Notification;
  onClick: (notification: Notification) => void;
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

export function NotificationItem({ notification, onClick }: NotificationItemProps) {
  const { t } = useLanguage();
  const actorName = notification.actor_profile?.display_name || t("common.anonymous");
  const actorAvatar = notification.actor_profile?.avatar_url || angelAvatar;
  const icon = getNotificationIcon(notification.type);
  const actionText = getNotificationActionText(notification.type, t);

  return (
    <button
      onClick={() => onClick(notification)}
      className={cn(
        "w-full p-3 flex items-start gap-3 hover:bg-muted/50 transition-all duration-200 text-left rounded-lg",
        !notification.is_read && "bg-primary/5"
      )}
    >
      {/* Avatar with icon badge */}
      <div className="relative shrink-0">
        <Avatar className="h-12 w-12">
          <AvatarImage src={actorAvatar} />
          <AvatarFallback className="bg-primary-pale text-primary text-sm">
            {actorName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="absolute -bottom-0.5 -right-0.5 w-6 h-6 bg-background rounded-full flex items-center justify-center text-sm shadow-sm border border-border">
          {icon}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm leading-snug", !notification.is_read ? "font-medium" : "text-muted-foreground")}>
          <span className="font-bold">{actorName}</span>{" "}
          {notification.content || actionText}
        </p>
        <p className={cn("text-xs mt-0.5", !notification.is_read ? "text-primary font-medium" : "text-muted-foreground")}>
          {getRelativeTime(notification.created_at, t)}
        </p>
      </div>

      {/* Unread dot */}
      {!notification.is_read && (
        <span className="mt-2 shrink-0 w-3 h-3 bg-primary rounded-full" />
      )}
    </button>
  );
}
