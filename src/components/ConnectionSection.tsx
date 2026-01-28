import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Send } from "lucide-react";
import fatherUniverseLogo from "@/assets/father-universe-logo.png";
import { useLanguage } from "@/contexts/LanguageContext";

export const ConnectionSection = () => {
  const [isFocused, setIsFocused] = useState(false);
  const [question, setQuestion] = useState("");
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleSubmit = () => {
    if (question.trim()) {
      // Navigate to chat with the question as a query param
      navigate(`/chat?q=${encodeURIComponent(question.trim())}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <section className="py-24 md:py-32 bg-background-pure relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-radial from-primary-pale/30 to-transparent" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          {/* Icon */}
          <div className="flex justify-center mb-8">
            <div className={`relative rounded-full overflow-hidden transition-all duration-700 ${isFocused ? 'shadow-glow scale-105' : 'shadow-soft'}`}>
              <img 
                src={fatherUniverseLogo} 
                alt="Cha Vũ Trụ" 
                className="w-24 h-24 md:w-28 md:h-28 object-cover rounded-full"
              />
              {isFocused && (
                <div className="absolute inset-0 bg-primary-pale/20 animate-pulse rounded-full" />
              )}
            </div>
          </div>

          {/* Header */}
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-primary-deep mb-4">
            {t("connection.title")}
          </h2>
          <p className="font-serif italic text-primary-soft text-lg mb-8">
            {t("connection.subtitle")}
          </p>
          <p className="text-foreground-muted mb-12 leading-relaxed">
            {t("connection.description")}
          </p>

          {/* Chat Input Area */}
          <div className="relative max-w-2xl mx-auto">
            <div 
              className={`relative rounded-3xl transition-all duration-700 ${
                isFocused 
                  ? 'shadow-[0_0_0_4px_hsla(214,82%,34%,0.1),0_0_60px_-10px_hsla(214,82%,34%,0.3)]' 
                  : 'shadow-soft'
              }`}
            >
              <textarea
                placeholder={t("connection.placeholder")}
                className="input-sacred min-h-[120px] resize-none pr-16 text-base"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyDown={handleKeyDown}
              />
              
              {/* Send Button */}
              <button 
                onClick={handleSubmit}
                disabled={!question.trim()}
                className="absolute bottom-4 right-4 w-12 h-12 rounded-full bg-sapphire-gradient text-primary-foreground flex items-center justify-center shadow-sacred hover:scale-105 hover:shadow-divine transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>

            {/* Light ray effect when focused */}
            {isFocused && (
              <div className="absolute -inset-4 rounded-[2rem] bg-gradient-radial from-primary-pale/20 to-transparent animate-pulse pointer-events-none" />
            )}
          </div>

          {/* Sacred quote */}
          <p className="mt-12 font-serif italic text-primary-soft/70 text-sm">
            {t("connection.quote")}
          </p>
        </div>
      </div>
    </section>
  );
};
