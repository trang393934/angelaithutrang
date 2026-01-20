import { useState, useMemo } from "react";
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
  Check,
  Search,
  Calendar,
  X,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useChatHistory, ChatHistoryItem } from "@/hooks/useChatHistory";
import ShareDialog from "@/components/ShareDialog";
import angelAvatar from "@/assets/angel-avatar.png";
import { formatDistanceToNow, format, isWithinInterval, startOfDay, endOfDay, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
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
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });
  const [showFilters, setShowFilters] = useState(false);

  // Filter history based on search and date
  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      // Search filter
      const matchesSearch = searchQuery.trim() === "" || 
        item.question_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer_text.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Date filter
      let matchesDate = true;
      if (dateRange.from || dateRange.to) {
        const itemDate = parseISO(item.created_at);
        if (dateRange.from && dateRange.to) {
          matchesDate = isWithinInterval(itemDate, {
            start: startOfDay(dateRange.from),
            end: endOfDay(dateRange.to)
          });
        } else if (dateRange.from) {
          matchesDate = itemDate >= startOfDay(dateRange.from);
        } else if (dateRange.to) {
          matchesDate = itemDate <= endOfDay(dateRange.to);
        }
      }
      
      return matchesSearch && matchesDate;
    });
  }, [history, searchQuery, dateRange]);

  const clearFilters = () => {
    setSearchQuery("");
    setDateRange({ from: undefined, to: undefined });
  };

  const hasActiveFilters = searchQuery.trim() !== "" || dateRange.from || dateRange.to;

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
        {/* Search and Filter Section */}
        <Card className="mb-4 border-primary/20">
          <CardContent className="p-4">
            {/* Search Input */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Tìm kiếm trong lịch sử..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={showFilters ? "border-primary text-primary" : ""}
              >
                <Filter className="w-4 h-4 mr-2" />
                Bộ lọc
                {hasActiveFilters && (
                  <span className="ml-2 w-2 h-2 rounded-full bg-primary" />
                )}
              </Button>
              
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-muted-foreground"
                >
                  <X className="w-4 h-4 mr-1" />
                  Xóa bộ lọc
                </Button>
              )}
            </div>

            {/* Date Range Filter */}
            {showFilters && (
              <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Lọc theo ngày</span>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="justify-start">
                        <Calendar className="w-4 h-4 mr-2" />
                        {dateRange.from ? format(dateRange.from, "dd/MM/yyyy", { locale: vi }) : "Từ ngày"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={dateRange.from}
                        onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                        initialFocus
                        locale={vi}
                      />
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="justify-start">
                        <Calendar className="w-4 h-4 mr-2" />
                        {dateRange.to ? format(dateRange.to, "dd/MM/yyyy", { locale: vi }) : "Đến ngày"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={dateRange.to}
                        onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                        initialFocus
                        locale={vi}
                      />
                    </PopoverContent>
                  </Popover>

                  {(dateRange.from || dateRange.to) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDateRange({ from: undefined, to: undefined })}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Xóa
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Count */}
        {hasActiveFilters && !isLoading && history.length > 0 && (
          <div className="mb-4 text-sm text-muted-foreground">
            Tìm thấy <span className="font-medium text-foreground">{filteredHistory.length}</span> kết quả
            {filteredHistory.length !== history.length && (
              <> trong tổng số <span className="font-medium text-foreground">{history.length}</span> hoạt động</>
            )}
          </div>
        )}

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

        {/* No Results after filtering */}
        {!isLoading && history.length > 0 && filteredHistory.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">Không tìm thấy kết quả</h3>
            <p className="text-foreground-muted mb-6">
              Thử thay đổi từ khóa tìm kiếm hoặc điều chỉnh bộ lọc
            </p>
            <Button variant="outline" onClick={clearFilters}>
              <X className="w-4 h-4 mr-2" />
              Xóa bộ lọc
            </Button>
          </div>
        )}

        {/* History List */}
        {!isLoading && filteredHistory.length > 0 && (
          <div className="space-y-4">
            {filteredHistory.map((item) => (
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
