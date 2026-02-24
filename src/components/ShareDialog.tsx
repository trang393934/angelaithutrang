import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  Copy, 
  Check, 
  Facebook, 
  Twitter, 
  MessageCircle, 
  Send as TelegramIcon,
  Link as LinkIcon,
  FileText,
  Coins,
  ExternalLink
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  // Content info
  contentType: 'chat' | 'post' | 'document' | 'question';
  contentId?: string;
  title?: string;
  content: string;
  shareUrl?: string; // Optional custom URL, defaults to current page
  onShareSuccess?: () => void;
  // Reward settings
  showRewards?: boolean;
  rewardAmount?: number;
}

// FUN Ecosystem platforms - 10 official links
const FUN_PLATFORMS = [
  { name: "FUN Profile", url: "https://fun.rich", icon: "🌟" },
  { name: "FUN Farm", url: "https://farm.fun.rich", icon: "🌱" },
  { name: "FUN Charity", url: "https://charity.fun.rich", icon: "💖" },
  { name: "FUN Academy", url: "https://academy.fun.rich", icon: "📚" },
  { name: "FUN Play", url: "https://play.fun.rich", icon: "🎮" },
  { name: "FUN Planet", url: "https://planet.fun.rich", icon: "🪐" },
  { name: "FUN Wallet", url: "https://wallet.fun.rich", icon: "💰" },
  { name: "FUN Treasury", url: "https://treasury.fun.rich", icon: "🏦" },
  { name: "Green Earth", url: "https://greenearth-fun.lovable.app", icon: "🌍" },
  { name: "Camly Coin", url: "https://camly.co", icon: "💎" },
];

// Social platforms with fixed Telegram URL format
const SOCIAL_PLATFORMS = [
  { 
    name: "Facebook", 
    icon: Facebook,
    color: "bg-blue-600 hover:bg-blue-700",
    // Facebook uses 'u' for URL and 'quote' for text
    getUrl: (url: string, text: string) => 
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`
  },
  { 
    name: "Twitter/X", 
    icon: Twitter,
    color: "bg-black hover:bg-gray-800",
    getUrl: (url: string, text: string) => 
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
  },
  { 
    name: "Zalo", 
    icon: MessageCircle,
    color: "bg-blue-500 hover:bg-blue-600",
    getUrl: (url: string, text: string) => 
      `https://zalo.me/share?u=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`
  },
  { 
    name: "Telegram", 
    icon: TelegramIcon,
    color: "bg-sky-500 hover:bg-sky-600",
    // Fixed: Telegram requires url parameter, text is optional
    getUrl: (url: string, text: string) => 
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
  },
];

