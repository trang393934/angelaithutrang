import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Wallet, RefreshCw, AlertTriangle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import camlyCoinLogo from "@/assets/camly-coin-logo.png";

interface TreasuryBalance {
  treasury_address: string;
  bnb_balance: number;
  camly_balance: number;
  updated_at: string;
}

export const TreasuryBalanceCard = () => {
  const [balance, setBalance] = useState<TreasuryBalance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('get-treasury-balance');
      
      if (error) throw error;
      
      if (data?.success) {
        setBalance(data);
      } else {
        throw new Error(data?.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Error fetching treasury balance:', err);
      setError(err instanceof Error ? err.message : 'Không thể tải balance');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
    // Auto refresh every 2 minutes
    const interval = setInterval(fetchBalance, 120000);
    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number, decimals: number = 4) => {
    return num.toLocaleString('vi-VN', { 
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals 
    });
  };

  const shortAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Warning thresholds
  const isBnbLow = balance && balance.bnb_balance < 0.01; // Less than 0.01 BNB
  const isCamlyLow = balance && balance.camly_balance < 500000; // Less than 500k CAMLY

  if (error) {
    return (
      <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-2xl p-4 border border-red-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-red-700">Lỗi tải Treasury</p>
              <p className="text-xs text-red-500">{error}</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchBalance}
            className="border-red-200 text-red-600 hover:bg-red-50"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-primary-pale to-violet-50 rounded-2xl p-4 border border-primary/20 shadow-soft">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-primary-deep">Treasury Balance</h3>
        </div>
        <div className="flex items-center gap-2">
          {balance && (
            <a 
              href={`https://bscscan.com/address/${balance.treasury_address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-foreground-muted hover:text-primary flex items-center gap-1"
            >
              {shortAddress(balance.treasury_address)}
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={fetchBalance}
            disabled={isLoading}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* BNB Balance */}
        <div className={`rounded-xl p-3 ${isBnbLow ? 'bg-red-100 border border-red-200' : 'bg-white/60'}`}>
          <div className="flex items-center gap-2 mb-1">
            <img 
              src="https://cryptologos.cc/logos/bnb-bnb-logo.png" 
              alt="BNB" 
              className="w-6 h-6"
            />
            <span className="text-sm font-medium">BNB (Gas)</span>
            {isBnbLow && <AlertTriangle className="w-4 h-4 text-red-500" />}
          </div>
          {isLoading ? (
            <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
          ) : (
            <>
              <p className={`text-lg font-bold ${isBnbLow ? 'text-red-600' : 'text-foreground'}`}>
                {balance ? formatNumber(balance.bnb_balance) : '0'} BNB
              </p>
              {isBnbLow && (
                <p className="text-xs text-red-500 mt-1">⚠️ Cần nạp thêm BNB!</p>
              )}
            </>
          )}
        </div>

        {/* CAMLY Balance */}
        <div className={`rounded-xl p-3 ${isCamlyLow ? 'bg-amber-100 border border-amber-200' : 'bg-white/60'}`}>
          <div className="flex items-center gap-2 mb-1">
            <img 
              src={camlyCoinLogo} 
              alt="CAMLY" 
              className="w-6 h-6"
            />
            <span className="text-sm font-medium">CAMLY</span>
            {isCamlyLow && <AlertTriangle className="w-4 h-4 text-amber-500" />}
          </div>
          {isLoading ? (
            <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
          ) : (
            <>
              <p className={`text-lg font-bold ${isCamlyLow ? 'text-amber-600' : 'text-foreground'}`}>
                {balance ? Math.floor(balance.camly_balance).toLocaleString('vi-VN') : '0'}
              </p>
              {isCamlyLow && (
                <p className="text-xs text-amber-500 mt-1">⚠️ Cần nạp thêm CAMLY!</p>
              )}
            </>
          )}
        </div>
      </div>

      {balance && (
        <p className="text-xs text-foreground-muted mt-3 text-center">
          Cập nhật: {new Date(balance.updated_at).toLocaleString('vi-VN')}
        </p>
      )}
    </div>
  );
};
