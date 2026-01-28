import { useState } from "react";
import { X, Download, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { motion } from "framer-motion";

interface ProfileImageLightboxProps {
  imageUrl: string;
  alt?: string;
  isOpen: boolean;
  onClose: () => void;
  type?: "avatar" | "cover";
}

export function ProfileImageLightbox({ 
  imageUrl, 
  alt = "Image", 
  isOpen, 
  onClose,
  type = "avatar" 
}: ProfileImageLightboxProps) {
  const [zoom, setZoom] = useState(1);

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const filename = type === "avatar" ? "avatar.jpg" : "cover.jpg";
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading image:", error);
      window.open(imageUrl, "_blank");
    }
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleClose = () => {
    setZoom(1);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none overflow-hidden">
        {/* Header with controls */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent"
        >
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              className="text-white hover:bg-white/20 transition-all"
            >
              <ZoomOut className="w-5 h-5" />
            </Button>
            <span className="text-white text-sm min-w-[50px] text-center font-medium">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomIn}
              disabled={zoom >= 3}
              className="text-white hover:bg-white/20 transition-all"
            >
              <ZoomIn className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="text-white hover:bg-white/20 transition-all"
            >
              <Download className="w-5 h-5 mr-2" />
              Tải về
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="text-white hover:bg-white/20 transition-all"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </motion.div>

        {/* Image container */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-center w-full h-[90vh] overflow-auto p-8"
        >
          <img
            src={imageUrl}
            alt={alt}
            className={`max-w-full max-h-full object-contain transition-transform duration-200 ${
              type === "avatar" ? "rounded-full shadow-2xl" : "rounded-lg shadow-2xl"
            }`}
            style={{ transform: `scale(${zoom})` }}
            onClick={() => setZoom((prev) => (prev < 2 ? prev + 0.5 : 1))}
          />
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
