import { useState, useEffect } from "react";
import { RefreshCw, TrendingUp, TrendingDown, ExternalLink, Clock, Copy, Check } from "lucide-react";
import { useCamlyPrice } from "@/hooks/useCamlyPrice";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import camlyCoinLogo from "@/assets/camly-coin-logo.png";

export const CamlyCoinPriceChart = () => {
  const { priceData, priceHistory, isLoading, error, refetch, contractAddress } = useCamlyPrice();
  const [copied, setCopied] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>("");

  // Update last update time every second
  useEffect(() => {
    const updateTime = () => {
      if (priceData?.lastUpdated) {
        const seconds = Math.floor((Date.now() - priceData.lastUpdated.getTime()) / 1000);
        if (seconds < 60) {
          setLastUpdate(`${seconds} giây trước`);
        } else {
          const minutes = Math.floor(seconds / 60);
          setLastUpdate(`${minutes} phút trước`);
        }
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [priceData?.lastUpdated]);

  const copyContract = () => {
    navigator.clipboard.writeText(contractAddress);
    setCopied(true);
    toast.success("Đã sao chép địa chỉ contract");
    setTimeout(() => setCopied(false), 2000);
  };

  const formatPrice = (price: number) => {
    if (price < 0.0001) return price.toExponential(4);
    if (price < 1) return price.toFixed(8);
    return price.toFixed(4);
  };

  const formatVnd = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price);
  };

  const formatNumber = (num: number) => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const isPositive = (priceData?.priceChange24h || 0) >= 0;

  return (
    <section className="py-12 bg-gradient-to-b from-amber-50/50 to-background dark:from-amber-950/20 dark:to-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-8">
          <h2 className="font-serif text-2xl md:text-3xl font-semibold text-primary-deep mb-2">
            Giá Camly Coin (CAMLY)
          </h2>
          <p className="text-foreground-muted flex items-center justify-center gap-2">
            <Clock className="w-4 h-4" />
            Cập nhật tự động mỗi phút • {lastUpdate}
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Main Price Card */}
          <div className="bg-card rounded-2xl shadow-lg border border-border overflow-hidden">
            {isLoading && !priceData ? (
              <div className="p-8 flex items-center justify-center">
                <RefreshCw className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <p className="text-destructive mb-4">{error}</p>
                <button
                  onClick={refetch}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
                >
                  Thử lại
                </button>
              </div>
            ) : priceData ? (
              <>
                {/* Price Header */}
                <div className="p-6 border-b border-border">
                  <div className="flex items-center gap-4">
                    <img
                      src={camlyCoinLogo}
                      alt="Camly Coin"
                      className="w-16 h-16 rounded-full"
                    />
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-foreground">
                        Camly Coin (CAMLY)
                      </h3>
                      <div className="flex items-baseline gap-3 mt-1">
                        <span className="text-2xl font-bold text-foreground">
                          ${formatPrice(priceData.priceUsd)}
                        </span>
                        <span className="text-lg text-muted-foreground">
                          ≈ {formatVnd(priceData.priceVnd)} VND
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`flex items-center gap-1 text-lg font-semibold ${
                          isPositive ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {isPositive ? (
                          <TrendingUp className="w-5 h-5" />
                        ) : (
                          <TrendingDown className="w-5 h-5" />
                        )}
                        <span>
                          {isPositive ? "+" : ""}
                          {priceData.priceChange24h.toFixed(2)}%
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">24h</span>
                    </div>
                    <button
                      onClick={refetch}
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                      title="Làm mới giá"
                    >
                      <RefreshCw className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`} />
                    </button>
                  </div>
                </div>

                {/* Price Chart */}
                {priceHistory.length > 1 && (
                  <div className="p-6 border-b border-border">
                    <h4 className="text-sm font-medium text-muted-foreground mb-4">
                      Biểu đồ giá (realtime)
                    </h4>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={priceHistory}>
                          <defs>
                            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                              <stop
                                offset="5%"
                                stopColor={isPositive ? "#22c55e" : "#ef4444"}
                                stopOpacity={0.3}
                              />
                              <stop
                                offset="95%"
                                stopColor={isPositive ? "#22c55e" : "#ef4444"}
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <XAxis
                            dataKey="timestamp"
                            tickFormatter={(ts) =>
                              new Date(ts).toLocaleTimeString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            }
                            tick={{ fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            domain={["auto", "auto"]}
                            tickFormatter={(val) => `$${val.toFixed(6)}`}
                            tick={{ fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                            width={80}
                          />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-card border border-border rounded-lg p-2 shadow-lg">
                                    <p className="text-xs text-muted-foreground">
                                      {new Date(payload[0].payload.timestamp).toLocaleString(
                                        "vi-VN"
                                      )}
                                    </p>
                                    <p className="font-semibold">
                                      ${formatPrice(payload[0].value as number)}
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="price"
                            stroke={isPositive ? "#22c55e" : "#ef4444"}
                            strokeWidth={2}
                            fill="url(#colorPrice)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-border">
                  <div className="p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Market Cap</p>
                    <p className="font-semibold text-foreground">
                      {formatNumber(priceData.marketCap)}
                    </p>
                  </div>
                  <div className="p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Volume 24h</p>
                    <p className="font-semibold text-foreground">
                      {formatNumber(priceData.volume24h)}
                    </p>
                  </div>
                  <div className="p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Liquidity</p>
                    <p className="font-semibold text-foreground">
                      {formatNumber(priceData.liquidity)}
                    </p>
                  </div>
                  <div className="p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">FDV</p>
                    <p className="font-semibold text-foreground">
                      {formatNumber(priceData.fdv)}
                    </p>
                  </div>
                </div>

                {/* Links */}
                <div className="p-4 border-t border-border">
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <a
                      href={`https://dexscreener.com/bsc/${priceData.pairAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors text-sm"
                    >
                      <img
                        src="https://dexscreener.com/favicon.ico"
                        alt="DEXScreener"
                        className="w-4 h-4"
                      />
                      <span>DEXScreener</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <a
                      href={`https://bscscan.com/token/${contractAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors text-sm"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                      </svg>
                      <span>BSCScan</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <a
                      href={`https://pancakeswap.finance/swap?outputCurrency=${contractAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded-full hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors text-sm"
                    >
                      <span>🥞</span>
                      <span>PancakeSwap</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </>
            ) : null}
          </div>

          {/* Contract Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-card p-4 rounded-xl border border-border text-center">
              <p className="text-xs text-muted-foreground mb-1">Mạng lưới</p>
              <p className="font-semibold text-foreground">BSC (BEP-20)</p>
            </div>
            <div className="bg-card p-4 rounded-xl border border-border text-center">
              <p className="text-xs text-muted-foreground mb-1">Tổng cung</p>
              <p className="font-semibold text-foreground">10B CAMLY</p>
            </div>
            <div className="bg-card p-4 rounded-xl border border-border text-center col-span-2 md:col-span-1">
              <p className="text-xs text-muted-foreground mb-1">Contract</p>
              <button
                onClick={copyContract}
                className="font-mono text-xs text-foreground hover:text-primary flex items-center gap-1 mx-auto"
              >
                <span className="truncate max-w-[100px]">{contractAddress}</span>
                {copied ? (
                  <Check className="w-3 h-3 text-green-500" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
            <div className="bg-card p-4 rounded-xl border border-border text-center">
              <p className="text-xs text-muted-foreground mb-1">Sàn giao dịch</p>
              <p className="font-semibold text-foreground">PancakeSwap</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