const ShareDialog = ({ 
  isOpen, 
  onClose, 
  contentType,
  contentId,
  title,
  content, 
  shareUrl,
  onShareSuccess,
  showRewards = true,
  rewardAmount = 500
}: ShareDialogProps) => {
  const { user } = useAuth();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedContent, setCopiedContent] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // Generate share URL
  const getShareUrl = () => {
    if (shareUrl) return shareUrl;
    
    // Default to current origin with content reference
    const baseUrl = "https://angel.fun.rich";
    switch (contentType) {
      case 'post':
        return `${baseUrl}/community?post=${contentId}`;
      case 'document':
        return `${baseUrl}/knowledge?doc=${contentId}`;
      case 'question':
        return `${baseUrl}/community-questions?q=${contentId}`;
      case 'chat':
      default:
        return baseUrl;
    }
  };

  // Format content for sharing
  const getShareContent = () => {
    const url = getShareUrl();
    const appName = "Angel AI - FUN Ecosystem";
    
    if (title) {
      return `${title}\n\n${content}\n\n🌟 ${appName}: ${url}`;
    }
    return `${content}\n\n🌟 ${appName}: ${url}`;
  };

  const generateContentHash = (text: string): string => {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  };

  // Copy link only
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      setCopiedLink(true);
      toast.success("Đã sao chép liên kết! 🔗");
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (error) {
      toast.error("Không thể sao chép. Vui lòng thử lại.");
    }
  };

  // Copy full content (for paste into other apps)
  const handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(getShareContent());
      setCopiedContent(true);
      toast.success("Đã sao chép nội dung! ✨ Chỉ cần paste vào trang đích.");
      setTimeout(() => setCopiedContent(false), 2000);
    } catch (error) {
      toast.error("Không thể sao chép. Vui lòng thử lại.");
    }
  };

  // Share to social platform - now uses server-side reward processing
  const handleShare = async (platform: typeof SOCIAL_PLATFORMS[0]) => {
    const url = getShareUrl();
    const text = title || content.substring(0, 200);
    
    // Always open share window first
    window.open(
      platform.getUrl(url, text), 
      '_blank', 
      'width=600,height=500,scrollbars=yes'
    );

    // If no user or rewards disabled, just share without tracking
    if (!user || !showRewards) {
      toast.success(`Đang chia sẻ qua ${platform.name}...`);
      return;
    }

    setIsSharing(true);
    const contentHash = generateContentHash(content);

    try {
      // Call server-side edge function for secure reward processing
      const { data, error } = await supabase.functions.invoke('process-share-reward', {
        body: {
          contentType,
          contentId: contentId || contentHash,
          contentHash,
          platform: platform.name,
          rewardAmount // Server will validate and use its own fixed amount
        }
      });

      if (error) {
        console.error("Share reward error:", error);
        toast.error("Có lỗi xảy ra. Vui lòng thử lại.");
        setIsSharing(false);
        return;
      }

      if (!data.success) {
        if (data.error === 'daily_limit_reached') {
          toast.warning(data.message);
        } else if (data.error === 'duplicate_content') {
          toast.warning(data.message, { duration: 4000 });
        } else {
          toast.error(data.message || "Có lỗi xảy ra. Vui lòng thử lại.");
        }
        setIsSharing(false);
        return;
      }

      // Success - show reward notification
      toast.success(
        <div className="flex items-center gap-2">
          <Coins className="w-5 h-5 text-amber-500" />
          <span>{data.message}</span>
        </div>
      );

      onShareSuccess?.();
      onClose();
    } catch (error) {
      console.error("Share error:", error);
      toast.error("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-card border-divine-gold/20">
        <DialogHeader>
          <DialogTitle className="text-center bg-gradient-to-r from-divine-gold via-divine-light to-divine-gold bg-clip-text text-transparent">
            ✨ Chia Sẻ Ánh Sáng ✨
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview */}
          <div className="p-3 bg-muted/30 rounded-lg max-h-24 overflow-y-auto text-sm">
            {title && <p className="font-medium text-foreground mb-1">{title}</p>}
            <p className="text-foreground-muted line-clamp-3">{content}</p>
          </div>

          {/* Copy Options Tabs */}
          <Tabs defaultValue="content" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="content" className="text-sm">
                <FileText className="w-4 h-4 mr-1" />
                Sao chép nội dung
              </TabsTrigger>
              <TabsTrigger value="link" className="text-sm">
                <LinkIcon className="w-4 h-4 mr-1" />
                Sao chép liên kết
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="content" className="mt-3 space-y-2">
              <p className="text-xs text-foreground-muted">
                Sao chép nội dung đầy đủ để paste vào bất kỳ trang nào
              </p>
              <Button
                onClick={handleCopyContent}
                variant="outline"
                className="w-full border-divine-gold/30 hover:bg-divine-gold/10"
              >
                {copiedContent ? (
                  <>
                    <Check className="w-4 h-4 mr-2 text-green-500" />
                    Đã sao chép! Chỉ cần paste
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Sao chép để paste
                  </>
                )}
              </Button>
            </TabsContent>
            
            <TabsContent value="link" className="mt-3 space-y-2">
              <p className="text-xs text-foreground-muted">
                Sao chép liên kết ngắn gọn
              </p>
              <div className="flex gap-2">
                <div className="flex-1 px-3 py-2 bg-muted/50 rounded-md text-sm text-foreground-muted truncate">
                  {getShareUrl()}
                </div>
                <Button
                  onClick={handleCopyLink}
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                >
                  {copiedLink ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {/* Reward info */}
          {showRewards && (
            <div className="flex items-center justify-center gap-2 py-2 px-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200/50 dark:border-amber-700/30">
              <Coins className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-sm text-amber-700 dark:text-amber-300 font-medium">
                +{rewardAmount} Camly Coin khi chia sẻ qua mạng xã hội
              </span>
            </div>
          )}

          {/* Social platforms */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground-muted">Chia sẻ qua mạng xã hội:</p>
            <div className="grid grid-cols-2 gap-2">
              {SOCIAL_PLATFORMS.map((platform) => (
                <Button
                  key={platform.name}
                  onClick={() => handleShare(platform)}
                  disabled={isSharing}
                  className={`${platform.color} text-white`}
                >
                  <platform.icon className="w-4 h-4 mr-2" />
                  {platform.name}
                </Button>
              ))}
            </div>
          </div>

          {/* FUN Platforms */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground-muted">Khám phá FUN Ecosystem:</p>
            <div className="grid grid-cols-2 gap-2">
              {FUN_PLATFORMS.map((platform) => (
                <a
                  key={platform.name}
                  href={platform.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-primary-pale/50 rounded-lg hover:bg-primary-pale transition-colors text-sm"
                >
                  <span>{platform.icon}</span>
                  <span className="flex-1">{platform.name}</span>
                  <ExternalLink className="w-3 h-3 text-muted-foreground" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog;
