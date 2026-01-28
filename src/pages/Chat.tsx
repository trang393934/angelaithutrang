import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { 
  ArrowLeft, Send, Sparkles, Lock, Coins, Heart, Copy, Share2, 
  ImagePlus, Camera, Wand2, X, Download, Loader2, MessageSquare,
  History, FolderOpen, Plus, Volume2, Image, Menu
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import angelAvatar from "@/assets/angel-avatar.png";
import ChatRewardNotification from "@/components/ChatRewardNotification";
import ChatShareDialog from "@/components/ChatShareDialog";
import EarlyAdopterRewardPopup from "@/components/EarlyAdopterRewardPopup";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatSessionsSidebar } from "@/components/chat/ChatSessionsSidebar";
import { ImageHistorySidebar } from "@/components/chat/ImageHistorySidebar";
import { AudioButton } from "@/components/chat/AudioButton";
import { useCamlyCoin } from "@/hooks/useCamlyCoin";
import { useExtendedRewardStatus } from "@/hooks/useExtendedRewardStatus";
import { useImageGeneration } from "@/hooks/useImageGeneration";
import { useImageAnalysis } from "@/hooks/useImageAnalysis";
import { useEarlyAdopterReward } from "@/hooks/useEarlyAdopterReward";
import { useChatHistory } from "@/hooks/useChatHistory";
import { useChatSessions } from "@/hooks/useChatSessions";
import { useChatFolders } from "@/hooks/useChatFolders";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { useImageHistory } from "@/hooks/useImageHistory";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Message {
  role: "user" | "assistant";
  content: string;
  type?: "text" | "image" | "image-analysis";
  imageUrl?: string;
}

interface RewardData {
  coins: number;
  purityScore: number;
  message: string;
  questionsRemaining: number;
}

interface ShareDialogState {
  isOpen: boolean;
  question: string;
  answer: string;
}

