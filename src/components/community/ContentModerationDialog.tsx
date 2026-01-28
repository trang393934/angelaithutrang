import { AlertTriangle, Heart, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ContentModerationDialogProps {
  open: boolean;
  onClose: () => void;
  message: string;
  blockedItems?: string[];
}

export function ContentModerationDialog({
  open,
  onClose,
  message,
  blockedItems,
}: ContentModerationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-amber-100">
              <Heart className="w-5 h-5 text-amber-600" />
            </div>
            <DialogTitle className="text-amber-700">
              Lời nhắc nhẹ từ Angel AI
            </DialogTitle>
          </div>
          <DialogDescription asChild>
            <div className="space-y-3">
              <p className="text-foreground whitespace-pre-line leading-relaxed">
                {message}
              </p>
              
              {blockedItems && blockedItems.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-amber-700 text-sm font-medium mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Nội dung cần chỉnh sửa:</span>
                  </div>
                  <ul className="text-sm text-amber-600 space-y-1">
                    {blockedItems.slice(0, 3).map((item, index) => (
                      <li key={index} className="truncate">
                        • <span className="blur-sm hover:blur-none transition-all">{item}</span>
                      </li>
                    ))}
                    {blockedItems.length > 3 && (
                      <li className="text-amber-500 italic">
                        và {blockedItems.length - 3} mục khác...
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="mt-4">
          <Button 
            onClick={onClose}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Con hiểu rồi, để con chỉnh sửa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
