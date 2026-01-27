import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, Video, Info, Home } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { motion } from "framer-motion";
import angelAvatar from "@/assets/angel-avatar.png";

interface ConversationHeaderProps {
  partnerId: string;
  partnerProfile: {
    display_name: string;
    avatar_url: string | null;
  } | null;
  isOnline: boolean;
  lastSeen?: string | null;
  isTyping?: boolean;
}

export function ConversationHeader({
  partnerId,
  partnerProfile,
  isOnline,
  lastSeen,
  isTyping,
}: ConversationHeaderProps) {
  const navigate = useNavigate();
  const getStatusText = () => {
    if (isTyping) return "Đang nhập...";
    if (isOnline) return "Đang hoạt động";
    if (lastSeen) {
      return `Hoạt động ${formatDistanceToNow(new Date(lastSeen), { addSuffix: true, locale: vi })}`;
    }
    return "Offline";
  };

  return (
    <header className="sticky top-0 z-50 bg-background-pure/95 backdrop-blur-lg border-b border-primary-pale shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => navigate("/")}
                  className="p-2 -ml-2 rounded-full hover:bg-primary-pale hover:scale-110 active:scale-95 transition-all duration-300 group"
                >
                  <Home className="w-5 h-5 text-primary group-hover:text-primary-deep group-hover:rotate-[-8deg] transition-all duration-300" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-primary-deep text-white">
                <p>Về trang chủ</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to="/messages"
                  className="p-2 -ml-2 rounded-full hover:bg-primary-pale hover:scale-110 active:scale-95 transition-all duration-300 group"
                >
                  <ArrowLeft className="w-5 h-5 text-primary group-hover:text-primary-deep group-hover:-translate-x-0.5 transition-all duration-300" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-primary-deep text-white">
                <p>Quay lại tin nhắn</p>
              </TooltipContent>
            </Tooltip>

            <Link
              to={`/user/${partnerId}`}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="relative">
                <Avatar className="w-10 h-10 ring-2 ring-background-pure">
                  <AvatarImage src={partnerProfile?.avatar_url || angelAvatar} />
                  <AvatarFallback>
                    {partnerProfile?.display_name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                {/* Online indicator */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background-pure ${
                    isOnline ? "bg-green-500" : "bg-gray-400"
                  }`}
                />
              </div>

              <div className="flex flex-col">
                <span className="font-semibold text-foreground leading-tight">
                  {partnerProfile?.display_name || "Người dùng"}
                </span>
                <motion.span
                  key={getStatusText()}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`text-xs ${isTyping ? "text-primary font-medium" : "text-foreground-muted"}`}
                >
                  {getStatusText()}
                </motion.span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full text-primary hover:bg-primary/10"
              disabled
            >
              <Phone className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full text-primary hover:bg-primary/10"
              disabled
            >
              <Video className="w-5 h-5" />
            </Button>
            <Link to={`/user/${partnerId}`}>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full text-primary hover:bg-primary/10"
              >
                <Info className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
