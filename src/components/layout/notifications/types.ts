import type { Notification } from "@/hooks/useNotifications";

export type { Notification };

export interface NotificationGroups {
  new: Notification[];
  today: Notification[];
  yesterday: Notification[];
  thisWeek: Notification[];
  earlier: Notification[];
}

export type FilterTab = "all" | "unread";

export const REACTION_ICONS: Record<string, { icon: string }> = {
  like: { icon: "👍" },
  love: { icon: "❤️" },
  care: { icon: "🥰" },
  haha: { icon: "😂" },
  wow: { icon: "😮" },
  sad: { icon: "😢" },
  angry: { icon: "😠" },
  pray: { icon: "🙏" },
};
