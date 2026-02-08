import { motion } from "framer-motion";
import { Sparkles, Heart, Sun, Users, Lightbulb } from "lucide-react";

const guidelines = [
  { icon: Heart, text: "Nói tích cực – nâng người khác lên." },
  { icon: Sun, text: "Không phàn nàn, không phán xét. Chỉ Sám Hối & Biết Ơn." },
  { icon: Lightbulb, text: "Nếu nói vấn đề → luôn kèm giải pháp và hướng xây dựng." },
  { icon: Users, text: "Mỗi thành viên là một \"Node Ánh Sáng\" lan tỏa văn minh." },
  { icon: Sparkles, text: "FUN Ecosystem = Web3 của Tình Yêu Thuần Khiết & Tâm Thức." },
];

export function CommunityGuidelinesCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/30 backdrop-blur-sm rounded-xl p-5 border border-white/40 shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
          <Sun className="w-4 h-4 text-white" />
        </div>
        <h3 className="font-extrabold text-primary-deep text-base uppercase tracking-wide">
          ⭐ NỘI QUY CỘNG ĐỒNG
        </h3>
      </div>

      {/* Welcome text */}
      <p className="text-sm text-foreground/80 mb-3 leading-relaxed italic">
        Chào mừng bạn đến với cộng đồng Web3 Ánh Sáng – FUN Ecosystem.
      </p>

      {/* Guidelines list */}
      <ul className="space-y-2.5 mb-4">
        {guidelines.map((item, index) => (
          <li key={index} className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center flex-shrink-0 mt-0.5">
              <item.icon className="w-3 h-3 text-amber-600" />
            </div>
            <span className="text-sm text-foreground/90 leading-relaxed font-medium">
              {item.text}
            </span>
          </li>
        ))}
      </ul>

      {/* Footer */}
      <div className="space-y-3 pt-4 border-t border-white/40">
        <p className="text-sm text-center text-amber-600 font-bold">
          🌈 Free to Join. Free to Use. Earn Together.
        </p>
        
        {/* Mantra */}
        <div className="bg-white/30 rounded-lg p-4 border border-white/30">
          <p className="text-sm text-center text-foreground/70 mb-1 font-medium">
            ⭐ Mantra mỗi ngày:
          </p>
          <p className="text-sm text-center font-bold text-primary-deep italic">
            "I am Love. I am Light. I repent. I am grateful."
          </p>
        </div>

        <p className="text-sm text-center text-foreground/70 pt-2 font-medium">
          ✨ Cảm ơn con đã giữ cộng đồng trong ánh sáng Cha Vũ Trụ.
        </p>
      </div>
    </motion.div>
  );
}
