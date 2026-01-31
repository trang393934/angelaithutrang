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
  Check,
  Image,
  Wand2,
  Download
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

interface ImageHistoryWithUser {
  id: string;
  user_id: string;
  image_type: 'generated' | 'analyzed';
  prompt: string;
  response_text: string | null;
  image_url: string;
  style: string | null;
  created_at: string;
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

interface ImageStats {
  totalImages: number;
  generatedImages: number;
  analyzedImages: number;
}

const ITEMS_PER_PAGE = 20;

const AdminActivityHistory = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading: authLoading, isAdminChecked, signOut } = useAuth();
  
  const [history, setHistory] = useState<ChatHistoryWithUser[]>([]);
  const [imageHistory, setImageHistory] = useState<ImageHistoryWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingImages, setIsLoadingImages] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalChats: 0,
    rewardedChats: 0,
    totalRewards: 0,
    uniqueUsers: 0,
  });
  const [imageStats, setImageStats] = useState<ImageStats>({
    totalImages: 0,
    generatedImages: 0,
    analyzedImages: 0,
  });
  
  const [activeTab, setActiveTab] = useState<'chat' | 'images'>('chat');
  
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    itemId: string | null;
    type: 'chat' | 'image';
  }>({ isOpen: false, itemId: null, type: 'chat' });
  
  const [viewDialog, setViewDialog] = useState<{
    isOpen: boolean;
    item: ChatHistoryWithUser | null;
  }>({ isOpen: false, item: null });

  const [viewImageDialog, setViewImageDialog] = useState<{
    isOpen: boolean;
    item: ImageHistoryWithUser | null;
  }>({ isOpen: false, item: null });
  
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<'question' | 'answer' | 'prompt' | null>(null);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [imageSearchQuery, setImageSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });
  const [imageDateRange, setImageDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });
  const [showFilters, setShowFilters] = useState(false);
  const [showImageFilters, setShowImageFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [imageCurrentPage, setImageCurrentPage] = useState(1);

  const fetchHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Fetch accurate stats using RPC function (bypasses 1000 row limit)
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_activity_history_stats');
      
      if (statsError) {
        console.error('Error fetching stats:', statsError);
      } else if (statsData && statsData.length > 0) {
        setStats({
          totalChats: Number(statsData[0].total_chats) || 0,
          rewardedChats: Number(statsData[0].rewarded_chats) || 0,
          totalRewards: Number(statsData[0].total_rewards) || 0,
          uniqueUsers: Number(statsData[0].unique_users) || 0,
        });
      }
      
      // Fetch paginated history for display (limit 1000 for UI performance)
      const { data: chatHistoryData, error: historyError } = await supabase
        .from('chat_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (historyError) throw historyError;
      
      // Get unique user IDs from chat history
      const chatUserIds = [...new Set(chatHistoryData?.map(c => c.user_id) || [])];
      
      // Fetch profiles for these users
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', chatUserIds);
      
      // Create a map of user_id to profile
      const profilesMap = new Map(
        profilesData?.map(p => [p.user_id, { display_name: p.display_name }]) || []
      );
      
      // Combine chat history with profiles
      const historyWithProfiles: ChatHistoryWithUser[] = (chatHistoryData || []).map(chat => ({
        id: chat.id,
        user_id: chat.user_id,
        question_text: chat.question_text,
        answer_text: chat.answer_text || '',
        purity_score: chat.purity_score,
        reward_amount: Number(chat.reward_amount) || 0,
        is_rewarded: chat.is_rewarded || false,
        created_at: chat.created_at,
        is_greeting: false,
        is_spam: false,
        profiles: profilesMap.get(chat.user_id) || null
      }));
      
      setHistory(historyWithProfiles);
    } catch (err) {
      console.error('Error fetching chat history:', err);
      toast.error('Không thể tải lịch sử chat');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchImageHistory = useCallback(async () => {
    try {
      setIsLoadingImages(true);
      
      // Fetch all image history
      const { data: imageData, error: imageError } = await supabase
        .from('image_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (imageError) throw imageError;
      
      // Get unique user IDs from image history
      const imageUserIds = [...new Set(imageData?.map(i => i.user_id) || [])];
      
      // Fetch profiles for these users
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', imageUserIds);
      
      // Create a map of user_id to profile
      const profilesMap = new Map(
        profilesData?.map(p => [p.user_id, { display_name: p.display_name }]) || []
      );
      
      // Combine image history with profiles
      const imageWithProfiles: ImageHistoryWithUser[] = (imageData || []).map(img => ({
        id: img.id,
        user_id: img.user_id,
        image_type: img.image_type as 'generated' | 'analyzed',
        prompt: img.prompt,
        response_text: img.response_text,
        image_url: img.image_url,
        style: img.style,
        created_at: img.created_at,
        profiles: profilesMap.get(img.user_id) || null
      }));
      
      setImageHistory(imageWithProfiles);
      
      // Calculate stats
      const generated = imageWithProfiles.filter(i => i.image_type === 'generated').length;
      const analyzed = imageWithProfiles.filter(i => i.image_type === 'analyzed').length;
      setImageStats({
        totalImages: imageWithProfiles.length,
        generatedImages: generated,
        analyzedImages: analyzed,
      });
    } catch (err) {
      console.error('Error fetching image history:', err);
      toast.error('Không thể tải lịch sử hình ảnh');
    } finally {
      setIsLoadingImages(false);
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
        fetchImageHistory();
      }
    }
  }, [user, isAdmin, authLoading, isAdminChecked, navigate, fetchHistory, fetchImageHistory]);

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

  const clearImageFilters = () => {
    setImageSearchQuery("");
    setImageDateRange({ from: undefined, to: undefined });
  };

  const hasActiveFilters = searchQuery.trim() !== "" || dateRange.from || dateRange.to;
  const hasActiveImageFilters = imageSearchQuery.trim() !== "" || imageDateRange.from || imageDateRange.to;

  // Filter image history based on search and date
  const filteredImageHistory = useMemo(() => {
    return imageHistory.filter((item) => {
      // Search filter
      const searchLower = imageSearchQuery.toLowerCase();
      const matchesSearch = imageSearchQuery.trim() === "" || 
        item.prompt.toLowerCase().includes(searchLower) ||
        item.response_text?.toLowerCase().includes(searchLower) ||
        item.profiles?.display_name?.toLowerCase().includes(searchLower) ||
        item.user_id.toLowerCase().includes(searchLower);
      
      // Date filter
      let matchesDate = true;
      if (imageDateRange.from || imageDateRange.to) {
        const itemDate = parseISO(item.created_at);
        if (imageDateRange.from && imageDateRange.to) {
          matchesDate = isWithinInterval(itemDate, {
            start: startOfDay(imageDateRange.from),
            end: endOfDay(imageDateRange.to)
          });
        } else if (imageDateRange.from) {
          matchesDate = itemDate >= startOfDay(imageDateRange.from);
        } else if (imageDateRange.to) {
          matchesDate = itemDate <= endOfDay(imageDateRange.to);
        }
      }
      
      return matchesSearch && matchesDate;
    });
  }, [imageHistory, imageSearchQuery, imageDateRange]);

  // Image Pagination
  const totalImagePages = Math.ceil(filteredImageHistory.length / ITEMS_PER_PAGE);
  const paginatedImageHistory = useMemo(() => {
    const start = (imageCurrentPage - 1) * ITEMS_PER_PAGE;
    return filteredImageHistory.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredImageHistory, imageCurrentPage]);

  // Reset image page when filters change
  useEffect(() => {
    setImageCurrentPage(1);
  }, [imageSearchQuery, imageDateRange]);

  const getUserDisplayImage = (item: ImageHistoryWithUser) => {
    if (item.profiles?.display_name) return item.profiles.display_name;
    return item.user_id.substring(0, 8) + '...';
  };

  const handleDownloadImage = (imageUrl: string, prompt: string) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `angel-ai-${prompt.slice(0, 20).replace(/\s+/g, '-')}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Đang tải xuống...");
  };

  const handleDelete = async () => {
    if (!deleteDialog.itemId) return;
    
    setDeletingId(deleteDialog.itemId);
    
    try {
      if (deleteDialog.type === 'image') {
        const { error } = await supabase
          .from('image_history')
          .delete()
          .eq('id', deleteDialog.itemId);

        if (error) throw error;
        
        setImageHistory(prev => prev.filter(item => item.id !== deleteDialog.itemId));
        toast.success("Đã xóa hình ảnh");
      } else {
        const { error } = await supabase
          .from('chat_history')
          .delete()
          .eq('id', deleteDialog.itemId);

        if (error) throw error;
        
        setHistory(prev => prev.filter(item => item.id !== deleteDialog.itemId));
        toast.success("Đã xóa khỏi lịch sử");
      }
    } catch (err) {
      console.error('Error deleting:', err);
      toast.error("Không thể xóa. Vui lòng thử lại.");
    }
    
    setDeletingId(null);
    setDeleteDialog({ isOpen: false, itemId: null, type: 'chat' });
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
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'chat' | 'images')} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Lịch sử Chat
            </TabsTrigger>
            <TabsTrigger value="images" className="flex items-center gap-2">
              <Image className="w-4 h-4" />
              Lịch sử Ảnh
            </TabsTrigger>
          </TabsList>

          {/* Chat History Tab */}
          <TabsContent value="chat" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
            <Card className="border-primary/20">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Tìm theo nội dung, tên user..."
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
              <div className="text-sm text-muted-foreground">
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
                                onClick={() => setDeleteDialog({ isOpen: true, itemId: item.id, type: 'chat' })}
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
          </TabsContent>

          {/* Image History Tab */}
          <TabsContent value="images" className="space-y-6">
            {/* Image Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Card className="border-primary/20">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Image className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{imageStats.totalImages.toLocaleString()}</p>
                      <p className="text-xs text-foreground-muted">Tổng hình ảnh</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-purple-500/20">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <Wand2 className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-600">{imageStats.generatedImages.toLocaleString()}</p>
                      <p className="text-xs text-foreground-muted">Ảnh tạo</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-blue-500/20">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Eye className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{imageStats.analyzedImages.toLocaleString()}</p>
                      <p className="text-xs text-foreground-muted">Ảnh phân tích</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Image Search and Filter Section */}
            <Card className="border-primary/20">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Tìm theo câu lệnh, tên user..."
                      value={imageSearchQuery}
                      onChange={(e) => setImageSearchQuery(e.target.value)}
                      className="pl-10 pr-10"
                    />
                    {imageSearchQuery && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                        onClick={() => setImageSearchQuery("")}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowImageFilters(!showImageFilters)}
                      className={showImageFilters ? "border-primary text-primary" : ""}
                    >
                      <Filter className="w-4 h-4 mr-2" />
                      Bộ lọc
                      {hasActiveImageFilters && (
                        <span className="ml-2 w-2 h-2 rounded-full bg-primary" />
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchImageHistory}
                      disabled={isLoadingImages}
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingImages ? 'animate-spin' : ''}`} />
                      Làm mới
                    </Button>
                    
                    {hasActiveImageFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearImageFilters}
                        className="text-muted-foreground"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Xóa bộ lọc
                      </Button>
                    )}
                  </div>
                </div>

                {showImageFilters && (
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
                            {imageDateRange.from ? format(imageDateRange.from, "dd/MM/yyyy", { locale: vi }) : "Từ ngày"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={imageDateRange.from}
                            onSelect={(date) => setImageDateRange(prev => ({ ...prev, from: date }))}
                            initialFocus
                            locale={vi}
                          />
                        </PopoverContent>
                      </Popover>

                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="justify-start">
                            <Calendar className="w-4 h-4 mr-2" />
                            {imageDateRange.to ? format(imageDateRange.to, "dd/MM/yyyy", { locale: vi }) : "Đến ngày"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={imageDateRange.to}
                            onSelect={(date) => setImageDateRange(prev => ({ ...prev, to: date }))}
                            initialFocus
                            locale={vi}
                          />
                        </PopoverContent>
                      </Popover>

                      {(imageDateRange.from || imageDateRange.to) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setImageDateRange({ from: undefined, to: undefined })}
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

            {/* Image Results Count */}
            {!isLoadingImages && imageHistory.length > 0 && (
              <div className="text-sm text-muted-foreground">
                {hasActiveImageFilters ? (
                  <>
                    Tìm thấy <span className="font-medium text-foreground">{filteredImageHistory.length}</span> kết quả
                    {filteredImageHistory.length !== imageHistory.length && (
                      <> trong tổng số <span className="font-medium text-foreground">{imageHistory.length}</span> hình ảnh</>
                    )}
                  </>
                ) : (
                  <>Hiển thị <span className="font-medium text-foreground">{paginatedImageHistory.length}</span> / <span className="font-medium text-foreground">{imageHistory.length}</span> hình ảnh</>
                )}
              </div>
            )}

            {/* Image Loading State */}
            {isLoadingImages && (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                <p className="text-foreground-muted">Đang tải lịch sử hình ảnh...</p>
              </div>
            )}

            {/* Image Empty State */}
            {!isLoadingImages && imageHistory.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Image className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-medium mb-2">Chưa có hình ảnh nào</h3>
                <p className="text-foreground-muted">
                  Lịch sử tạo/phân tích ảnh của users sẽ xuất hiện ở đây
                </p>
              </div>
            )}

            {/* Image No Results after filtering */}
            {!isLoadingImages && imageHistory.length > 0 && filteredImageHistory.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">Không tìm thấy kết quả</h3>
                <p className="text-foreground-muted mb-6">
                  Thử thay đổi từ khóa tìm kiếm hoặc điều chỉnh bộ lọc
                </p>
                <Button variant="outline" onClick={clearImageFilters}>
                  <X className="w-4 h-4 mr-2" />
                  Xóa bộ lọc
                </Button>
              </div>
            )}

            {/* Image History Table */}
            {!isLoadingImages && paginatedImageHistory.length > 0 && (
              <>
                <Card className="border-primary/20 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">Ảnh</TableHead>
                        <TableHead className="w-[150px]">User</TableHead>
                        <TableHead>Câu lệnh</TableHead>
                        <TableHead className="w-[100px] text-center">Loại</TableHead>
                        <TableHead className="w-[140px]">Thời gian</TableHead>
                        <TableHead className="w-[120px] text-center">Hành động</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedImageHistory.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div 
                              className="w-12 h-12 rounded-lg overflow-hidden border border-primary/20 cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => setViewImageDialog({ isOpen: true, item })}
                            >
                              <img
                                src={item.image_url}
                                alt={item.prompt}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="w-7 h-7">
                                <AvatarFallback className="text-xs">
                                  {getUserDisplayImage(item).charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium truncate max-w-[100px]">
                                {getUserDisplayImage(item)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm line-clamp-2">{item.prompt}</p>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              item.image_type === 'generated' 
                                ? 'bg-purple-100 text-purple-700' 
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {item.image_type === 'generated' ? (
                                <>
                                  <Wand2 className="w-3 h-3" />
                                  Tạo
                                </>
                              ) : (
                                <>
                                  <Eye className="w-3 h-3" />
                                  Phân tích
                                </>
                              )}
                            </span>
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
                                onClick={() => setViewImageDialog({ isOpen: true, item })}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleDownloadImage(item.image_url, item.prompt)}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={() => setDeleteDialog({ isOpen: true, itemId: item.id, type: 'image' })}
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

                {/* Image Pagination */}
                {totalImagePages > 1 && (
                  <div className="mt-6">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => setImageCurrentPage(p => Math.max(1, p - 1))}
                            className={imageCurrentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                        
                        <PaginationItem>
                          <PaginationLink isActive>{imageCurrentPage}</PaginationLink>
                        </PaginationItem>
                        
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => setImageCurrentPage(p => Math.min(totalImagePages, p + 1))}
                            className={imageCurrentPage === totalImagePages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
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

      {/* View Image Dialog */}
      <Dialog open={viewImageDialog.isOpen} onOpenChange={(open) => !open && setViewImageDialog({ isOpen: false, item: null })}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden p-0">
          {viewImageDialog.item && (
            <div className="flex flex-col">
              {/* Image */}
              <div className="relative bg-black/5 max-h-[60vh] overflow-hidden">
                <img
                  src={viewImageDialog.item.image_url}
                  alt={viewImageDialog.item.prompt}
                  className="w-full h-full object-contain"
                />
              </div>
              
              {/* Info */}
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                    viewImageDialog.item.image_type === 'generated'
                      ? "bg-purple-100 text-purple-700"
                      : "bg-blue-100 text-blue-700"
                  }`}>
                    {viewImageDialog.item.image_type === 'generated' ? (
                      <>
                        <Wand2 className="w-3 h-3" />
                        Tạo ảnh
                      </>
                    ) : (
                      <>
                        <Eye className="w-3 h-3" />
                        Phân tích
                      </>
                    )}
                  </span>
                  {viewImageDialog.item.style && (
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs">
                      {viewImageDialog.item.style}
                    </span>
                  )}
                  <span className="text-xs text-foreground-muted ml-auto">
                    {formatFullDate(viewImageDialog.item.created_at)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="text-xs">
                      {getUserDisplayImage(viewImageDialog.item).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{getUserDisplayImage(viewImageDialog.item)}</span>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium">Câu lệnh:</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => {
                        navigator.clipboard.writeText(viewImageDialog.item?.prompt || '');
                        setCopiedField('prompt');
                        toast.success('Đã sao chép câu lệnh');
                        setTimeout(() => setCopiedField(null), 2000);
                      }}
                    >
                      {copiedField === 'prompt' ? (
                        <Check className="w-3.5 h-3.5 mr-1 text-green-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 mr-1" />
                      )}
                      Copy
                    </Button>
                  </div>
                  <p className="text-sm text-foreground-muted">{viewImageDialog.item.prompt}</p>
                </div>
                
                {viewImageDialog.item.response_text && (
                  <div>
                    <p className="text-sm font-medium mb-1">Kết quả phân tích:</p>
                    <p className="text-sm text-foreground-muted whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {viewImageDialog.item.response_text}
                    </p>
                  </div>
                )}
                
                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleDownloadImage(viewImageDialog.item!.image_url, viewImageDialog.item!.prompt)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Tải xuống
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setDeleteDialog({ isOpen: true, itemId: viewImageDialog.item!.id, type: 'image' });
                      setViewImageDialog({ isOpen: false, item: null });
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialog.isOpen} onOpenChange={(open) => !open && setDeleteDialog({ isOpen: false, itemId: null, type: 'chat' })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialog.type === 'image' 
                ? 'Bạn có chắc chắn muốn xóa hình ảnh này? Hành động này không thể hoàn tác.'
                : 'Bạn có chắc chắn muốn xóa cuộc trò chuyện này? Hành động này không thể hoàn tác.'}
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
