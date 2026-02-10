import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MoreHorizontal, Users, Flag, Heart, Ban, Search,
  UserPlus, Share2, Copy, Check, Link as LinkIcon, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

interface ProfileMoreMenuProps {
  userId: string;
  displayName: string | null;
  handle: string | null;
  isOwnProfile?: boolean;
}

export function ProfileMoreMenu({ userId, displayName, handle, isOwnProfile }: ProfileMoreMenuProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [showLink, setShowLink] = useState(false);
  const [copied, setCopied] = useState(false);

  const profileUrl = handle
    ? `${window.location.origin}/@${handle}`
    : `${window.location.origin}/user/${userId}`;

  const name = displayName || "Người dùng";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      toast.success("Đã sao chép liên kết!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Không thể sao chép");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${name} | FUN Profile`,
          text: `Xem trang cá nhân của ${name}`,
          url: profileUrl,
        });
      } catch {}
    } else {
      handleCopyLink();
    }
    setOpen(false);
  };

  const menuItems = [
    {
      icon: Users,
      label: "Xem quan hệ bạn bè",
      onClick: () => { setOpen(false); navigate(`/user/${userId}?tab=friends`); },
    },
    ...(!isOwnProfile ? [
      {
        icon: Flag,
        label: "Báo cáo trang cá nhân",
        onClick: () => { setOpen(false); toast.info("Tính năng báo cáo sẽ sớm ra mắt"); },
      },
      {
        icon: Heart,
        label: `Giúp ${name.split(" ").pop()}`,
        onClick: () => { setOpen(false); toast.info("Tính năng hỗ trợ sẽ sớm ra mắt"); },
      },
      {
        icon: Ban,
        label: "Chặn",
        onClick: () => { setOpen(false); toast.info("Tính năng chặn sẽ sớm ra mắt"); },
      },
    ] : []),
    {
      icon: Search,
      label: "Tìm kiếm",
      onClick: () => { setOpen(false); navigate("/community?search=1"); },
    },
    {
      icon: UserPlus,
      label: "Mời bạn bè",
      onClick: handleShare,
    },
    {
      icon: Share2,
      label: "Chia sẻ trang cá nhân",
      onClick: () => setShowLink(true),
    },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full bg-muted/80 hover:bg-muted h-9 w-9"
        >
          <MoreHorizontal className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl px-0 pb-8 max-h-[85vh]">
        <SheetHeader className="px-4 pb-2 border-b">
          <SheetTitle className="text-center text-base font-semibold">
            {name}
          </SheetTitle>
        </SheetHeader>

        {!showLink ? (
          <div className="divide-y divide-border">
            {menuItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <button
                  key={i}
                  onClick={item.onClick}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-muted/50 transition-colors text-left"
                >
                  <Icon className="w-6 h-6 text-foreground/80" />
                  <span className="text-[15px] text-foreground">{item.label}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="px-5 pt-4 space-y-4">
            <button onClick={() => setShowLink(false)} className="text-muted-foreground">
              <X className="w-5 h-5" />
            </button>
            <div>
              <h3 className="text-lg font-bold text-foreground">
                Liên kết đến trang cá nhân của {name}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Liên kết riêng của {name} trên FUN Ecosystem.
              </p>
            </div>
            <div className="bg-muted rounded-lg px-4 py-3">
              <p className="text-sm text-foreground break-all font-mono">{profileUrl}</p>
            </div>
            <Button
              onClick={handleCopyLink}
              variant="outline"
              className="w-full h-12 text-[15px] font-semibold"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2 text-green-600" />
                  Đã sao chép
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Sao chép liên kết
                </>
              )}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
