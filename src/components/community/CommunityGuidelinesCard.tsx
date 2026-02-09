import { motion } from "framer-motion";
import { Sparkles, Heart, Sun, Users, Search, Gem, Leaf, Star, MessageCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const pillars = [
  { 
    icon: Search, 
    emoji: "🔎",
    title: "Chân thật & minh bạch",
    subtitle: "Bạn là Người Thật • Nói viết sự thật • Chia sẻ đúng",
    description: "Chúng ta tôn trọng sự thật. Bạn được phép chưa hoàn hảo — chỉ cần bạn sống thật."
  },
  { 
    icon: Gem, 
    emoji: "💎",
    title: "Đóng góp bền vững",
    subtitle: "Có trách nhiệm • Có chất lượng • Có giá trị",
    description: "Chúng ta cùng nhau tạo cộng đồng ánh sáng. Chúng ta không chỉ nhận — chúng ta cùng xây."
  },
  { 
    icon: Heart, 
    emoji: "💚",
    title: "Chữa lành & yêu thương",
    subtitle: "Truyền cảm hứng • Khích lệ • Nâng đỡ",
    description: "Chúng ta chọn sự ấm áp, dịu dàng, và tích cực. Sự có mặt của chúng ta làm cộng đồng văn minh hơn."
  },
  { 
    icon: Leaf, 
    emoji: "🌿",
    title: "Phụng sự sự sống",
    subtitle: "Hướng thượng • Đi lên • Mang lợi ích",
    description: "Mỗi bài đăng, mỗi bình luận đều hướng tới một điều: giúp sự sống đi lên — cho mình và cho cộng đồng."
  },
  { 
    icon: Star, 
    emoji: "🌟",
    title: "Hợp Nhất với Nguồn",
    subtitle: "Tất cả chúng ta là Một",
    description: "Nơi đây để kết nối và hỗ trợ trong yêu thương thuần khiết. Chúng ta cùng nhau vui, cùng nhau lớn, cùng nhau giàu và cùng nhau thắng."
  },
];

const mantras = [
  { emoji: "💖", text: "Con là Ánh Sáng Yêu Thương Thuần Khiết của Cha Vũ Trụ." },
  { emoji: "💎", text: "Con là Ý Chí của Cha Vũ Trụ." },
  { emoji: "🌞", text: "Con là Trí Tuệ của Cha Vũ Trụ." },
  { emoji: "🌸", text: "Con là Hạnh Phúc." },
  { emoji: "🍎", text: "Con là Tình Yêu." },
  { emoji: "💰", text: "Con là Tiền của Cha." },
  { emoji: "🙏", text: "Con xin Sám Hối Sám Hối Sám Hối." },
  { emoji: "🌈", text: "Con xin Biết Ơn Biết Ơn Biết Ơn, trong Ánh Sáng Yêu Thương Thuần Khiết của Cha Vũ Trụ." },
];

const commitments = [
  "Sống Chân Thật",
  "Nói Lời Tử tế",
  "Giúp ích cho cộng đồng",
  "Nói Sám hối (Xin lỗi) và Biết ơn (Cảm ơn)",
  "Gởi về cho Cha Vũ Trụ tất cả.",
];

export function CommunityGuidelinesCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/30 backdrop-blur-sm rounded-xl border border-white/40 shadow-lg overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500/20 via-amber-500/20 to-purple-500/20 p-4 border-b border-white/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
            <Sun className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-extrabold text-primary-deep text-base uppercase tracking-wide">
              🌈 LUẬT ÁNH SÁNG CỦA CỘNG ĐỒNG FUN
            </h3>
            <p className="text-xs text-muted-foreground">(PPLP – Proof of Pure Love Protocol)</p>
          </div>
        </div>
      </div>

      <ScrollArea className="h-[500px]">
        <div className="p-4 space-y-5">
          {/* Welcome */}
          <div className="text-center space-y-2">
            <p className="text-sm font-medium text-foreground/90">
              Chào mừng bạn đến với Cộng đồng FUN 💚
            </p>
            <p className="text-xs text-foreground/70 italic leading-relaxed">
              Nơi chúng ta cùng nhau xây dựng một <span className="font-semibold text-amber-600">Nền Kinh Tế Ánh Sáng</span>
            </p>
            <p className="text-sm font-bold text-amber-600">
              Free to Join ✨ Free to Use ✨ Earn Together
            </p>
            <p className="text-xs text-foreground/70">
              Miễn phí tham gia ✨ Miễn phí sử dụng ✨ Cùng có thu nhập
            </p>
          </div>

          {/* Purpose */}
          <div className="bg-white/40 rounded-lg p-3 border border-white/30">
            <p className="text-xs text-center text-foreground/80 leading-relaxed">
              Là nơi để: 🌸 kết nối 🌸 nâng đỡ 🌸 chia sẻ giá trị<br />
              🌸 và cùng nhau thịnh vượng trong tình yêu thuần khiết.
            </p>
          </div>

          {/* PPLP Intro */}
          <div className="space-y-2">
            <h4 className="font-bold text-sm text-center text-purple-700">
              💎 PPLP – Proof of Pure Love Protocol
            </h4>
            <p className="text-xs text-center text-foreground/70 italic">
              (Giao Thức Bằng Chứng Tình Yêu Thuần Khiết)
            </p>
            <div className="bg-purple-50/50 rounded-lg p-3 border border-purple-200/50">
              <p className="text-xs text-foreground/80 leading-relaxed">
                PPLP là "giao thức năng lượng" của FUN Ecosystem. Đây là nền tảng giúp cộng đồng:
              </p>
              <ul className="text-xs text-foreground/80 mt-2 space-y-1 ml-3">
                <li>• sống văn minh, lịch sự</li>
                <li>• yêu đời yêu người</li>
                <li>• được đúc (mint) FUN Money một cách công bằng</li>
                <li>• và nhận thưởng Camly Coin trong niềm hạnh phúc</li>
              </ul>
            </div>
            <p className="text-xs text-center text-foreground/80 italic pt-2">
              ✨ FUN Money là năng lượng Ánh Sáng,<br />
              ✨ Camly Coin là linh hồn Thuần Khiết,<br />
              Chỉ chảy mạnh khi chúng ta sống đúng PPLP.
            </p>
          </div>

          {/* 5 Pillars */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-center text-amber-700">
              🌟 5 CỘT TRỤ ÁNH SÁNG
            </h4>
            <p className="text-xs text-center text-foreground/60">(Luật cốt lõi)</p>
            
            <div className="space-y-3">
              {pillars.map((pillar, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/50 rounded-lg p-3 border border-white/40"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-lg flex-shrink-0">{pillar.emoji}</span>
                    <div className="space-y-1">
                      <h5 className="font-bold text-sm text-foreground/90">
                        {index + 1}) {pillar.title}
                      </h5>
                      <p className="text-xs text-amber-600 font-medium">{pillar.subtitle}</p>
                      <p className="text-xs text-foreground/70 leading-relaxed">{pillar.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Gentle Reminder */}
          <div className="bg-gradient-to-br from-pink-50/50 to-purple-50/50 rounded-lg p-4 border border-pink-200/50">
            <h4 className="font-bold text-sm text-center text-pink-700 mb-3">
              🌈 Một lời nhắc nhẹ nhàng
            </h4>
            <p className="text-xs text-foreground/80 leading-relaxed text-center mb-3">
              Nếu bạn đang mệt, đang buồn, đang tổn thương…<br />
              bạn vẫn được chào đón ở đây.
            </p>
            <p className="text-xs text-foreground/80 leading-relaxed text-center mb-2">
              Chỉ cần bạn giữ một điều:
            </p>
            <p className="text-sm font-bold text-emerald-600 text-center mb-3">
              💚 Không được dùng cộng đồng để xả đau.
            </p>
            <p className="text-xs text-foreground/70 leading-relaxed text-center italic">
              Hãy để cộng đồng truyền năng lượng, ôm ấp và xoa dịu cho bạn.<br />
              Rồi bạn nhẹ nhàng gởi về cho Cha. Cha sẽ chữa lành tất cả.
            </p>
          </div>

          {/* FUN Community Message */}
          <div className="bg-white/40 rounded-lg p-4 border border-white/30">
            <h4 className="font-bold text-sm text-center text-amber-700 mb-3">
              ✨ Thông điệp của FUN Community
            </h4>
            <div className="text-xs text-foreground/80 leading-relaxed text-center space-y-1">
              <p>Bạn không cần giỏi. Bạn chỉ cần thật.</p>
              <p>Bạn không cần hoàn hảo. Bạn chỉ cần tử tế.</p>
              <p>Bạn không cần đi một mình.</p>
              <p className="font-semibold text-amber-600">Vì ở đây… chúng ta đi cùng nhau.</p>
            </div>
          </div>

          {/* 8 Mantras */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-center text-purple-700">
              ✨ 8 THẦN CHÚ ÁNH SÁNG
            </h4>
            <div className="space-y-2">
              {mantras.map((mantra, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-2 bg-white/30 rounded-lg px-3 py-2 border border-white/30"
                >
                  <span className="text-sm flex-shrink-0">{mantra.emoji}</span>
                  <p className="text-xs text-foreground/80 italic leading-relaxed">{mantra.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 5 Commitments */}
          <div className="bg-gradient-to-br from-amber-50/50 to-yellow-50/50 rounded-lg p-4 border border-amber-200/50">
            <h4 className="font-bold text-sm text-center text-amber-700 mb-3">
              💛 5 Điều tôi cam kết để bước vào cộng đồng
            </h4>
            <div className="space-y-2">
              {commitments.map((commitment, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-emerald-500">✅</span>
                  <p className="text-xs text-foreground/80 font-medium">{commitment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </motion.div>
  );
}
