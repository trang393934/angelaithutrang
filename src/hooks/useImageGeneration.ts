import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface GeneratedImage {
  imageUrl: string;
  description: string;
  prompt: string;
}

export function useImageGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateImage = useCallback(async (prompt: string, style: "spiritual" | "realistic" | "artistic" = "spiritual") => {
    setIsGenerating(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("generate-image", {
        body: { prompt, style }
      });

      if (fnError) throw fnError;

      if (data.error) {
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
