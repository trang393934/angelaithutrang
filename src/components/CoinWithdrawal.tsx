import { useState, useEffect } from "react";
import { Wallet, ArrowUpRight, AlertCircle, CheckCircle2, Clock, XCircle, Loader2, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWeb3Wallet } from "@/hooks/useWeb3Wallet";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "@/hooks/use-toast";
import camlyCoinLogo from "@/assets/camly-coin-logo.png";

interface WithdrawalStatus {
  can_withdraw: boolean;
  available_balance: number;
  withdrawn_today: number;
  remaining_daily_limit: number;
  total_withdrawn: number;
  pending_amount: number;
}

interface WithdrawalHistory {
  id: string;
  amount: number;
  wallet_address: string;
  status: string;
  tx_hash: string | null;
  created_at: string;
}

const MIN_WITHDRAWAL = 200000;
const MAX_DAILY_WITHDRAWAL = 500000;

export function CoinWithdrawal() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { isConnected, address, connect, hasWallet } = useWeb3Wallet();
  
  const [withdrawalStatus, setWithdrawalStatus] = useState<WithdrawalStatus | null>(null);
  const [withdrawalHistory, setWithdrawalHistory] = useState<WithdrawalHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");

  useEffect(() => {
    if (user) {
      fetchWithdrawalStatus();
      fetchWithdrawalHistory();
      
      // Subscribe to realtime updates
      const channel = supabase
        .channel('withdrawal_updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'coin_withdrawals',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchWithdrawalStatus();
            fetchWithdrawalHistory();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchWithdrawalStatus = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .rpc('get_user_withdrawal_status', { _user_id: user.id });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setWithdrawalStatus(data[0]);
      }
    } catch (error) {
      console.error('Error fetching withdrawal status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWithdrawalHistory = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('coin_withdrawals')
        .select('id, amount, wallet_address, status, tx_hash, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setWithdrawalHistory(data || []);
    } catch (error) {
      console.error('Error fetching withdrawal history:', error);
    }
  };

  const handleWithdraw = async () => {
    if (!user || !address || !withdrawAmount) return;

    const amount = parseInt(withdrawAmount);
    
    if (isNaN(amount) || amount < MIN_WITHDRAWAL) {
      toast({
        title: "Lỗi",
        description: `Số lượng rút tối thiểu là ${MIN_WITHDRAWAL.toLocaleString()} Camly Coin`,
        variant: "destructive",
      });
      return;
    }

    if (withdrawalStatus && amount > withdrawalStatus.remaining_daily_limit) {
      toast({
        title: "Lỗi",
        description: `Giới hạn còn lại hôm nay: ${withdrawalStatus.remaining_daily_limit.toLocaleString()} Camly Coin`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .rpc('request_coin_withdrawal', {
          _user_id: user.id,
          _wallet_address: address,
          _amount: amount,
        });

      if (error) throw error;

      const result = data?.[0];
      
      if (result?.success) {
        toast({
          title: "Thành công!",
          description: result.message,
        });
        setShowDialog(false);
        setWithdrawAmount("");
        fetchWithdrawalStatus();
        fetchWithdrawalHistory();
      } else {
        toast({
          title: "Lỗi",
          description: result?.message || "Không thể xử lý yêu cầu rút",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error requesting withdrawal:', error);
      toast({
        title: "Lỗi",
        description: "Không thể gửi yêu cầu rút. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'pending':
      case 'processing':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'failed':
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Hoàn thành';
      case 'pending': return 'Chờ xử lý';
      case 'processing': return 'Đang xử lý';
      case 'failed': return 'Thất bại';
      case 'rejected': return 'Từ chối';
      default: return status;
    }
  };

  const getShortAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isLoading) {
    return (
      <Card className="border-divine-gold/20 shadow-soft animate-pulse">
        <CardContent className="p-6">
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4" />
          <div className="h-20 bg-gray-100 rounded" />
        </CardContent>
      </Card>
    );
  }

  const canWithdraw = withdrawalStatus?.can_withdraw && 
                       withdrawalStatus.available_balance >= MIN_WITHDRAWAL &&
                       withdrawalStatus.pending_amount === 0;

  const dailyProgress = withdrawalStatus 
    ? (withdrawalStatus.withdrawn_today / MAX_DAILY_WITHDRAWAL) * 100 
    : 0;

  return (
    <Card className="border-divine-gold/20 shadow-soft overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-divine-gold/10 to-amber-100/50 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-divine-gold/20">
              <ArrowUpRight className="w-5 h-5 text-divine-gold" />
            </div>
            <div>
              <CardTitle className="text-lg">{t("withdrawal.title") || "Rút Camly Coin"}</CardTitle>
              <CardDescription>{t("withdrawal.subtitle") || "Chuyển về ví Web3 của bạn"}</CardDescription>
            </div>
          </div>
          <img src={camlyCoinLogo} alt="Camly Coin" className="w-10 h-10" />
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Balance & Limits Info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
            <p className="text-xs text-foreground-muted">Số dư khả dụng</p>
            <p className="text-lg font-bold text-primary">
              {withdrawalStatus?.available_balance.toLocaleString() || 0}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-green-50 border border-green-100">
            <p className="text-xs text-foreground-muted">Tổng đã rút</p>
            <p className="text-lg font-bold text-green-600">
              {withdrawalStatus?.total_withdrawn.toLocaleString() || 0}
            </p>
          </div>
        </div>

        {/* Daily Limit Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-foreground-muted">Giới hạn hôm nay</span>
            <span className="font-medium">
              {withdrawalStatus?.withdrawn_today.toLocaleString() || 0} / {MAX_DAILY_WITHDRAWAL.toLocaleString()}
            </span>
          </div>
          <Progress value={dailyProgress} className="h-2" />
          <p className="text-xs text-foreground-muted">
            Còn lại: <span className="font-medium text-primary">{withdrawalStatus?.remaining_daily_limit.toLocaleString() || MAX_DAILY_WITHDRAWAL.toLocaleString()}</span> Camly Coin
          </p>
        </div>

        {/* Pending Warning */}
        {withdrawalStatus?.pending_amount && withdrawalStatus.pending_amount > 0 && (
          <Alert className="border-amber-200 bg-amber-50">
            <Clock className="w-4 h-4 text-amber-600" />
            <AlertDescription className="text-amber-700">
              Đang có yêu cầu rút {withdrawalStatus.pending_amount.toLocaleString()} Camly Coin chờ xử lý
            </AlertDescription>
          </Alert>
        )}

        {/* Withdraw Button */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button 
              className="w-full bg-gradient-to-r from-divine-gold to-amber-500 hover:from-divine-gold/90 hover:to-amber-500/90 text-white"
              disabled={!canWithdraw}
            >
              <Wallet className="w-4 h-4 mr-2" />
              {!canWithdraw 
                ? (withdrawalStatus?.available_balance || 0) < MIN_WITHDRAWAL 
                  ? `Tối thiểu ${MIN_WITHDRAWAL.toLocaleString()} Camly Coin`
                  : withdrawalStatus?.pending_amount ? "Đang có yêu cầu chờ xử lý" : "Không thể rút"
                : "Rút về ví Web3"
              }
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-divine-gold" />
                Rút Camly Coin về ví Web3
              </DialogTitle>
              <DialogDescription>
                Nhập số lượng muốn rút. Tối thiểu 200,000, tối đa 500,000/ngày.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {!isConnected ? (
                <Alert className="border-primary/20 bg-primary/5">
                  <Info className="w-4 h-4 text-primary" />
                  <AlertDescription>
                    Vui lòng kết nối ví Web3 để tiếp tục
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                  <p className="text-xs text-green-600">Ví đã kết nối</p>
                  <p className="font-mono text-sm">{getShortAddress(address || '')}</p>
                </div>
              )}

              {!isConnected ? (
                <Button onClick={connect} className="w-full" disabled={!hasWallet}>
                  <Wallet className="w-4 h-4 mr-2" />
                  {hasWallet ? "Kết nối ví" : "Cài đặt MetaMask"}
                </Button>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Số lượng rút</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder={`Tối thiểu ${MIN_WITHDRAWAL.toLocaleString()}`}
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      min={MIN_WITHDRAWAL}
                      max={Math.min(
                        withdrawalStatus?.available_balance || 0,
                        withdrawalStatus?.remaining_daily_limit || MAX_DAILY_WITHDRAWAL
                      )}
                    />
                    <div className="flex justify-between text-xs text-foreground-muted">
                      <span>Khả dụng: {withdrawalStatus?.available_balance.toLocaleString()}</span>
                      <button 
                        className="text-primary hover:underline"
                        onClick={() => setWithdrawAmount(
                          Math.min(
                            withdrawalStatus?.available_balance || 0,
                            withdrawalStatus?.remaining_daily_limit || MAX_DAILY_WITHDRAWAL
                          ).toString()
                        )}
                      >
                        Tối đa
                      </button>
                    </div>
                  </div>

                  <Alert className="border-amber-200 bg-amber-50">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <AlertDescription className="text-xs text-amber-700">
                      Yêu cầu rút sẽ được xử lý trong vòng 24-48 giờ. 
                      Camly Coin sẽ được chuyển về ví BSC của bạn.
                    </AlertDescription>
                  </Alert>
                </>
              )}
            </div>

            {isConnected && (
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDialog(false)}>
                  Hủy
                </Button>
                <Button 
                  onClick={handleWithdraw} 
                  disabled={isSubmitting || !withdrawAmount || parseInt(withdrawAmount) < MIN_WITHDRAWAL}
                  className="bg-gradient-to-r from-divine-gold to-amber-500"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <ArrowUpRight className="w-4 h-4 mr-2" />
                      Xác nhận rút
                    </>
                  )}
                </Button>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>

        {/* Withdrawal History */}
        {withdrawalHistory.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <p className="text-xs font-medium text-foreground-muted">Lịch sử rút gần đây</p>
            <div className="space-y-2">
              {withdrawalHistory.slice(0, 3).map((withdrawal) => (
                <div 
                  key={withdrawal.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-gray-50 text-sm"
                >
                  <div className="flex items-center gap-2">
                    {getStatusIcon(withdrawal.status)}
                    <div>
                      <p className="font-medium">{withdrawal.amount.toLocaleString()} CAMLY</p>
                      <p className="text-xs text-foreground-muted">
                        {new Date(withdrawal.created_at).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-medium ${
                      withdrawal.status === 'completed' ? 'text-green-600' :
                      withdrawal.status === 'pending' || withdrawal.status === 'processing' ? 'text-amber-600' :
                      'text-red-500'
                    }`}>
                      {getStatusText(withdrawal.status)}
                    </p>
                    {withdrawal.tx_hash && (
                      <a 
                        href={`https://bscscan.com/tx/${withdrawal.tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        Xem TX
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default CoinWithdrawal;
