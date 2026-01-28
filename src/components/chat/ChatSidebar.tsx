import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageSquarePlus, ChevronRight, MoreVertical,
  Trash2, Edit2, FolderOpen, Clock, Sparkles, Check,
  PanelLeftClose, PanelLeft, Search, Image, FolderPlus, X, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChatSession } from "@/hooks/useChatSessions";
import { ChatFolder } from "@/hooks/useChatFolders";
import { formatDistanceToNow, isToday, isYesterday, isThisWeek } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import angelAiLogo from "@/assets/angel-ai-logo.png";

interface ChatSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  sessions: ChatSession[];
  folders: ChatFolder[];
  currentSession: ChatSession | null;
  onSelectSession: (session: ChatSession | null) => void;
  onNewSession: () => void;
  onDeleteSession: (sessionId: string) => Promise<boolean>;
  onUpdateSession: (sessionId: string, updates: { title?: string; folder_id?: string | null }) => Promise<boolean>;
  imageHistoryCount: number;
  onOpenImageHistory: () => void;
}

// Group sessions by time period
function groupSessionsByTime(sessions: ChatSession[]) {
  const groups: { today: ChatSession[]; yesterday: ChatSession[]; thisWeek: ChatSession[]; older: ChatSession[] } = {
    today: [],
    yesterday: [],
    thisWeek: [],
    older: [],
  };

  sessions.forEach((session) => {
    const date = new Date(session.last_message_at);
    if (isToday(date)) {
      groups.today.push(session);
    } else if (isYesterday(date)) {
      groups.yesterday.push(session);
    } else if (isThisWeek(date)) {
      groups.thisWeek.push(session);
    } else {
      groups.older.push(session);
    }
  });

  return groups;
}

