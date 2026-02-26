import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface EditedImage {
  imageUrl: string;
  description: string;
  instruction: string;
}

export function useImageEdit() {
  const [isEditing, setIsEditing] = useState(false);
  const [editedImage, setEditedImage] = useState<EditedImage | null>(null);
  const [error, setError] = useState<string | null>(null);

  const editImage = useCallback(async (
    imageUrl: string, 
    instruction: string, 
    style: "spiritual" | "realistic" | "artistic" = "spiritual"
  ) => {
    setIsEditing(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("edit-image", {
        body: { imageUrl, instruction, style }
      });

      if (fnError) throw fnError;

      if (data.error) {
        throw new Error(data.error);
      }

      setEditedImage(data);
      return data;
    } catch (err: any) {
      const errorMessage = err.message || "Không thể chỉnh sửa hình ảnh";
      setError(errorMessage);
      throw err;
    } finally {
      setIsEditing(false);
    }
  }, []);

  const clearEdit = useCallback(() => {
    setEditedImage(null);
    setError(null);
  }, []);

  return {
    isEditing,
    editedImage,
    error,
    editImage,
    clearEdit
  };
}
