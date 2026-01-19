import { useState, useEffect, useCallback } from "react";

// Correct Camly Coin Contract Address on BSC
const CAMLY_CONTRACT = "0x0910320181889fefde0bb1ca63962b0a8882e413";

export interface CamlyPriceData {
  priceUsd: number;
  priceVnd: number;
  priceBnb: number;
  priceChange24h: number;
  volume24h: number;
  liquidity: number;
  marketCap: number;
  fdv: number;
  pairAddress: string;
  lastUpdated: Date;
}

export interface PriceHistory {
  timestamp: number;
  price: number;
}

export function useCamlyPrice() {
  const [priceData, setPriceData] = useState<CamlyPriceData | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // USD to VND exchange rate (approximate)
  const USD_TO_VND = 25000;

  const fetchPrice = useCallback(async () => {
    try {
      // Fetch from DEXScreener API (free, no API key required)
      const response = await fetch(
        `https://api.dexscreener.com/latest/dex/tokens/${CAMLY_CONTRACT}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch price data");
      }

      const data = await response.json();
      
      if (data.pairs && data.pairs.length > 0) {
        // Get the pair with highest liquidity (usually the main trading pair)
        const mainPair = data.pairs.reduce((best: any, current: any) => {
          const currentLiquidity = parseFloat(current.liquidity?.usd || 0);
          const bestLiquidity = parseFloat(best.liquidity?.usd || 0);
          return currentLiquidity > bestLiquidity ? current : best;
        }, data.pairs[0]);

        const priceUsd = parseFloat(mainPair.priceUsd || 0);
        const priceChange24h = parseFloat(mainPair.priceChange?.h24 || 0);
        const volume24h = parseFloat(mainPair.volume?.h24 || 0);
        const liquidity = parseFloat(mainPair.liquidity?.usd || 0);
        const fdv = parseFloat(mainPair.fdv || 0);
        const marketCap = parseFloat(mainPair.marketCap || fdv);
        
        // Calculate BNB price (approximate based on BNB price ~$600)
        const priceBnb = priceUsd / 600;

        const newPriceData: CamlyPriceData = {
          priceUsd,
          priceVnd: priceUsd * USD_TO_VND,
          priceBnb,
          priceChange24h,
          volume24h,
          liquidity,
          marketCap,
          fdv,
          pairAddress: mainPair.pairAddress,
          lastUpdated: new Date(),
        };

        setPriceData(newPriceData);

        // Add to price history
        setPriceHistory(prev => {
          const newHistory = [...prev, {
            timestamp: Date.now(),
            price: priceUsd
          }];
          // Keep last 60 data points (1 hour of data with 1 minute intervals)
          return newHistory.slice(-60);
        });

        setError(null);
      } else {
        throw new Error("No trading pairs found");
      }
    } catch (err: any) {
      console.error("Price fetch error:", err);
      setError(err.message || "Failed to fetch price");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchPrice();
  }, [fetchPrice]);

  // Auto-refresh every 1 minute
  useEffect(() => {
    const interval = setInterval(fetchPrice, 60000); // 60 seconds
    return () => clearInterval(interval);
  }, [fetchPrice]);

  return {
    priceData,
    priceHistory,
    isLoading,
    error,
    refetch: fetchPrice,
    contractAddress: CAMLY_CONTRACT,
  };
}
