import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { getProfilePath } from "@/lib/profileUrl";
import { Search, X, Loader2, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import angelAvatar from "@/assets/angel-avatar.png";
import { useLanguage } from "@/contexts/LanguageContext";

interface UserResult {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  handle: string | null;
}

interface FriendSearchModalProps {
  open: boolean;
  onClose: () => void;
}

export function FriendSearchModal({ open, onClose }: FriendSearchModalProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<UserResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (open) {
      loadUsers();
      setTimeout(() => inputRef.current?.focus(), 200);
    } else {
      setQuery("");
      setUsers([]);
    }
  }, [open]);

  const loadUsers = async (searchQuery?: string) => {
    setIsLoading(true);
    try {
      let q = supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url, bio, handle")
        .order("created_at", { ascending: false })
        .limit(30);

      if (searchQuery && searchQuery.trim().length >= 2) {
        q = q.or(`display_name.ilike.%${searchQuery.trim()}%,handle.ilike.%${searchQuery.trim()}%`);
      }

      const { data } = await q;
      setUsers(data || []);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => loadUsers(value), 300);
  };

  const handleUserClick = (user: UserResult) => {
    onClose();
    navigate(getProfilePath(user.user_id, user.handle));
  };

  if (!open) return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-background flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button onClick={onClose} className="p-1">
          <X className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={handleInputChange}
            placeholder={t("community.searchFriends") || "Tìm kiếm bạn bè, người dùng..."}
            className="pl-9 h-10 rounded-full bg-muted border-0"
          />
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}

        {!isLoading && users.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Users className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">
              {query.length >= 2
                ? `Không tìm thấy "${query}"`
                : "Tìm kiếm bạn bè hoặc người dùng"}
            </p>
          </div>
        )}

        {!isLoading && users.length > 0 && (
          <div>
            <div className="px-4 py-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase">
                {query.length >= 2 ? "Kết quả" : "Gợi ý"} ({users.length})
              </span>
            </div>
            {users.map((u) => (
              <button
                key={u.user_id}
                onClick={() => handleUserClick(u)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
              >
                <Avatar className="w-11 h-11">
                  <AvatarImage src={u.avatar_url || angelAvatar} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {u.display_name?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {u.display_name || "Người dùng"}
                  </p>
                  {u.handle && (
                    <p className="text-xs text-muted-foreground truncate">@{u.handle}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>,
    document.body
  );
}
