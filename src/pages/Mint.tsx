  import { Header } from "@/components/Header";
  import { Footer } from "@/components/Footer";
  import { FUNMoneyBalanceCard } from "@/components/mint/FUNMoneyBalanceCard";
  import { MintActionsList } from "@/components/mint/MintActionsList";
  import { TokenLifecyclePanel } from "@/components/mint/TokenLifecyclePanel";
  import { useAuth } from "@/hooks/useAuth";
  import { Button } from "@/components/ui/button";
  import { Card, CardContent } from "@/components/ui/card";
  import { Link } from "react-router-dom";
  import { ArrowRight, Coins, Sparkles, Shield, Zap, ExternalLink, Info, Lock } from "lucide-react";
  import funMoneyLogo from "@/assets/fun-money-logo.png";
  
  import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
 
 export default function Mint() {
   const { user } = useAuth();
 
   // Unauthenticated view
   if (!user) {
     return (
       <div className="min-h-screen flex flex-col bg-background">
         <Header />
         <main className="flex-1 container mx-auto px-4 py-8 pt-28">
           <div className="max-w-2xl mx-auto text-center space-y-6">
             <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
               <img src={funMoneyLogo} alt="FUN Money" className="w-16 h-16" />
             </div>
             <h1 className="text-3xl font-bold">Mint FUN Money</h1>
             <p className="text-muted-foreground">
               Đăng nhập để mint FUN Money token về ví của bạn qua giao thức PPLP.
             </p>
             <Button asChild size="lg" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
               <Link to="/auth">
                 Đăng nhập ngay
                 <ArrowRight className="ml-2 h-4 w-4" />
               </Link>
             </Button>
           </div>
         </main>
         <Footer />
       </div>
     );
   }
 
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