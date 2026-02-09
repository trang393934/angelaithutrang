import { supabase } from "@/integrations/supabase/client";

export type ProfileEventType =
  | "view"
  | "follow_click"
  | "message_click"
  | "transfer_click"
  | "module_open"
  | "signup_start";

export async function trackProfileEvent(
  profileUserId: string,
  eventType: ProfileEventType,
  metadata?: Record<string, string | number | boolean | null>,
  referrerHandle?: string
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from("profile_view_events").insert([{
      profile_user_id: profileUserId,
      viewer_user_id: user?.id ?? null,
      event_type: eventType,
      referrer_handle: referrerHandle ?? null,
      metadata: metadata ?? null,
    }]);
  } catch (err) {
    console.error("trackProfileEvent error:", err);
  }
}
