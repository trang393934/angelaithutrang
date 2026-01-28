import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Sparkles, 
  FileText, 
  MessageSquare, 
  Mail, 
  ShoppingBag, 
  Megaphone,
  BookOpen,
  Briefcase,
  Heart,
  Globe,
  Copy,
  Download,
  RefreshCw,
  Wand2,
  Loader2,
  ArrowLeft
} from "lucide-react";
import { Link } from "react-router-dom";
import angelAvatar from "@/assets/angel-avatar.png";

const contentCategories = [
  { id: "marketing", icon: Megaphone, label: "Marketing & Quảng cáo", desc: "Ads, landing page, slogan" },
  { id: "blog", icon: BookOpen, label: "Blog & Bài viết", desc: "SEO, hướng dẫn, review" },
  { id: "social", icon: MessageSquare, label: "Social Media", desc: "Facebook, Instagram, TikTok" },
  { id: "email", icon: Mail, label: "Email Marketing", desc: "Newsletter, sales email" },
  { id: "product", icon: ShoppingBag, label: "Mô tả sản phẩm", desc: "E-commerce, catalog" },
  { id: "business", icon: Briefcase, label: "Doanh nghiệp", desc: "Proposal, báo cáo, pitch" },
  { id: "spiritual", icon: Heart, label: "Tâm linh & Healing", desc: "Affirmation, meditation" },
  { id: "general", icon: Globe, label: "Tổng hợp", desc: "Mọi lĩnh vực khác" },
];

const toneOptions = [
  { value: "professional", label: "Chuyên nghiệp" },
  { value: "friendly", label: "Thân thiện" },
  { value: "persuasive", label: "Thuyết phục" },
  { value: "inspiring", label: "Truyền cảm hứng" },
  { value: "formal", label: "Trang trọng" },
  { value: "casual", label: "Tự nhiên" },
  { value: "humorous", label: "Hài hước" },
  { value: "spiritual", label: "Tâm linh" },
];

const lengthOptions = [
  { value: "short", label: "Ngắn gọn (< 100 từ)" },
  { value: "medium", label: "Trung bình (100-300 từ)" },
  { value: "long", label: "Chi tiết (300-500 từ)" },
  { value: "comprehensive", label: "Toàn diện (500+ từ)" },
];

