import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface OnChainTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  tokenSymbol: string;
  tokenName?: string;
  tokenDecimal: string;
  contractAddress?: string;
  timestamp: number;
  type: "normal" | "token" | "internal";
  source: "angel_ai" | "external";
  direction: "in" | "out";
  counterparty_name?: string;
  status: "confirmed" | "pending" | "failed";
}

export interface OnChainBalances {
  bnb: string;
  camly: string;
}

interface UseOnChainTransactionsReturn {
  transactions: OnChainTransaction[];
  balances: OnChainBalances | null;
  isLoading: boolean;
  error: string | null;
  fetchOnChain: (walletAddress: string) => Promise<void>;
}

export function useOnChainTransactions(): UseOnChainTransactionsReturn {
  const [transactions, setTransactions] = useState<OnChainTransaction[]>([]);
  const [balances, setBalances] = useState<OnChainBalances | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOnChain = useCallback(async (walletAddress: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Chưa đăng nhập");
        setIsLoading(false);
        return;
      }

      const res = await supabase.functions.invoke("fetch-wallet-transactions", {
        body: { wallet_address: walletAddress },
      });

      if (res.error) {
        setError(res.error.message || "Lỗi khi tải giao dịch on-chain");
        setIsLoading(false);
        return;
      }

      const data = res.data;
      setTransactions(data.transactions || []);
      setBalances(data.balances || null);
    } catch (err: any) {
      setError(err.message || "Lỗi không xác định");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { transactions, balances, isLoading, error, fetchOnChain };
}
