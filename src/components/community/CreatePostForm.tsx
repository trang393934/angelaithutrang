import { useState, useRef } from "react";
import { Image, Send, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import angelAvatar from "@/assets/angel-avatar.png";

interface CreatePostFormProps {
  userAvatar?: string | null;
  userName?: string;
  onSubmit: (content: string, imageUrl?: string) => Promise<{ success: boolean; message: string }>;
}

export function CreatePostForm({ userAvatar, userName, onSubmit }: CreatePostFormProps) {
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Ảnh không được vượt quá 5MB");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `posts/${fileName}`;

      console.log("Uploading to community bucket:", filePath);

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from("community")
        .upload(filePath, file);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw uploadError;
      }

      console.log("Upload success:", uploadData);

      const { data: urlData } = supabase.storage
        .from("community")
        .getPublicUrl(filePath);

      console.log("Public URL:", urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && !imageFile) return;

    setIsSubmitting(true);
    try {
      let imageUrl: string | undefined;

      if (imageFile) {
        const url = await uploadImage(imageFile);
        if (url) {
          imageUrl = url;
          console.log("Image uploaded successfully:", imageUrl);
        } else {
          console.error("Failed to upload image");
        }
      }

      console.log("Submitting post with content:", content.trim(), "imageUrl:", imageUrl);
      const result = await onSubmit(content.trim(), imageUrl);

      if (result.success) {
        setContent("");
        removeImage();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-primary/10 bg-white/80 backdrop-blur-sm w-full max-w-full overflow-hidden">
      <CardContent className="p-3 sm:p-4">
        <div className="flex gap-2 sm:gap-3 min-w-0">
          <Avatar className="w-9 h-9 sm:w-10 sm:h-10 border-2 border-primary/20 shrink-0">
            <AvatarImage src={userAvatar || angelAvatar} alt={userName} />
            <AvatarFallback>{userName?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-3 min-w-0 overflow-hidden">
            <Textarea
              placeholder="Chia sẻ kiến thức, trải nghiệm của bạn về Angel AI, về Cha Vũ Trụ..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[80px] resize-none border-primary/20 focus:border-primary/40"
            />

            {imagePreview && (
              <div className="relative inline-block">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-48 rounded-lg object-cover"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  ref={fileInputRef}
                  className="hidden"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting || isUploading}
                  className="text-primary/70 hover:text-primary hover:bg-primary/10"
                >
                  <Image className="w-5 h-5 mr-1" />
                  Ảnh
                </Button>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={(!content.trim() && !imageFile) || isSubmitting || isUploading}
                className="bg-sapphire-gradient hover:opacity-90 shrink-0"
                size="sm"
              >
                {isSubmitting || isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin sm:mr-2" />
                ) : (
                  <Send className="w-4 h-4 sm:mr-2" />
                )}
                <span className="hidden sm:inline">Đăng</span>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
