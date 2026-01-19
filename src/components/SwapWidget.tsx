import { useState, useEffect, useCallback } from "react";
import { ArrowDownUp, Settings, RefreshCw, ExternalLink, ChevronDown, AlertCircle } from "lucide-react";
import { usePancakeSwap, SWAP_TOKENS } from "@/hooks/usePancakeSwap";
import { useWeb3Wallet } from "@/hooks/useWeb3Wallet";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import camlyCoinLogo from "@/assets/camly-coin-logo.png";

export const SwapWidget = () => {
  const { isConnected, connect } = useWeb3Wallet();
  const { quote, isSwapping, getQuote, executeSwap, getTokenBalance } = usePancakeSwap();

  const [fromToken, setFromToken] = useState(SWAP_TOKENS[0]); // BNB
  const [toToken, setToToken] = useState(SWAP_TOKENS[1]); // CAMLY
  const [amountIn, setAmountIn] = useState("");
  const [slippage, setSlippage] = useState(0.5);
  const [showSettings, setShowSettings] = useState(false);
  const [fromBalance, setFromBalance] = useState("0");
  const [toBalance, setToBalance] = useState("0");

  // Get token logo
  const getTokenLogo = (token: typeof SWAP_TOKENS[0]) => {
    if (token.symbol === "CAMLY") {
      return camlyCoinLogo;
    }
    return token.logo;
  };

  // Fetch balances
  const fetchBalances = useCallback(async () => {
    if (!isConnected) return;
    
    const from = await getTokenBalance(fromToken.address, fromToken.decimals);
    const to = await getTokenBalance(toToken.address, toToken.decimals);
    setFromBalance(from);
    setToBalance(to);
  }, [isConnected, fromToken, toToken, getTokenBalance]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  // Debounced quote fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      if (amountIn && parseFloat(amountIn) > 0) {
        getQuote(fromToken, toToken, amountIn, slippage);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [amountIn, fromToken, toToken, slippage, getQuote]);

  // Swap tokens
  const handleSwapTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setAmountIn("");
    const temp = fromBalance;
    setFromBalance(toBalance);
    setToBalance(temp);
  };

  // Execute swap
  const handleSwap = async () => {
    if (!isConnected) {
      connect();
      return;
    }

    if (!amountIn || parseFloat(amountIn) <= 0) {
      toast.error("Vui lòng nhập số lượng");
      return;
    }

    if (parseFloat(amountIn) > parseFloat(fromBalance)) {
      toast.error("Số dư không đủ");
      return;
    }

    const result = await executeSwap(fromToken, toToken, amountIn, quote.amountOutMin);

    if (result.success) {
      toast.success(
        <div className="flex flex-col gap-1">
          <span>Swap thành công!</span>
          <a
            href={`https://bscscan.com/tx/${result.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary flex items-center gap-1"
          >
            Xem giao dịch <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      );
      setAmountIn("");
      fetchBalances();
    } else {
      toast.error(result.error || "Giao dịch thất bại");
    }
  };

  // Set max amount
  const handleMax = () => {
    // Leave some BNB for gas if swapping BNB
    if (fromToken.address === "native") {
      const maxAmount = Math.max(parseFloat(fromBalance) - 0.01, 0);
      setAmountIn(maxAmount.toString());
    } else {
      setAmountIn(fromBalance);
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border shadow-lg p-6 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Swap Token</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchBalances}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            title="Làm mới số dư"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            title="Cài đặt"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* From Token */}
      <div className="bg-muted/50 rounded-xl p-4 mb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Từ</span>
          <span className="text-xs text-muted-foreground">
            Số dư: {parseFloat(fromBalance).toFixed(4)}
            <button onClick={handleMax} className="ml-1 text-primary hover:underline">
              MAX
            </button>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-3 py-2 bg-background rounded-lg hover:bg-muted transition-colors">
                <img
                  src={getTokenLogo(fromToken)}
                  alt={fromToken.symbol}
                  className="w-6 h-6 rounded-full"
                  onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
                />
                <span className="font-medium">{fromToken.symbol}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {SWAP_TOKENS.filter(t => t.address !== toToken.address).map((token) => (
                <DropdownMenuItem
                  key={token.address}
                  onClick={() => setFromToken(token)}
                  className="flex items-center gap-2"
                >
                  <img
                    src={getTokenLogo(token)}
                    alt={token.symbol}
                    className="w-5 h-5 rounded-full"
                    onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
                  />
                  <span>{token.symbol}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <input
            type="number"
            value={amountIn}
            onChange={(e) => setAmountIn(e.target.value)}
            placeholder="0.0"
            className="flex-1 bg-transparent text-right text-xl font-semibold outline-none"
          />
        </div>
      </div>

      {/* Swap Button */}
      <div className="flex justify-center -my-1 relative z-10">
        <button
          onClick={handleSwapTokens}
          className="p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors shadow-md"
        >
          <ArrowDownUp className="w-4 h-4" />
        </button>
      </div>

      {/* To Token */}
      <div className="bg-muted/50 rounded-xl p-4 mt-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Đến</span>
          <span className="text-xs text-muted-foreground">
            Số dư: {parseFloat(toBalance).toFixed(4)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-3 py-2 bg-background rounded-lg hover:bg-muted transition-colors">
                <img
                  src={getTokenLogo(toToken)}
                  alt={toToken.symbol}
                  className="w-6 h-6 rounded-full"
                  onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
                />
                <span className="font-medium">{toToken.symbol}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {SWAP_TOKENS.filter(t => t.address !== fromToken.address).map((token) => (
                <DropdownMenuItem
                  key={token.address}
                  onClick={() => setToToken(token)}
                  className="flex items-center gap-2"
                >
                  <img
                    src={getTokenLogo(token)}
                    alt={token.symbol}
                    className="w-5 h-5 rounded-full"
                    onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
                  />
                  <span>{token.symbol}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex-1 text-right">
            {quote.isLoading ? (
              <RefreshCw className="w-5 h-5 animate-spin ml-auto" />
            ) : (
              <span className="text-xl font-semibold">
                {parseFloat(quote.amountOut).toFixed(6) || "0.0"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quote Info */}
      {amountIn && parseFloat(amountIn) > 0 && !quote.error && (
        <div className="mt-4 p-3 bg-muted/30 rounded-lg text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Tỷ giá</span>
            <span>
              1 {fromToken.symbol} ≈ {(parseFloat(quote.amountOut) / parseFloat(amountIn) || 0).toFixed(6)} {toToken.symbol}
            </span>
          </div>
          <div className="flex justify-between text-muted-foreground mt-1">
            <span>Slippage</span>
            <span>{slippage}%</span>
          </div>
          <div className="flex justify-between text-muted-foreground mt-1">
            <span>Tối thiểu nhận được</span>
            <span>{parseFloat(quote.amountOutMin).toFixed(6)} {toToken.symbol}</span>
          </div>
        </div>
      )}

      {/* Error */}
      {quote.error && (
        <div className="mt-4 p-3 bg-destructive/10 rounded-lg flex items-center gap-2 text-destructive text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{quote.error}</span>
        </div>
      )}

      {/* Swap Button */}
      <button
        onClick={handleSwap}
        disabled={isSwapping || quote.isLoading || (!isConnected ? false : !amountIn || parseFloat(amountIn) <= 0)}
        className="w-full mt-4 py-4 px-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSwapping ? (
          <span className="flex items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin" />
            Đang xử lý...
          </span>
        ) : !isConnected ? (
          "Kết nối ví"
        ) : !amountIn || parseFloat(amountIn) <= 0 ? (
          "Nhập số lượng"
        ) : parseFloat(amountIn) > parseFloat(fromBalance) ? (
          "Số dư không đủ"
        ) : (
          "Swap"
        )}
      </button>

      {/* Powered by */}
      <div className="mt-4 text-center">
        <a
          href="https://pancakeswap.finance/swap"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:text-primary flex items-center justify-center gap-1"
        >
          Powered by PancakeSwap
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cài đặt giao dịch</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Slippage Tolerance
              </label>
              <div className="flex gap-2">
                {[0.1, 0.5, 1.0, 3.0].map((value) => (
                  <button
                    key={value}
                    onClick={() => setSlippage(value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      slippage === value
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    {value}%
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={slippage}
                onChange={(e) => setSlippage(parseFloat(e.target.value) || 0.5)}
                className="mt-2 w-full px-4 py-2 bg-muted rounded-lg outline-none"
                placeholder="Custom %"
                step="0.1"
                min="0.1"
                max="50"
              />
              {slippage > 5 && (
                <p className="text-xs text-amber-500 mt-1">
                  ⚠️ Slippage cao có thể dẫn đến mất mát đáng kể
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