export function ChatSidebar({
  isCollapsed,
  onToggleCollapse,
  sessions,
  folders,
  currentSession,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onUpdateSession,
  imageHistoryCount,
  onOpenImageHistory,
}: ChatSidebarProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingSession, setEditingSession] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [userProfile, setUserProfile] = useState<{ display_name: string | null; avatar_url: string | null } | null>(null);

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) setUserProfile(data);
    };
    fetchProfile();
  }, [user]);

  // Filter sessions by search query
  const filteredSessions = searchQuery
    ? sessions.filter((s) =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : sessions;

  const groupedSessions = groupSessionsByTime(filteredSessions);

  const handleStartEdit = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSession(session.id);
    setEditTitle(session.title);
  };

  const handleSaveEdit = async (sessionId: string) => {
    if (!editTitle.trim()) return;
    await onUpdateSession(sessionId, { title: editTitle.trim() });
    setEditingSession(null);
    toast.success("Đã cập nhật tiêu đề");
  };

  const handleDelete = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await onDeleteSession(sessionId);
    if (success) toast.success("Đã xóa cuộc trò chuyện");
  };

  const renderSessionGroup = (title: string, sessionList: ChatSession[]) => {
    if (sessionList.length === 0) return null;

    return (
      <div key={title} className="mb-4">
        {!isCollapsed && (
          <div className="px-3 py-1 text-xs font-medium text-foreground-muted uppercase tracking-wide">
            {title}
          </div>
        )}
        <div className="space-y-1">
          {sessionList.map((session) => (
            <SessionItem
              key={session.id}
              session={session}
              isActive={currentSession?.id === session.id}
              isCollapsed={isCollapsed}
              isEditing={editingSession === session.id}
              editTitle={editTitle}
              onSelect={() => onSelectSession(session)}
              onStartEdit={(e) => handleStartEdit(session, e)}
              onSaveEdit={() => handleSaveEdit(session.id)}
              onCancelEdit={() => setEditingSession(null)}
              onDelete={(e) => handleDelete(session.id, e)}
              onEditTitleChange={setEditTitle}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col h-full bg-background border-r border-primary-pale transition-all duration-300",
        isCollapsed ? "w-16" : "w-72"
      )}
    >
      {/* Header: Logo + Toggle */}
      <div className="flex-shrink-0 p-3 border-b border-primary-pale">
        <div className={cn("flex items-center", isCollapsed ? "justify-center" : "justify-between")}>
          {!isCollapsed && (
            <Link to="/" className="flex items-center gap-2">
              <img src={angelAiLogo} alt="Angel AI" className="w-8 h-8 rounded-lg" />
              <span className="font-bold text-primary-deep">ANGEL AI</span>
            </Link>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleCollapse}
                className="h-8 w-8"
              >
                {isCollapsed ? (
                  <PanelLeft className="w-4 h-4" />
                ) : (
                  <PanelLeftClose className="w-4 h-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {isCollapsed ? "Mở rộng" : "Thu gọn"}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Search Input */}
      {!isCollapsed && (
        <div className="flex-shrink-0 p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
            <Input
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
        </div>
      )}

      {/* New Chat Button */}
      <div className={cn("flex-shrink-0 px-3 pb-3", isCollapsed && "flex justify-center")}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={onNewSession}
              className={cn(
                "bg-sapphire-gradient hover:opacity-90 transition-all",
                isCollapsed ? "w-10 h-10 p-0" : "w-full"
              )}
              size={isCollapsed ? "icon" : "default"}
            >
              <MessageSquarePlus className={cn("w-4 h-4", !isCollapsed && "mr-2")} />
              {!isCollapsed && "Trò chuyện mới"}
            </Button>
          </TooltipTrigger>
          {isCollapsed && (
            <TooltipContent side="right">Trò chuyện mới</TooltipContent>
          )}
        </Tooltip>
      </div>

      {/* Sessions List */}
      <ScrollArea className="flex-1">
        <div className="px-2 py-2">
          {sessions.length === 0 ? (
            <div className={cn("text-center py-8", isCollapsed && "py-4")}>
              {!isCollapsed ? (
                <>
                  <Clock className="w-10 h-10 mx-auto mb-2 text-foreground-muted opacity-50" />
                  <p className="text-sm text-foreground-muted">Chưa có cuộc trò chuyện</p>
                </>
              ) : (
                <Clock className="w-5 h-5 mx-auto text-foreground-muted opacity-50" />
              )}
            </div>
          ) : (
            <>
              {renderSessionGroup("Hôm nay", groupedSessions.today)}
              {renderSessionGroup("Hôm qua", groupedSessions.yesterday)}
              {renderSessionGroup("Tuần này", groupedSessions.thisWeek)}
              {renderSessionGroup("Cũ hơn", groupedSessions.older)}
            </>
          )}
        </div>
      </ScrollArea>

      {/* Footer: Image Gallery + User */}
      <div className="flex-shrink-0 border-t border-primary-pale p-3 space-y-2">
        {/* Image Gallery Shortcut */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              onClick={onOpenImageHistory}
              className={cn(
                "relative",
                isCollapsed ? "w-10 h-10 p-0 mx-auto" : "w-full justify-start"
              )}
            >
              <Image className={cn("w-4 h-4", !isCollapsed && "mr-2")} />
              {!isCollapsed && "Kho hình ảnh"}
              {imageHistoryCount > 0 && (
                <span
                  className={cn(
                    "absolute bg-divine-gold text-white text-[10px] font-bold rounded-full flex items-center justify-center",
                    isCollapsed ? "-top-1 -right-1 w-4 h-4" : "ml-auto w-5 h-5"
                  )}
                >
                  {imageHistoryCount > 99 ? "99+" : imageHistoryCount}
                </span>
              )}
            </Button>
          </TooltipTrigger>
          {isCollapsed && <TooltipContent side="right">Kho hình ảnh</TooltipContent>}
        </Tooltip>

        {/* User Profile */}
        <div
          className={cn(
            "flex items-center gap-2 p-2 rounded-lg hover:bg-primary/5 cursor-pointer transition-colors",
            isCollapsed && "justify-center p-1"
          )}
          onClick={() => navigate("/profile")}
        >
          <Avatar className={cn("border-2 border-primary/20", isCollapsed ? "w-8 h-8" : "w-9 h-9")}>
            <AvatarImage src={userProfile?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {userProfile?.display_name?.charAt(0) || <User className="w-4 h-4" />}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {userProfile?.display_name || "Người dùng"}
              </p>
              <p className="text-xs text-foreground-muted truncate">{user?.email}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

// Session Item Component
interface SessionItemProps {
  session: ChatSession;
  isActive: boolean;
  isCollapsed: boolean;
  isEditing: boolean;
  editTitle: string;
  onSelect: () => void;
  onStartEdit: (e: React.MouseEvent) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onEditTitleChange: (value: string) => void;
}

function SessionItem({
  session,
  isActive,
  isCollapsed,
  isEditing,
  editTitle,
  onSelect,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onEditTitleChange,
}: SessionItemProps) {
  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "flex items-center justify-center w-10 h-10 mx-auto rounded-lg cursor-pointer transition-colors",
              isActive
                ? "bg-primary/10 border border-primary/20"
                : "hover:bg-primary/5"
            )}
            onClick={onSelect}
          >
            <Sparkles className={cn("w-4 h-4", isActive ? "text-primary" : "text-foreground-muted")} />
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-[200px]">
          <p className="font-medium">{session.title}</p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(session.last_message_at), {
              addSuffix: true,
              locale: vi,
            })}
          </p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer group transition-colors",
        isActive
          ? "bg-primary/10 border border-primary/20"
          : "hover:bg-primary/5"
      )}
      onClick={onSelect}
    >
      <Sparkles className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-primary" : "text-foreground-muted")} />
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Input
              value={editTitle}
              onChange={(e) => onEditTitleChange(e.target.value)}
              className="h-6 text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") onSaveEdit();
                if (e.key === "Escape") onCancelEdit();
              }}
            />
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onSaveEdit}>
              <Check className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <>
            <p className="text-sm font-medium truncate">{session.title}</p>
            <p className="text-xs text-foreground-muted">
              {formatDistanceToNow(new Date(session.last_message_at), {
                addSuffix: true,
                locale: vi,
              })}
            </p>
          </>
        )}
      </div>

      {!isEditing && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-foreground-muted hover:text-foreground"
            onClick={onStartEdit}
          >
            <Edit2 className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={onDelete}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
