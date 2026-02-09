import { useState, useEffect } from "react";
import { Copy, Check, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface WalletAddressDisplayProps {
  userId: string;
  className?: string;
}

export function WalletAddressDisplay({ userId, className = "" }: WalletAddressDisplayProps) {
  const { t } = useLanguage();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchWallet = async () => {
      const { data } = await supabase
        .from("user_wallet_addresses")
        .select("wallet_address")
        .eq("user_id", userId)
        .maybeSingle();

      if (data?.wallet_address) {
        setWalletAddress(data.wallet_address);
      }
    };

    fetchWallet();
  }, [userId]);

  if (!walletAddress) return null;

  const shortenAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      toast.success(t("wallet.copied") || "Đã sao chép địa chỉ ví!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Không thể sao chép");
    }
  };

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 border border-border text-xs font-mono ${className}`}>
      <Wallet className="w-3.5 h-3.5 text-primary shrink-0" />
      <span className="text-muted-foreground select-all" title={walletAddress}>
        {shortenAddress(walletAddress)}
      </span>
      <button
        onClick={handleCopy}
        className="p-0.5 rounded hover:bg-primary/10 transition-colors shrink-0"
        title={t("wallet.copy") || "Sao chép địa chỉ ví"}
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-green-500" />
        ) : (
          <Copy className="w-3.5 h-3.5 text-muted-foreground hover:text-primary transition-colors" />
        )}
      </button>
    </div>
  );
}
