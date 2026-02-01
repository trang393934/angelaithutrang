import { useState, useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TimeoutMessageProps {
  delay?: number;
  message?: string;
  showRefresh?: boolean;
}

export function TimeoutMessage({ 
  delay = 10000, 
  message = "Kết nối đang chậm. Vui lòng đợi hoặc thử refresh trang.",
  showRefresh = true
}: TimeoutMessageProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  if (!visible) return null;

  return (
    <div className="flex flex-col items-center gap-3 animate-fade-in">
      <div className="flex items-center gap-2 text-amber-500">
        <AlertCircle className="w-5 h-5" />
        <span className="text-sm text-muted-foreground">{message}</span>
      </div>
      {showRefresh && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh trang
        </Button>
      )}
    </div>
  );
}
