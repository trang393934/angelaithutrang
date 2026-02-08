import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gift, ArrowRight, ExternalLink, Copy, Loader2, ArrowLeft, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import camlyCoinLogo from "@/assets/camly-coin-logo.png";

interface ReceiptData {
  id: string;
  receipt_public_id: string;
  sender: { user_id: string; display_name: string | null; avatar_url: string | null };
  receiver: { user_id: string; display_name: string | null; avatar_url: string | null };
  amount: number;
  message: string | null;
  gift_type: string;
  tx_hash: string | null;
  context_type: string;
  context_id: string | null;
  post: { id: string; content_preview: string } | null;
  created_at: string;
  explorer_url: string | null;
}

export default function Receipt() {
  const { receiptId } = useParams<{ receiptId: string }>();
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!receiptId) return;
    fetchReceipt();
  }, [receiptId]);

  const fetchReceipt = async () => {
    try {
      const response = await supabase.functions.invoke("get-tip-receipt", {
        body: { receipt_id: receiptId },
      });

      if (response.error || response.data?.error) {
        setError(response.data?.error || "Không tìm thấy biên nhận");
        return;
      }

      setReceipt(response.data.receipt);
    } catch (err) {
      setError("Lỗi tải biên nhận");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Đã sao chép link biên nhận!");
  };

  const formatAmount = (amount: number) => new Intl.NumberFormat("vi-VN").format(amount);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <Gift className="w-12 h-12 text-amber-300 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-600">{error || "Biên nhận không tồn tại"}</p>
            <Link to="/">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Về trang chủ
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-amber-50/30 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Back */}
        <Link to="/" className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Trang chủ
        </Link>

        <Card className="border-2 border-amber-200 shadow-xl overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 text-center" style={{
            backgroundImage: `linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.3) 30%, transparent 50%, rgba(255,255,255,0.15) 70%, transparent 100%), linear-gradient(135deg, #b8860b 0%, #daa520 15%, #ffd700 30%, #ffec8b 45%, #ffd700 55%, #daa520 70%, #b8860b 85%, #cd950c 100%)`,
          }}>
            <div className="flex items-center justify-center gap-2 mb-1">
              <Gift className="w-6 h-6 text-white" />
              <h1 className="text-xl font-bold text-white">Biên Nhận Tặng Thưởng</h1>
            </div>
            <p className="text-white/80 text-sm">Angel AI • Lan tỏa yêu thương</p>
          </div>

          <CardContent className="p-6 space-y-5">
            {/* Sender -> Receiver */}
            <div className="flex items-center justify-between gap-3">
              <Link to={`/user/${receipt.sender.user_id}`} className="flex flex-col items-center gap-2 flex-1 hover:opacity-80">
                <Avatar className="h-14 w-14 ring-2 ring-amber-300 shadow-md">
                  <AvatarImage src={receipt.sender.avatar_url || ""} />
                  <AvatarFallback className="bg-amber-100 text-amber-700 text-lg">{receipt.sender.display_name?.[0] || "?"}</AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <p className="text-xs text-amber-600">Người tặng</p>
                  <p className="font-semibold text-sm text-gray-800 truncate max-w-[120px]">{receipt.sender.display_name || "Ẩn danh"}</p>
                </div>
              </Link>

              <div className="flex flex-col items-center shrink-0">
                <ArrowRight className="w-6 h-6 text-amber-400" />
                <img src={camlyCoinLogo} alt="coin" className="w-8 h-8 mt-1" />
              </div>

              <Link to={`/user/${receipt.receiver.user_id}`} className="flex flex-col items-center gap-2 flex-1 hover:opacity-80">
                <Avatar className="h-14 w-14 ring-2 ring-rose-300 shadow-md">
                  <AvatarImage src={receipt.receiver.avatar_url || ""} />
                  <AvatarFallback className="bg-rose-100 text-rose-700 text-lg">{receipt.receiver.display_name?.[0] || "?"}</AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <p className="text-xs text-rose-500">Người nhận</p>
                  <p className="font-semibold text-sm text-gray-800 truncate max-w-[120px]">{receipt.receiver.display_name || "Ẩn danh"}</p>
                </div>
              </Link>
            </div>

            {/* Amount */}
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-4 text-center border border-amber-200">
              <div className="flex items-center justify-center gap-2">
                <img src={camlyCoinLogo} alt="coin" className="w-8 h-8" />
                <span className="text-3xl font-bold text-amber-700">{formatAmount(receipt.amount)}</span>
              </div>
              <p className="text-sm text-amber-600 mt-1">Camly Coin</p>
            </div>

            {/* Message */}
            {receipt.message && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <MessageCircle className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-500 font-medium">Lời nhắn</span>
                </div>
                <p className="text-sm text-gray-700 italic">"{receipt.message}"</p>
              </div>
            )}

            {/* Post link */}
            {receipt.post && (
              <Link
                to={`/community`}
                className="block bg-blue-50 border border-blue-200 rounded-lg p-3 hover:bg-blue-100 transition-colors"
              >
                <p className="text-xs text-blue-500 font-medium mb-1">Tặng trên bài viết</p>
                <p className="text-sm text-blue-700 line-clamp-2">{receipt.post.content_preview}</p>
              </Link>
            )}

            {/* TX Hash */}
            {receipt.tx_hash && (
              <a
                href={receipt.explorer_url || `https://bscscan.com/tx/${receipt.tx_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-orange-50 border border-orange-200 rounded-lg p-3 text-orange-600 hover:bg-orange-100 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="text-sm font-medium">Xem giao dịch trên BscScan</span>
              </a>
            )}

            {/* Time */}
            <p className="text-center text-xs text-gray-400">
              {new Date(receipt.created_at).toLocaleString("vi-VN")}
            </p>

            {/* Actions */}
            <div className="flex gap-2">
              <Button onClick={handleCopyLink} variant="outline" className="flex-1 border-amber-300 text-amber-700">
                <Copy className="w-4 h-4 mr-2" />
                Sao chép link
              </Button>
              <Link to="/" className="flex-1">
                <Button className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Về trang chủ
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
