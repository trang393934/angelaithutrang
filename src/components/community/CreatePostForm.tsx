import { useState, useRef } from "react";
import { Image, Send, X, Loader2, Plus, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import angelAvatar from "@/assets/angel-avatar.png";
import { fullContentCheck, checkImageFilename } from "@/lib/contentModeration";
import { ContentModerationDialog } from "./ContentModerationDialog";
import { compressImage, formatFileSize } from "@/lib/imageCompression";

const MAX_IMAGES = 30;

// Common emojis for quick access - grouped by category
const EMOJI_CATEGORIES = [
  {
    name: "Cảm xúc",
    emojis: ["😊", "😂", "🥰", "😍", "🤗", "😇", "🥺", "😢", "😭", "😤", "😡", "🤔", "😴", "🤒", "😎", "🤩"]
  },
  {
    name: "Yêu thương",
    emojis: ["❤️", "💕", "💖", "💗", "💓", "💞", "💝", "🧡", "💛", "💚", "💙", "💜", "🤎", "🖤", "🤍", "💔"]
  },
  {
    name: "Tay & Cử chỉ",
    emojis: ["👍", "👏", "🙏", "💪", "✌️", "🤝", "👋", "🤲", "🙌", "👐", "✋", "🤚", "🖐️", "👊", "✊", "🤛"]
  },
  {
    name: "Thiên nhiên",
    emojis: ["🌟", "⭐", "✨", "🌈", "☀️", "🌙", "🌸", "🌺", "🌻", "🌹", "🍀", "🌿", "🌴", "🦋", "🐦", "🕊️"]
  },
  {
    name: "Hoạt động",
    emojis: ["🎉", "🎊", "🎁", "🎂", "🎈", "🎵", "🎶", "📚", "✍️", "💼", "🏆", "🥇", "🎯", "💡", "🔥", "💎"]
  }
];

interface CreatePostFormProps {
  userAvatar?: string | null;
  userName?: string;
  onSubmit: (content: string, imageUrls?: string[]) => Promise<{ success: boolean; message: string }>;
}

export function CreatePostForm({ userAvatar, userName, onSubmit }: CreatePostFormProps) {
  const [content, setContent] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [moderationDialogOpen, setModerationDialogOpen] = useState(false);
  const [moderationMessage, setModerationMessage] = useState("");
  const [moderationBlockedItems, setModerationBlockedItems] = useState<string[]>([]);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.substring(0, start) + emoji + content.substring(end);
      setContent(newContent);
      
      // Set cursor position after emoji
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);
    } else {
      setContent(content + emoji);
    }
  };

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

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        alert(`Ảnh "${file.name}" vượt quá 5MB`);
        continue;
      }
      
      // Check image filename for harmful content
      const imageCheck = checkImageFilename(file.name);
      if (!imageCheck.isAllowed) {
        setModerationMessage(imageCheck.gentleReminder);
        setModerationBlockedItems(imageCheck.blockedItems || []);
        setModerationDialogOpen(true);
        continue;
      }
      
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    // Create previews
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
        let file = files[i];
        
        // Compress image before upload
        try {
          const originalSize = file.size;
          file = await compressImage(file, {
            maxWidth: 1920,
            maxHeight: 1920,
            quality: 0.8,
            format: 'webp'
          });
          console.log(`Image compressed: ${formatFileSize(originalSize)} → ${formatFileSize(file.size)}`);
        } catch (compressError) {
          console.warn("Image compression failed, using original:", compressError);
        }
        
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

    // Content moderation check before submitting
    const moderationResult = fullContentCheck(content.trim(), imageFiles);
    if (!moderationResult.isAllowed) {
      setModerationMessage(moderationResult.gentleReminder);
      setModerationBlockedItems(moderationResult.blockedItems || []);
      setModerationDialogOpen(true);
      return;
    }

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
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-primary/10 bg-white/80 backdrop-blur-sm w-full max-w-full overflow-hidden">
      <CardContent className="p-4 sm:p-5">
        <div className="flex gap-3 sm:gap-4 min-w-0">
          <Avatar className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-primary/20 shrink-0">
            <AvatarImage src={userAvatar || angelAvatar} alt={userName} />
            <AvatarFallback>{userName?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-3 min-w-0 overflow-hidden">
            <Textarea
              ref={textareaRef}
              placeholder="Chia sẻ kiến thức, trải nghiệm của bạn về Angel AI, về Cha Vũ Trụ..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[140px] sm:min-h-[160px] resize-none border-primary/20 focus:border-primary/40 text-base sm:text-lg leading-relaxed"
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
                
                {/* Add more button */}
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

            <div className="flex items-center justify-between">
              <div className="flex gap-1 sm:gap-2">
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
                  className="text-primary/70 hover:text-primary hover:bg-primary/10"
                >
                  <Image className="w-5 h-5 mr-1" />
                  <span className="hidden sm:inline">Ảnh</span> ({imageFiles.length}/{MAX_IMAGES})
                </Button>

                {/* Emoji Picker Button */}
                <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isSubmitting || isUploading}
                      className="text-amber-500 hover:text-amber-600 hover:bg-amber-50"
                    >
                      <Smile className="w-5 h-5 mr-1" />
                      <span className="hidden sm:inline">Cảm xúc</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-80 p-3" 
                    align="start"
                    side="top"
                  >
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm text-foreground/80">Chọn cảm xúc</h4>
                      {EMOJI_CATEGORIES.map((category) => (
                        <div key={category.name}>
                          <p className="text-xs text-muted-foreground mb-1.5">{category.name}</p>
                          <div className="grid grid-cols-8 gap-1">
                            {category.emojis.map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => {
                                  insertEmoji(emoji);
                                  setEmojiPickerOpen(false);
                                }}
                                className="w-8 h-8 flex items-center justify-center text-xl hover:bg-primary/10 rounded-md transition-colors"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={(!content.trim() && imageFiles.length === 0) || isSubmitting || isUploading}
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
      
      {/* Content Moderation Dialog */}
      <ContentModerationDialog
        open={moderationDialogOpen}
        onClose={() => setModerationDialogOpen(false)}
        message={moderationMessage}
        blockedItems={moderationBlockedItems}
      />
    </Card>
  );
}
