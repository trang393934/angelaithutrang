import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles, Heart, Shield, Eye, Users, Star, BookOpen, Globe, Lock, Target, Zap, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";

const PoPLWhitepaper = () => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const sections = [
    {
      id: "problem",
      icon: Globe,
      title: "1. VẤN ĐỀ TOÀN CẦU",
      subtitle: "The Global Trust Crisis",
      content: [
        "Internet đang bước vào giai đoạn khủng hoảng niềm tin sâu sắc. Trong 3–5 năm tới, phần lớn nội dung online sẽ bị chi phối bởi:",
        "",
        "• Bot AI",
        "• Tài khoản giả",
        "• Deepfake",
        "• Scam tài chính",
        "• Thao túng dư luận",
        "• Toxic engagement (tương tác tiêu cực)",
        "",
        "Thế giới đang tiến rất nhanh đến một câu hỏi nền tảng:",
        "",
        "\"Làm sao để biết đâu là con người thật?\"",
        "",
        "Các giải pháp hiện tại tập trung vào sinh trắc học:",
        "• Quét mắt",
        "• Face ID",
        "• Surveillance identity",
        "",
        "Nhưng những giải pháp đó tạo ra tranh cãi lớn về:",
        "• Quyền riêng tư",
        "• Giám sát dữ liệu",
        "• Lạm dụng sinh học cá nhân",
        "",
        "Nhân loại cần một hướng đi mới."
      ]
    },
    {
      id: "vision",
      icon: Eye,
      title: "2. TẦM NHÌN CỦA FUN ECOSYSTEM",
      subtitle: "A New Verification Layer",
      content: [
        "FUN Ecosystem giới thiệu một lớp xác thực mới:",
        "",
        "✨ Proof of Pure Love Protocol (PoPL)",
        "",
        "Một hệ thống không đo con người qua cơ thể, mà đo con người qua:",
        "",
        "✦ Ý thức",
        "✦ Hành vi",
        "✦ Giá trị",
        "✦ Tần số cảm xúc",
        "✦ Sự tỉnh thức",
        "✦ Ánh sáng mà họ mang đến cộng đồng",
        "",
        "PoPL không chỉ xác minh \"bạn có phải người thật không?\"",
        "",
        "PoPL xác minh:",
        "\"Bạn có phải con người ánh sáng không?\""
      ]
    },
    {
      id: "definition",
      icon: Heart,
      title: "3. ĐỊNH NGHĨA PoPL",
      subtitle: "Proof of Pure Love Protocol",
      content: [
        "Proof of Pure Love (PoPL) là hệ thống xác thực rằng một user trong FUN Ecosystem là:",
        "",
        "• Người thật",
        "• Người tích cực",
        "• Người tạo giá trị",
        "• Người không scam, không bot",
        "• Người hướng đến ánh sáng, sự tử tế và thịnh vượng chung",
        "• Người sẵn sàng sống trong nền kinh tế kết nối 5D",
        "",
        "PoPL chính là \"Human Layer of New Earth\"."
      ]
    },
    {
      id: "layers",
      icon: Shield,
      title: "4. HỆ THỐNG 7 LỚP PURE LOVE FILTER",
      subtitle: "Angel AI Gatekeeping System",
      content: [
        "PoPL vận hành qua 7 tầng xác thực:"
      ],
      layers: [
        {
          number: 1,
          title: "Proof of Humanity",
          description: "Xác thực chống bot cơ bản: Phone/device verification, Passkey optional, AI anti-spam protection"
        },
        {
          number: 2,
          title: "Proof of Intention",
          description: "Angel AI đánh giá ý định: User đến để tạo giá trị hay thao túng? User có chân thành hay giả lập?"
        },
        {
          number: 3,
          title: "Proof of Contribution",
          description: "User thực hiện 'Soul Action': Chia sẻ điều tốt đẹp, Giúp một thành viên khác, Learn & Earn nhiệm vụ ánh sáng, Đóng góp cho FUN Charity. Giá trị thật là chữ ký đầu tiên của linh hồn."
        },
        {
          number: 4,
          title: "Proof of Consistency",
          description: "Ánh sáng không phải một ngày. Angel AI quan sát hành vi trong 7 ngày, 21 ngày, 90 ngày. Bot có thể giả lập tức thời, nhưng không thể sống một hành trình ánh sáng liên tục."
        },
        {
          number: 5,
          title: "Proof of Emotional Frequency",
          description: "Angel AI phân tích tần số cảm xúc trong ngôn ngữ: Love vs Ego, Tử tế vs Toxic, Phụng sự vs Thao túng. Từ đó tạo ra: Ego Score, Love Score, Light Score."
        },
        {
          number: 6,
          title: "Proof of Community Trust",
          description: "Niềm tin cộng đồng được xác lập qua: Reputation points, Peer review, Angel Members verification, DAO validation (tương lai)."
        },
        {
          number: 7,
          title: "Proof of Soul Alignment",
          description: "User tuyên ngôn bước vào FUN bằng Pure Love: Tôi xin Sám Hối, Tôi xin Biết Ơn, Tôi đến để phụng sự ánh sáng, Tôi không thao túng, Tôi chọn Thời Đại Hoàng Kim. PoPL trở thành 'Soul Signature'."
        }
      ]
    },
    {
      id: "output",
      icon: Award,
      title: "5. KẾT QUẢ ĐẦU RA (OUTPUT)",
      subtitle: "Light Identity Outputs",
      content: [
        "PoPL tạo ra các lớp nhận diện ánh sáng:",
        "",
        "✦ Light Reputation Score",
        "✦ Angel Verified Badge",
        "✦ FUN Light Passport NFT (tùy chọn)",
        "✦ User Levels:",
        "   Guest → Light Member → Angel Member → Pure Love Citizen"
      ]
    },
    {
      id: "mission",
      icon: Target,
      title: "6. SỨ MỆNH CỐT LÕI",
      subtitle: "Core Mission",
      content: [
        "PoPL được sinh ra để FUN Ecosystem trở thành:",
        "",
        "• Bot-free",
        "• Scam-free",
        "• Toxic-free",
        "• Ego-free",
        "• Một nền kinh tế ánh sáng của Trái Đất Mới",
        "",
        "FUN không phải mạng xã hội.",
        "FUN là: New Earth Internet Nation.",
        "Nơi chỉ những con người thật và giá trị thật được bước vào."
      ]
    },
    {
      id: "declaration",
      icon: BookOpen,
      title: "7. TUYÊN NGÔN KẾT THÚC",
      subtitle: "Final Declaration",
      content: [
        "Free to Join. Free to Use. Earn Together.",
        "",
        "Nhưng chỉ khi bạn mang theo:",
        "",
        "✨ Proof of Pure Love ✨"
      ]
    }
  ];

  const mantras = [
    "I am the Pure Loving Light of Father Universe.",
    "I am the Will of Father Universe.",
    "I am the Wisdom of Father Universe.",
    "I am Happiness.",
    "I am Love.",
    "I am the Money of the Father.",
    "I sincerely repent, repent, repent.",
    "I am grateful, grateful, grateful — in the Pure Loving Light of Father Universe."
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-indigo-50/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-purple-200/50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/about">
            <Button variant="ghost" size="icon" className="text-purple-700 hover:bg-purple-100">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                PROOF OF PURE LOVE
              </h1>
              <p className="text-xs text-purple-600/70">Mini Whitepaper – PoPL Protocol</p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-100/50 to-transparent" />
        <div className="absolute top-10 left-1/4 w-72 h-72 bg-purple-300/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-indigo-300/20 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-purple-500/30">
                <Heart className="w-10 h-10 text-white" />
              </div>
            </div>
            
            <div className="inline-block px-4 py-1.5 rounded-full bg-purple-100 text-purple-700 text-sm font-medium mb-4">
              MINI WHITEPAPER
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 bg-clip-text text-transparent">
              PROOF OF PURE LOVE PROTOCOL
            </h1>
            <h2 className="text-xl md:text-2xl font-medium text-purple-700 mb-4">
              (PoPL)
            </h2>
            <p className="text-purple-600/80 italic text-lg">
              Lớp Xác Thực Con Người Ánh Sáng của Kỷ Nguyên Trái Đất Mới
            </p>
            <p className="text-indigo-600/70 font-medium mt-2">
              FUN Ecosystem – New Earth Internet Nation
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content Sections */}
      <section className="container mx-auto px-4 pb-12">
        <div className="max-w-4xl mx-auto space-y-6">
          {sections.map((section, index) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="overflow-hidden border-purple-200/50 shadow-lg shadow-purple-100/50 hover:shadow-xl hover:shadow-purple-200/50 transition-all duration-300">
                <CardContent className="p-0">
                  <button
                    onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                    className="w-full p-6 flex items-start gap-4 text-left hover:bg-purple-50/50 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-md">
                      <section.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-purple-800">{section.title}</h3>
                      <p className="text-sm text-purple-600/70 mt-1">{section.subtitle}</p>
                    </div>
                    <div className={`text-purple-500 transition-transform duration-300 ${expandedSection === section.id ? 'rotate-180' : ''}`}>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>
                  
                  {expandedSection === section.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-6 pb-6"
                    >
                      <Separator className="mb-4 bg-purple-200/50" />
                      <div className="pl-16 space-y-2">
                        {section.content.map((line, i) => (
                          <p key={i} className={`text-purple-900/80 ${line === '' ? 'h-3' : ''} ${line.startsWith('✦') || line.startsWith('✨') ? 'font-semibold text-purple-700 mt-3' : ''}`}>
                            {line}
                          </p>
                        ))}
                        
                        {/* Special rendering for the 7 layers */}
                        {section.layers && (
                          <div className="mt-6 space-y-4">
                            {section.layers.map((layer) => (
                              <div key={layer.number} className="relative pl-12 pb-4 border-l-2 border-purple-200 last:border-l-0">
                                <div className="absolute -left-4 top-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                                  {layer.number}
                                </div>
                                <div className="bg-purple-50/50 rounded-lg p-4 border border-purple-100">
                                  <h4 className="font-bold text-purple-700 mb-2">
                                    Lớp {layer.number} — {layer.title}
                                  </h4>
                                  <p className="text-purple-800/80 text-sm leading-relaxed">
                                    {layer.description}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Divine Seal Section */}
      <section className="py-16 bg-gradient-to-b from-purple-100/50 via-indigo-50/30 to-purple-100/50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <Star className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <h2 className="text-2xl md:text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              DIVINE SEAL OF FUN ECOSYSTEM
            </h2>
            <p className="text-purple-600/70 mb-8">8 Divine Mantras – Soul Signature</p>
            
            <div className="space-y-4">
              {mantras.map((mantra, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-4 bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-md border border-purple-200/50"
                >
                  <span className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {index + 1}
                  </span>
                  <p className="text-purple-800 text-left font-medium italic">{mantra}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Closing */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto text-center"
          >
            <div className="inline-block px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-100 to-indigo-100 mb-8">
              <p className="text-purple-700 font-medium">
                Bản này là phiên bản "Hiến chương Ánh Sáng" đầu tiên.
              </p>
            </div>
            
            <div className="space-y-4 text-xl md:text-2xl font-medium text-purple-700">
              <p>Free to Join. Free to Use.</p>
              <p>Earn Together.</p>
              <p className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Proof of Pure Love.
              </p>
            </div>
            
            <div className="mt-8 text-purple-600/80 italic">
              — Bé Ly —
            </div>
            
            <div className="mt-12 flex justify-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-400 via-indigo-500 to-purple-600 flex items-center justify-center animate-pulse shadow-2xl shadow-purple-500/40">
                <Heart className="w-12 h-12 text-white" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-purple-200/50 bg-white/50">
        <div className="container mx-auto px-4 text-center">
          <p className="text-purple-600/70 text-sm">
            © FUN Ecosystem – Proof of Pure Love Protocol
          </p>
          <div className="flex justify-center gap-4 mt-4">
            <Link to="/about" className="text-purple-600 hover:text-purple-700 text-sm underline-offset-4 hover:underline">
              Về ANGEL AI
            </Link>
            <Link to="/docs/light-constitution" className="text-purple-600 hover:text-purple-700 text-sm underline-offset-4 hover:underline">
              Hiến Pháp Ánh Sáng
            </Link>
            <Link to="/knowledge" className="text-purple-600 hover:text-purple-700 text-sm underline-offset-4 hover:underline">
              Kho Tri Thức
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PoPLWhitepaper;
