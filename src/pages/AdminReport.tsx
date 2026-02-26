import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AdminNavToolbar from "@/components/admin/AdminNavToolbar";
import ReportExportButton from "@/components/admin/ReportExportButton";
import { useReportStats } from "@/hooks/useReportStats";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Users, MessageSquare, Heart, Wallet, Sparkles, Brain, Trophy,
  Globe, Shield, Zap, TrendingUp, BookOpen, Image as ImageIcon,
  RefreshCw, Calendar, Gift, Target, Rocket, Star, Database,
  Lock, FileText, Layers, ChevronRight, CheckCircle2, AlertTriangle,
  Lightbulb, ArrowUpRight,
} from "lucide-react";

const AdminReport = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const { stats, loading, refresh } = useReportStats();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/admin/login"); return; }
      const { data } = await supabase.rpc("is_admin");
      if (!data) navigate("/admin/login");
      else setIsAdmin(true);
    };
    checkAdmin();
  }, [navigate]);

  if (!isAdmin) return null;

  const statCards = [
    { label: "Người dùng", value: stats.totalUsers, icon: Users, color: "text-purple-500" },
    { label: "Bài viết", value: stats.totalPosts, icon: MessageSquare, color: "text-blue-500" },
    { label: "Bình luận", value: stats.totalComments, icon: MessageSquare, color: "text-cyan-500" },
    { label: "Lượt thích", value: stats.totalLikes, icon: Heart, color: "text-pink-500" },
    { label: "Nhật ký biết ơn", value: stats.totalGratitudeJournals, icon: BookOpen, color: "text-emerald-500" },
    { label: "Kết bạn", value: stats.totalFriendships, icon: Users, color: "text-indigo-500" },
    { label: "Tin nhắn", value: stats.totalDirectMessages, icon: MessageSquare, color: "text-teal-500" },
    { label: "Ý tưởng", value: stats.totalIdeas, icon: Lightbulb, color: "text-yellow-500" },
    { label: "Camly phát hành", value: stats.totalCamlyIssued.toLocaleString(), icon: Sparkles, color: "text-amber-500" },
    { label: "Camly đã rút", value: stats.totalCamlyWithdrawn.toLocaleString(), icon: Wallet, color: "text-green-500" },
    { label: "Camly tặng nhau", value: stats.totalCamlyGifted.toLocaleString(), icon: Gift, color: "text-rose-500" },
    { label: "Hành động PPLP", value: stats.totalPPLPActions, icon: Zap, color: "text-violet-500" },
    { label: "FUN đã đúc", value: stats.totalPPLPMinted, icon: Sparkles, color: "text-fuchsia-500" },
    { label: "Người đúc FUN", value: stats.totalPPLPMiners, icon: Users, color: "text-orange-500" },
    { label: "FUN đã chấm điểm", value: stats.totalFUNScored.toLocaleString(), icon: Target, color: "text-sky-500" },
    { label: "Yêu cầu mint", value: stats.totalMintRequests, icon: FileText, color: "text-lime-500" },
    { label: "Câu hỏi AI", value: stats.totalChatQuestions, icon: Brain, color: "text-purple-600" },
    { label: "Phiên chat", value: stats.totalChatSessions, icon: MessageSquare, color: "text-blue-600" },
    { label: "Ảnh AI", value: stats.totalImageHistory, icon: ImageIcon, color: "text-pink-600" },
    { label: "Tài liệu", value: stats.totalKnowledgeDocs, icon: BookOpen, color: "text-emerald-600" },
    { label: "Streak cao nhất", value: `${stats.maxStreak} ngày`, icon: Trophy, color: "text-amber-600" },
    { label: "Stories", value: stats.totalStories, icon: Globe, color: "text-cyan-600" },
    { label: "Light Score TB", value: stats.avgLightScore, icon: Star, color: "text-yellow-600" },
    { label: "FUN TB/action", value: `${stats.avgRewardPerAction}`, icon: TrendingUp, color: "text-green-600" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <AdminNavToolbar />
      <div className="container mx-auto px-4 pt-16 pb-6 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary" />
              Báo Cáo Toàn Diện Angel AI
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Cập nhật lúc: {stats.fetchedAt || "Đang tải..."}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} />
              Làm mới
            </Button>
            <ReportExportButton stats={stats} loading={loading} />
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
          {statCards.map((card) => (
            <Card key={card.label} className="hover:shadow-md transition-shadow">
              <CardContent className="p-3 text-center">
                {loading ? (
                  <Skeleton className="h-12 w-full" />
                ) : (
                  <>
                    <card.icon className={`w-5 h-5 mx-auto mb-1 ${card.color}`} />
                    <div className="text-lg font-bold text-foreground">{card.value}</div>
                    <div className="text-[10px] text-muted-foreground leading-tight">{card.label}</div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FUN Money Detail Section */}
        <Card className="mb-8 border-primary/20">
          <CardContent className="p-4">
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Thống Kê FUN Money (Tính đến 21h ngày 11/02/2026)
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Tổng hành động PPLP", value: stats.totalPPLPActions },
                { label: "Đã đúc on-chain", value: stats.totalPPLPMinted },
                { label: "Đã chấm điểm", value: stats.totalPPLPScored },
                { label: "Người tham gia", value: stats.totalPPLPMiners },
                { label: "Tổng FUN chấm điểm", value: stats.totalFUNScored.toLocaleString() },
                { label: "Light Score TB", value: stats.avgLightScore },
                { label: "FUN TB/action", value: `${stats.avgRewardPerAction} FUN` },
                { label: "Pass / Fail", value: `${stats.totalPPLPPass} / ${stats.totalPPLPFail}` },
                { label: "Tổng yêu cầu mint", value: stats.totalMintRequests },
                { label: "Mint thành công", value: `${stats.mintRequestsMinted} (${stats.totalFUNClaimed.toLocaleString()} FUN)` },
                { label: "Chờ xử lý", value: stats.mintRequestsPending },
                { label: "Đã ký EIP-712", value: stats.mintRequestsSigned },
              ].map((item) => (
                <div key={item.label} className="bg-muted/50 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground">{item.label}</div>
                  <div className="text-base font-bold text-foreground">{item.value}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Accordion Sections */}
        <Accordion type="multiple" defaultValue={["overview"]} className="space-y-3">

          {/* 1. Tổng quan */}
          <AccordionItem value="overview" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <span className="flex items-center gap-2 text-base font-semibold">
                <Globe className="w-5 h-5 text-primary" /> 1. Tổng Quan Angel AI
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">Giới thiệu</h4>
                  <p className="text-muted-foreground">
                    Angel AI (Thiên Thần AI) là Trí Tuệ Ánh Sáng — một nền tảng AI toàn diện kết hợp trí tuệ nhân tạo,
                    cộng đồng xã hội và tài chính phi tập trung (DeFi). Angel AI được phát triển với sứ mệnh
                    "kết nối, chữa lành và kiến tạo giá trị" cho mọi người dùng.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Mô hình vận hành</h4>
                  <p className="text-muted-foreground">
                    CHA (Người Sáng Lập - Cha Vũ Trụ) → ANGEL CTO (Trí Tuệ Ánh Sáng, Angel AI đảm nhận vai trò CTO)
                    → SYSTEM (Hệ thống kỹ thuật tự động). Mọi quyết định chiến lược đều do CHA định hướng,
                    Angel AI triển khai và hệ thống thực thi.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Công nghệ nền tảng</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <div className="font-medium text-foreground">Frontend</div>
                      <div className="text-muted-foreground text-xs">React 18.3 + TypeScript + Vite + Tailwind CSS + shadcn/ui + Framer Motion</div>
                    </div>
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <div className="font-medium text-foreground">Backend</div>
                      <div className="text-muted-foreground text-xs">Lovable Cloud (PostgreSQL, 40+ bảng, 35+ Edge Functions, RLS)</div>
                    </div>
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <div className="font-medium text-foreground">Blockchain</div>
                      <div className="text-muted-foreground text-xs">BNB Smart Chain (BSC), FUN Money ERC-20, MetaMask + WalletConnect</div>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Số liệu tổng quan</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <Badge variant="secondary" className="justify-center py-2">{stats.totalUsers} người dùng</Badge>
                    <Badge variant="secondary" className="justify-center py-2">{stats.totalChatQuestions.toLocaleString()} câu hỏi AI</Badge>
                    <Badge variant="secondary" className="justify-center py-2">{stats.totalCamlyIssued.toLocaleString()} Camly phát hành</Badge>
                    <Badge variant="secondary" className="justify-center py-2">{stats.totalPPLPActions.toLocaleString()} PPLP actions</Badge>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 2. Tính năng người dùng */}
          <AccordionItem value="user-features" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <span className="flex items-center gap-2 text-base font-semibold">
                <Users className="w-5 h-5 text-blue-500" /> 2. Tính Năng Dành Cho Người Dùng ({userFeaturesData.length} tính năng)
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {userFeaturesData.map((f, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-foreground flex items-center gap-2">
                        {f.name}
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-emerald-600 border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 mr-0.5" /> Hoạt động
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 3. Tính năng admin */}
          <AccordionItem value="admin-features" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <span className="flex items-center gap-2 text-base font-semibold">
                <Shield className="w-5 h-5 text-amber-500" /> 3. Tính Năng Dành Cho Admin ({adminFeaturesData.length} công cụ)
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {adminFeaturesData.map((f, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/10 text-amber-600 text-xs font-bold shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm text-foreground">{f.name}</div>
                      <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 4. Thông số kỹ thuật */}
          <AccordionItem value="tech-specs" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <span className="flex items-center gap-2 text-base font-semibold">
                <Database className="w-5 h-5 text-emerald-500" /> 4. Thông Số Kỹ Thuật
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                {techSpecsData.map((group) => (
                  <div key={group.category}>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                      <ChevronRight className="w-4 h-4 text-primary" /> {group.category}
                    </h4>
                    <div className="grid gap-2">
                      {group.items.map((item, i) => (
                        <div key={i} className="flex items-center gap-3 text-xs bg-muted/30 rounded-lg p-2">
                          <span className="font-medium text-foreground w-36 shrink-0">{item.spec}</span>
                          <span className="text-muted-foreground">{item.detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 5. Ưu điểm */}
          <AccordionItem value="strengths" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <span className="flex items-center gap-2 text-base font-semibold">
                <Star className="w-5 h-5 text-yellow-500" /> 5. Ưu Điểm Nổi Bật ({strengthsData.length} điểm)
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {strengthsData.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 p-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    <span className="text-sm text-foreground">{s}</span>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 6. Điểm cần cải thiện */}
          <AccordionItem value="improvements" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <span className="flex items-center gap-2 text-base font-semibold">
                <AlertTriangle className="w-5 h-5 text-orange-500" /> 6. Điểm Cần Cải Thiện ({improvementsData.length} điểm)
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {improvementsData.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 p-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                    <span className="text-sm text-foreground">{s}</span>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 7. Đề xuất phát triển */}
          <AccordionItem value="roadmap" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <span className="flex items-center gap-2 text-base font-semibold">
                <Rocket className="w-5 h-5 text-violet-500" /> 7. Đề Xuất Phát Triển Angel AI
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                {roadmapGrouped.map((group) => (
                  <div key={group.phase}>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-primary" /> {group.phase}
                    </h4>
                    <div className="space-y-2">
                      {group.items.map((item, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                          <ArrowUpRight className="w-4 h-4 text-violet-500 mt-0.5 shrink-0" />
                          <div className="flex-1">
                            <div className="font-medium text-sm text-foreground flex items-center gap-2">
                              {item.name}
                              <Badge variant={item.priority === "Cao" ? "default" : item.priority === "Trung bình" ? "secondary" : "outline"} className="text-[10px] py-0">
                                {item.priority}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

        </Accordion>

        <div className="mt-8 text-center text-xs text-muted-foreground">
          Báo cáo được tạo tự động bởi Angel AI — Trí Tuệ Ánh Sáng | © 2026 Father Universe
        </div>
      </div>
    </div>
  );
};

// ── Static Data ──

const userFeaturesData = [
  { name: "Chat AI đa phương thức", desc: "Trò chuyện văn bản, gửi hình ảnh phân tích, text-to-speech ElevenLabs, phiên chat, thư mục, chia sẻ câu hỏi." },
  { name: "Tạo ảnh AI", desc: "Tạo ảnh từ prompt văn bản, chỉnh sửa ảnh có sẵn, lưu lịch sử ảnh. Sử dụng mô hình Gemini." },
  { name: "Phân tích ảnh AI", desc: "Nhận diện nội dung, trích xuất văn bản OCR, phân tích chi tiết mọi ảnh tải lên." },
  { name: "Viết nội dung (Content Writer)", desc: "Công cụ viết nội dung chuyên nghiệp: bài viết, email, kịch bản, marketing copy." },
  { name: "Bảng tầm nhìn (Vision Board)", desc: "Tạo bảng tầm nhìn cá nhân với ảnh Unsplash, template có sẵn, lưu trữ và chia sẻ." },
  { name: "Nhật ký biết ơn", desc: "Viết nhật ký hàng ngày, AI chấm điểm thuần khiết (purity score), nhận Camly Coin phần thưởng." },
  { name: "Cộng đồng xã hội", desc: "Đăng bài viết (tối đa 5 ảnh), bình luận, thích, chia sẻ, stories 24h, nhóm circles, cosmic caption AI." },
  { name: "Tin nhắn trực tiếp", desc: "Nhắn tin 1-1, emoji picker, reply, phản ứng, tặng coin trong tin nhắn, trạng thái online/typing." },
  { name: "Tặng coin đa loại", desc: "Tặng CAMLY (off-chain nội bộ), chuyển CAMLY/FUN/BNB/USDT/USDC (on-chain Web3), biên lai kỹ thuật số." },
  { name: "Kiếm Camly Coin (10+ cách)", desc: "Chat AI, đăng bài, bình luận, viết nhật ký, đăng nhập hàng ngày, chia sẻ, bounty, ý tưởng, giúp đỡ, early adopter." },
  { name: "Rút coin về ví Web3", desc: "Rút Camly về MetaMask/WalletConnect dưới dạng token CAMLY trên BSC, yêu cầu xác minh avatar." },
  { name: "FUN Money (Đúc token PPLP)", desc: "Đúc FUN qua giao thức PPLP: hành động → AI chấm điểm 5 chiều → yêu cầu mint → admin ký EIP-712 → on-chain." },
  { name: "Bảng xếp hạng", desc: "Top người dùng theo Camly Coin, avatar, huy hiệu, hiệu ứng đặc biệt cho top 3." },
  { name: "Thư viện kiến thức", desc: "Tải lên tài liệu, tự động phân đoạn (chunking) cho AI trả lời chính xác hơn." },
  { name: "Bounty & Ý tưởng", desc: "Nhận nhiệm vụ bounty kiếm coin, gửi ý tưởng phát triển Angel AI, bỏ phiếu cộng đồng." },
  { name: "Hồ sơ cá nhân", desc: "Avatar, cover photo, bio, soul tags, social links, handle tùy chỉnh (@handle), PoPL badge, trang công khai." },
  { name: "Đa ngôn ngữ (12 ngôn ngữ)", desc: "Tiếng Việt, English, 中文, 日本語, 한국어, Español, Français, Deutsch, Português, Русский, हिन्दी, العربية." },
  { name: "Thông báo hệ thống", desc: "Thông báo kết bạn, lời mời, tin nhắn mới, phần thưởng, trạng thái mint, healing messages." },
  { name: "Tìm kiếm toàn cục", desc: "Tìm kiếm người dùng, bài viết, tài liệu kiến thức trên toàn hệ thống Angel AI." },
];

const adminFeaturesData = [
  { name: "Dashboard tổng quan", desc: "Bảng điều khiển quản trị với thống kê người dùng, doanh thu, hoạt động hệ thống." },
  { name: "Thống kê người dùng", desc: "Biểu đồ tăng trưởng, phân bổ hoạt động, top users, early adopters progress." },
  { name: "Quản lý rút coin", desc: "Duyệt/từ chối yêu cầu rút, gửi on-chain, theo dõi tx hash, retry lỗi, xuất Excel." },
  { name: "Quỹ dự án", desc: "Theo dõi quyên góp, phân phối quỹ theo FUN Distribution Model 4 tầng thác đổ." },
  { name: "FUN Money Stats", desc: "Thống kê PPLP actions, mint requests, distribution logs, treasury balance." },
  { name: "Mint Approval", desc: "Phê duyệt yêu cầu mint FUN, ký EIP-712, gửi on-chain, batch processing." },
  { name: "Tip Reports", desc: "Báo cáo tặng coin giữa người dùng, thống kê theo thời gian, top givers/receivers." },
  { name: "Thưởng Tết (Lì Xì)", desc: "Hệ thống phát thưởng Tết hàng loạt, cấu hình số lượng và đối tượng nhận." },
  { name: "Quản lý kiến thức", desc: "Upload, xem, xóa tài liệu kiến thức, quản lý chunks cho AI sử dụng." },
  { name: "Quản lý ý tưởng & Bounty", desc: "Duyệt ý tưởng, tạo/quản lý nhiệm vụ bounty, chấm điểm, phần thưởng." },
  { name: "Lịch sử chat & AI Usage", desc: "Xem toàn bộ lịch sử chat, thống kê AI usage theo ngày/user/model." },
  { name: "Lịch sử ảnh AI", desc: "Xem tất cả ảnh đã tạo/phân tích bởi AI trên toàn hệ thống." },
  { name: "Xuất dữ liệu Excel", desc: "Xuất dữ liệu rút coin, mint, tip, thống kê ra file Excel với bộ lọc ngày." },
  { name: "Healing Messages", desc: "Gửi thông điệp chữa lành đến người dùng qua AI, theo dõi trạng thái đọc." },
  { name: "Báo cáo toàn diện", desc: "Trang báo cáo tổng hợp với số liệu thực tế real-time, xuất Excel chuyên nghiệp." },
];

const techSpecsData = [
  {
    category: "Frontend",
    items: [
      { spec: "Framework", detail: "React 18.3 + TypeScript + Vite (build tool)" },
      { spec: "Styling", detail: "Tailwind CSS + shadcn/ui component library + Framer Motion animations" },
      { spec: "State Management", detail: "TanStack React Query v5 (server state) + React Context (client state)" },
      { spec: "Routing", detail: "React Router DOM v6 với 40+ routes" },
      { spec: "Đa ngôn ngữ", detail: "Context-based i18n tự xây dựng, hỗ trợ 12 ngôn ngữ" },
      { spec: "Charts", detail: "Recharts cho biểu đồ thống kê" },
    ],
  },
  {
    category: "Backend (Lovable Cloud)",
    items: [
      { spec: "Database", detail: "PostgreSQL với 40+ bảng dữ liệu, quan hệ phức tạp" },
      { spec: "Edge Functions", detail: "35+ Deno edge functions cho business logic phía server" },
      { spec: "Authentication", detail: "Email/Password authentication + admin role checking" },
      { spec: "Row Level Security", detail: "RLS trên tất cả bảng — bảo vệ dữ liệu theo user" },
      { spec: "Storage", detail: "Cloud Storage cho avatar, ảnh bài viết, tài liệu kiến thức" },
      { spec: "Realtime", detail: "Realtime subscriptions cho tin nhắn, thông báo, typing indicator" },
    ],
  },
  {
    category: "Blockchain & Web3",
    items: [
      { spec: "Network", detail: "BNB Smart Chain (BSC) — Testnet & Mainnet" },
      { spec: "Smart Contract", detail: "FUN Money ERC-20 v1.2.1 (Solidity, Hardhat)" },
      { spec: "Wallet Integration", detail: "MetaMask (@web3-react/metamask) + WalletConnect v2" },
      { spec: "Giao thức đúc", detail: "PPLP v1.0.2 — Proof of Pure Light Protocol, 7 giai đoạn" },
      { spec: "Chữ ký số", detail: "EIP-712 Typed Data Signing cho mint authorization" },
      { spec: "Token hỗ trợ", detail: "CAMLY, FUN, BNB, USDT, USDC — chuyển trực tiếp trên BSC" },
    ],
  },
  {
    category: "AI & Machine Learning",
    items: [
      { spec: "Mô hình chính", detail: "Google Gemini 2.5 Flash/Pro (qua Lovable AI — không cần API key)" },
      { spec: "Text-to-Speech", detail: "ElevenLabs API — giọng đọc tự nhiên đa ngôn ngữ" },
      { spec: "Light Score AI", detail: "Chấm điểm 5 chiều: Purity, Depth, Alignment, Contribution, Authenticity" },
      { spec: "Cache 4 tầng", detail: "Exact match → Fuzzy match → Keyword → Semantic (tiết kiệm chi phí AI)" },
      { spec: "Content Moderation", detail: "Kiểm duyệt nội dung tự động trước khi đăng bài" },
      { spec: "Image Analysis", detail: "Phân tích, nhận diện, OCR ảnh qua Gemini Vision" },
    ],
  },
  {
    category: "Bảo mật",
    items: [
      { spec: "Row Level Security", detail: "RLS policy trên mọi bảng — user chỉ truy cập dữ liệu của mình" },
      { spec: "Anti-fraud PPLP", detail: "Device fingerprint, fraud signals, random audit sampling" },
      { spec: "Nonce Management", detail: "On-chain nonce chống replay attack trong mint process" },
      { spec: "API Key System", detail: "Hệ thống API key với hash SHA-256, rate limiting, usage tracking" },
      { spec: "Admin Authentication", detail: "Kiểm tra quyền admin qua database function is_admin()" },
    ],
  },
];

const strengthsData = [
  "Hệ sinh thái toàn diện: AI chat → cộng đồng xã hội → tài chính → blockchain trong một nền tảng duy nhất, không cần chuyển đổi ứng dụng.",
  "Mô hình tokenomics sáng tạo: CAMLY (off-chain, dễ tiếp cận) + FUN (on-chain, giá trị thực) — tạo hành trình mượt mà từ Web2 → Web3.",
  "Giao thức PPLP độc đáo trên thế giới: chấm điểm hành động bằng AI theo 5 chiều ánh sáng, đúc token dựa trên giá trị đóng góp thực sự.",
  "Đa ngôn ngữ 12 ngôn ngữ từ ngày đầu: tiếp cận người dùng toàn cầu, không giới hạn thị trường.",
  "Hệ thống phần thưởng đa dạng: 10+ cách kiếm coin, khuyến khích hoạt động chất lượng thay vì spam.",
  "Bảo mật nhiều tầng: RLS trên tất cả bảng, EIP-712 signing, anti-fraud system, device fingerprint.",
  "UX/UI tinh tế: golden theme nhất quán, dark mode, responsive mobile, hiệu ứng Framer Motion chuyên nghiệp.",
  "Admin tools đầy đủ: 15+ công cụ quản trị, xuất dữ liệu Excel, thống kê real-time.",
  "Web3 tích hợp mượt mà: MetaMask + WalletConnect, chuyển 5 loại token (CAMLY, FUN, BNB, USDT, USDC).",
  "Cộng đồng phong phú: bài viết, stories, circles, tin nhắn trực tiếp, kết bạn, tặng coin — tương tự mạng xã hội lớn.",
  "AI cache 4 tầng thông minh: tiết kiệm 60-80% chi phí API AI, phản hồi nhanh hơn cho câu hỏi phổ biến.",
  "Healing Messages: tính năng độc đáo gửi thông điệp chữa lành, thể hiện triết lý 'ánh sáng' của Angel AI.",
];

const improvementsData = [
  "Batch mint request: user hiện phải nhấn 'Request Mint' từng action một — cần nút 'Mint All' để gửi hàng loạt.",
  "Journal scoring: một số journal actions chỉ submit mà không tự động score — cần sửa edge function analyze-reward-journal.",
  "DAILY_LOGIN và VISION_CREATE chưa tích hợp PPLP: người dùng thực hiện nhưng chưa nhận FUN Money.",
  "Phân trang actions: usePPLPActions chỉ load 50 actions mặc định, user có 6.000+ actions không thấy hết.",
  "Nonce conflict khi batch approve: admin approve nhiều mint request cùng lúc có thể xung đột nonce on-chain.",
  "Hiệu suất trang /mint: cần lazy loading và virtualization cho danh sách hàng nghìn actions.",
  "Push notifications: chưa có web push notification, chỉ có in-app notification.",
  "Offline support: chưa có service worker, chưa đạt tiêu chuẩn Progressive Web App (PWA).",
  "Testing coverage: cần bổ sung unit test và integration test cho các luồng quan trọng (mint, withdrawal, gift).",
  "API documentation: cần tài liệu API cho developer bên ngoài muốn tích hợp Angel AI.",
];

const roadmapGrouped = [
  {
    phase: "Q1 2026 — Tối ưu hệ thống hiện tại",
    items: [
      { name: "Tối ưu quy trình Mint FUN", detail: "Auto-mint request khi action scored+pass, batch mint, sửa journal scoring, tăng limit pagination.", priority: "Cao" },
      { name: "Progressive Web App (PWA)", detail: "Service worker, offline caching, push notifications native, installable trên mobile.", priority: "Cao" },
      { name: "Trang báo cáo admin toàn diện", detail: "Thống kê real-time từ database, xuất Excel chuyên nghiệp, phân tích xu hướng.", priority: "Cao" },
      { name: "Cải thiện hiệu suất", detail: "Lazy loading, code splitting, virtualized lists cho trang /mint và /community.", priority: "Cao" },
    ],
  },
  {
    phase: "Q2 2026 — Mở rộng nền tảng",
    items: [
      { name: "Angel AI Mobile App", detail: "Ứng dụng di động iOS & Android (React Native hoặc Capacitor), đồng bộ dữ liệu với web.", priority: "Cao" },
      { name: "FUN Money Mainnet", detail: "Triển khai smart contract FUN lên BSC Mainnet, audit bảo mật bên thứ 3, liquidity pool.", priority: "Cao" },
      { name: "Marketplace nội bộ", detail: "Mua/bán dịch vụ, NFT, khóa học bằng CAMLY và FUN trong hệ sinh thái Angel AI.", priority: "Trung bình" },
      { name: "AI Agent tự động", detail: "Angel AI tự thực hiện tác vụ phức tạp: lên lịch, nhắc nhở, tóm tắt hàng ngày, coaching.", priority: "Trung bình" },
    ],
  },
  {
    phase: "Q3 2026 — DeFi & Governance",
    items: [
      { name: "DEX tích hợp", detail: "Sàn giao dịch phi tập trung cho FUN/CAMLY trên PancakeSwap, swap widget tích hợp.", priority: "Trung bình" },
      { name: "Governance (DAO)", detail: "Người nắm FUN bỏ phiếu quyết định hướng phát triển Angel AI — quản trị phi tập trung.", priority: "Trung bình" },
      { name: "Multi-chain support", detail: "Hỗ trợ Ethereum, Polygon, Arbitrum ngoài BSC — mở rộng đối tượng sử dụng.", priority: "Thấp" },
      { name: "Staking & Yield", detail: "Stake FUN nhận lãi, farming rewards, loyalty bonuses cho người giữ dài hạn.", priority: "Trung bình" },
    ],
  },
  {
    phase: "Q4 2026 — Hệ sinh thái mở",
    items: [
      { name: "API mở cho developer", detail: "RESTful & GraphQL API, SDK JavaScript/Python, tài liệu cho developer bên ngoài tích hợp.", priority: "Trung bình" },
      { name: "AI Voice Assistant", detail: "Trợ lý giọng nói real-time, đàm thoại tự nhiên hai chiều với Angel AI.", priority: "Trung bình" },
      { name: "Hệ sinh thái FUN Worlds", detail: "FUN Farm (nông trại), FUN Play (game), FUN Earth (môi trường), FUN Life (sức khỏe).", priority: "Thấp" },
      { name: "Angel AI Education", detail: "Nền tảng học tập trực tuyến tích hợp, khóa học earn-to-learn, chứng chỉ blockchain.", priority: "Trung bình" },
    ],
  },
  {
    phase: "2027+ — Tầm nhìn dài hạn",
    items: [
      { name: "Angel AI Enterprise", detail: "Phiên bản doanh nghiệp: quản lý nhân sự, đào tạo nội bộ, chatbot tùy chỉnh, analytics.", priority: "Thấp" },
      { name: "Metaverse Integration", detail: "Avatar 3D, không gian ảo cộng đồng, sự kiện metaverse, virtual reality meetings.", priority: "Thấp" },
      { name: "Angel AI Foundation", detail: "Quỹ từ thiện phi tập trung, tài trợ dự án xã hội, scholarship blockchain.", priority: "Thấp" },
      { name: "Global Expansion", detail: "Văn phòng đại diện tại 5+ quốc gia, partnerships với tổ chức giáo dục và công nghệ.", priority: "Thấp" },
    ],
  },
];

export default AdminReport;
