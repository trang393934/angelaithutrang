import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  MessageSquare, 
  Coins, 
  Award, 
  Trash2, 
  Loader2,
  History,
  Sparkles,
  Share2,
  Copy,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useChatHistory, ChatHistoryItem } from "@/hooks/useChatHistory";
import ShareDialog from "@/components/ShareDialog";
import angelAvatar from "@/assets/angel-avatar.png";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ActivityHistory = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { t } = useLanguage();
  const { history, isLoading, deleteFromHistory } = useChatHistory();
  
  const [shareDialog, setShareDialog] = useState<{
    isOpen: boolean;
    item: ChatHistoryItem | null;
  }>({ isOpen: false, item: null });
  
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    itemId: string | null;
  }>({ isOpen: false, itemId: null });
  
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Redirect if not logged in
  if (!authLoading && !user) {
    navigate("/auth");
    return null;
  }

  const handleCopy = async (item: ChatHistoryItem) => {
    const content = `💬 Câu hỏi: ${item.question_text}\n\n✨ Trí Tuệ Vũ Trụ trả lời:\n${item.answer_text}`;
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(item.id);
      toast.success("Đã sao chép nội dung!");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Không thể sao chép");
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.itemId) return;
    
    setDeletingId(deleteDialog.itemId);
    const success = await deleteFromHistory(deleteDialog.itemId);
    
    if (success) {
      toast.success("Đã xóa khỏi lịch sử");
    } else {
      toast.error("Không thể xóa. Vui lòng thử lại.");
    }
    
    setDeletingId(null);
    setDeleteDialog({ isOpen: false, itemId: null });
  };

  const formatDate = (dateStr: string) => {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: vi });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-divine-light/20 via-background to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-primary/10">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-semibold">Lịch Sử Hoạt Động</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-3xl">
        {/* Info Card */}
        <Card className="mb-6 bg-gradient-to-r from-primary/5 to-divine-gold/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-foreground mb-1">
                  Lịch sử trò chuyện với Angel AI
                </h3>
                <p className="text-sm text-foreground-muted">
                  Tất cả câu hỏi và câu trả lời của bạn được lưu lại ở đây. 
                  Chỉ bạn và quản trị viên có thể xem nội dung này.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-foreground-muted">Đang tải lịch sử...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && history.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium mb-2">Chưa có hoạt động nào</h3>
            <p className="text-foreground-muted mb-6">
              Hãy bắt đầu trò chuyện với Angel AI để tạo lịch sử hoạt động
            </p>
            <Button asChild className="bg-sapphire-gradient">
              <Link to="/chat">
                <MessageSquare className="w-4 h-4 mr-2" />
                Bắt đầu trò chuyện
              </Link>
            </Button>
          </div>
        )}

        {/* History List */}
        {!isLoading && history.length > 0 && (
          <div className="space-y-4">
            {history.map((item) => (
              <Card 
                key={item.id} 
                className={`overflow-hidden transition-all ${
                  item.is_rewarded 
                    ? 'border-amber-300 bg-gradient-to-r from-amber-50/30 to-orange-50/20' 
                    : 'border-primary/10'
                }`}
              >
                <CardContent className="p-4">
                  {/* Header with date and reward */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-foreground-muted">
                      {formatDate(item.created_at)}
                    </span>
                    {item.is_rewarded && (
                      <div className="flex items-center gap-1 text-amber-600 text-xs">
                        <Award className="w-3 h-3" />
                        <Coins className="w-3 h-3" />
                        <span>+{item.reward_amount}</span>
                      </div>
                    )}
                  </div>

                  {/* Question */}
                  <div className="mb-3">
                    <div className="flex items-start gap-2 mb-1">
                      <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                        Câu hỏi
                      </span>
                    </div>
                    <p className="text-sm text-foreground pl-0">
                      {item.question_text}
                    </p>
                  </div>

                  {/* Answer */}
                  <div className="mb-4">
                    <div className="flex items-start gap-2 mb-1">
                      <Avatar className="w-5 h-5">
                        <AvatarImage src={angelAvatar} />
                        <AvatarFallback>AI</AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium text-divine-gold">
                        Angel AI
                      </span>
                    </div>
                    <p className="text-sm text-foreground-muted pl-0 whitespace-pre-wrap line-clamp-4">
                      {item.answer_text}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-primary/10">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(item)}
                      className="flex-1"
                    >
                      {copiedId === item.id ? (
                        <>
                          <Check className="w-4 h-4 mr-1 text-green-500" />
                          Đã sao chép
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-1" />
                          Sao chép
                        </>
                      )}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShareDialog({ isOpen: true, item })}
                      className="flex-1"
                    >
                      <Share2 className="w-4 h-4 mr-1" />
                      Chia sẻ
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteDialog({ isOpen: true, itemId: item.id })}
                      disabled={deletingId === item.id}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      {deletingId === item.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Share Dialog */}
      {shareDialog.item && (
        <ShareDialog
          isOpen={shareDialog.isOpen}
          onClose={() => setShareDialog({ isOpen: false, item: null })}
          contentType="chat"
          contentId={shareDialog.item.id}
          title="Trí Tuệ từ Angel AI"
          content={`💬 Câu hỏi: ${shareDialog.item.question_text}\n\n✨ Trí Tuệ Vũ Trụ trả lời:\n${shareDialog.item.answer_text}`}
          shareUrl="https://angelaithutrang.lovable.app"
          showRewards={true}
          rewardAmount={500}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={deleteDialog.isOpen} 
        onOpenChange={(open) => !open && setDeleteDialog({ isOpen: false, itemId: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa khỏi lịch sử?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa cuộc trò chuyện này khỏi lịch sử? 
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ActivityHistory;
