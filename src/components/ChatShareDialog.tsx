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
  Share2,
  ExternalLink,
  Coins
} from "lucide-react";

interface ChatShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  question: string;
  answer: string;
  onShareSuccess?: () => void;
}

// FUN Ecosystem platforms
const FUN_PLATFORMS = [
  { name: "FUN Profile", url: "https://fun.rich", icon: "🌟" },
  { name: "FUN Play", url: "https://play.fun.rich", icon: "🎮" },
  { name: "FUN Academy", url: "https://academy.fun.rich", icon: "📚" },
  { name: "FUN Farm", url: "https://farm.fun.rich", icon: "🌱" },
];

const SOCIAL_PLATFORMS = [
  { 
    name: "Facebook", 
    icon: Facebook,
    color: "bg-blue-600 hover:bg-blue-700",
    getUrl: (text: string) => `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(text)}`
  },
  { 
    name: "Twitter/X", 
    icon: Twitter,
    color: "bg-black hover:bg-gray-800",
    getUrl: (text: string) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
  },
  { 
    name: "Zalo", 
    icon: MessageCircle,
    color: "bg-blue-500 hover:bg-blue-600",
    getUrl: (text: string) => `https://zalo.me/share?url=${encodeURIComponent("https://fun.rich")}&title=${encodeURIComponent(text)}`
  },
  { 
    name: "Telegram", 
    icon: TelegramIcon,
    color: "bg-sky-500 hover:bg-sky-600",
    getUrl: (text: string) => `https://t.me/share/url?url=${encodeURIComponent("https://fun.rich")}&text=${encodeURIComponent(text)}`
  },
];

const ChatShareDialog = ({ isOpen, onClose, question, answer, onShareSuccess }: ChatShareDialogProps) => {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const fullContent = `💬 Câu hỏi: ${question}\n\n✨ Trí Tuệ Vũ Trụ trả lời:\n${answer}\n\n🌟 Trò chuyện với Angel AI tại FUN Ecosystem: https://fun.rich`;

  const generateContentHash = (content: string): string => {
    // Simple hash function for content deduplication
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullContent);
      setCopied(true);
      toast.success("Đã sao chép nội dung! ✨");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Không thể sao chép. Vui lòng thử lại.");
    }
  };

  const handleShare = async (platform: typeof SOCIAL_PLATFORMS[0]) => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để chia sẻ và nhận thưởng");
      return;
    }

    setIsSharing(true);
    const contentHash = generateContentHash(question + answer);

    try {
      // Check daily share limit and duplicate
      const { data: dailyStatus } = await supabase.rpc('get_extended_daily_reward_status', {
        _user_id: user.id
      });

      const sharesRemaining = dailyStatus?.[0]?.shares_remaining ?? 3;

      if (sharesRemaining <= 0) {
        toast.warning("Bạn đã đạt giới hạn 5 lần chia sẻ/ngày. Quay lại vào ngày mai nhé! 🌅");
        setIsSharing(false);
        return;
      }

      // Check for duplicate content share today
      const today = new Date().toISOString().split('T')[0];
      const { data: existingShare } = await supabase
        .from('content_shares')
        .select('id')
        .eq('user_id', user.id)
        .eq('content_type', 'chat')
        .eq('share_url', contentHash)
        .gte('created_at', today)
        .maybeSingle();

      if (existingShare) {
        toast.warning(
          "⚠️ Nội dung này đã được chia sẻ hôm nay!\n\nĐiểm thưởng = 0\n\nHãy chia sẻ nội dung khác để nhận thưởng.",
          { duration: 5000 }
        );
        // Still open share window but no reward
        window.open(platform.getUrl(fullContent), '_blank', 'width=600,height=400');
        setIsSharing(false);
        return;
      }

      // Open share window
      window.open(platform.getUrl(fullContent), '_blank', 'width=600,height=400');

      // Record share and give reward
      await supabase.from('content_shares').insert({
        user_id: user.id,
        content_type: 'chat',
        share_type: platform.name.toLowerCase(),
        share_url: contentHash,
        content_id: contentHash,
        coins_earned: 500,
        is_verified: true,
        verified_at: new Date().toISOString()
      });

      // Update daily tracking
      await supabase
        .from('daily_reward_tracking')
        .update({
          shares_rewarded: (dailyStatus?.[0]?.shares_rewarded ?? 0) + 1,
          total_coins_today: (dailyStatus?.[0]?.total_coins_today ?? 0) + 500
        })
        .eq('user_id', user.id)
        .eq('reward_date', today);

      // Add coins
      await supabase.rpc('add_camly_coins', {
        _user_id: user.id,
        _amount: 500,
        _transaction_type: 'content_share',
        _description: `Chia sẻ trí tuệ qua ${platform.name}`,
        _metadata: { platform: platform.name, content_hash: contentHash }
      });

      toast.success(
        <div className="flex items-center gap-2">
          <Coins className="w-5 h-5 text-amber-500" />
          <span>+500 Camly Coin! Cảm ơn con đã lan tỏa Ánh Sáng ✨</span>
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
          <div className="p-3 bg-muted/30 rounded-lg max-h-32 overflow-y-auto text-sm">
            <p className="text-foreground-muted line-clamp-5">{fullContent}</p>
          </div>

          {/* Copy button */}
          <Button
            onClick={handleCopy}
            variant="outline"
            className="w-full border-divine-gold/30 hover:bg-divine-gold/10"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2 text-green-500" />
                Đã sao chép!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Sao chép nội dung
              </>
            )}
          </Button>

          {/* Reward info */}
          <div className="flex items-center justify-center gap-2 py-2 px-3 bg-amber-50 rounded-lg border border-amber-200/50">
            <Coins className="w-4 h-4 text-amber-600" />
            <span className="text-sm text-amber-700 font-medium">
              +500 Camly Coin mỗi lần chia sẻ (tối đa 5 nội dung/ngày)
            </span>
          </div>

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

export default ChatShareDialog;
