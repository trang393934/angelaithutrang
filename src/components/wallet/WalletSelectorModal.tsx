import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Wallet, ExternalLink, Loader2 } from "lucide-react";
import { detectWallets, type DetectedWallet, setActiveProvider } from "@/lib/walletProviders";
import { useLanguage } from "@/contexts/LanguageContext";

interface WalletSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (provider: any) => void;
  isConnecting: boolean;
}

const WALLET_DOWNLOAD_LINKS: Record<string, string> = {
  metamask: "https://metamask.io/download/",
  trust: "https://trustwallet.com/download",
  okx: "https://www.okx.com/download",
};

const ALL_WALLETS = [
  { id: "metamask", name: "MetaMask", icon: "🦊", desc: "Ví phổ biến nhất" },
  { id: "trust", name: "Trust Wallet", icon: "🛡️", desc: "Ví di động an toàn" },
  { id: "okx", name: "OKX Wallet", icon: "⭕", desc: "Ví đa chuỗi" },
];

export function WalletSelectorModal({
  open,
  onOpenChange,
  onSelect,
  isConnecting,
}: WalletSelectorModalProps) {
  const { t } = useLanguage();
  const [detectedWallets, setDetectedWallets] = useState<DetectedWallet[]>([]);
  const [connectingId, setConnectingId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDetectedWallets(detectWallets());
      setConnectingId(null);
    }
  }, [open]);

  const handleSelectWallet = (wallet: DetectedWallet) => {
    setConnectingId(wallet.id);
    setActiveProvider(wallet.provider);
    onSelect(wallet.provider);
  };

  const detectedIds = new Set(detectedWallets.map((w) => w.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            Kết nối ví Web3
          </DialogTitle>
          <DialogDescription>
            Chọn ví bạn muốn sử dụng. Giao dịch hoàn toàn P2P, phi tập trung.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 mt-2">
          {/* Detected / installed wallets */}
          {detectedWallets.map((wallet) => (
            <button
              key={wallet.id}
              onClick={() => handleSelectWallet(wallet)}
              disabled={isConnecting}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 text-left disabled:opacity-50"
            >
              <span className="text-2xl">{wallet.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">{wallet.name}</div>
                <div className="text-xs text-green-600 font-medium">✓ Đã cài đặt</div>
              </div>
              {connectingId === wallet.id && isConnecting ? (
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              ) : (
                <span className="text-xs text-primary font-medium">Kết nối →</span>
              )}
            </button>
          ))}

          {/* Not installed wallets */}
          {ALL_WALLETS.filter((w) => !detectedIds.has(w.id)).map((wallet) => (
            <button
              key={wallet.id}
              onClick={() => {
                const url = WALLET_DOWNLOAD_LINKS[wallet.id];
                if (url) window.open(url, "_blank");
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-dashed border-muted-foreground/20 hover:border-muted-foreground/40 transition-all duration-200 text-left opacity-60 hover:opacity-80"
            >
              <span className="text-2xl grayscale">{wallet.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-muted-foreground">{wallet.name}</div>
                <div className="text-xs text-muted-foreground">{wallet.desc}</div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          ))}
        </div>

        {detectedWallets.length === 0 && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              Chưa phát hiện ví Web3 nào. Vui lòng cài đặt một ví ở trên.
            </p>
          </div>
        )}

        <p className="text-[10px] text-muted-foreground text-center mt-2">
          Non-custodial · P2P · Không trung gian · Bạn toàn quyền tài sản
        </p>
      </DialogContent>
    </Dialog>
  );
}