type ChatMode = "chat" | "generate-image" | "analyze-image";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/angel-chat`;

const Chat = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const { t } = useLanguage();
  const { dailyStatus, refreshBalance } = useCamlyCoin();
  const { sharesRewarded, sharesRemaining, refreshStatus: refreshExtendedStatus } = useExtendedRewardStatus();
  const { 
    showRewardPopup: showEarlyAdopterPopup, 
    rewardResult: earlyAdopterResult, 
    incrementQuestionCount, 
    dismissRewardPopup: dismissEarlyAdopterPopup 
  } = useEarlyAdopterReward();
  const { saveToHistory: saveToChatHistory } = useChatHistory();
  
  // Chat sessions & folders
  const {
    sessions,
    currentSession,
    sessionMessages,
    createSession,
    updateSession,
    deleteSession,
    selectSession,
    endCurrentSession,
    fetchSessionMessages,
  } = useChatSessions();
  
  const {
    folders,
    createFolder,
    updateFolder,
    deleteFolder,
  } = useChatFolders();

  // Image history
  const {
    history: imageHistory,
    isLoading: imageHistoryLoading,
    saveToHistory: saveToImageHistory,
    deleteFromHistory: deleteFromImageHistory,
  } = useImageHistory();

  // Sidebar states
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showImageHistorySidebar, setShowImageHistorySidebar] = useState(false);
  
  const [hasAgreed, setHasAgreed] = useState<boolean | null>(null);
  const [userResponseStyle, setUserResponseStyle] = useState<string>("detailed");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: t("chat.welcome"),
      type: "text"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentReward, setCurrentReward] = useState<RewardData | null>(null);
  const [hasProcessedQuery, setHasProcessedQuery] = useState(false);
  const [shareDialog, setShareDialog] = useState<ShareDialogState>({
    isOpen: false,
    question: "",
    answer: ""
  });
  const [chatMode, setChatMode] = useState<ChatMode>("chat");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageStyle, setImageStyle] = useState<"spiritual" | "realistic" | "artistic">("spiritual");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isGenerating, generateImage } = useImageGeneration();
  const { isAnalyzing, analyzeImage } = useImageAnalysis();
  const { isLoading: ttsLoading, isPlaying: ttsPlaying, currentMessageId: ttsMessageId, playText, stopAudio } = useTextToSpeech();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Helper to find the question for an assistant message
  const getQuestionForAnswer = (answerIndex: number): string => {
    for (let i = answerIndex - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        return messages[i].content;
      }
    }
    return "";
  };

  const handleCopyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success(t("chat.copied"));
    } catch (error) {
      toast.error(t("chat.copyError"));
    }
  };

  const handleOpenShare = (answerIndex: number, answerContent: string) => {
    const question = getQuestionForAnswer(answerIndex);
    setShareDialog({
      isOpen: true,
      question,
      answer: answerContent
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error(t("chat.fileImageOnly"));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error(t("chat.fileTooLarge"));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setUploadedImage(dataUrl);
      setChatMode("analyze-image");
    };
    reader.readAsDataURL(file);
  };

  const handleDownloadImage = (imageUrl: string) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `angel-ai-image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Check if user has agreed to Light Law and fetch response style
  useEffect(() => {
    const checkAgreementAndProfile = async () => {
      if (!user) {
        setHasAgreed(false);
        return;
      }
      
      // Check light agreement
      const { data: agreementData } = await supabase
        .from("user_light_agreements")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      
      setHasAgreed(!!agreementData);
      
      // Fetch user's response style preference
      const { data: profileData } = await supabase
        .from("profiles")
        .select("response_style")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (profileData?.response_style) {
        setUserResponseStyle(profileData.response_style);
        console.log("User response style:", profileData.response_style);
      }
    };

    if (!authLoading) {
      checkAgreementAndProfile();
    }
  }, [user, authLoading]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load session messages when session changes
  useEffect(() => {
    if (currentSession && sessionMessages.length > 0) {
      const loadedMessages: Message[] = [
        { role: "assistant", content: t("chat.welcome"), type: "text" }
      ];
      
      sessionMessages.forEach(msg => {
        loadedMessages.push({ role: "user", content: msg.question_text, type: "text" });
        loadedMessages.push({ role: "assistant", content: msg.answer_text, type: "text" });
      });
      
      setMessages(loadedMessages);
    } else if (!currentSession) {
      // Reset to welcome message when no session
      setMessages([{ role: "assistant", content: t("chat.welcome"), type: "text" }]);
    }
  }, [currentSession, sessionMessages, t]);

  // Handle new session creation
  const handleNewSession = async () => {
    await endCurrentSession();
    setMessages([{ role: "assistant", content: t("chat.welcome"), type: "text" }]);
    toast.success("Bắt đầu cuộc trò chuyện mới");
  };

  const streamChat = async (userMessages: Message[], userResponseStyle?: string): Promise<string> => {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ 
        messages: userMessages.map(m => ({ role: m.role, content: m.content })),
        responseStyle: userResponseStyle || 'detailed'
      }),
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      if (resp.status === 429) {
        throw new Error(errorData.error || t("common.error"));
      }
      if (resp.status === 402) {
        throw new Error(errorData.error || t("common.error"));
      }
      throw new Error(errorData.error || t("common.error"));
    }

    if (!resp.body) throw new Error(t("common.error"));

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let assistantContent = "";

    setMessages(prev => [...prev, { role: "assistant", content: "", type: "text" }]);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") break;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            assistantContent += content;
            setMessages(prev => {
              const updated = [...prev];
              updated[updated.length - 1] = { role: "assistant", content: assistantContent, type: "text" };
              return updated;
            });
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }
    
    return assistantContent;
  };

  const analyzeAndReward = useCallback(async (questionText: string, aiResponse: string) => {
    if (!user) return;
    try {
      const { data } = await supabase.functions.invoke("analyze-reward-question", {
        body: { questionText, aiResponse },
      });
      
      // Handle response recycling detection
      if (data?.isResponseRecycled) {
        toast.info(data.message, {
          duration: 8000,
          icon: "💫",
          style: {
            background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
            border: "1px solid #f59e0b",
            color: "#92400e",
          }
        });
        // Still update remaining questions count
        if (data.questionsRemaining !== undefined) {
          setCurrentReward({
            coins: 0,
            purityScore: 0,
            message: data.message,
            questionsRemaining: data.questionsRemaining,
          });
        }
        return;
      }
      
      if (data?.rewarded) {
        setCurrentReward({
          coins: data.coins,
          purityScore: data.purityScore,
          message: data.message,
          questionsRemaining: data.questionsRemaining,
        });
        refreshBalance();
        
        // Early adopter count is now incremented server-side in analyze-reward-question
        // Just refresh the status to get updated count
        if (!data.isGreeting && !data.isSpam && !data.isDuplicate) {
          // Status will be refreshed through the hook's subscription
        }
      }
    } catch (error) {
      console.error("Reward analysis error:", error);
    }
  }, [user, refreshBalance]);

  // Image generation - saves to IMAGE history (separate from chat history)
  const handleGenerateImage = async (prompt: string) => {
    setMessages(prev => [...prev, { role: "user", content: `🎨 ${t("chat.createImage")} ${prompt}`, type: "text" }]);
    setMessages(prev => [...prev, { role: "assistant", content: t("chat.creatingImage"), type: "text" }]);
    
    try {
      const result = await generateImage(prompt, imageStyle);
      
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: result.description || t("chat.imageCreated"),
          type: "image",
          imageUrl: result.imageUrl
        };
        return updated;
      });
      
      // Save to IMAGE history (not chat history)
      if (user && result.imageUrl) {
        saveToImageHistory('generated', prompt, result.imageUrl, result.description, imageStyle);
      }
      
      toast.success(t("chat.imageCreated"));
    } catch (error: any) {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: `${t("chat.imageError")} ${error.message}`,
          type: "text"
        };
        return updated;
      });
      toast.error(error.message || t("chat.imageError"));
    }
  };

  // Image analysis - saves to IMAGE history (separate from chat history)
  const handleAnalyzeImage = async (question: string) => {
    if (!uploadedImage) return;
    
    const imageToAnalyze = uploadedImage; // Store before clearing

    setMessages(prev => [...prev, { 
      role: "user", 
      content: question || t("chat.analyzeDefault"), 
      type: "image-analysis",
      imageUrl: imageToAnalyze
    }]);
    setMessages(prev => [...prev, { role: "assistant", content: "", type: "text" }]);

    let analysisResult = "";
    
    try {
      await analyzeImage(imageToAnalyze, question, (text) => {
        analysisResult = text;
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: text, type: "text" };
          return updated;
        });
      });
      
      // Save to IMAGE history (not chat history)
      if (user && analysisResult) {
        saveToImageHistory('analyzed', question || t("chat.analyzeDefault"), imageToAnalyze, analysisResult);
      }
      
      setUploadedImage(null);
      setChatMode("chat");
    } catch (error: any) {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: `${t("chat.analyzeError")} ${error.message}`,
          type: "text"
        };
        return updated;
      });
      toast.error(error.message || t("chat.analyzeError"));
    }
  };

  const sendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage = messageText.trim();

    if (chatMode === "generate-image") {
      setIsLoading(true);
      await handleGenerateImage(userMessage);
      setIsLoading(false);
      setChatMode("chat");
      return;
    }

    if (chatMode === "analyze-image" && uploadedImage) {
      setIsLoading(true);
      await handleAnalyzeImage(userMessage);
      setIsLoading(false);
      return;
    }
    
    const newMessages: Message[] = [...messages, { role: "user", content: userMessage, type: "text" }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const assistantResponse = await streamChat(newMessages, userResponseStyle);
      
      // Create session if first message in new conversation
      let activeSessionId = currentSession?.id;
      if (!activeSessionId && user) {
        const newSession = await createSession(userMessage.slice(0, 50) + (userMessage.length > 50 ? "..." : ""));
        activeSessionId = newSession?.id;
      }
      
      // Save to chat history with session
      if (user && assistantResponse) {
        saveToChatHistory(userMessage, assistantResponse, {
          sessionId: activeSessionId,
        });
      }
      
      // Analyze and reward
      setTimeout(() => {
        analyzeAndReward(userMessage, assistantResponse);
      }, 500);
    } catch (error) {
      console.error("Chat error:", error);
      toast.error(error instanceof Error ? error.message : t("common.error"));
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, chatMode, uploadedImage, analyzeAndReward, t, user, currentSession, createSession, saveToChatHistory]);

  useEffect(() => {
    const questionFromQuery = searchParams.get("q");
    const isSearchQuery = searchParams.get("isSearch") === "true";
    
    if (questionFromQuery && hasAgreed && !hasProcessedQuery && !isLoading) {
      setHasProcessedQuery(true);
      setSearchParams({}, { replace: true });
      
      // Add marker for edge function to detect search intent
      const finalMessage = isSearchQuery 
        ? `[SEARCH_INTENT] ${questionFromQuery}`
        : questionFromQuery;
        
      setTimeout(() => {
        sendMessage(finalMessage);
      }, 300);
    }
  }, [searchParams, hasAgreed, hasProcessedQuery, isLoading, sendMessage, setSearchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || isGenerating || isAnalyzing) return;

    const userMessage = input.trim();
    setInput("");
    await sendMessage(userMessage);
  };

  // Access restricted
  if (!authLoading && (!user || hasAgreed === false)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-pale via-background to-background flex flex-col items-center justify-center p-4">
        <div className="max-w-md text-center space-y-6">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-divine-gold/30 rounded-full blur-xl animate-pulse-divine" />
            <div className="relative w-24 h-24 rounded-full bg-divine-gold/10 flex items-center justify-center">
              <Lock className="w-12 h-12 text-divine-gold" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold bg-gradient-to-r from-divine-gold via-divine-light to-divine-gold bg-clip-text text-transparent">
            {t("chat.accessRestricted")}
          </h1>
          
          <p className="text-foreground-muted leading-relaxed">
            {t("chat.accessDescription")} <strong className="text-divine-gold">{t("chat.lawOfLight")}</strong>.
          </p>
          
          <div className="flex flex-col gap-3">
            <Link
              to="/auth"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-sapphire-gradient text-primary-foreground font-medium shadow-sacred hover:shadow-divine transition-all duration-300"
            >
              <Sparkles className="w-5 h-5" />
              {t("chat.enterPortal")}
            </Link>
            
            <Link to="/" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-foreground-muted hover:text-primary transition-colors">
              <ArrowLeft className="w-4 h-4" />
              {t("chat.backHome")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (authLoading || hasAgreed === null) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-pale via-background to-background flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-divine-gold animate-pulse" />
          <span className="text-foreground-muted">{t("chat.connecting")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex bg-gradient-to-b from-primary-pale via-background to-background overflow-hidden">
      <ChatRewardNotification 
        reward={currentReward} 
        onDismiss={() => setCurrentReward(null)} 
      />

      {/* Desktop Sidebar - Persistent */}
      <ChatSidebar
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        sessions={sessions}
        folders={folders}
        currentSession={currentSession}
        onSelectSession={selectSession}
        onNewSession={handleNewSession}
        onDeleteSession={deleteSession}
        onUpdateSession={updateSession}
        imageHistoryCount={imageHistory.length}
        onOpenImageHistory={() => setShowImageHistorySidebar(true)}
      />

      {/* Mobile Sidebar Overlay */}
      <ChatSessionsSidebar
        isOpen={showMobileSidebar}
        onClose={() => setShowMobileSidebar(false)}
        sessions={sessions}
        folders={folders}
        currentSession={currentSession}
        onSelectSession={selectSession}
        onCreateSession={createSession}
        onDeleteSession={deleteSession}
        onUpdateSession={updateSession}
        onCreateFolder={createFolder}
        onDeleteFolder={deleteFolder}
        onUpdateFolder={updateFolder}
      />

      {/* Image History Sidebar */}
      <ImageHistorySidebar
        isOpen={showImageHistorySidebar}
        onClose={() => setShowImageHistorySidebar(false)}
        history={imageHistory}
        isLoading={imageHistoryLoading}
        onDelete={deleteFromImageHistory}
      />

      {/* Early Adopter Reward Popup */}
      <EarlyAdopterRewardPopup
        isOpen={showEarlyAdopterPopup}
        coinsAwarded={earlyAdopterResult?.coinsAwarded || 0}
        userRank={earlyAdopterResult?.userRank || 0}
        onClose={dismissEarlyAdopterPopup}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header - Compact for mobile */}
        <header className="flex-shrink-0 bg-background-pure/90 backdrop-blur-lg border-b border-primary-pale shadow-soft safe-area-top">
          <div className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Mobile menu button */}
                <button 
                  onClick={() => setShowMobileSidebar(true)}
                  className="lg:hidden p-1.5 sm:p-2 rounded-full hover:bg-primary-pale hover:scale-110 active:scale-95 transition-all duration-300"
                >
                  <Menu className="w-5 h-5 text-primary" />
                </button>
                
                {/* Back button - desktop only when sidebar collapsed */}
                {sidebarCollapsed && !isMobile && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button 
                        onClick={() => navigate("/")}
                        className="p-1.5 sm:p-2 rounded-full hover:bg-primary-pale hover:scale-110 active:scale-95 transition-all duration-300 group"
                      >
                        <ArrowLeft className="w-5 h-5 text-primary group-hover:text-primary-deep group-hover:-translate-x-0.5 transition-all duration-300" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-primary-deep text-white">
                      <p>Về trang chủ</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                
                {/* Image gallery - mobile only */}
                <button 
                  onClick={() => setShowImageHistorySidebar(true)}
                  className="lg:hidden p-1.5 sm:p-2 rounded-full hover:bg-primary-pale hover:scale-110 active:scale-95 transition-all duration-300 group relative"
                >
                  <Image className="w-5 h-5 text-primary group-hover:text-primary-deep transition-all duration-300" />
                  {imageHistory.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-divine-gold text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {imageHistory.length > 99 ? '99+' : imageHistory.length}
                    </span>
                  )}
                </button>

                {/* Avatar and title */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="relative">
                    <img src={angelAvatar} alt="Angel AI" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover shadow-soft" />
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-400 border-2 border-white rounded-full"></span>
                  </div>
                  <div className="hidden sm:block">
                    <h1 className="font-serif text-base sm:text-lg font-semibold text-primary-deep">
                      {currentSession ? currentSession.title : "Angel AI"}
                    </h1>
                    <p className="text-[10px] sm:text-xs text-foreground-muted">
                      {currentSession ? "Đang tiếp tục chủ đề" : t("chat.subtitle")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* New chat button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleNewSession}
                      className="p-1.5 sm:p-2 rounded-full hover:bg-primary-pale hover:scale-110 active:scale-95 transition-all duration-300 group"
                    >
                      <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-primary group-hover:text-primary-deep transition-all duration-300" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-primary-deep text-white">
                    <p>Cuộc trò chuyện mới</p>
                  </TooltipContent>
                </Tooltip>
                {dailyStatus && (
                  <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-amber-50 rounded-full border border-amber-200/50">
                    <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600" />
                    <span className="text-[10px] sm:text-xs text-amber-700 font-medium">{dailyStatus.questionsRemaining}/10</span>
                  </div>
                )}
                <Link to="/community" className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-pink-50 rounded-full border border-pink-200/50 hover:bg-pink-100 transition-colors">
                  <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-500" />
                  <span className="text-[10px] sm:text-xs text-pink-700 font-medium hidden sm:inline">{t("chat.community")}</span>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Messages - Scrollable area with wider container */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-2 sm:px-4 lg:px-8 py-4 sm:py-6">
          <div className="mx-auto max-w-5xl space-y-4 sm:space-y-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-2 sm:gap-3 ${message.role === "user" ? "flex-row-reverse" : ""} animate-fade-in`}
              >
                {message.role === "assistant" && (
                  <img src={angelAvatar} alt="Angel AI" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover shadow-soft flex-shrink-0" />
                )}
                <div className="flex flex-col gap-2 max-w-[95%] sm:max-w-[90%] lg:max-w-[85%]">
                  {/* Image in message */}
                  {message.imageUrl && message.type === "image-analysis" && (
                    <div 
                      className="rounded-xl overflow-hidden cursor-pointer"
                      onClick={() => { setSelectedImage(message.imageUrl!); setShowImageDialog(true); }}
                    >
                      <img src={message.imageUrl} alt="Uploaded" className="max-w-xs rounded-xl" />
                    </div>
                  )}
                  
                  <div
                    className={`rounded-2xl px-3 sm:px-5 py-3 sm:py-4 ${
                      message.role === "user"
                        ? "bg-sapphire-gradient text-white rounded-br-md shadow-sacred"
                        : "bg-white border border-primary-pale/50 text-foreground rounded-bl-md shadow-soft"
                    }`}
                  >
                    <p className="text-base sm:text-lg leading-relaxed whitespace-pre-wrap break-words message-content">
                      {message.content || (isLoading && index === messages.length - 1 ? "" : message.content)}
                    </p>
                    {(isLoading || isGenerating || isAnalyzing) && message.role === "assistant" && !message.content && (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 text-primary animate-spin" />
                        <span className="text-xs sm:text-sm text-foreground-muted">
                          {isGenerating ? t("chat.generating") : isAnalyzing ? t("chat.analyzing") : t("chat.thinking")}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Generated image */}
                  {message.type === "image" && message.imageUrl && (
                    <div className="relative group">
                      <img 
                        src={message.imageUrl} 
                        alt="Generated" 
                        className="max-w-full rounded-xl shadow-lg cursor-pointer"
                        onClick={() => { setSelectedImage(message.imageUrl!); setShowImageDialog(true); }}
                      />
                      <button
                        onClick={() => handleDownloadImage(message.imageUrl!)}
                        className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  
                  {/* Action buttons for user messages */}
                  {message.role === "user" && message.content && (
                    <div className="flex items-center gap-2 mr-1 justify-end">
                      <button
                        onClick={() => handleCopyMessage(message.content)}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-primary hover:bg-primary-pale/50 rounded-md transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{t("chat.copy")}</span>
                      </button>
                    </div>
                  )}
                  
                  {/* Action buttons for assistant messages */}
                  {message.role === "assistant" && message.content && !(isLoading || isGenerating || isAnalyzing) && (
                    <div className="flex items-center gap-2 ml-1">
                      {/* Audio Button */}
                      <AudioButton
                        isLoading={ttsLoading}
                        isPlaying={ttsPlaying}
                        isCurrentMessage={ttsMessageId === `msg-${index}`}
                        onPlay={() => playText(message.content, `msg-${index}`)}
                        onStop={stopAudio}
                      />
                      <button
                        onClick={() => handleCopyMessage(message.content)}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-primary hover:bg-primary-pale/50 rounded-md transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{t("chat.copy")}</span>
                      </button>
                      <button
                        onClick={() => handleOpenShare(index, message.content)}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                      >
                        <Share2 className="w-3 h-3" />
                        <span>{t("chat.share")}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Uploaded Image Preview */}
        {uploadedImage && (
          <div className="flex-shrink-0 px-3 sm:px-4 lg:px-8 py-2 bg-muted/50 border-t border-border">
            <div className="mx-auto max-w-5xl flex items-center gap-2 sm:gap-3">
              <div className="relative flex-shrink-0">
                <img src={uploadedImage} alt="To analyze" className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-cover" />
                <button
                  onClick={() => { setUploadedImage(null); setChatMode("chat"); }}
                  className="absolute -top-1.5 -right-1.5 p-0.5 sm:p-1 bg-destructive text-destructive-foreground rounded-full"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">{t("chat.askAboutImage")}</p>
            </div>
          </div>
        )}

        {/* Mode Indicator */}
        {chatMode !== "chat" && !uploadedImage && (
          <div className="flex-shrink-0 px-3 sm:px-4 lg:px-8 py-2 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-t border-border">
            <div className="mx-auto max-w-5xl flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Wand2 className="w-4 h-4 text-purple-600 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-purple-700 dark:text-purple-300">
                  {t("chat.mode.image")}
                </span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <select
                  value={imageStyle}
                  onChange={(e) => setImageStyle(e.target.value as any)}
                  className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded bg-white dark:bg-gray-800 border border-border"
                >
                  <option value="spiritual">{t("chat.styleSpiritual")}</option>
                  <option value="realistic">{t("chat.styleRealistic")}</option>
                  <option value="artistic">{t("chat.styleArtistic")}</option>
                </select>
                <button
                  onClick={() => setChatMode("chat")}
                  className="text-[10px] sm:text-xs text-muted-foreground hover:text-foreground px-1.5"
                >
                  {t("chat.cancel")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Input - Fixed at bottom with safe area padding */}
        <div className="flex-shrink-0 bg-background-pure/95 backdrop-blur-lg border-t border-primary-pale px-3 sm:px-4 lg:px-8 py-2 sm:py-3 safe-area-bottom">
          <form onSubmit={handleSubmit} className="mx-auto max-w-5xl">
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Mode buttons - Compact on mobile */}
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => setChatMode("chat")}
                  className={`p-1.5 sm:p-2 rounded-full transition-colors ${chatMode === "chat" ? "bg-primary text-primary-foreground" : "hover:bg-primary-pale"}`}
                  title={t("chat.mode.chat")}
                >
                  <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setChatMode("generate-image")}
                  className={`p-1.5 sm:p-2 rounded-full transition-colors ${chatMode === "generate-image" ? "bg-purple-500 text-white" : "hover:bg-purple-100"}`}
                  title={t("chat.generateImage")}
                >
                  <Wand2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 sm:p-2 rounded-full hover:bg-blue-100 transition-colors"
                  title={t("chat.analyzeImage")}
                >
                  <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              <div className="flex-1 relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    chatMode === "generate-image" 
                      ? t("chat.placeholderImage")
                      : chatMode === "analyze-image"
                      ? t("chat.placeholderAnalyze")
                      : t("chat.placeholder")
                  }
                  disabled={isLoading || isGenerating || isAnalyzing}
                  enterKeyHint="send"
                  autoComplete="off"
                  autoCorrect="off"
                  className="w-full px-3 sm:px-5 py-2.5 sm:py-3 pr-10 sm:pr-12 rounded-full border border-primary-pale bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-300 disabled:opacity-50 text-sm sm:text-base"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading || isGenerating || isAnalyzing}
                  className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 rounded-full bg-sapphire-gradient text-white hover:shadow-sacred transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading || isGenerating || isAnalyzing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Share Dialog */}
      <ChatShareDialog 
        isOpen={shareDialog.isOpen}
        onClose={() => setShareDialog({ isOpen: false, question: "", answer: "" })}
        question={shareDialog.question}
        answer={shareDialog.answer}
        onShareSuccess={() => refreshExtendedStatus()}
      />

      {/* Image Preview Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{t("chat.viewImage")}</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="flex flex-col items-center gap-4">
              <img src={selectedImage} alt="Preview" className="max-h-[70vh] rounded-lg" />
              <button
                onClick={() => handleDownloadImage(selectedImage)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg"
              >
                <Download className="w-4 h-4" />
                {t("chat.download")}
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Chat;
