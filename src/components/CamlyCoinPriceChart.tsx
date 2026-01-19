import { useEffect, useRef } from "react";

export const CamlyCoinPriceChart = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create CoinMarketCap widget script
    const script = document.createElement("script");
    script.src = "https://files.coinmarketcap.com/static/widget/currency.js";
    script.async = true;
    
    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current && script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  return (
    <section className="py-12 bg-gradient-to-b from-amber-50/50 to-background dark:from-amber-950/20 dark:to-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-8">
          <h2 className="font-serif text-2xl md:text-3xl font-semibold text-primary-deep mb-2">
            Giá Camly Coin
          </h2>
          <p className="text-foreground-muted">
            Theo dõi giá và biến động của CAMLY trên thị trường
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div 
            ref={containerRef}
            className="bg-card rounded-2xl shadow-lg border border-border overflow-hidden p-4"
          >
            {/* CoinMarketCap Widget */}
            <div 
              className="coinmarketcap-currency-widget" 
              data-currencyid="36393"
              data-base="VND"
              data-secondary="USD"
              data-ticker="true"
              data-rank="true"
              data-marketcap="true"
              data-volume="true"
              data-sta498="true"
              data-stats="USD"
            />
            
            {/* Fallback / Additional Info */}
            <div className="mt-6 pt-4 border-t border-border">
              <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
                <a
                  href="https://coinmarketcap.com/currencies/camly-coin/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors"
                >
                  <img 
                    src="https://s2.coinmarketcap.com/static/cloud/img/fav-icons/apple-touch-icon.png" 
                    alt="CoinMarketCap" 
                    className="w-4 h-4"
                  />
                  <span>Xem trên CoinMarketCap</span>
                </a>
                <a
                  href="https://bscscan.com/token/0x3CE2eb776292f2e4De2b19F1FFc14bA3D77b097D"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                  <span>Xem trên BSCScan</span>
                </a>
              </div>
            </div>
          </div>

          {/* Price Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-card p-4 rounded-xl border border-border text-center">
              <p className="text-xs text-muted-foreground mb-1">Mạng lưới</p>
              <p className="font-semibold text-foreground">BSC (BEP-20)</p>
            </div>
            <div className="bg-card p-4 rounded-xl border border-border text-center">
              <p className="text-xs text-muted-foreground mb-1">Tổng cung</p>
              <p className="font-semibold text-foreground">1B CAMLY</p>
            </div>
            <div className="bg-card p-4 rounded-xl border border-border text-center">
              <p className="text-xs text-muted-foreground mb-1">Contract</p>
              <p className="font-mono text-xs text-foreground truncate">0x3CE2...097D</p>
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