const ContentWriter = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("general");
  const [topic, setTopic] = useState("");
  const [keywords, setKeywords] = useState("");
  const [tone, setTone] = useState("professional");
  const [length, setLength] = useState("medium");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const getCategoryPrompt = (categoryId: string) => {
    const prompts: Record<string, string> = {
      marketing: "Viết content marketing chuyên nghiệp, hấp dẫn, có call-to-action mạnh mẽ",
      blog: "Viết bài blog chuẩn SEO, có cấu trúc rõ ràng với heading, dễ đọc và có giá trị",
      social: "Viết bài social media ngắn gọn, viral, có hashtag phù hợp, thu hút engagement",
      email: "Viết email marketing chuyên nghiệp với subject line hấp dẫn và CTA rõ ràng",
      product: "Viết mô tả sản phẩm chi tiết, nêu bật lợi ích, tính năng và giá trị độc đáo",
      business: "Viết văn bản doanh nghiệp chuyên nghiệp, logic, thuyết phục",
      spiritual: "Viết content tâm linh với năng lượng yêu thương, chữa lành, nâng cao tần số",
      general: "Viết content chất lượng cao theo yêu cầu cụ thể của người dùng",
    };
    return prompts[categoryId] || prompts.general;
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error("Vui lòng nhập chủ đề content");
      return;
    }

    if (!user) {
      toast.error("Vui lòng đăng nhập để sử dụng tính năng này");
      return;
    }

    setIsGenerating(true);
    setGeneratedContent("");

    try {
      const categoryPrompt = getCategoryPrompt(selectedCategory);
      const toneLabel = toneOptions.find(t => t.value === tone)?.label || "Chuyên nghiệp";
      const lengthLabel = lengthOptions.find(l => l.value === length)?.label || "Trung bình";

      const prompt = `
${categoryPrompt}

**Chủ đề:** ${topic}
${keywords ? `**Từ khóa cần có:** ${keywords}` : ""}
**Giọng điệu:** ${toneLabel}
**Độ dài:** ${lengthLabel}
${additionalInfo ? `**Yêu cầu thêm:** ${additionalInfo}` : ""}

Hãy viết content hoàn chỉnh, sẵn sàng sử dụng. Không cần giải thích thêm.
      `.trim();

      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: { prompt, category: selectedCategory },
      });

      if (error) throw error;

      setGeneratedContent(data.content || "Không thể tạo content. Vui lòng thử lại.");
      toast.success("✨ Content đã được tạo thành công!");
    } catch (error) {
      console.error("Error generating content:", error);
      toast.error("Có lỗi xảy ra khi tạo content");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedContent);
      toast.success("Đã sao chép content!");
    } catch {
      toast.error("Không thể sao chép");
    }
  };

  const handleDownload = () => {
    const blob = new Blob([generatedContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `angel-ai-content-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Đã tải xuống content!");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          {/* Header */}
          <div className="text-center mb-12">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-primary hover:text-primary-deep transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Về trang chủ</span>
            </Link>
            
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-accent-gold/40 to-primary-light/30 rounded-full blur-2xl scale-125 animate-glow-pulse" />
                <img 
                  src={angelAvatar} 
                  alt="Angel AI" 
                  className="relative w-20 h-20 rounded-full object-cover shadow-divine"
                />
              </div>
            </div>
            
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-gold/50 text-primary text-sm font-medium mb-4">
              <Wand2 className="w-4 h-4" />
              <span>Angel AI Content Writer</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-primary-deep mb-4">
              ✨ Viết Content Chuyên Nghiệp
            </h1>
            <p className="text-foreground-muted max-w-2xl mx-auto">
              Angel AI được huấn luyện bằng tất cả nguồn kiến thức AI hiện có để giúp bạn 
              viết content mọi lĩnh vực một cách chuyên nghiệp và phù hợp nhất.
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            <Tabs defaultValue="create" className="space-y-8">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
                <TabsTrigger value="create" className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Tạo Content
                </TabsTrigger>
                <TabsTrigger value="history" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Lịch sử
                </TabsTrigger>
              </TabsList>

              <TabsContent value="create" className="space-y-8">
                {/* Category Selection */}
                <div>
                  <h3 className="text-lg font-semibold text-primary-deep mb-4">
                    1. Chọn loại content
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {contentCategories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                          selectedCategory === cat.id
                            ? "border-primary bg-primary-pale shadow-sacred"
                            : "border-primary-light/30 hover:border-primary/50 hover:bg-primary-pale/30"
                        }`}
                      >
                        <cat.icon className={`w-6 h-6 mb-2 ${
                          selectedCategory === cat.id ? "text-primary" : "text-foreground-muted"
                        }`} />
                        <p className="font-medium text-sm text-primary-deep">{cat.label}</p>
                        <p className="text-xs text-foreground-muted mt-1">{cat.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Content Input */}
                <div className="grid md:grid-cols-2 gap-8">
                  <Card className="card-sacred">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        2. Nhập thông tin
                      </CardTitle>
                      <CardDescription>
                        Cung cấp chi tiết để Angel AI tạo content phù hợp nhất
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-primary-deep mb-2">
                          Chủ đề / Tiêu đề *
                        </label>
                        <Input
                          placeholder="VD: Ra mắt sản phẩm skincare mới..."
                          value={topic}
                          onChange={(e) => setTopic(e.target.value)}
                          className="bg-background-pure"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-primary-deep mb-2">
                          Từ khóa (cách nhau bởi dấu phẩy)
                        </label>
                        <Input
                          placeholder="VD: skincare, dưỡng da, vitamin C..."
                          value={keywords}
                          onChange={(e) => setKeywords(e.target.value)}
                          className="bg-background-pure"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-primary-deep mb-2">
                            Giọng điệu
                          </label>
                          <Select value={tone} onValueChange={setTone}>
                            <SelectTrigger className="bg-background-pure">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {toneOptions.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-primary-deep mb-2">
                            Độ dài
                          </label>
                          <Select value={length} onValueChange={setLength}>
                            <SelectTrigger className="bg-background-pure">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {lengthOptions.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-primary-deep mb-2">
                          Yêu cầu thêm (tùy chọn)
                        </label>
                        <Textarea
                          placeholder="Thêm chi tiết, phong cách cụ thể, hoặc ví dụ mẫu..."
                          value={additionalInfo}
                          onChange={(e) => setAdditionalInfo(e.target.value)}
                          className="bg-background-pure min-h-[100px]"
                        />
                      </div>

                      <Button
                        onClick={handleGenerate}
                        disabled={isGenerating || !topic.trim()}
                        className="w-full bg-sapphire-gradient hover:opacity-90 transition-opacity"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Đang tạo content...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Tạo Content với Angel AI
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Generated Content */}
                  <Card className="card-sacred">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        3. Content được tạo
                      </CardTitle>
                      <CardDescription>
                        Kết quả từ Angel AI - sẵn sàng sử dụng
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {generatedContent ? (
                        <div className="space-y-4">
                          <div className="p-4 rounded-xl bg-primary-pale/30 border border-primary-light/50 min-h-[300px] max-h-[500px] overflow-y-auto">
                            <div className="prose prose-sm max-w-none whitespace-pre-wrap text-foreground-muted">
                              {generatedContent}
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              onClick={handleCopy}
                              className="flex-1"
                            >
                              <Copy className="w-4 h-4 mr-2" />
                              Sao chép
                            </Button>
                            <Button
                              variant="outline"
                              onClick={handleDownload}
                              className="flex-1"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Tải xuống
                            </Button>
                            <Button
                              variant="outline"
                              onClick={handleGenerate}
                              disabled={isGenerating}
                            >
                              <RefreshCw className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center min-h-[300px] text-center text-foreground-muted">
                          <Wand2 className="w-12 h-12 mb-4 text-primary-light" />
                          <p>Content sẽ xuất hiện ở đây</p>
                          <p className="text-sm mt-1">Nhập thông tin và nhấn "Tạo Content"</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="history">
                <Card className="card-sacred">
                  <CardHeader>
                    <CardTitle>Lịch sử Content</CardTitle>
                    <CardDescription>
                      Các content bạn đã tạo trước đó (coming soon)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center py-12 text-center text-foreground-muted">
                      <FileText className="w-12 h-12 mb-4 text-primary-light" />
                      <p>Tính năng lưu lịch sử sẽ sớm được cập nhật</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ContentWriter;
