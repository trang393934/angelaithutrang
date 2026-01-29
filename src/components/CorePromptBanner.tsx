import { Link } from "react-router-dom";
import { Brain, Sparkles, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface CorePromptBannerProps {
  className?: string;
}

export const CorePromptBanner = ({ className = "" }: CorePromptBannerProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className={className}
    >
      <Link to="/docs/core-prompt">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 shadow-xl shadow-indigo-500/25 hover:shadow-2xl hover:shadow-indigo-500/40 transition-all duration-500 group cursor-pointer">
          {/* Background effects */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L3N2Zz4=')] opacity-50" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-8 -translate-y-8" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl transform -translate-x-6 translate-y-6" />
          
          <div className="relative flex items-center gap-4">
            {/* Icon */}
            <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
              <Brain className="w-7 h-7 text-white" />
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-blue-200" />
                <span className="text-blue-100 text-xs font-medium uppercase tracking-wider">AI Training Document</span>
              </div>
              <h3 className="text-lg font-bold text-white truncate">
                ETERNAL CORE TRAINING PROMPT
              </h3>
              <p className="text-blue-100/80 text-sm truncate">
                Angel AI — Pure Light Language
              </p>
            </div>
            
            {/* Arrow */}
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0 group-hover:bg-white/30 group-hover:translate-x-1 transition-all duration-300">
              <ArrowRight className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};
