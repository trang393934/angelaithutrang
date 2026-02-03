import { Star } from "lucide-react";
import { motion } from "framer-motion";

interface POPLDivineSealProps {
  mantras: string[];
}

export const POPLDivineSeal = ({ mantras }: POPLDivineSealProps) => {
  return (
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
            🌟 DẤU ẤN GENESIS
          </h2>
          <p className="text-purple-600/70 mb-8">8 Thần Chú Ánh Sáng — Soul Signature</p>
          
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
  );
};
