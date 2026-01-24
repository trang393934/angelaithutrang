import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageSquarePlus, FolderPlus, ChevronRight, MoreVertical,
  Trash2, Edit2, FolderOpen, Clock, Sparkles, X, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ChatSession, useChatSessions } from "@/hooks/useChatSessions";
import { ChatFolder, useChatFolders } from "@/hooks/useChatFolders";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ChatSessionsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  folders: ChatFolder[];
  currentSession: ChatSession | null;
  onSelectSession: (session: ChatSession | null) => void;
  onCreateSession: (title?: string) => Promise<ChatSession | null>;
  onDeleteSession: (sessionId: string) => Promise<boolean>;
  onUpdateSession: (sessionId: string, updates: { title?: string; folder_id?: string | null }) => Promise<boolean>;
  onCreateFolder: (name: string, description?: string) => Promise<ChatFolder | null>;
  onDeleteFolder: (folderId: string) => Promise<boolean>;
  onUpdateFolder: (folderId: string, updates: { name?: string }) => Promise<boolean>;
}

export function ChatSessionsSidebar({
  isOpen,
  onClose,
  sessions,
  folders,
  currentSession,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
  onUpdateSession,
  onCreateFolder,
  onDeleteFolder,
  onUpdateFolder,
}: ChatSessionsSidebarProps) {
  const [editingSession, setEditingSession] = useState<string | null>(null);
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [movingSession, setMovingSession] = useState<string | null>(null);

  const handleNewSession = async () => {
    const session = await onCreateSession();
    if (session) {
      toast.success("Đã tạo cuộc trò chuyện mới");
      onClose();
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    const folder = await onCreateFolder(newFolderName.trim());
    if (folder) {
      toast.success("Đã tạo thư mục mới");
      setShowNewFolderDialog(false);
      setNewFolderName("");
    }
  };

  const handleStartEditSession = (session: ChatSession) => {
    setEditingSession(session.id);
    setEditTitle(session.title);
  };

  const handleSaveSessionTitle = async (sessionId: string) => {
    if (!editTitle.trim()) return;
    
    await onUpdateSession(sessionId, { title: editTitle.trim() });
    setEditingSession(null);
    toast.success("Đã cập nhật tiêu đề");
  };

  const handleDeleteSession = async (sessionId: string) => {
    const success = await onDeleteSession(sessionId);
    if (success) {
      toast.success("Đã xóa cuộc trò chuyện");
    }
  };

  const handleMoveToFolder = async (sessionId: string, folderId: string | null) => {
    await onUpdateSession(sessionId, { folder_id: folderId });
    setMovingSession(null);
    toast.success(folderId ? "Đã di chuyển vào thư mục" : "Đã bỏ khỏi thư mục");
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  // Sessions without folder
  const unfolderedSessions = sessions.filter(s => !s.folder_id);
  
  // Sessions grouped by folder
  const getSessionsInFolder = (folderId: string) => 
    sessions.filter(s => s.folder_id === folderId);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onClose}
          />
          
          {/* Sidebar */}
          <motion.div
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-0 top-0 h-full w-80 bg-background-pure border-r border-primary-pale z-50 flex flex-col shadow-xl"
          >
            {/* Header */}
            <div className="p-4 border-b border-primary-pale flex items-center justify-between">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-divine-gold" />
                Lịch sử trò chuyện
              </h2>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Actions */}
            <div className="p-3 flex gap-2 border-b border-primary-pale">
              <Button
                onClick={handleNewSession}
                className="flex-1 bg-sapphire-gradient hover:opacity-90"
                size="sm"
              >
                <MessageSquarePlus className="w-4 h-4 mr-2" />
                Trò chuyện mới
              </Button>
              <Button
                onClick={() => setShowNewFolderDialog(true)}
                variant="outline"
                size="sm"
              >
                <FolderPlus className="w-4 h-4" />
              </Button>
            </div>

            {/* Sessions List */}
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-2">
                {/* Folders */}
                {folders.map((folder) => (
                  <div key={folder.id} className="space-y-1">
                    <div
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-primary/5 cursor-pointer group"
                      onClick={() => toggleFolder(folder.id)}
                    >
                      <ChevronRight
                        className={cn(
                          "w-4 h-4 text-foreground-muted transition-transform",
                          expandedFolders.has(folder.id) && "rotate-90"
                        )}
                      />
                      <FolderOpen
                        className="w-4 h-4"
                        style={{ color: folder.color }}
                      />
                      
                      {editingFolder === folder.id ? (
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onBlur={() => {
                            onUpdateFolder(folder.id, { name: editTitle });
                            setEditingFolder(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              onUpdateFolder(folder.id, { name: editTitle });
                              setEditingFolder(null);
                            }
                          }}
                          className="h-6 text-sm"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className="flex-1 text-sm font-medium truncate">
                          {folder.name}
                        </span>
                      )}

                      <span className="text-xs text-foreground-muted">
                        {getSessionsInFolder(folder.id).length}
                      </span>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingFolder(folder.id);
                              setEditTitle(folder.name);
                            }}
                          >
                            <Edit2 className="w-4 h-4 mr-2" />
                            Đổi tên
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteFolder(folder.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Xóa thư mục
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Sessions in folder */}
                    <AnimatePresence>
                      {expandedFolders.has(folder.id) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="ml-6 space-y-1 overflow-hidden"
                        >
                          {getSessionsInFolder(folder.id).map((session) => (
                            <SessionItem
                              key={session.id}
                              session={session}
                              isActive={currentSession?.id === session.id}
                              isEditing={editingSession === session.id}
                              editTitle={editTitle}
                              onSelect={() => {
                                onSelectSession(session);
                                onClose();
                              }}
                              onStartEdit={() => handleStartEditSession(session)}
                              onSaveEdit={() => handleSaveSessionTitle(session.id)}
                              onCancelEdit={() => setEditingSession(null)}
                              onDelete={() => handleDeleteSession(session.id)}
                              onEditTitleChange={setEditTitle}
                              folders={folders}
                              onMoveToFolder={(folderId) => handleMoveToFolder(session.id, folderId)}
                            />
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}

                {/* Unfoldered sessions */}
                {unfolderedSessions.length > 0 && (
                  <div className="space-y-1">
                    {folders.length > 0 && (
                      <div className="px-2 py-1 text-xs text-foreground-muted font-medium">
                        Chưa phân loại
                      </div>
                    )}
                    {unfolderedSessions.map((session) => (
                      <SessionItem
                        key={session.id}
                        session={session}
                        isActive={currentSession?.id === session.id}
                        isEditing={editingSession === session.id}
                        editTitle={editTitle}
                        onSelect={() => {
                          onSelectSession(session);
                          onClose();
                        }}
                        onStartEdit={() => handleStartEditSession(session)}
                        onSaveEdit={() => handleSaveSessionTitle(session.id)}
                        onCancelEdit={() => setEditingSession(null)}
                        onDelete={() => handleDeleteSession(session.id)}
                        onEditTitleChange={setEditTitle}
                        folders={folders}
                        onMoveToFolder={(folderId) => handleMoveToFolder(session.id, folderId)}
                      />
                    ))}
                  </div>
                )}

                {sessions.length === 0 && (
                  <div className="text-center py-8 text-foreground-muted">
                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Chưa có cuộc trò chuyện nào</p>
                    <p className="text-xs mt-1">Bắt đầu trò chuyện với Angel AI</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </motion.div>
        </>
      )}

      {/* New Folder Dialog */}
      <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-divine-gold" />
              Tạo thư mục mới
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Tên thư mục..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateFolder();
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewFolderDialog(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
              Tạo thư mục
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AnimatePresence>
  );
}

// Session Item Component
interface SessionItemProps {
  session: ChatSession;
  isActive: boolean;
  isEditing: boolean;
  editTitle: string;
  onSelect: () => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
  onEditTitleChange: (value: string) => void;
  folders: ChatFolder[];
  onMoveToFolder: (folderId: string | null) => void;
}

function SessionItem({
  session,
  isActive,
  isEditing,
  editTitle,
  onSelect,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onEditTitleChange,
  folders,
  onMoveToFolder,
}: SessionItemProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 p-2 rounded-lg cursor-pointer group transition-colors",
        isActive
          ? "bg-primary/10 border border-primary/20"
          : "hover:bg-primary/5"
      )}
      onClick={onSelect}
    >
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStartEdit(); }}>
              <Edit2 className="w-4 h-4 mr-2" />
              Đổi tên
            </DropdownMenuItem>
            
            {folders.length > 0 && (
              <>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMoveToFolder(null); }}>
                  <FolderOpen className="w-4 h-4 mr-2" />
                  Bỏ khỏi thư mục
                </DropdownMenuItem>
                {folders.map((folder) => (
                  <DropdownMenuItem
                    key={folder.id}
                    onClick={(e) => { e.stopPropagation(); onMoveToFolder(folder.id); }}
                  >
                    <FolderOpen className="w-4 h-4 mr-2" style={{ color: folder.color }} />
                    {folder.name}
                  </DropdownMenuItem>
                ))}
              </>
            )}
            
            <DropdownMenuItem
              className="text-destructive"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Xóa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
