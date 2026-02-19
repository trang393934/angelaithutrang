import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FUNMoneyBalanceCard } from "@/components/mint/FUNMoneyBalanceCard";
import { MintActionsList } from "@/components/mint/MintActionsList";
import { TokenLifecyclePanel } from "@/components/mint/TokenLifecyclePanel";
import { useAuth } from "@/hooks/useAuth";
import { useUnmintedCount } from "@/hooks/useUnmintedCount";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ArrowRight, Coins, Sparkles, Shield, Zap, ExternalLink, Info, Lock, ChevronDown, Wallet, CheckCircle2, Download, AlertTriangle, PauseCircle } from "lucide-react";
import funMoneyLogo from "@/assets/fun-money-logo.png";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

export default function Mint() {
  const { user } = useAuth();
  const { unmintedCount } = useUnmintedCount(user?.id);
  const [guideOpen, setGuideOpen] = useState(true);
  const [mintPaused, setMintPaused] = useState(false);
  const [pausedReason, setPausedReason] = useState("");
  const [settingsLoading, setSettingsLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("system_settings")
      .select("value")
      .eq("key", "mint_system")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value) {
          const val = data.value as Record<string, unknown>;
          setMintPaused(!!val.paused);
          setPausedReason((val.paused_reason as string) || "");
        }
        setSettingsLoading(false);
      });
  }, []);
 
  return (
    <>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />

        <main className="flex-1 container mx-auto px-4 py-8 pt-28">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-sm font-medium">
                <Sparkles className="h-4 w-4" />
                Proof of Pure Love Protocol
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                Mint FUN Money
              </h1>
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                Claim FUN Money token (BEP-20) về ví của bạn từ các Light Actions đã được Angel AI xác nhận.
              </p>
            </div>

            {/* 🚨 MINT PAUSED BANNER - Hiển thị nổi bật khi hệ thống dừng */}
            {mintPaused && (
              <Alert className="border-red-400 bg-red-50 dark:bg-red-950/40">
                <PauseCircle className="h-5 w-5 text-red-600" />
                <AlertTitle className="text-red-700 dark:text-red-400 text-base font-bold">
                  🚨 Hệ thống Mint FUN Money đang tạm dừng
                </AlertTitle>
                <AlertDescription className="text-red-600 dark:text-red-300 text-sm mt-1">
                  {pausedReason || "Hệ thống đúc FUN Money đang tạm dừng để bảo trì và kiểm tra an ninh."}
                  <br />
                  <span className="font-medium">Vui lòng quay lại sau. Các Light Actions của bạn vẫn được ghi nhận và sẽ được xử lý khi hệ thống hoạt động trở lại. 🙏</span>
                </AlertDescription>
              </Alert>
            )}

            {/* Important Notice */}
            <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/30">
              <Info className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-700 dark:text-amber-400">Quan trọng</AlertTitle>
              <AlertDescription className="text-amber-600 dark:text-amber-300">
                FUN Money đang chạy trên <strong>BSC Testnet</strong>. Bạn cần tBNB (testnet BNB) để trả phí gas.
                <Button 
                  variant="link" 
                  size="sm" 
                  className="text-amber-700 dark:text-amber-400 p-0 h-auto ml-1"
                  onClick={() => window.open("https://testnet.bnbchain.org/faucet-smart", "_blank")}
                >
                  Lấy tBNB miễn phí <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </AlertDescription>
            </Alert>

            {/* Unminted Actions Banner */}
            {!mintPaused && unmintedCount > 0 && (
              <Alert className="border-orange-300 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertTitle className="text-orange-700 dark:text-orange-400">
                  ⚡ {unmintedCount} Light Actions chưa gửi yêu cầu mint!
                </AlertTitle>
                <AlertDescription className="text-orange-600 dark:text-orange-300">
                  Bạn có {unmintedCount} hành động đã đạt điểm nhưng chưa gửi yêu cầu mint FUN Money.
                  Cuộn xuống và nhấn <strong>"Gửi tất cả yêu cầu mint"</strong> để Admin duyệt nhé!
                </AlertDescription>
              </Alert>
            )}

               {/* Hướng dẫn Activate & Claim - Collapsible Stepper */}
              <Collapsible open={guideOpen} onOpenChange={setGuideOpen}>
                <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
                  <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center justify-between p-4 text-left hover:bg-blue-100/50 dark:hover:bg-blue-900/20 transition-colors rounded-t-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-blue-600" />
                        <h3 className="font-semibold text-blue-800 dark:text-blue-300">Hướng dẫn Activate & Claim FUN Money</h3>
                      </div>
                      <ChevronDown className={`h-4 w-4 text-blue-600 transition-transform ${guideOpen ? "rotate-180" : ""}`} />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-4 pb-4 space-y-3">
                      {/* Step 1 */}
                      <div className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shrink-0">1</div>
                          <div className="w-0.5 flex-1 bg-blue-200 dark:bg-blue-800 mt-1" />
                        </div>
                        <div className="pb-4">
                          <p className="font-medium text-sm">Kết nối ví MetaMask vào BSC Testnet (Chain ID: 97)</p>
                          <p className="text-xs text-muted-foreground mt-1">Mở MetaMask → Thêm mạng → BSC Testnet hoặc nhấn nút "Chuyển sang BSC Testnet" trên trang này.</p>
                        </div>
                      </div>

                      {/* Step 2 */}
                      <div className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shrink-0">2</div>
                          <div className="w-0.5 flex-1 bg-blue-200 dark:bg-blue-800 mt-1" />
                        </div>
                        <div className="pb-4">
                          <p className="font-medium text-sm">Kiểm tra mục "Token Lifecycle" bên trái</p>
                          <p className="text-xs text-muted-foreground mt-1">Số <strong>Locked</strong> hiển thị FUN đã được admin duyệt và khóa on-chain cho bạn.</p>
                        </div>
                      </div>

                      {/* Step 3 */}
                      <div className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center text-sm font-bold shrink-0">3</div>
                          <div className="w-0.5 flex-1 bg-blue-200 dark:bg-blue-800 mt-1" />
                        </div>
                        <div className="pb-4">
                          <p className="font-medium text-sm">Nhấn "Activate All" — chuyển Locked → Activated</p>
                          <p className="text-xs text-muted-foreground mt-1">Cần tBNB để trả phí gas. Nếu chưa có:</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-1.5 text-xs border-amber-300 text-amber-700 hover:bg-amber-50 dark:text-amber-300"
                            onClick={() => window.open("https://testnet.bnbchain.org/faucet-smart", "_blank")}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Lấy tBNB miễn phí
                          </Button>
                        </div>
                      </div>

                      {/* Step 4 */}
                      <div className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold shrink-0">4</div>
                        </div>
                        <div>
                          <p className="font-medium text-sm">Nhấn "Claim All" — FUN chuyển về ví của bạn ✨</p>
                          <p className="text-xs text-muted-foreground mt-1">Trạng thái chuyển từ Activated → <strong>Flowing</strong>. FUN Money giờ thuộc về bạn hoàn toàn!</p>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* Main Layout */}
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Balance Card + Lifecycle - Sticky on desktop */}
                <div className="lg:col-span-1">
                  <div className="lg:sticky lg:top-24 space-y-4">
                    <FUNMoneyBalanceCard />

                    {/* Token Lifecycle Panel */}
                    <TokenLifecyclePanel />

                    {/* Quick Info */}
                    <Card>
                      <CardContent className="p-4 space-y-3">
                        <h4 className="font-medium text-sm">Cách thức hoạt động</h4>
                        <div className="space-y-2 text-xs text-muted-foreground">
                          <div className="flex items-start gap-2">
                            <div className="p-1 rounded-full bg-amber-100 dark:bg-amber-900/30 mt-0.5">
                              <Sparkles className="h-3 w-3 text-amber-600" />
                            </div>
                            <span>Thực hiện hành động yêu thương (chat, đăng bài, viết nhật ký...)</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <div className="p-1 rounded-full bg-blue-100 dark:bg-blue-900/30 mt-0.5">
                              <Shield className="h-3 w-3 text-blue-600" />
                            </div>
                            <span>Angel AI chấm điểm theo 5 trụ cột PPLP</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <div className="p-1 rounded-full bg-green-100 dark:bg-green-900/30 mt-0.5">
                              <Zap className="h-3 w-3 text-green-600" />
                            </div>
                            <span>Nếu đạt Light Score ≥60, bạn Request Mint FUN</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <div className="p-1 rounded-full bg-orange-100 dark:bg-orange-900/30 mt-0.5">
                              <Lock className="h-3 w-3 text-orange-600" />
                            </div>
                            <span>Admin phê duyệt → FUN được lock on-chain</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <div className="p-1 rounded-full bg-purple-100 dark:bg-purple-900/30 mt-0.5">
                              <Coins className="h-3 w-3 text-purple-600" />
                            </div>
                            <span>Activate → Claim → FUN về ví của bạn</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
 
               {/* Actions List */}
               <div className="lg:col-span-2">
                 <MintActionsList />
               </div>
             </div>
 
             {/* PPLP Info */}
             <div className="grid gap-4 sm:grid-cols-3 pt-4">
               <Card className="text-center p-4">
                 <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                   <span className="text-lg font-bold text-red-600">S</span>
                 </div>
                 <h4 className="font-medium">Phụng Sự</h4>
                 <p className="text-xs text-muted-foreground mt-1">Service to Others</p>
               </Card>
               <Card className="text-center p-4">
                 <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                   <span className="text-lg font-bold text-blue-600">T</span>
                 </div>
                 <h4 className="font-medium">Chân Thật</h4>
                 <p className="text-xs text-muted-foreground mt-1">Truthfulness</p>
               </Card>
               <Card className="text-center p-4">
                 <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                   <span className="text-lg font-bold text-green-600">H</span>
                 </div>
                 <h4 className="font-medium">Chữa Lành</h4>
                 <p className="text-xs text-muted-foreground mt-1">Healing</p>
               </Card>
             </div>
           </div>
         </main>
 
         <Footer />
       </div>
     </>
   );
 }