import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Bell, Wallet, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface NewWithdrawal {
  id: string;
  amount: number;
  wallet_address: string;
  created_at: string;
}

export const useNewWithdrawalNotification = () => {
  const [newWithdrawals, setNewWithdrawals] = useState<NewWithdrawal[]>([]);

  useEffect(() => {
    // Subscribe to new withdrawals
    const channel = supabase
      .channel('admin-withdrawals')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'coin_withdrawals',
          filter: 'status=eq.pending'
        },
        (payload) => {
          console.log('New withdrawal detected:', payload);
          const newWithdrawal = payload.new as NewWithdrawal;
          
          setNewWithdrawals(prev => [newWithdrawal, ...prev]);
          
          // Show toast notification
          toast.custom((t) => (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg shadow-lg p-4 max-w-md">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <Bell className="w-5 h-5 text-amber-600 animate-pulse" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-amber-800">Yêu cầu rút mới!</p>
                  <p className="text-sm text-amber-600">
                    {Math.floor(newWithdrawal.amount).toLocaleString()} CAMLY
                  </p>
                  <p className="text-xs text-amber-500 truncate">
                    {newWithdrawal.wallet_address}
                  </p>
                </div>
                <Link 
                  to="/admin/withdrawals"
                  className="flex items-center gap-1 text-sm text-amber-600 hover:text-amber-800 font-medium"
                  onClick={() => toast.dismiss(t)}
                >
                  Xem <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ), {
            duration: 10000,
            position: 'top-right'
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { newWithdrawals };
};

export const NewWithdrawalBadge = ({ count }: { count: number }) => {
  if (count === 0) return null;
  
  return (
    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
      {count > 9 ? '9+' : count}
    </span>
  );
};
