import type { Notification } from "@/hooks/useNotifications";
import { NotificationItem } from "./NotificationItem";

interface NotificationSectionProps {
  title: string;
  notifications: Notification[];
  onNotificationClick: (notification: Notification) => void;
}

export function NotificationSection({
  title,
  notifications,
  onNotificationClick,
}: NotificationSectionProps) {
  if (notifications.length === 0) return null;

  return (
    <div className="py-1">
      <h4 className="px-3 py-1.5 text-sm font-bold text-foreground">{title}</h4>
      <div>
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onClick={onNotificationClick}
          />
        ))}
      </div>
    </div>
  );
}
