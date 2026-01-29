import { useState } from "react";
import { X, Download, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ImageLightboxProps {
  imageUrl: string;
  alt?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ImageLightbox({ imageUrl, alt = "Image", isOpen, onClose }: ImageLightboxProps) {
  const [zoom, setZoom] = useState(1);

  const handleDownload = async () => {
    try {
      let blob: Blob;
      let filename = `angel-ai-image-${Date.now()}.png`;

      // Check if it's a data URL
      if (imageUrl.startsWith("data:")) {
        // Convert data URL to blob
        const response = await fetch(imageUrl);
        blob = await response.blob();
      } else {
        // Regular URL - fetch the image
        const response = await fetch(imageUrl);
        blob = await response.blob();
        // Try to extract filename from URL
        const urlFilename = imageUrl.split("/").pop()?.split("?")[0];
        if (urlFilename && urlFilename.includes(".")) {
          filename = urlFilename;
        }
      }

      // Create object URL from blob
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      link.style.display = "none";
      
      // Add to DOM, click, and remove
      document.body.appendChild(link);
      link.click();
      
      // Cleanup after a short delay
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      }, 100);
    } catch (error) {
      console.error("Error downloading image:", error);
      // Fallback: try to open in new tab
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(`<img src="${imageUrl}" alt="Download" style="max-width:100%"/>`);
        newWindow.document.title = "Tải về hình ảnh";
      }
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
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/70 to-transparent">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              className="text-white hover:bg-white/20"
            >
              <ZoomOut className="w-5 h-5" />
            </Button>
            <span className="text-white text-sm min-w-[50px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomIn}
              disabled={zoom >= 3}
              className="text-white hover:bg-white/20"
            >
              <ZoomIn className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="text-white hover:bg-white/20"
            >
              <Download className="w-5 h-5 mr-2" />
              Tải về
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Image container */}
        <div className="flex items-center justify-center w-full h-[90vh] overflow-auto p-8">
          <img
            src={imageUrl}
            alt={alt}
            className="max-w-full max-h-full object-contain transition-transform duration-200 cursor-zoom-in"
            style={{ transform: `scale(${zoom})` }}
            onClick={() => setZoom((prev) => (prev < 2 ? prev + 0.5 : 1))}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
