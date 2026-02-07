import { Gift, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import camlyCoinLogo from "@/assets/camly-coin-logo.png";

interface TipMessageCardProps {
  content: string;
  tipGiftId?: string | null;
  receiptPublicId?: string | null;
}

export function TipMessageCard({ content, tipGiftId, receiptPublicId }: TipMessageCardProps) {
  return (
    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-3 space-y-2 max-w-[280px]">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-md">
          <Gift className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm font-bold text-amber-700">Tặng thưởng</span>
        <img src={camlyCoinLogo} alt="coin" className="w-5 h-5 ml-auto" />
      </div>

      <p className="text-sm text-gray-700 whitespace-pre-wrap">{content}</p>

      {receiptPublicId && (
        <Link to={`/receipt/${receiptPublicId}`}>
          <Button
            variant="outline"
            size="sm"
            className="w-full border-amber-300 text-amber-700 hover:bg-amber-100 mt-1"
          >
            <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
            Xem biên nhận
          </Button>
        </Link>
      )}
    </div>
  );
}
