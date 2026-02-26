import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import NotFound from "./NotFound";

// Reserved system routes that can never be usernames
const RESERVED_ROUTES = new Set([
  'chat', 'about', 'auth', 'admin', 'community', 'earn', 'profile',
  'onboarding', 'swap', 'knowledge', 'mint', 'messages', 'notifications',
  'docs', 'bounty', 'ideas', 'vision', 'receipt', 'coordinator-gate',
  'content-writer', 'activity-history', 'community-questions', 'user',
  'post', 'video', 'live', 'index', 'api', 'settings', 'search',
]);

// Lazy-load the actual profile page
import UserProfile from "./UserProfile";

/**
 * DynamicRoute handles /:username — differentiates between
 * reserved system routes and user profile handles.
 */
const DynamicRoute = () => {
  const { username } = useParams<{ username: string }>();
  const [status, setStatus] = useState<"loading" | "found" | "not_found">("loading");

  useEffect(() => {
    if (!username) { setStatus("not_found"); return; }

    // If it matches a reserved route, show 404
    if (RESERVED_ROUTES.has(username.toLowerCase())) {
      setStatus("not_found");
      return;
    }

    // Check if handle exists in DB
    const check = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id")
        .ilike("handle", username)
        .maybeSingle();

      setStatus(data ? "found" : "not_found");
    };
    check();
  }, [username]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-7 h-7 text-primary animate-spin" />
      </div>
    );
  }

  if (status === "not_found") return <NotFound />;

  // Render UserProfile with handle as the userId param (it already resolves handles)
  return <UserProfile />;
};

export default DynamicRoute;
