import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UseTextToSpeechReturn {
  isLoading: boolean;
  isPlaying: boolean;
  currentMessageId: string | null;
  playText: (text: string, messageId: string) => Promise<void>;
  stopAudio: () => void;
  togglePlayPause: () => void;
}

export function useTextToSpeech(): UseTextToSpeechReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMessageId, setCurrentMessageId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const cleanupAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setIsPlaying(false);
    setCurrentMessageId(null);
  }, []);

  const stopAudio = useCallback(() => {
    cleanupAudio();
  }, [cleanupAudio]);

  const playText = useCallback(async (text: string, messageId: string) => {
    // If same message is playing, toggle pause/play
    if (currentMessageId === messageId && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
      return;
    }

    // Stop any existing audio
    cleanupAudio();

    setIsLoading(true);
    setCurrentMessageId(messageId);

    try {
      // Strip markdown and clean text for TTS
      const cleanText = text
        .replace(/\*\*([^*]+)\*\*/g, "$1") // Bold
        .replace(/\*([^*]+)\*/g, "$1") // Italic
        .replace(/#{1,6}\s/g, "") // Headers
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Links
        .replace(/```[\s\S]*?```/g, "") // Code blocks
        .replace(/`([^`]+)`/g, "$1") // Inline code
        .replace(/>\s/g, "") // Blockquotes
        .replace(/-{3,}/g, "") // Horizontal rules
        .replace(/\n{3,}/g, "\n\n") // Multiple newlines
        .trim();

      if (!cleanText) {
        toast.error("Không có nội dung để đọc");
        return;
      }

      // Get Supabase URL from env
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(
        `${supabaseUrl}/functions/v1/elevenlabs-tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({ text: cleanText }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `TTS failed: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      audioUrlRef.current = audioUrl;

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
        setCurrentMessageId(null);
      };

      audio.onerror = () => {
        toast.error("Lỗi phát audio");
        cleanupAudio();
      };

      await audio.play();
      setIsPlaying(true);
    } catch (error: any) {
      console.error("TTS Error:", error);
      toast.error(error.message || "Không thể tạo giọng đọc");
      cleanupAudio();
    } finally {
      setIsLoading(false);
    }
  }, [currentMessageId, isPlaying, cleanupAudio]);

  const togglePlayPause = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  }, [isPlaying]);

  return {
    isLoading,
    isPlaying,
    currentMessageId,
    playText,
    stopAudio,
    togglePlayPause,
  };
}
