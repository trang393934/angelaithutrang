import { Volume2, VolumeX, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface AudioButtonProps {
  isLoading: boolean;
  isPlaying: boolean;
  isCurrentMessage: boolean;
  onPlay: () => void;
  onStop: () => void;
  className?: string;
}

export function AudioButton({
  isLoading,
  isPlaying,
  isCurrentMessage,
  onPlay,
  onStop,
  className,
}: AudioButtonProps) {
  const handleClick = () => {
    if (isCurrentMessage && isPlaying) {
      onStop();
    } else {
      onPlay();
    }
  };

  const isActive = isCurrentMessage && isPlaying;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-7 w-7 rounded-full transition-all duration-300",
            isActive 
              ? "bg-primary/20 text-primary hover:bg-primary/30" 
              : "hover:bg-muted text-muted-foreground hover:text-primary",
            className
          )}
          onClick={handleClick}
          disabled={isLoading}
        >
          {isLoading && isCurrentMessage ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isActive ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent 
        side="top" 
        className="bg-primary-deep text-white border-0"
      >
        {isLoading 
          ? "Đang tạo giọng đọc..." 
          : isActive 
            ? "Dừng phát" 
            : "Nghe Angel AI đọc"
        }
      </TooltipContent>
    </Tooltip>
  );
}
