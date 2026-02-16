import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Image, Video, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (file: File, caption?: string) => Promise<{ success: boolean; message: string }>;
}

export function CreateStoryModal({ isOpen, onClose, onSubmit }: CreateStoryModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      toast.error("Chỉ chấp nhận file ảnh hoặc video");
      return;
    }

    // Validate file size (10MB for images, 50MB for videos)
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`File quá lớn. Tối đa ${isVideo ? "50MB" : "10MB"}`);
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast.error("Vui lòng chọn ảnh hoặc video");
      return;
    }

    setIsSubmitting(true);
    const result = await onSubmit(selectedFile, caption.trim() || undefined);
    setIsSubmitting(false);

    if (result.success) {
      toast.success(result.message);
      handleClose();
    } else {
      toast.error(result.message);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreview(null);
    setCaption("");
    onClose();
  };

  const isVideo = selectedFile?.type.startsWith("video/");

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-background-pure rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-primary-pale/20">
              <h2 className="font-semibold text-lg text-foreground">Tạo tin mới</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {!preview ? (
                // File upload area
                <div
                  className="border-2 border-dashed border-primary-pale/50 rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary-pale/10 transition-all"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="flex justify-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                      <Image className="w-7 h-7 text-white" />
                    </div>
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                      <Video className="w-7 h-7 text-white" />
                    </div>
                  </div>
                  <p className="text-foreground font-medium mb-1">Chọn ảnh hoặc video</p>
                  <p className="text-foreground-muted text-sm">Tin của bạn sẽ tự động hết hạn sau 24 giờ</p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>
              ) : (
                // Preview area
                <div className="space-y-4">
                  <div className="relative rounded-xl overflow-hidden bg-black aspect-[9/16] max-h-[400px]">
                    {isVideo ? (
                      <video
                        src={preview}
                        className="w-full h-full object-contain"
                        controls
                        muted
                      />
                    ) : (
                      <img
                        src={preview}
                        alt="Preview"
                        className="w-full h-full object-contain"
                      />
                    )}

                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
                      onClick={() => {
                        setSelectedFile(null);
                        setPreview(null);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <Textarea
                    placeholder="Thêm chú thích... (tùy chọn)"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="resize-none bg-primary-pale/20 border-0 focus:ring-2 focus:ring-primary/30"
                    rows={2}
                    maxLength={200}
                  />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-primary-pale/20 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Hủy
              </Button>
              <Button
                className="flex-1 bg-sapphire-gradient"
                onClick={handleSubmit}
                disabled={!selectedFile || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang đăng...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Đăng tin
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
