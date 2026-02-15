import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface GeneratedImage {
  imageUrl: string;
  description: string;
  prompt: string;
  mode?: "fast" | "spiritual";
}

export type ImageGenerationMode = "fast" | "spiritual";

export type ImageSize = "square" | "landscape" | "portrait" | "wide";

export const IMAGE_SIZE_OPTIONS: Record<ImageSize, { width: number; height: number; label: string; icon: string }> = {
  square: { width: 1024, height: 1024, label: "1:1", icon: "⬜" },
  landscape: { width: 1344, height: 768, label: "16:9", icon: "🖼️" },
  portrait: { width: 768, height: 1344, label: "9:16", icon: "📱" },
  wide: { width: 1536, height: 640, label: "21:9", icon: "🎬" },
};

export function useImageGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateImage = useCallback(async (
    prompt: string,
    style: "spiritual" | "realistic" | "artistic" = "spiritual",
    mode: ImageGenerationMode = "fast",
    size: ImageSize = "square"
  ) => {
    setIsGenerating(true);
    setError(null);

    const sizeConfig = IMAGE_SIZE_OPTIONS[size];

    try {
      const { data, error: fnError } = await supabase.functions.invoke("generate-image", {
        body: { prompt, style, mode, image_width: sizeConfig.width, image_height: sizeConfig.height }
      });

      if (fnError) {
        const errMsg = typeof fnError === 'object' && fnError.message ? fnError.message : String(fnError);
        throw new Error(errMsg);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setGeneratedImage(data);
      return data;
    } catch (err: any) {
      const errorMessage = err.message || "Không thể tạo hình ảnh";
      setError(errorMessage);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const clearImage = useCallback(() => {
    setGeneratedImage(null);
    setError(null);
  }, []);

  return {
    isGenerating,
    generatedImage,
    error,
    generateImage,
    clearImage
  };
}
