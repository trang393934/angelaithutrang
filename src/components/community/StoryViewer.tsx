import { useState, useEffect, useRef } from "react";
import { X, ChevronLeft, ChevronRight, Trash2, Eye, Pause, Play } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { GroupedStories, Story } from "@/hooks/useStories";
import angelAvatar from "@/assets/angel-avatar.png";

interface StoryViewerProps {
  groupedStories: GroupedStories[];
  initialGroupIndex: number;
  currentUserId?: string;
  viewedStoryIds: Set<string>;
  onClose: () => void;
  onViewed: (storyId: string) => void;
  onDelete: (storyId: string) => Promise<{ success: boolean }>;
}

const STORY_DURATION = 5000; // 5 seconds per story

export function StoryViewer({
  groupedStories,
  initialGroupIndex,
  currentUserId,
  viewedStoryIds,
  onClose,
  onViewed,
  onDelete,
}: StoryViewerProps) {
  const [currentGroupIndex, setCurrentGroupIndex] = useState(initialGroupIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const pausedProgressRef = useRef<number>(0);

  const currentGroup = groupedStories[currentGroupIndex];
  const currentStory = currentGroup?.stories[currentStoryIndex];

  // Mark story as viewed
  useEffect(() => {
    if (currentStory && !viewedStoryIds.has(currentStory.id)) {
      onViewed(currentStory.id);
    }
  }, [currentStory?.id]);

  // Story timer
  useEffect(() => {
    if (isPaused || !currentStory) return;

    startTimeRef.current = Date.now();
    const startProgress = pausedProgressRef.current;

    const duration = currentStory.media_type === "video" ? 15000 : STORY_DURATION;
    const remainingDuration = duration * (1 - startProgress);

    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const newProgress = startProgress + (elapsed / duration);
      
      if (newProgress >= 1) {
        goToNextStory();
      } else {
        setProgress(newProgress);
        timerRef.current = setTimeout(animate, 50);
      }
    };

    timerRef.current = setTimeout(animate, 50);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [currentGroupIndex, currentStoryIndex, isPaused, currentStory]);

  const goToNextStory = () => {
    pausedProgressRef.current = 0;
    setProgress(0);

    if (currentStoryIndex < currentGroup.stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
    } else if (currentGroupIndex < groupedStories.length - 1) {
      setCurrentGroupIndex(prev => prev + 1);
      setCurrentStoryIndex(0);
    } else {
      onClose();
    }
  };

  const goToPrevStory = () => {
    pausedProgressRef.current = 0;
    setProgress(0);

    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
    } else if (currentGroupIndex > 0) {
      setCurrentGroupIndex(prev => prev - 1);
      const prevGroup = groupedStories[currentGroupIndex - 1];
      setCurrentStoryIndex(prevGroup.stories.length - 1);
    }
  };

  const handlePause = () => {
    pausedProgressRef.current = progress;
    setIsPaused(true);
  };

  const handleResume = () => {
    setIsPaused(false);
  };

  const handleDelete = async () => {
    if (!currentStory || isDeleting) return;
    
    setIsDeleting(true);
    const result = await onDelete(currentStory.id);
    setIsDeleting(false);

    if (result.success) {
      // Move to next story or close
      if (currentGroup.stories.length <= 1) {
        if (groupedStories.length <= 1) {
          onClose();
        } else {
          goToNextStory();
        }
      } else {
        // Story will be removed, stay at same index
        setProgress(0);
        pausedProgressRef.current = 0;
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft") goToPrevStory();
    if (e.key === "ArrowRight") goToNextStory();
    if (e.key === "Escape") onClose();
    if (e.key === " ") {
      e.preventDefault();
      isPaused ? handleResume() : handlePause();
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPaused, currentGroupIndex, currentStoryIndex]);

  if (!currentStory || !currentGroup) return null;

  const isOwner = currentUserId === currentStory.user_id;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 z-20 text-white hover:bg-white/20"
        onClick={onClose}
      >
        <X className="w-6 h-6" />
      </Button>

      {/* Navigation arrows */}
      {(currentGroupIndex > 0 || currentStoryIndex > 0) && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 text-white hover:bg-white/20"
          onClick={goToPrevStory}
        >
          <ChevronLeft className="w-8 h-8" />
        </Button>
      )}

      {(currentGroupIndex < groupedStories.length - 1 || 
        currentStoryIndex < currentGroup.stories.length - 1) && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 text-white hover:bg-white/20"
          onClick={goToNextStory}
        >
          <ChevronRight className="w-8 h-8" />
        </Button>
      )}

      {/* Story content */}
      <div className="relative w-full max-w-md h-full max-h-[90vh] bg-black rounded-xl overflow-hidden">
        {/* Progress bars */}
        <div className="absolute top-2 left-2 right-2 z-10 flex gap-1">
          {currentGroup.stories.map((story, index) => (
            <div
              key={story.id}
              className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
            >
              <div
                className="h-full bg-white transition-all duration-100 ease-linear"
                style={{
                  width: `${
                    index < currentStoryIndex
                      ? 100
                      : index === currentStoryIndex
                      ? progress * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-6 left-2 right-2 z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 ring-2 ring-white">
              <AvatarImage src={currentGroup.avatar_url || angelAvatar} />
              <AvatarFallback>{currentGroup.display_name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-white font-medium text-sm">{currentGroup.display_name}</p>
              <p className="text-white/70 text-xs">
                {formatDistanceToNow(new Date(currentStory.created_at), {
                  addSuffix: true,
                  locale: vi,
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={isPaused ? handleResume : handlePause}
            >
              {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
            </Button>

            {isOwner && (
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-red-500/50"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Media */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStory.id}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full flex items-center justify-center"
          >
            {currentStory.media_type === "video" ? (
              <video
                src={currentStory.media_url}
                className="w-full h-full object-contain"
                autoPlay
                muted
                playsInline
                onPause={handlePause}
                onPlay={handleResume}
              />
            ) : (
              <img
                src={currentStory.media_url}
                alt="Story"
                className="w-full h-full object-contain"
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Caption */}
        {currentStory.caption && (
          <div className="absolute bottom-4 left-4 right-4 z-10">
            <p className="text-white text-center text-sm bg-black/50 rounded-lg px-4 py-2">
              {currentStory.caption}
            </p>
          </div>
        )}

        {/* Views count for owner */}
        {isOwner && (
          <div className="absolute bottom-16 left-4 z-10 flex items-center gap-1 text-white/70 text-sm">
            <Eye className="w-4 h-4" />
            <span>{currentStory.views_count} lượt xem</span>
          </div>
        )}

        {/* Click zones for navigation */}
        <div
          className="absolute inset-y-0 left-0 w-1/3 z-5"
          onClick={goToPrevStory}
        />
        <div
          className="absolute inset-y-0 right-0 w-1/3 z-5"
          onClick={goToNextStory}
        />
      </div>
    </motion.div>
  );
}
