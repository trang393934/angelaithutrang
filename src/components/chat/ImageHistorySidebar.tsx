import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Image, Wand2, Eye, X, Download, Trash2, Clock, Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { ImageHistoryItem } from "@/hooks/useImageHistory";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ImageHistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  history: ImageHistoryItem[];
  isLoading: boolean;
  onDelete: (id: string) => Promise<boolean>;
}

export function ImageHistorySidebar({
  isOpen,
  onClose,
  history,
  isLoading,
  onDelete,
}: ImageHistorySidebarProps) {
  const [filter, setFilter] = useState<'all' | 'generated' | 'analyzed'>('all');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedImage, setSelectedImage] = useState<ImageHistoryItem | null>(null);

  const filteredHistory = history.filter(item => {
    const matchesFilter = filter === 'all' || item.image_type === filter;
    const matchesSearch = searchQuery === "" || 
      item.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.response_text?.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const handleDownload = (imageUrl: string, prompt: string) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `angel-ai-${prompt.slice(0, 20).replace(/\s+/g, '-')}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Đang tải xuống...");
  };

  const handleDelete = async (id: string) => {
    const success = await onDelete(id);
    if (success) {
      toast.success("Đã xóa hình ảnh");
      if (selectedImage?.id === id) {
        setSelectedImage(null);
      }
    }
  };

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
                <Image className="w-5 h-5 text-divine-gold" />
                Kho hình ảnh
              </h2>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Search */}
            <div className="p-3 border-b border-primary-pale">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
                <Input
                  placeholder="Tìm kiếm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="p-3 border-b border-primary-pale">
              <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
                <TabsList className="w-full">
                  <TabsTrigger value="all" className="flex-1 text-xs">
                    Tất cả
                  </TabsTrigger>
                  <TabsTrigger value="generated" className="flex-1 text-xs">
                    <Wand2 className="w-3 h-3 mr-1" />
                    Tạo ảnh
                  </TabsTrigger>
                  <TabsTrigger value="analyzed" className="flex-1 text-xs">
                    <Eye className="w-3 h-3 mr-1" />
                    Phân tích
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Image Grid */}
            <ScrollArea className="flex-1">
              <div className="p-3">
                {isLoading ? (
                  <div className="text-center py-8 text-foreground-muted">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm">Đang tải...</p>
                  </div>
                ) : filteredHistory.length === 0 ? (
                  <div className="text-center py-8 text-foreground-muted">
                    <Image className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">
                      {searchQuery ? "Không tìm thấy hình ảnh" : "Chưa có hình ảnh nào"}
                    </p>
                    <p className="text-xs mt-1">
                      Tạo ảnh hoặc phân tích ảnh để lưu vào đây
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {filteredHistory.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative group cursor-pointer rounded-lg overflow-hidden border border-primary-pale hover:border-divine-gold transition-all"
                        onClick={() => setSelectedImage(item)}
                      >
                        <div className="aspect-square">
                          <img
                            src={item.image_url}
                            alt={item.prompt}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute bottom-0 left-0 right-0 p-2">
                            <div className="flex items-center gap-1 text-white text-xs mb-1">
                              {item.image_type === 'generated' ? (
                                <Wand2 className="w-3 h-3" />
                              ) : (
                                <Eye className="w-3 h-3" />
                              )}
                              <span className="truncate">{item.prompt.slice(0, 30)}...</span>
                            </div>
                            <div className="flex items-center gap-1 text-white/70 text-xs">
                              <Clock className="w-3 h-3" />
                              {formatDistanceToNow(new Date(item.created_at), {
                                addSuffix: true,
                                locale: vi,
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Type badge */}
                        <div className={cn(
                          "absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center",
                          item.image_type === 'generated' 
                            ? "bg-purple-500/80" 
                            : "bg-blue-500/80"
                        )}>
                          {item.image_type === 'generated' ? (
                            <Wand2 className="w-3 h-3 text-white" />
                          ) : (
                            <Eye className="w-3 h-3 text-white" />
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Stats */}
            {history.length > 0 && (
              <div className="p-3 border-t border-primary-pale bg-primary/5">
                <div className="flex items-center justify-between text-xs text-foreground-muted">
                  <span>
                    {history.filter(h => h.image_type === 'generated').length} ảnh tạo
                  </span>
                  <span>•</span>
                  <span>
                    {history.filter(h => h.image_type === 'analyzed').length} ảnh phân tích
                  </span>
                </div>
              </div>
            )}
          </motion.div>

          {/* Image Detail Dialog */}
          <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden p-0">
              {selectedImage && (
                <div className="flex flex-col">
                  {/* Image */}
                  <div className="relative bg-black/5 max-h-[60vh] overflow-hidden">
                    <img
                      src={selectedImage.image_url}
                      alt={selectedImage.prompt}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  
                  {/* Info */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1",
                        selectedImage.image_type === 'generated'
                          ? "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700"
                      )}>
                        {selectedImage.image_type === 'generated' ? (
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
                      {selectedImage.style && (
                        <span className="px-2 py-1 bg-divine-gold/20 text-divine-gold-dark rounded-full text-xs">
                          {selectedImage.style}
                        </span>
                      )}
                      <span className="text-xs text-foreground-muted ml-auto">
                        {formatDistanceToNow(new Date(selectedImage.created_at), {
                          addSuffix: true,
                          locale: vi,
                        })}
                      </span>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium mb-1">Yêu cầu:</p>
                      <p className="text-sm text-foreground-muted">{selectedImage.prompt}</p>
                    </div>
                    
                    {selectedImage.response_text && (
                      <div>
                        <p className="text-sm font-medium mb-1">Kết quả phân tích:</p>
                        <p className="text-sm text-foreground-muted whitespace-pre-wrap max-h-32 overflow-y-auto">
                          {selectedImage.response_text}
                        </p>
                      </div>
                    )}
                    
                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleDownload(selectedImage.image_url, selectedImage.prompt)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Tải xuống
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(selectedImage.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </>
      )}
    </AnimatePresence>
  );
}
