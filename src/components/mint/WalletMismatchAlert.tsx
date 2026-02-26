import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import type { MismatchedMint } from "@/hooks/useWalletMismatch";

interface WalletMismatchAlertProps {
  mismatch: MismatchedMint;
}

export function WalletMismatchAlert({ mismatch }: WalletMismatchAlertProps) {
  const { t } = useLanguage();
  const { recipientAddress, totalAmount, txHashes } = mismatch;

  const truncated = `${recipientAddress.slice(0, 6)}...${recipientAddress.slice(-4)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(recipientAddress);
      toast.success(t("mint.walletMismatch.copied"));
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <Alert className="border-amber-300 bg-amber-50 dark:bg-amber-950/30">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-700 dark:text-amber-400">
        {t("mint.walletMismatch.title")}
      </AlertTitle>
      <AlertDescription className="space-y-3 text-amber-600 dark:text-amber-300">
        <p className="text-sm">
          {t("mint.walletMismatch.description")
            .replace("{amount}", totalAmount.toLocaleString())
            .replace("{address}", truncated)}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs border-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40"
            onClick={handleCopy}
          >
            <Copy className="h-3 w-3 mr-1" />
            {truncated}
          </Button>

          {txHashes[0] && (
            <a
              href={`https://testnet.bscscan.com/tx/${txHashes[0]}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
            >
              BSCScan <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        <p className="text-xs text-amber-500 dark:text-amber-400">
          {t("mint.walletMismatch.hint")}
        </p>
      </AlertDescription>
    </Alert>
  );
}
