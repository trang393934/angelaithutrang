import { useState, useRef, useEffect } from "react";
import { Image, Send, X, Loader2, Plus, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import angelAvatar from "@/assets/angel-avatar.png";
import { motion, AnimatePresence } from "framer-motion";

const MAX_IMAGES = 30;

interface CollapsibleCreatePostProps {
  userAvatar?: string | null;
  userName?: string;
  onSubmit: (content: string, imageUrls?: string[]) => Promise<{ success: boolean; message: string }>;
}

export function CollapsibleCreatePost({ userAvatar, userName, onSubmit }: CollapsibleCreatePostProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus textarea when expanded
  useEffect(() => {
    if (isExpanded && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isExpanded]);

  // Close on click outside (only if no content)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node) &&
        !content.trim() &&
        imageFiles.length === 0 &&
        !isSubmitting &&
        !isUploading
      ) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isExpanded, content, imageFiles.length, isSubmitting, isUploading]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = MAX_IMAGES - imageFiles.length;
    if (files.length > remainingSlots) {
      alert(`Bạn chỉ có thể tải thêm ${remainingSlots} ảnh nữa (tối đa ${MAX_IMAGES} ảnh)`);
      return;
    }

    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    files.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`Ảnh "${file.name}" vượt quá 5MB`);
        return;
      }
      validFiles.push(file);
    });

    if (validFiles.length === 0) return;

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        newPreviews.push(reader.result as string);
        if (newPreviews.length === validFiles.length) {
          setImagePreviews((prev) => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });

    setImageFiles((prev) => [...prev, ...validFiles]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (files: File[]): Promise<string[]> => {
    setIsUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `posts/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("community")
          .upload(filePath, file);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from("community")
          .getPublicUrl(filePath);

        uploadedUrls.push(urlData.publicUrl);
        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      }

      return uploadedUrls;
    } catch (error) {
      console.error("Error uploading images:", error);
      return uploadedUrls;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && imageFiles.length === 0) return;

    setIsSubmitting(true);
    try {
      let imageUrls: string[] | undefined;

      if (imageFiles.length > 0) {
        imageUrls = await uploadImages(imageFiles);
        if (imageUrls.length === 0) {
          console.error("Failed to upload images");
        }
      }

      const result = await onSubmit(content.trim(), imageUrls);

      if (result.success) {
        setContent("");
        setImageFiles([]);
        setImagePreviews([]);
        setIsExpanded(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card 
      ref={containerRef}
      className="border-primary/10 bg-white/90 backdrop-blur-sm w-full max-w-full overflow-hidden shadow-sm"
    >
      <CardContent className="p-3 sm:p-4">
        <AnimatePresence mode="wait">
          {!isExpanded ? (
            // Collapsed state - single line
            <motion.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => setIsExpanded(true)}
            >
              <Avatar className="w-10 h-10 border-2 border-primary/20 shrink-0">
                <AvatarImage src={userAvatar || angelAvatar} alt={userName} />
                <AvatarFallback>{userName?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="bg-muted/50 hover:bg-muted/70 transition-colors rounded-full px-4 py-2.5 text-foreground-muted text-sm sm:text-base">
                  Chia sẻ kiến thức, trải nghiệm của bạn về Angel AI, về Cha Vũ Trụ...
                </div>
              </div>
            </motion.div>
          ) : (
            // Expanded state - full form
            <motion.div
              key="expanded"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {/* Header with close button */}
              <div className="flex items-center justify-between pb-2 border-b border-primary/10">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 border-2 border-primary/20 shrink-0">
                    <AvatarImage src={userAvatar || angelAvatar} alt={userName} />
                    <AvatarFallback>{userName?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm text-foreground">{userName || "Bạn"}</p>
                    <p className="text-xs text-foreground-muted">Đang tạo bài viết</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-foreground-muted hover:text-foreground"
                  onClick={() => {
                    if (!content.trim() && imageFiles.length === 0) {
                      setIsExpanded(false);
                    }
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Textarea */}
              <Textarea
                ref={textareaRef}
                placeholder="Chia sẻ kiến thức, trải nghiệm của bạn về Angel AI, về Cha Vũ Trụ..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[120px] sm:min-h-[150px] resize-none border-0 focus-visible:ring-0 text-base sm:text-lg leading-relaxed p-0 placeholder:text-foreground-muted/60"
              />

              {/* Image Previews Grid */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group aspect-square">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      <span className="absolute bottom-1 left-1 text-xs bg-black/60 text-white px-1.5 py-0.5 rounded">
                        {index + 1}
                      </span>
                    </div>
                  ))}

                  {imageFiles.length < MAX_IMAGES && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-lg border-2 border-dashed border-primary/30 hover:border-primary/50 flex flex-col items-center justify-center text-primary/60 hover:text-primary/80 transition-colors"
                    >
                      <Plus className="w-6 h-6" />
                      <span className="text-xs mt-1">{imageFiles.length}/{MAX_IMAGES}</span>
                    </button>
                  )}
                </div>
              )}

              {/* Upload Progress */}
              {isUploading && (
                <div className="bg-primary/10 rounded-lg p-2">
                  <div className="flex items-center gap-2 text-sm text-primary">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang tải ảnh... {uploadProgress}%</span>
                  </div>
                  <div className="mt-1 h-1.5 bg-primary/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Action bar */}
              <div className="flex items-center justify-between pt-2 border-t border-primary/10">
                <div className="flex gap-1">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    ref={fileInputRef}
                    className="hidden"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSubmitting || isUploading || imageFiles.length >= MAX_IMAGES}
                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                  >
                    <Image className="w-5 h-5" />
                    <span className="hidden sm:inline ml-1">Ảnh ({imageFiles.length}/{MAX_IMAGES})</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-amber-500 hover:text-amber-600 hover:bg-amber-50"
                  >
                    <Smile className="w-5 h-5" />
                    <span className="hidden sm:inline ml-1">Cảm xúc</span>
                  </Button>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={(!content.trim() && imageFiles.length === 0) || isSubmitting || isUploading}
                  className="bg-primary hover:bg-primary/90"
                  size="sm"
                >
                  {isSubmitting || isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Đăng
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
