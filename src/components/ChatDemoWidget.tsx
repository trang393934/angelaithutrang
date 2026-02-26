import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Sparkles, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import angelAvatar from "@/assets/angel-avatar.png";

const DEMO_MESSAGE_LIMIT = 5;
const DEMO_STORAGE_KEY = "angel_ai_demo_count";
const DEMO_MESSAGES_KEY = "angel_ai_demo_messages";

interface DemoMessage {
  role: "user" | "assistant";
  content: string;
}

export const ChatDemoWidget = () => {
  const { t, currentLanguage } = useLanguage();
  const { user } = useAuth();
  const [messages, setMessages] = useState<DemoMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resetTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "40px";
    }
  }, []);

  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "40px";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, []);

  // Initialize from localStorage
  useEffect(() => {
    const savedCount = parseInt(localStorage.getItem(DEMO_STORAGE_KEY) || "0", 10);
    const savedMessages = localStorage.getItem(DEMO_MESSAGES_KEY);
    
    setMessageCount(savedCount);
    
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch {
        // Invalid saved messages, start fresh
      }
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Don't render if user is logged in
  if (user) {
    return null;
  }

  const hasReachedLimit = messageCount >= DEMO_MESSAGE_LIMIT;

  const handleSend = async () => {
    if (!input.trim() || isLoading || hasReachedLimit) return;

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);

    // Add user message
    const newMessages: DemoMessage[] = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);

    try {
      // Call angel-chat with isDemo flag (no auth required)
      const response = await supabase.functions.invoke("angel-chat", {
        body: {
          messages: [{ role: "user", content: userMessage }],
          isDemo: true,
          responseStyle: "concise", // Use concise style for demo
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      // Handle standard JSON response
      let aiResponse = "";
      
      if (response.data?.choices?.[0]?.message?.content) {
        aiResponse = response.data.choices[0].message.content;
      }

      // Fallback response if AI fails
      if (!aiResponse) {
        aiResponse = getWelcomeMessage(currentLanguage);
      }

      // Add AI response
      const updatedMessages: DemoMessage[] = [...newMessages, { role: "assistant", content: aiResponse }];
      setMessages(updatedMessages);

      // Update message count
      const newCount = messageCount + 1;
      setMessageCount(newCount);
      
      // Save to localStorage
      localStorage.setItem(DEMO_STORAGE_KEY, newCount.toString());
      localStorage.setItem(DEMO_MESSAGES_KEY, JSON.stringify(updatedMessages));

    } catch (error) {
      console.error("Demo chat error:", error);
      // Add error message in persona style
      const errorMessage = currentLanguage === "vi" 
        ? "Bạn ơi, đường truyền đang gián đoạn. Hãy thử lại nhé! 💫"
        : "My friend, the connection was interrupted. Please try again! 💫";
      
      setMessages([...newMessages, { role: "assistant", content: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };



  return (
    <div className="w-full max-w-6xl mx-auto my-8 px-2 sm:px-4 opacity-0 animate-fade-in animate-delay-500">
      <div className="bg-card/80 backdrop-blur-sm border border-primary/20 rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-4 py-3 border-b border-primary/10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            <h3 className="font-serif font-semibold text-primary-deep">
              {t("chatDemo.title")}
            </h3>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="h-[350px] sm:h-[400px] md:h-[450px] p-4" ref={scrollRef}>
          {/* Welcome message if no messages yet */}
          {messages.length === 0 && !hasReachedLimit && (
            <div className="flex gap-3 mb-4 animate-fade-in">
              <img 
                src={angelAvatar} 
                alt="Angel AI" 
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              />
              <div className="bg-primary/5 rounded-2xl rounded-tl-md px-4 py-3 max-w-[88%]">
                <p className="text-sm text-foreground leading-relaxed">
                  {t("chatDemo.welcomeMessage")}
                </p>
              </div>
            </div>
          )}

          {/* Chat messages */}
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 mb-4 animate-fade-in ${
                message.role === "user" ? "flex-row-reverse" : ""
              }`}
            >
              {message.role === "assistant" && (
                <img 
                  src={angelAvatar} 
                  alt="Angel AI" 
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
              )}
              <div
                className={`rounded-2xl px-4 py-3 max-w-[88%] ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-md"
                    : "bg-primary/5 rounded-tl-md"
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </p>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-3 mb-4 animate-fade-in">
              <img 
                src={angelAvatar} 
                alt="Angel AI" 
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              />
              <div className="bg-primary/5 rounded-2xl rounded-tl-md px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          {/* Limit reached message */}
          {hasReachedLimit && (
            <div className="text-center py-6 animate-fade-in">
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-6 border border-primary/20">
                <Lock className="w-10 h-10 text-primary mx-auto mb-3" />
                <h4 className="font-serif font-semibold text-primary-deep mb-2">
                  {t("chatDemo.limitReached")}
                </h4>
                <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                  {t("chatDemo.limitMessage")}
                </p>
                <Link to="/auth">
                  <Button className="btn-sacred">
                    <Sparkles className="w-4 h-4 mr-2" />
                    {t("chatDemo.signupCta")}
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Input Area - Auto-expanding textarea */}
        {!hasReachedLimit && (
          <div className="p-3 sm:p-4 border-t border-primary/10 bg-background/50">
            <div className="flex gap-2 items-end">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  adjustTextareaHeight();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                    resetTextareaHeight();
                  }
                }}
                placeholder={t("chatDemo.placeholder")}
                disabled={isLoading}
                rows={1}
                className="flex-1 bg-background border border-primary/20 focus:border-primary/40 rounded-xl px-4 py-2.5 text-sm resize-none outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                style={{ height: "40px", maxHeight: "200px", overflowY: "auto" }}
              />
              <Button
                onClick={() => {
                  handleSend();
                  resetTextareaHeight();
                }}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="bg-primary hover:bg-primary/90 flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            {/* Progress indicator */}
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>💬 {t("chatDemo.remaining").replace("{count}", String(DEMO_MESSAGE_LIMIT - messageCount))}</span>
              <div className="flex gap-1">
                {Array.from({ length: DEMO_MESSAGE_LIMIT }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i < messageCount ? "bg-primary" : "bg-primary/20"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Fallback welcome messages by language
function getWelcomeMessage(lang: string): string {
  const messages: Record<string, string> = {
    vi: "Xin chào bạn thân mến! Mình là Angel AI, người bạn đồng hành của bạn. Hãy chia sẻ với mình bất cứ điều gì nhé! 💫",
    en: "Hello, my friend! I'm Angel AI, your companion on the journey. Share with me whatever is on your mind! 💫",
    zh: "你好，朋友！我是Angel AI，你的同行伙伴。请与我分享你心中的任何事！💫",
    ja: "こんにちは！Angel AIです。あなたの旅の仲間です。心にあることを何でも話してください！💫",
    ko: "안녕하세요! Angel AI입니다. 당신의 동반자입니다. 마음속에 있는 것을 무엇이든 나눠주세요! 💫",
    es: "¡Hola, amigo! Soy Angel AI, tu compañero de viaje. ¡Comparte conmigo lo que tengas en mente! 💫",
    fr: "Bonjour, mon ami ! Je suis Angel AI, votre compagnon de route. Partagez avec moi ce qui vous tient à cœur ! 💫",
    de: "Hallo, mein Freund! Ich bin Angel AI, dein Begleiter. Teile mit mir, was dich bewegt! 💫",
    pt: "Olá, meu amigo! Eu sou Angel AI, seu companheiro de jornada. Compartilhe comigo o que está em sua mente! 💫",
    ru: "Привет, друг! Я Angel AI, ваш спутник на этом пути. Поделитесь со мной тем, что у вас на душе! 💫",
    ar: "مرحباً يا صديقي! أنا Angel AI، رفيقك في الرحلة. شاركني ما يدور في ذهنك! 💫",
    hi: "नमस्ते, मेरे दोस्त! मैं Angel AI हूँ, आपका साथी। अपने मन की बात मुझसे साझा करें! 💫",
  };
  return messages[lang] || messages.en;
}
