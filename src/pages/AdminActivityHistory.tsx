import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  MessageSquare, 
  Coins, 
  Award, 
  Trash2, 
  Loader2,
  History,
  Search,
  Calendar,
  X,
  Filter,
  Users,
  TrendingUp,
  Wallet,
  LogOut,
  Eye,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Copy,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";

interface ChatHistoryWithUser {
  id: string;
  user_id: string;
  question_text: string;
  answer_text: string;
  purity_score: number | null;
  reward_amount: number;
  is_rewarded: boolean;
  created_at: string;
  is_greeting: boolean;
  is_spam: boolean;
  profiles?: {
    display_name: string | null;
  } | null;
}

interface Stats {
  totalChats: number;
  rewardedChats: number;
  totalRewards: number;
  uniqueUsers: number;
}

const ITEMS_PER_PAGE = 20;

const AdminActivityHistory = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading: authLoading, isAdminChecked, signOut } = useAuth();
  
  const [history, setHistory] = useState<ChatHistoryWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalChats: 0,
    rewardedChats: 0,
    totalRewards: 0,
    uniqueUsers: 0,
  });
  
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    itemId: string | null;
  }>({ isOpen: false, itemId: null });
  
  const [viewDialog, setViewDialog] = useState<{
    isOpen: boolean;
    item: ChatHistoryWithUser | null;
  }>({ isOpen: false, item: null });
  
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<'question' | 'answer' | null>(null);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Fetch chat questions (main source of chat data)
      const { data: chatData, error: chatError } = await supabase
        .from('chat_questions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (chatError) throw chatError;
      
      // Get unique user IDs from chat
      const chatUserIds = [...new Set(chatData?.map(c => c.user_id) || [])];
      
      // Fetch profiles for these users
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', chatUserIds);
      
      // Create a map of user_id to profile
      const profilesMap = new Map(
        profilesData?.map(p => [p.user_id, { display_name: p.display_name }]) || []
      );
      
      // Combine chat questions with profiles
      const historyWithProfiles: ChatHistoryWithUser[] = (chatData || []).map(chat => ({
        id: chat.id,
        user_id: chat.user_id,
        question_text: chat.question_text,
        answer_text: chat.ai_response_preview || '',
        purity_score: chat.purity_score,
        reward_amount: Number(chat.reward_amount) || 0,
        is_rewarded: chat.is_rewarded || false,
        created_at: chat.created_at,
        is_greeting: chat.is_greeting || false,
        is_spam: chat.is_spam || false,
        profiles: profilesMap.get(chat.user_id) || null
      }));
      
      setHistory(historyWithProfiles);
      
      // Calculate stats - use user_light_agreements for consistent user count
      const { count: totalAgreedUsers } = await supabase
        .from('user_light_agreements')
        .select('*', { count: 'exact', head: true });
      
      const totalChats = historyWithProfiles.length;
      const rewardedChats = historyWithProfiles.filter(c => c.is_rewarded).length;
      const totalRewards = historyWithProfiles.reduce((sum, c) => sum + (c.reward_amount || 0), 0);
      
      setStats({
        totalChats,
        rewardedChats,
        totalRewards,
        uniqueUsers: totalAgreedUsers || 0,
      });
    } catch (err) {
      console.error('Error fetching chat history:', err);
      toast.error('Không thể tải lịch sử chat');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAdminChecked) {
      if (!user) {
        navigate("/admin/login");
      } else if (!isAdmin) {
        toast.error("Bạn không có quyền truy cập trang này");
        navigate("/");
      } else {
        fetchHistory();
      }
    }
  }, [user, isAdmin, authLoading, isAdminChecked, navigate, fetchHistory]);

  // Filter history based on search and date
  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = searchQuery.trim() === "" || 
        item.question_text.toLowerCase().includes(searchLower) ||
        item.answer_text.toLowerCase().includes(searchLower) ||
        item.profiles?.display_name?.toLowerCase().includes(searchLower) ||
        item.user_id.toLowerCase().includes(searchLower);
      
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

  // Pagination
  const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);
  const paginatedHistory = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredHistory.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredHistory, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, dateRange]);

  const clearFilters = () => {
    setSearchQuery("");
    setDateRange({ from: undefined, to: undefined });
  };

  const hasActiveFilters = searchQuery.trim() !== "" || dateRange.from || dateRange.to;

  const handleDelete = async () => {
    if (!deleteDialog.itemId) return;
    
    setDeletingId(deleteDialog.itemId);
    
    try {
      const { error } = await supabase
        .from('chat_questions')
        .delete()
        .eq('id', deleteDialog.itemId);

      if (error) throw error;
      
      setHistory(prev => prev.filter(item => item.id !== deleteDialog.itemId));
      toast.success("Đã xóa khỏi lịch sử");
    } catch (err) {
      console.error('Error deleting:', err);
      toast.error("Không thể xóa. Vui lòng thử lại.");
    }
    
    setDeletingId(null);
    setDeleteDialog({ isOpen: false, itemId: null });
  };

  const formatDate = (dateStr: string) => {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: vi });
  };

  const formatFullDate = (dateStr: string) => {
    return format(new Date(dateStr), "HH:mm dd/MM/yyyy", { locale: vi });
  };

  const getUserDisplay = (item: ChatHistoryWithUser) => {
    if (item.profiles?.display_name) return item.profiles.display_name;
    return item.user_id.substring(0, 8) + '...';
  };

  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
      items.push(
        <PaginationItem key={1}>
          <PaginationLink onClick={() => setCurrentPage(1)}>1</PaginationLink>
        </PaginationItem>
      );
      if (startPage > 2) {
        items.push(
          <PaginationItem key="start-ellipsis">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink 
            isActive={currentPage === i}
            onClick={() => setCurrentPage(i)}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(
          <PaginationItem key="end-ellipsis">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink onClick={() => setCurrentPage(totalPages)}>{totalPages}</PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  if (authLoading || !isAdminChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-divine-light/20 via-background to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-primary/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/admin/dashboard" className="p-2 rounded-full hover:bg-primary/10 transition-colors">
                <ArrowLeft className="w-5 h-5 text-primary" />
              </Link>
              <div className="flex items-center gap-3">
                <img src={angelAvatar} alt="Angel AI" className="w-10 h-10 rounded-full shadow-soft" />
                <div>
                  <h1 className="font-serif text-lg font-semibold text-primary">Admin Activity History</h1>
                  <p className="text-xs text-foreground-muted">Quản lý lịch sử chat của tất cả users</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/admin/dashboard"
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full text-sm text-foreground-muted hover:text-primary hover:bg-primary/10 transition-colors"
              >
                <Users className="w-4 h-4" />
                Dashboard
              </Link>
              <Link
                to="/admin/statistics"
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full text-sm text-foreground-muted hover:text-primary hover:bg-primary/10 transition-colors"
              >
                <TrendingUp className="w-4 h-4" />
                Thống kê
              </Link>
              <Link
                to="/admin/withdrawals"
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full text-sm text-foreground-muted hover:text-primary hover:bg-primary/10 transition-colors"
              >
                <Wallet className="w-4 h-4" />
                Rút coin
              </Link>
              <button
                onClick={() => signOut().then(() => navigate("/"))}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm text-foreground-muted hover:text-primary hover:bg-primary/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Đăng xuất</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-primary/20">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <MessageSquare className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.totalChats.toLocaleString()}</p>
                  <p className="text-xs text-foreground-muted">Tổng chat</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-500/20">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Award className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-600">{stats.rewardedChats.toLocaleString()}</p>
                  <p className="text-xs text-foreground-muted">Đã thưởng</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-500/20">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Coins className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{stats.totalRewards.toLocaleString()}</p>
                  <p className="text-xs text-foreground-muted">Tổng Camly Coin</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-500/20">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">{stats.uniqueUsers.toLocaleString()}</p>
                  <p className="text-xs text-foreground-muted">Tổng users</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter Section */}
        <Card className="mb-6 border-primary/20">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Tìm theo nội dung, tên user, email..."
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

              {/* Filter and Refresh Buttons */}
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
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchHistory}
                  disabled={isLoading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Làm mới
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
        {!isLoading && history.length > 0 && (
          <div className="mb-4 text-sm text-muted-foreground">
            {hasActiveFilters ? (
              <>
                Tìm thấy <span className="font-medium text-foreground">{filteredHistory.length}</span> kết quả
                {filteredHistory.length !== history.length && (
                  <> trong tổng số <span className="font-medium text-foreground">{history.length}</span> hoạt động</>
                )}
              </>
            ) : (
              <>Hiển thị <span className="font-medium text-foreground">{paginatedHistory.length}</span> / <span className="font-medium text-foreground">{history.length}</span> hoạt động</>
            )}
          </div>
        )}

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
              <History className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium mb-2">Chưa có hoạt động nào</h3>
            <p className="text-foreground-muted">
              Lịch sử chat của users sẽ xuất hiện ở đây
            </p>
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

        {/* History Table */}
        {!isLoading && paginatedHistory.length > 0 && (
          <>
            <Card className="border-primary/20 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">User</TableHead>
                    <TableHead>Câu hỏi</TableHead>
                    <TableHead className="w-[100px] text-center">Thưởng</TableHead>
                    <TableHead className="w-[140px]">Thời gian</TableHead>
                    <TableHead className="w-[100px] text-center">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedHistory.map((item) => (
                    <TableRow key={item.id} className={item.is_rewarded ? 'bg-amber-50/30' : ''}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-7 h-7">
                            <AvatarFallback className="text-xs">
                              {getUserDisplay(item).charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium truncate max-w-[100px]">
                            {getUserDisplay(item)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm line-clamp-2">{item.question_text}</p>
                      </TableCell>
                      <TableCell className="text-center">
                        {item.is_rewarded ? (
                          <div className="flex items-center justify-center gap-1 text-amber-600 text-sm">
                            <Coins className="w-4 h-4" />
                            <span>+{item.reward_amount}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(item.created_at)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setViewDialog({ isOpen: true, item })}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => setDeleteDialog({ isOpen: true, itemId: item.id })}
                            disabled={deletingId === item.id}
                          >
                            {deletingId === item.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    
                    {renderPaginationItems()}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </main>

      {/* View Dialog */}
      <Dialog open={viewDialog.isOpen} onOpenChange={(open) => !open && setViewDialog({ isOpen: false, item: null })}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
          <DialogHeader className="shrink-0 pb-2">
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Chi tiết cuộc trò chuyện
            </DialogTitle>
            <DialogDescription>
              {viewDialog.item && (
                <span className="flex items-center gap-2">
                  <span>User: <strong>{getUserDisplay(viewDialog.item)}</strong></span>
                  <span>•</span>
                  <span>{formatFullDate(viewDialog.item.created_at)}</span>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {viewDialog.item && (
            <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
              {/* Question */}
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                      Câu hỏi
                    </span>
                    {viewDialog.item.purity_score && (
                      <span className="text-xs text-muted-foreground">
                        Điểm tinh khiết: {(viewDialog.item.purity_score * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs shrink-0"
                    onClick={() => {
                      navigator.clipboard.writeText(viewDialog.item?.question_text || '');
                      setCopiedField('question');
                      toast.success('Đã sao chép câu hỏi');
                      setTimeout(() => setCopiedField(null), 2000);
                    }}
                  >
                    {copiedField === 'question' ? (
                      <Check className="w-3.5 h-3.5 mr-1 text-green-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 mr-1" />
                    )}
                    Copy
                  </Button>
                </div>
                <p className="text-sm whitespace-pre-wrap break-words">{viewDialog.item.question_text}</p>
              </div>

              {/* Answer */}
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-5 h-5">
                      <AvatarImage src={angelAvatar} />
                      <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium text-foreground">Angel AI</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs shrink-0"
                    onClick={() => {
                      navigator.clipboard.writeText(viewDialog.item?.answer_text || '');
                      setCopiedField('answer');
                      toast.success('Đã sao chép câu trả lời');
                      setTimeout(() => setCopiedField(null), 2000);
                    }}
                  >
                    {copiedField === 'answer' ? (
                      <Check className="w-3.5 h-3.5 mr-1 text-green-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 mr-1" />
                    )}
                    Copy
                  </Button>
                </div>
                <p className="text-sm whitespace-pre-wrap break-words">{viewDialog.item.answer_text}</p>
              </div>

              {/* Reward Info */}
              {viewDialog.item.is_rewarded && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <Award className="w-5 h-5 text-amber-600" />
                  <span className="text-sm text-amber-700">
                    Đã nhận thưởng <strong>{viewDialog.item.reward_amount.toLocaleString()} Camly Coin</strong>
                  </span>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialog.isOpen} onOpenChange={(open) => !open && setDeleteDialog({ isOpen: false, itemId: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa cuộc trò chuyện này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminActivityHistory;
