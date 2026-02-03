import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { motion } from "framer-motion";

export const POPLFooter = () => {
  return (
    <>
      {/* Closing Section */}
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
                Đây là phiên bản "Hiến Pháp Ánh Sáng" Genesis v1.0
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
            © FUN Ecosystem — Proof of Pure Love Protocol v1.0
          </p>
          <div className="flex justify-center gap-4 mt-4 flex-wrap">
            <Link to="/about" className="text-purple-600 hover:text-purple-700 text-sm underline-offset-4 hover:underline">
              Về ANGEL AI
            </Link>
            <Link to="/docs/light-constitution" className="text-purple-600 hover:text-purple-700 text-sm underline-offset-4 hover:underline">
              Hiến Pháp Ánh Sáng
            </Link>
            <Link to="/docs/master-charter" className="text-purple-600 hover:text-purple-700 text-sm underline-offset-4 hover:underline">
              Hiến Pháp Gốc
            </Link>
            <Link to="/knowledge" className="text-purple-600 hover:text-purple-700 text-sm underline-offset-4 hover:underline">
              Kho Tri Thức
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
};
