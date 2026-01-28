import { useState, useRef, useEffect } from "react";
import { X, Check, Move, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { motion } from "framer-motion";

interface CoverPositionEditorProps {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (position: number) => Promise<void>;
  initialPosition?: number;
}

export function CoverPositionEditor({ 
  imageUrl, 
  isOpen, 
  onClose,
  onSave,
  initialPosition = 50
}: CoverPositionEditorProps) {
  const [position, setPosition] = useState(initialPosition);
  const [isSaving, setIsSaving] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const startPosition = useRef(0);

  useEffect(() => {
    setPosition(initialPosition);
  }, [initialPosition, isOpen]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartY.current = e.clientY;
    startPosition.current = position;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const containerHeight = containerRef.current.offsetHeight;
    const deltaY = e.clientY - dragStartY.current;
    const deltaPercent = (deltaY / containerHeight) * 100;
    
    // Invert the direction: dragging down should increase position (show lower part)
    const newPosition = Math.max(0, Math.min(100, startPosition.current + deltaPercent));
    setPosition(newPosition);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    dragStartY.current = e.touches[0].clientY;
    startPosition.current = position;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const containerHeight = containerRef.current.offsetHeight;
    const deltaY = e.touches[0].clientY - dragStartY.current;
    const deltaPercent = (deltaY / containerHeight) * 100;
    
    const newPosition = Math.max(0, Math.min(100, startPosition.current + deltaPercent));
    setPosition(newPosition);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(position);
      onClose();
    } catch (error) {
      console.error("Error saving position:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0 bg-background border overflow-hidden">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Move className="w-5 h-5 text-primary" />
            Điều chỉnh vị trí ảnh bìa
          </DialogTitle>
          <DialogDescription>
            Kéo ảnh lên/xuống hoặc sử dụng thanh trượt để chọn vị trí hiển thị đẹp nhất
          </DialogDescription>
        </DialogHeader>

        {/* Preview Container */}
        <div 
          ref={containerRef}
          className="relative h-[300px] overflow-hidden cursor-grab active:cursor-grabbing select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
        >
          <motion.img
            src={imageUrl}
            alt="Cover preview"
            className="w-full h-auto min-h-full object-cover absolute left-0"
            style={{
              top: `${-position}%`,
            }}
            animate={{ top: `${-position}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
          
          {/* Overlay Guide */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full flex items-center gap-2 text-sm">
              <Move className="w-4 h-4" />
              Kéo để điều chỉnh
            </div>
            
            {/* Directional hints */}
            <motion.div 
              className="absolute top-1/3 left-1/2 -translate-x-1/2 flex flex-col items-center gap-8"
              animate={{ opacity: isDragging ? 0 : 0.7 }}
            >
              <ArrowUp className="w-8 h-8 text-white drop-shadow-lg animate-bounce" />
              <ArrowDown className="w-8 h-8 text-white drop-shadow-lg animate-bounce" style={{ animationDelay: "0.5s" }} />
            </motion.div>
          </div>

          {/* Frame overlay to show visible area */}
          <div className="absolute inset-0 border-4 border-primary/30 pointer-events-none">
            <div className="absolute inset-x-0 top-0 h-1 bg-primary/50" />
            <div className="absolute inset-x-0 bottom-0 h-1 bg-primary/50" />
          </div>
        </div>

        {/* Slider Control */}
        <div className="p-4 space-y-4 bg-muted/30">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Trên</span>
            <Slider
              value={[position]}
              onValueChange={([value]) => setPosition(value)}
              min={0}
              max={100}
              step={1}
              className="flex-1"
            />
            <span className="text-sm text-muted-foreground whitespace-nowrap">Dưới</span>
          </div>
          
          <div className="text-center text-sm text-muted-foreground">
            Vị trí: {Math.round(position)}%
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 p-4 border-t bg-muted/20">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            <X className="w-4 h-4 mr-2" />
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full"
                />
                Đang lưu...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Lưu vị trí
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
