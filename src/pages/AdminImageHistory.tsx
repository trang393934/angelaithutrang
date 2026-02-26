import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getProfilePath } from "@/lib/profileUrl";
import { 
  ArrowLeft, 
  Image, 
  Wand2, 
  Eye, 
  Trash2, 
  Loader2,
  Search,
  Calendar,
  X,
  Filter,
  Users,
  LogOut,
  Download,
  RefreshCw,
  ExternalLink
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Dialog,
  DialogContent,
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
import { cn } from "@/lib/utils";

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
    avatar_url: string | null;
  } | null;
}

interface Stats {
  totalImages: number;
  generatedImages: number;
  analyzedImages: number;
  uniqueUsers: number;
}

const ITEMS_PER_PAGE = 20;

const AdminImageHistory = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading: authLoading, isAdminChecked, signOut } = useAuth();
  
  const [history, setHistory] = useState<ImageHistoryWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalImages: 0,
    generatedImages: 0,
    analyzedImages: 0,
    uniqueUsers: 0,
  });
  
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    itemId: string | null;
  }>({ isOpen: false, itemId: null });
  
  const [viewDialog, setViewDialog] = useState<{
    isOpen: boolean;
    item: ImageHistoryWithUser | null;
  }>({ isOpen: false, item: null });
  
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<'all' | 'generated' | 'analyzed'>('all');
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Fetch image history
      const { data: imageData, error: imageError } = await supabase
        .from('image_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (imageError) throw imageError;
      
      // Calculate stats
      const generated = imageData?.filter(i => i.image_type === 'generated').length || 0;
      const analyzed = imageData?.filter(i => i.image_type === 'analyzed').length || 0;
      const uniqueUserIds = [...new Set(imageData?.map(i => i.user_id) || [])];
      
      setStats({
        totalImages: imageData?.length || 0,
        generatedImages: generated,
        analyzedImages: analyzed,
        uniqueUsers: uniqueUserIds.length,
      });
      
      // Fetch profiles for these users
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', uniqueUserIds);
      
      // Create a map of user_id to profile
      const profilesMap = new Map(
        profilesData?.map(p => [p.user_id, { display_name: p.display_name, avatar_url: p.avatar_url }]) || []
      );
      
      // Combine image history with profiles
      const historyWithProfiles: ImageHistoryWithUser[] = (imageData || []).map(img => ({
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
      
      setHistory(historyWithProfiles);
    } catch (err) {
      console.error('Error fetching image history:', err);
      toast.error('Không thể tải lịch sử hình ảnh');
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

  // Filter history based on search, type and date
  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      // Type filter
      const matchesType = typeFilter === 'all' || item.image_type === typeFilter;
      
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = searchQuery.trim() === "" || 
        item.prompt.toLowerCase().includes(searchLower) ||
        item.response_text?.toLowerCase().includes(searchLower) ||
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
      
      return matchesType && matchesSearch && matchesDate;
    });
  }, [history, searchQuery, typeFilter, dateRange]);

  // Pagination
  const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);
  const paginatedHistory = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredHistory.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredHistory, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, typeFilter, dateRange]);

  const clearFilters = () => {
    setSearchQuery("");
    setTypeFilter('all');
    setDateRange({ from: undefined, to: undefined });
  };

  const hasActiveFilters = searchQuery.trim() !== "" || typeFilter !== 'all' || dateRange.from || dateRange.to;

  const handleDelete = async () => {
    if (!deleteDialog.itemId) return;
    
    setDeletingId(deleteDialog.itemId);
    
    try {
      const { error } = await supabase
        .from('image_history')
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

  const handleDownload = (imageUrl: string, prompt: string) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `angel-ai-${prompt.slice(0, 20).replace(/\s+/g, '-')}-${Date.now()}.png`;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Đang tải xuống...");
  };

  const formatDate = (dateStr: string) => {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: vi });
  };

  const formatFullDate = (dateStr: string) => {
    return format(new Date(dateStr), "HH:mm dd/MM/yyyy", { locale: vi });
  };

  const getUserDisplay = (item: ImageHistoryWithUser) => {
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
                  <h1 className="font-serif text-lg font-semibold text-primary">Lịch sử Hình ảnh</h1>
                  <p className="text-xs text-foreground-muted">Quản lý hình ảnh của tất cả users</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/admin/activity-history"
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full text-sm text-foreground-muted hover:text-primary hover:bg-primary/10 transition-colors"
              >
                <Users className="w-4 h-4" />
                Chat History
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
                  <Image className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.totalImages.toLocaleString()}</p>
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
                  <p className="text-2xl font-bold text-purple-600">{stats.generatedImages.toLocaleString()}</p>
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
                  <p className="text-2xl font-bold text-blue-600">{stats.analyzedImages.toLocaleString()}</p>
                  <p className="text-xs text-foreground-muted">Ảnh phân tích</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-500/20">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{stats.uniqueUsers.toLocaleString()}</p>
                  <p className="text-xs text-foreground-muted">Users đã dùng</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter Section */}
        <Card className="mb-6 border-primary/20">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3">
              {/* Search and Type Filter Row */}
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Tìm theo prompt, tên user..."
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

                {/* Type Filter */}
                <Tabs value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)} className="w-full sm:w-auto">
                  <TabsList className="w-full sm:w-auto">
                    <TabsTrigger value="all" className="flex-1 sm:flex-none text-xs">
                      Tất cả
                    </TabsTrigger>
                    <TabsTrigger value="generated" className="flex-1 sm:flex-none text-xs">
                      <Wand2 className="w-3 h-3 mr-1" />
                      Tạo ảnh
                    </TabsTrigger>
                    <TabsTrigger value="analyzed" className="flex-1 sm:flex-none text-xs">
                      <Eye className="w-3 h-3 mr-1" />
                      Phân tích
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                {/* Date Filter */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className={cn(
                      "gap-2",
                      (dateRange.from || dateRange.to) && "text-primary border-primary"
                    )}>
                      <Calendar className="w-4 h-4" />
                      <span className="hidden sm:inline">
                        {dateRange.from ? format(dateRange.from, "dd/MM") : "Từ ngày"}
                        {dateRange.to ? ` - ${format(dateRange.to, "dd/MM")}` : ""}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <CalendarComponent
                      mode="range"
                      selected={{ from: dateRange.from, to: dateRange.to }}
                      onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>

                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                    <X className="w-4 h-4" />
                    Xóa bộ lọc
                  </Button>
                )}

                <Button variant="outline" size="sm" onClick={fetchHistory} className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  <span className="hidden sm:inline">Làm mới</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Info */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-foreground-muted">
            Hiển thị {paginatedHistory.length} / {filteredHistory.length} kết quả
            {hasActiveFilters && ` (đã lọc từ ${history.length} tổng)`}
          </p>
        </div>

        {/* Image Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : paginatedHistory.length === 0 ? (
          <Card className="border-primary/20">
            <CardContent className="py-12 text-center">
              <Image className="w-12 h-12 mx-auto mb-4 text-foreground-muted opacity-50" />
              <p className="text-foreground-muted">
                {hasActiveFilters ? "Không tìm thấy hình ảnh phù hợp" : "Chưa có hình ảnh nào"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {paginatedHistory.map((item) => (
              <Card 
                key={item.id} 
                className="group cursor-pointer overflow-hidden border-primary/10 hover:border-primary/30 transition-all"
                onClick={() => setViewDialog({ isOpen: true, item })}
              >
                <div className="relative aspect-square">
                  <img
                    src={item.image_url}
                    alt={item.prompt}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-2">
                      <p className="text-white text-xs truncate">{item.prompt}</p>
                      <p className="text-white/70 text-xs">{formatDate(item.created_at)}</p>
                    </div>
                  </div>

                  {/* Type badge */}
                  <div className={cn(
                    "absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center",
                    item.image_type === 'generated' 
                      ? "bg-purple-500/90" 
                      : "bg-blue-500/90"
                  )}>
                    {item.image_type === 'generated' ? (
                      <Wand2 className="w-3 h-3 text-white" />
                    ) : (
                      <Eye className="w-3 h-3 text-white" />
                    )}
                  </div>
                </div>
                
                <CardContent className="p-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-5 h-5">
                      <AvatarImage src={item.profiles?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {getUserDisplay(item).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-foreground-muted truncate flex-1">
                      {getUserDisplay(item)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                {renderPaginationItems()}
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </main>

      {/* View Dialog */}
      <Dialog open={viewDialog.isOpen} onOpenChange={() => setViewDialog({ isOpen: false, item: null })}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden p-0">
          {viewDialog.item && (
            <div className="flex flex-col">
              {/* Image */}
              <div className="relative bg-black/5 max-h-[50vh] overflow-hidden">
                <img
                  src={viewDialog.item.image_url}
                  alt={viewDialog.item.prompt}
                  className="w-full h-full object-contain"
                />
              </div>
              
              {/* Info */}
              <div className="p-4 space-y-3 overflow-y-auto max-h-[40vh]">
                {/* User info */}
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={viewDialog.item.profiles?.avatar_url || undefined} />
                    <AvatarFallback>
                      {getUserDisplay(viewDialog.item).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{getUserDisplay(viewDialog.item)}</p>
                    <p className="text-xs text-foreground-muted">{formatFullDate(viewDialog.item.created_at)}</p>
                  </div>
                  <Link 
                    to={getProfilePath(viewDialog.item.user_id)}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Xem profile
                  </Link>
                </div>

                {/* Type and style */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1",
                    viewDialog.item.image_type === 'generated'
                      ? "bg-purple-100 text-purple-700"
                      : "bg-blue-100 text-blue-700"
                  )}>
                    {viewDialog.item.image_type === 'generated' ? (
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
                  {viewDialog.item.style && (
                    <span className="px-2 py-1 bg-divine-gold/20 text-divine-gold-dark rounded-full text-xs">
                      {viewDialog.item.style}
                    </span>
                  )}
                </div>
                
                {/* Prompt */}
                <div>
                  <p className="text-sm font-medium mb-1">Yêu cầu (Prompt):</p>
                  <p className="text-sm text-foreground-muted bg-muted/50 p-2 rounded">{viewDialog.item.prompt}</p>
                </div>
                
                {/* Response text for analyzed images */}
                {viewDialog.item.response_text && (
                  <div>
                    <p className="text-sm font-medium mb-1">Kết quả phân tích:</p>
                    <p className="text-sm text-foreground-muted whitespace-pre-wrap bg-muted/50 p-2 rounded max-h-32 overflow-y-auto">
                      {viewDialog.item.response_text}
                    </p>
                  </div>
                )}
                
                {/* User ID */}
                <div>
                  <p className="text-xs text-foreground-muted">User ID: <span className="font-mono">{viewDialog.item.user_id}</span></p>
                </div>
                
                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleDownload(viewDialog.item!.image_url, viewDialog.item!.prompt)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Tải xuống
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setViewDialog({ isOpen: false, item: null });
                      setDeleteDialog({ isOpen: true, itemId: viewDialog.item!.id });
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.isOpen} onOpenChange={(open) => !open && setDeleteDialog({ isOpen: false, itemId: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa hình ảnh này?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Hình ảnh sẽ bị xóa vĩnh viễn khỏi lịch sử.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deletingId ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminImageHistory;
