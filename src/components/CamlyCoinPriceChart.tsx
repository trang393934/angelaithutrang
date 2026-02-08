import { useState, useEffect } from "react";
import { RefreshCw, TrendingUp, TrendingDown, ExternalLink, Copy, Check, Star, Share2, Info, Users } from "lucide-react";
import { useCamlyPrice } from "@/hooks/useCamlyPrice";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import camlyCoinLogo from "@/assets/camly-coin-logo.png";

export const CamlyCoinPriceChart = () => {
  const { priceData, priceHistory, isLoading, error, refetch, contractAddress } = useCamlyPrice();
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [activeTimeframe, setActiveTimeframe] = useState<"24h" | "1M" | "All">("24h");

  const copyContract = () => {
    navigator.clipboard.writeText(contractAddress);
    setCopied(true);
    toast.success(t("chart.contractCopied"));
    setTimeout(() => setCopied(false), 2000);
  };

  // Format price with exact decimal precision like CoinMarketCap
  const formatPriceExact = (price: number): string => {
    if (price === 0) return "$0.00";
    if (price < 0.00000001) return `$${price.toExponential(2)}`;
    if (price < 0.0001) {
      // Format like $0.00001715
      return `$${price.toFixed(8).replace(/\.?0+$/, '')}`;
    }
    if (price < 1) return `$${price.toFixed(6)}`;
    if (price < 100) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(2)}`;
  };

  // Format large numbers with B, M, K suffix
  const formatMarketNumber = (num: number): string => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  // Format supply numbers
  const formatSupply = (num: number): string => {
    if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toLocaleString();
  };

  const isPositive = (priceData?.priceChange24h || 0) >= 0;

  // Calculate min/max for chart
  const minPrice = priceHistory.length > 0 ? Math.min(...priceHistory.map(p => p.price)) * 0.999 : 0;
  const maxPrice = priceHistory.length > 0 ? Math.max(...priceHistory.map(p => p.price)) * 1.001 : 0;
  const currentPrice = priceData?.priceUsd || 0;

  return (
    <section className="py-4 sm:py-6 lg:py-8 bg-white/60 backdrop-blur-[2px] overflow-hidden">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6">
        <div className="max-w-7xl mx-auto">
          {isLoading && !priceData ? (
            <div className="flex items-center justify-center py-12 sm:py-20">
              <RefreshCw className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-12 sm:py-20">
              <p className="text-destructive mb-4 text-sm sm:text-base">{error}</p>
              <button
                onClick={refetch}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm"
              >
                {t("chart.retry")}
              </button>
            </div>
          ) : priceData ? (
            <div className="flex flex-col lg:grid lg:grid-cols-[340px_1fr] gap-4 lg:gap-6">
              {/* Left Panel - Price Info */}
              <div className="space-y-3 sm:space-y-4">
                {/* Token Header */}
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <img
                    src={camlyCoinLogo}
                    alt="Camly Coin"
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0"
                  />
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                    <h1 className="text-base sm:text-xl font-bold text-foreground truncate">Camly Coin</h1>
                    <span className="text-xs sm:text-sm text-muted-foreground">CAMLY</span>
                  </div>
                  <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 bg-muted text-muted-foreground rounded hidden sm:inline">#7103</span>
                  <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
                    <button className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground hover:text-foreground">
                      <Star className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">735</span>
                    </button>
                    <button className="p-1 sm:p-1.5 hover:bg-muted rounded">
                      <Share2 className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>

                {/* Main Price */}
                <div>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground tracking-tight">
                    {formatPriceExact(priceData.priceUsd)}
                  </h2>
                  <div className={`flex items-center gap-1 text-xs sm:text-sm font-medium mt-1 ${
                    isPositive ? "text-green-500" : "text-red-500"
                  }`}>
                    {isPositive ? (
                      <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                    ) : (
                      <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4" />
                    )}
                    <span>
                      {Math.abs(priceData.priceChange24h).toFixed(2)}% (24h)
                    </span>
                  </div>
                </div>

                {/* Market Stats - Compact for Mobile */}
                <div className="space-y-2 sm:space-y-3 pt-2">
                  {/* Market Cap */}
                  <div className="flex items-center justify-between p-2 sm:p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <span className="text-xs sm:text-sm text-muted-foreground">Market cap</span>
                      <Info className="w-3 h-3 text-muted-foreground hidden sm:block" />
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-xs sm:text-sm">{formatMarketNumber(priceData.marketCap)}</span>
                    </div>
                  </div>

                  {/* Volume & FDV */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <div className="p-2 sm:p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-1 mb-0.5 sm:mb-1">
                        <span className="text-[10px] sm:text-xs text-muted-foreground">Volume 24h</span>
                      </div>
                      <div className="font-semibold text-xs sm:text-sm">{formatMarketNumber(priceData.volume24h)}</div>
                    </div>
                    <div className="p-2 sm:p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-1 mb-0.5 sm:mb-1">
                        <span className="text-[10px] sm:text-xs text-muted-foreground">FDV</span>
                      </div>
                      <div className="font-semibold text-xs sm:text-sm">{formatMarketNumber(priceData.fdv)}</div>
                    </div>
                  </div>

                  {/* Vol/Mkt Cap & Holders - Hidden on very small screens */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <div className="p-2 sm:p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-1 mb-0.5 sm:mb-1">
                        <span className="text-[10px] sm:text-xs text-muted-foreground">Vol/Mkt</span>
                      </div>
                      <div className="font-semibold text-xs sm:text-sm">
                        {priceData.marketCap > 0 ? ((priceData.volume24h / priceData.marketCap) * 100).toFixed(2) : 0}%
                      </div>
                    </div>
                    <div className="p-2 sm:p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-1 mb-0.5 sm:mb-1">
                        <span className="text-[10px] sm:text-xs text-muted-foreground">Holders</span>
                      </div>
                      <div className="font-semibold text-xs sm:text-sm">105.51K</div>
                    </div>
                  </div>

                  {/* Contract Address - Always visible */}
                  <div className="p-2 sm:p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">Contract (BSC)</span>
                      <button
                        onClick={copyContract}
                        className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs font-mono text-primary hover:text-primary/80 min-w-0"
                      >
                        <span className="truncate max-w-[120px] sm:max-w-[180px]">{contractAddress}</span>
                        {copied ? (
                          <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-500 flex-shrink-0" />
                        ) : (
                          <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Panel - Chart */}
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                {/* Chart Tabs - Scrollable on mobile */}
                <div className="flex items-center justify-between px-2 sm:px-4 py-2 sm:py-3 border-b border-border gap-2">
                  <div className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto scrollbar-none">
                    <button className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-lg bg-primary/10 text-primary whitespace-nowrap">
                      Chart
                    </button>
                    <button className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-lg text-muted-foreground hover:bg-muted whitespace-nowrap">
                      Markets
                    </button>
                    <button className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-lg text-muted-foreground hover:bg-muted whitespace-nowrap">
                      News
                    </button>
                    <button className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-lg text-muted-foreground hover:bg-muted whitespace-nowrap hidden sm:block">
                      Holders
                    </button>
                  </div>
                  <a
                    href={`https://pancakeswap.finance/swap?outputCurrency=${contractAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 sm:px-4 py-1 sm:py-1.5 bg-primary text-primary-foreground text-xs sm:text-sm font-medium rounded-lg hover:bg-primary/90 whitespace-nowrap flex-shrink-0"
                  >
                    Buy CAMLY
                  </a>
                </div>

                {/* Chart Controls */}
                <div className="flex items-center justify-between px-2 sm:px-4 py-1.5 sm:py-2 border-b border-border">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <button className="px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium rounded border border-border bg-muted/50">
                      Price
                    </button>
                    <button className="px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium rounded border border-transparent text-muted-foreground hover:border-border">
                      Mkt Cap
                    </button>
                  </div>
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    {(["24h", "1M", "All"] as const).map((tf) => (
                      <button
                        key={tf}
                        onClick={() => setActiveTimeframe(tf)}
                        className={`px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium rounded ${
                          activeTimeframe === tf
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chart Area */}
                <div className="p-2 sm:p-4">
                  <div className="h-[200px] sm:h-[280px] lg:h-[350px]">
                    {priceHistory.length > 1 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={priceHistory} margin={{ top: 10, right: 60, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorPriceCMC" x1="0" y1="0" x2="0" y2="1">
                              <stop
                                offset="5%"
                                stopColor={isPositive ? "#22c55e" : "#ef4444"}
                                stopOpacity={0.15}
                              />
                              <stop
                                offset="95%"
                                stopColor={isPositive ? "#22c55e" : "#ef4444"}
                                stopOpacity={0.02}
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
                            tick={{ fontSize: 10, fill: "#888" }}
                            axisLine={false}
                            tickLine={false}
                            minTickGap={50}
                          />
                          <YAxis
                            domain={[minPrice, maxPrice]}
                            tickFormatter={(val) => val.toFixed(8)}
                            tick={{ fontSize: 9, fill: "#888" }}
                            axisLine={false}
                            tickLine={false}
                            width={70}
                            orientation="right"
                          />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
                                    <p className="text-xs text-muted-foreground mb-1">
                                      {new Date(payload[0].payload.timestamp).toLocaleString("vi-VN")}
                                    </p>
                                    <p className="font-bold text-foreground">
                                      {formatPriceExact(payload[0].value as number)}
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <ReferenceLine
                            y={currentPrice}
                            stroke={isPositive ? "#22c55e" : "#ef4444"}
                            strokeDasharray="3 3"
                            strokeWidth={1}
                          />
                          <Area
                            type="monotone"
                            dataKey="price"
                            stroke={isPositive ? "#22c55e" : "#ef4444"}
                            strokeWidth={2}
                            fill="url(#colorPriceCMC)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                        {t("chart.loadingChart")}
                      </div>
                    )}
                  </div>

                  {/* Current Price Label */}
                  {priceHistory.length > 1 && (
                    <div className="flex justify-end mt-1 sm:mt-2">
                      <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-bold rounded ${
                        isPositive ? "bg-green-500 text-white" : "bg-red-500 text-white"
                      }`}>
                        {formatPriceExact(currentPrice).replace('$', '')}
                      </span>
                    </div>
                  )}
                </div>

                {/* External Links - Compact on mobile */}
                <div className="px-2 sm:px-4 py-2 sm:py-3 border-t border-border flex flex-wrap gap-1.5 sm:gap-2">
                  <a
                    href={`https://dexscreener.com/bsc/${priceData.pairAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium rounded-full bg-muted hover:bg-muted/80"
                  >
                    <img src="https://dexscreener.com/favicon.ico" alt="" className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    DEXScreener
                    <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  </a>
                  <a
                    href={`https://bscscan.com/token/${contractAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium rounded-full bg-muted hover:bg-muted/80"
                  >
                    BSCScan
                    <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  </a>
                  <a
                    href="https://coinmarketcap.com/currencies/camly-coin/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium rounded-full bg-muted hover:bg-muted/80"
                  >
                    CoinMarketCap
                    <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  </a>
                  <button
                    onClick={refetch}
                    className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium rounded-full bg-primary/10 text-primary hover:bg-primary/20 ml-auto"
                  >
                    <RefreshCw className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${isLoading ? "animate-spin" : ""}`} />
                    {t("chart.refresh")}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
};
