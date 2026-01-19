import { useState, useEffect } from "react";
import { RefreshCw, TrendingUp, TrendingDown, ExternalLink, Copy, Check, Star, Share2, Info, Users } from "lucide-react";
import { useCamlyPrice } from "@/hooks/useCamlyPrice";
import { toast } from "sonner";
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
  const [copied, setCopied] = useState(false);
  const [activeTimeframe, setActiveTimeframe] = useState<"24h" | "1M" | "All">("24h");

  const copyContract = () => {
    navigator.clipboard.writeText(contractAddress);
    setCopied(true);
    toast.success("Đã sao chép địa chỉ contract");
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
    <section className="py-8 bg-background">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="max-w-7xl mx-auto">
          {isLoading && !priceData ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-destructive mb-4">{error}</p>
              <button
                onClick={refetch}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
              >
                Thử lại
              </button>
            </div>
          ) : priceData ? (
            <div className="grid lg:grid-cols-[380px_1fr] gap-6">
              {/* Left Panel - Price Info */}
              <div className="space-y-4">
                {/* Token Header */}
                <div className="flex items-center gap-3">
                  <img
                    src={camlyCoinLogo}
                    alt="Camly Coin"
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-foreground">Camly Coin</h1>
                    <span className="text-sm text-muted-foreground">CAMLY</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded">#7103</span>
                  <div className="flex items-center gap-2 ml-auto">
                    <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                      <Star className="w-4 h-4" />
                      <span>735</span>
                    </button>
                    <button className="p-1.5 hover:bg-muted rounded">
                      <Share2 className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>

                {/* Main Price */}
                <div>
                  <h2 className="text-4xl font-bold text-foreground tracking-tight">
                    {formatPriceExact(priceData.priceUsd)}
                  </h2>
                  <div className={`flex items-center gap-1 text-sm font-medium mt-1 ${
                    isPositive ? "text-green-500" : "text-red-500"
                  }`}>
                    {isPositive ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    <span>
                      {isPositive ? "" : ""}
                      {Math.abs(priceData.priceChange24h).toFixed(2)}% (24h)
                    </span>
                  </div>
                </div>

                {/* Market Stats */}
                <div className="space-y-3 pt-2">
                  {/* Market Cap */}
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Market cap</span>
                      <span className="text-amber-500 text-xs">⚠</span>
                      <Info className="w-3 h-3 text-muted-foreground" />
                    </div>
                    <div className="text-right">
                      <span className="font-semibold">{formatMarketNumber(priceData.marketCap)}</span>
                      <span className={`text-xs ml-2 ${isPositive ? "text-green-500" : "text-red-500"}`}>
                        {isPositive ? "▲" : "▼"} 0%
                      </span>
                    </div>
                  </div>

                  {/* Volume & FDV */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-xs text-muted-foreground">Volume (24h)</span>
                        <Info className="w-3 h-3 text-muted-foreground" />
                      </div>
                      <div className="font-semibold text-sm">{formatMarketNumber(priceData.volume24h)}</div>
                      <span className="text-xs text-green-500">▲ 26.96%</span>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-xs text-muted-foreground">FDV</span>
                        <Info className="w-3 h-3 text-muted-foreground" />
                      </div>
                      <div className="font-semibold text-sm">{formatMarketNumber(priceData.fdv)}</div>
                    </div>
                  </div>

                  {/* Vol/Mkt Cap & Holders */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-xs text-muted-foreground">Vol/Mkt Cap (24h)</span>
                        <Info className="w-3 h-3 text-muted-foreground" />
                      </div>
                      <div className="font-semibold text-sm">
                        {priceData.marketCap > 0 ? ((priceData.volume24h / priceData.marketCap) * 100).toFixed(2) : 0}%
                      </div>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-xs text-muted-foreground">Holders</span>
                        <Users className="w-3 h-3 text-muted-foreground" />
                      </div>
                      <div className="font-semibold text-sm">105.51K</div>
                    </div>
                  </div>

                  {/* Supply Info */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-xs text-muted-foreground">Total supply</span>
                        <Info className="w-3 h-3 text-muted-foreground" />
                      </div>
                      <div className="font-semibold text-sm">999.99B CAMLY</div>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-xs text-muted-foreground">Max. supply</span>
                        <Info className="w-3 h-3 text-muted-foreground" />
                      </div>
                      <div className="font-semibold text-sm">999.99B CAMLY</div>
                    </div>
                  </div>

                  {/* Circulating Supply */}
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground">Self-reported circulating supply</span>
                      <span className="text-amber-500 text-xs">⚠</span>
                      <Info className="w-3 h-3 text-muted-foreground" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">999.99B CAMLY</span>
                      <span className="w-4 h-4 rounded-full border-2 border-primary"></span>
                    </div>
                  </div>

                  {/* Contract Address */}
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Contract (BSC)</span>
                      <button
                        onClick={copyContract}
                        className="flex items-center gap-2 text-xs font-mono text-primary hover:text-primary/80"
                      >
                        <span className="truncate max-w-[180px]">{contractAddress}</span>
                        {copied ? (
                          <Check className="w-3.5 h-3.5 text-green-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Panel - Chart */}
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                {/* Chart Tabs */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <div className="flex items-center gap-1">
                    <button className="px-3 py-1.5 text-sm font-medium rounded-lg bg-primary/10 text-primary">
                      Chart
                    </button>
                    <button className="px-3 py-1.5 text-sm font-medium rounded-lg text-muted-foreground hover:bg-muted">
                      Markets
                    </button>
                    <button className="px-3 py-1.5 text-sm font-medium rounded-lg text-muted-foreground hover:bg-muted">
                      News
                    </button>
                    <button className="px-3 py-1.5 text-sm font-medium rounded-lg text-muted-foreground hover:bg-muted">
                      Holders
                    </button>
                  </div>
                  <a
                    href={`https://pancakeswap.finance/swap?outputCurrency=${contractAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90"
                  >
                    Buy CAMLY
                  </a>
                </div>

                {/* Chart Controls */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-border">
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1 text-xs font-medium rounded border border-border bg-muted/50">
                      Price
                    </button>
                    <button className="px-3 py-1 text-xs font-medium rounded border border-transparent text-muted-foreground hover:border-border">
                      Mkt Cap
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    {(["24h", "1M", "All"] as const).map((tf) => (
                      <button
                        key={tf}
                        onClick={() => setActiveTimeframe(tf)}
                        className={`px-3 py-1 text-xs font-medium rounded ${
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
                <div className="p-4">
                  <div className="h-[300px] lg:h-[400px]">
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
                        Đang tải dữ liệu biểu đồ...
                      </div>
                    )}
                  </div>

                  {/* Current Price Label */}
                  {priceHistory.length > 1 && (
                    <div className="flex justify-end mt-2">
                      <span className={`px-2 py-1 text-xs font-bold rounded ${
                        isPositive ? "bg-red-500 text-white" : "bg-red-500 text-white"
                      }`}>
                        {formatPriceExact(currentPrice).replace('$', '')}
                      </span>
                    </div>
                  )}
                </div>

                {/* External Links */}
                <div className="px-4 py-3 border-t border-border flex flex-wrap gap-2">
                  <a
                    href={`https://dexscreener.com/bsc/${priceData.pairAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-muted hover:bg-muted/80"
                  >
                    <img src="https://dexscreener.com/favicon.ico" alt="" className="w-3 h-3" />
                    DEXScreener
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <a
                    href={`https://bscscan.com/token/${contractAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-muted hover:bg-muted/80"
                  >
                    BSCScan
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <a
                    href="https://coinmarketcap.com/currencies/camly-coin/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-muted hover:bg-muted/80"
                  >
                    CoinMarketCap
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    onClick={refetch}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-primary/10 text-primary hover:bg-primary/20 ml-auto"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
                    Làm mới
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
