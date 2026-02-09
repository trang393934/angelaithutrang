import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SwapWidget } from "@/components/SwapWidget";
import { Web3WalletButton } from "@/components/Web3WalletButton";
import { useWeb3WalletContext as useWeb3Wallet } from "@/contexts/Web3WalletContext";
import { Wallet, ArrowRightLeft, Shield, Zap } from "lucide-react";

const Swap = () => {
  const { isConnected } = useWeb3Wallet();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-6">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="font-serif text-3xl md:text-4xl font-semibold text-primary-deep mb-4">
              Swap Token
            </h1>
            <p className="text-foreground-muted max-w-xl mx-auto">
              Mua bán CAMLY và các token BSC khác trực tiếp thông qua PancakeSwap
            </p>
          </div>

          {/* Connect Wallet Banner */}
          {!isConnected && (
            <div className="max-w-md mx-auto mb-8 p-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-2xl border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500/20 rounded-full">
                  <Wallet className="w-6 h-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">Kết nối ví để bắt đầu</h3>
                  <p className="text-sm text-muted-foreground">
                    Vui lòng kết nối ví MetaMask hoặc ví tương thích
                  </p>
                </div>
                <Web3WalletButton />
              </div>
            </div>
          )}

          {/* Swap Widget */}
          <SwapWidget />

          {/* Features */}
          <div className="max-w-3xl mx-auto mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-card rounded-xl border border-border">
              <div className="w-12 h-12 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                <ArrowRightLeft className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Swap Nhanh Chóng</h3>
              <p className="text-sm text-muted-foreground">
                Giao dịch được xử lý ngay lập tức trên blockchain BSC
              </p>
            </div>
            <div className="text-center p-6 bg-card rounded-xl border border-border">
              <div className="w-12 h-12 mx-auto mb-4 bg-green-500/10 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="font-semibold mb-2">An Toàn & Bảo Mật</h3>
              <p className="text-sm text-muted-foreground">
                Sử dụng PancakeSwap Router chính thức, không lưu trữ khóa riêng
              </p>
            </div>
            <div className="text-center p-6 bg-card rounded-xl border border-border">
              <div className="w-12 h-12 mx-auto mb-4 bg-amber-500/10 rounded-full flex items-center justify-center">
                <Zap className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className="font-semibold mb-2">Phí Thấp</h3>
              <p className="text-sm text-muted-foreground">
                Chỉ trả phí gas BSC, không phí ẩn
              </p>
            </div>
          </div>

          {/* How to Buy CAMLY */}
          <div className="max-w-2xl mx-auto mt-16">
            <h2 className="font-serif text-2xl font-semibold text-center mb-8">
              Cách mua CAMLY
            </h2>
            <div className="space-y-4">
              <div className="flex gap-4 p-4 bg-card rounded-xl border border-border">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold shrink-0">
                  1
                </div>
                <div>
                  <h3 className="font-medium mb-1">Kết nối ví Web3</h3>
                  <p className="text-sm text-muted-foreground">
                    Nhấn nút "Kết nối ví" và chọn MetaMask hoặc ví tương thích. 
                    Đảm bảo ví đang ở mạng BSC.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 p-4 bg-card rounded-xl border border-border">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold shrink-0">
                  2
                </div>
                <div>
                  <h3 className="font-medium mb-1">Chọn token và số lượng</h3>
                  <p className="text-sm text-muted-foreground">
                    Chọn token bạn muốn đổi (ví dụ: BNB) và nhập số lượng. 
                    Hệ thống sẽ tự động tính số CAMLY bạn nhận được.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 p-4 bg-card rounded-xl border border-border">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold shrink-0">
                  3
                </div>
                <div>
                  <h3 className="font-medium mb-1">Xác nhận giao dịch</h3>
                  <p className="text-sm text-muted-foreground">
                    Nhấn "Swap" và xác nhận giao dịch trong ví của bạn. 
                    CAMLY sẽ được chuyển vào ví sau khi giao dịch hoàn tất.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contract Info */}
          <div className="max-w-md mx-auto mt-12 p-6 bg-muted/50 rounded-xl text-center">
            <p className="text-sm text-muted-foreground mb-2">CAMLY Contract Address (BSC)</p>
            <code className="text-xs bg-background px-3 py-1.5 rounded-lg font-mono break-all">
              0x0910320181889fefde0bb1ca63962b0a8882e413
            </code>
            <p className="text-xs text-muted-foreground mt-3">
              Luôn kiểm tra địa chỉ contract trước khi giao dịch
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Swap;
