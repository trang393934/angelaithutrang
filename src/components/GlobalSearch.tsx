import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Loader2, BookOpen, Users, MessageCircle, Sparkles, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import angelAvatar from "@/assets/angel-avatar.png";
import { useLanguage } from "@/contexts/LanguageContext";

interface SearchResult {
  id: string;
  type: "knowledge" | "community" | "question" | "user";
  title: string;
  description: string;
  url: string;
  createdAt: string;
  avatar?: string;
}

interface SearchResults {
  knowledge: SearchResult[];
  community: SearchResult[];
  questions: SearchResult[];
  aiSummary: { content: string; source: string } | null;
}

interface UserResult {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

interface GlobalSearchProps {
  variant?: "header" | "community" | "standalone";
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export function GlobalSearch({ 
  variant = "header", 
  placeholder,
  className = "",
  autoFocus = false
}: GlobalSearchProps) {
  const { t } = useLanguage();
  const searchPlaceholder = placeholder || t("search.placeholder");
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [userResults, setUserResults] = useState<UserResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-focus and load all users when prop is set (community variant)
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
        setIsOpen(true);
      }, 100);
      // Auto-load users list for community variant
      if (variant === "community") {
        loadAllUsers();
      }
    }
  }, [autoFocus, variant]);

  const loadAllUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error: dbError } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url, bio")
        .order("created_at", { ascending: false })
        .limit(50);

      if (dbError) throw dbError;
      setUserResults(data || []);
      setIsOpen(true);
    } catch (err) {
      console.error("Load users error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcut to open search (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (event.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setResults(null);
      setUserResults([]);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Community variant: search users only
      if (variant === "community") {
        const { data, error: dbError } = await supabase
          .from("profiles")
          .select("user_id, display_name, avatar_url, bio")
          .ilike("display_name", `%${searchQuery.trim()}%`)
          .limit(15);

        if (dbError) throw dbError;
        setUserResults(data || []);
        setResults(null);
      } else {
        // Default: global search via edge function
        const { data, error: fnError } = await supabase.functions.invoke("global-search", {
          body: { query: searchQuery, searchType: "all" },
        });

        if (fnError) throw fnError;

        if (data.success) {
          setResults(data.results);
        } else {
          setError(data.error || t("common.error"));
        }
        setUserResults([]);
      }
    } catch (err) {
      console.error("Search error:", err);
      setError(t("search.error"));
    } finally {
      setIsLoading(false);
    }
  }, [t, variant]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(true);

    // Debounce search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  const handleResultClick = (result: SearchResult) => {
    setIsOpen(false);
    setQuery("");
    navigate(result.url);
  };

  // Format search keyword to proper question for Angel AI
  const formatSearchQueryToQuestion = (searchQuery: string): string => {
    const trimmed = searchQuery.trim();
    
    // If already a complete question, keep it
    if (trimmed.endsWith('?') || 
        /^(cho con|hãy|làm sao|là gì|như thế nào|giải thích|hướng dẫn)/i.test(trimmed)) {
      return trimmed;
    }
    
    // Format keyword into an information request
    return `Cho con biết thông tin về "${trimmed}"`;
  };

  const handleAskAngel = () => {
    setIsOpen(false);
    
    // Format query and add isSearch flag for intent detection
    const formattedQuery = formatSearchQueryToQuestion(query);
    navigate(`/chat?q=${encodeURIComponent(formattedQuery)}&isSearch=true`);
    setQuery("");
  };

  const clearSearch = () => {
    setQuery("");
    setResults(null);
    setUserResults([]);
    setError(null);
    inputRef.current?.focus();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "knowledge":
        return <BookOpen className="w-4 h-4 text-emerald-600" />;
      case "community":
        return <Users className="w-4 h-4 text-blue-600" />;
      case "question":
        return <MessageCircle className="w-4 h-4 text-purple-600" />;
      default:
        return <Search className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "knowledge":
        return t("search.knowledge");
      case "community":
        return t("search.community");
      case "question":
        return t("search.questions");
      default:
        return "";
    }
  };

  const totalResults = results 
    ? results.knowledge.length + results.community.length + results.questions.length 
    : 0;

  const inputClasses = variant === "community"
    ? "pl-9 pr-10 h-10 bg-white/70 border-2 border-yellow-600/30 rounded-full text-sm text-black placeholder:text-black/60 focus:bg-white/90 focus:ring-2 focus:ring-yellow-500/40 shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)]"
    : "pl-9 pr-10 h-10 bg-muted/50 border-border/50 rounded-full text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30";

  const iconClasses = variant === "community"
    ? "text-black/70"
    : "text-muted-foreground";

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${iconClasses}`} />
        <Input
          ref={inputRef}
          type="text"
          placeholder={searchPlaceholder}
          value={query}
          onChange={handleInputChange}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          className={inputClasses}
        />
        {query && (
          <button
            onClick={clearSearch}
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/20 transition-colors ${iconClasses}`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {isOpen && (query.length >= 2 || (variant === "community" && userResults.length > 0)) && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-border/50 overflow-hidden z-[100] min-w-[320px] max-w-[480px]"
          >
            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">{t("search.searching")}</span>
              </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <div className="p-4 text-center text-sm text-red-500">
                {error}
              </div>
            )}

            {/* Community Variant: User Results */}
            {!isLoading && !error && variant === "community" && userResults.length > 0 && (
              <div className="max-h-[400px] overflow-y-auto">
                <div className="px-4 py-2 bg-muted/30 border-b">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {t("search.users") || "Users"} ({userResults.length})
                  </span>
                </div>
                {userResults.map((user) => (
                  <button
                    key={user.user_id}
                    onClick={() => {
                      setIsOpen(false);
                      setQuery("");
                      navigate(`/user/${user.user_id}`);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left border-b border-border/30 last:border-b-0"
                  >
                    <Avatar className="w-9 h-9">
                      <AvatarImage src={user.avatar_url || ""} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {user.display_name?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {user.display_name || t("common.anonymous")}
                      </p>
                      {user.bio && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {user.bio}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Community Variant: No Results */}
            {!isLoading && !error && variant === "community" && userResults.length === 0 && (query.length >= 2 || autoFocus) && (
              <div className="p-6 text-center">
                <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  {query.length >= 2 
                    ? `${t("search.noResults")} "${query}"`
                    : t("search.noUsers") || "Chưa có thành viên nào"
                  }
                </p>
              </div>
            )}

            {/* Default Variant: Global Results */}
            {!isLoading && !error && variant !== "community" && results && (
              <div className="max-h-[400px] overflow-y-auto">
                {/* AI Summary */}
                {results.aiSummary && (
                  <div className="p-4 bg-gradient-to-r from-primary/5 to-purple-50 dark:from-primary/10 dark:to-purple-900/20 border-b">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-8 h-8 ring-2 ring-primary/30">
                        <AvatarImage src={angelAvatar} />
                        <AvatarFallback>AI</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Sparkles className="w-4 h-4 text-primary" />
                          <span className="text-xs font-semibold text-primary">{t("search.angelAnswer")}</span>
                        </div>
                        <p className="text-sm text-foreground leading-relaxed">
                          {results.aiSummary.content}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Knowledge Results */}
                {results.knowledge.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-muted/30 border-b">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {t("search.knowledge")} ({results.knowledge.length})
                      </span>
                    </div>
                    {results.knowledge.map((result) => (
                      <ResultItem 
                        key={result.id} 
                        result={result} 
                        onClick={() => handleResultClick(result)}
                        icon={getTypeIcon(result.type)}
                      />
                    ))}
                  </div>
                )}

                {/* Community Results */}
                {results.community.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-muted/30 border-b">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {t("search.community")} ({results.community.length})
                      </span>
                    </div>
                    {results.community.map((result) => (
                      <ResultItem 
                        key={result.id} 
                        result={result} 
                        onClick={() => handleResultClick(result)}
                        icon={getTypeIcon(result.type)}
                        showAvatar
                      />
                    ))}
                  </div>
                )}

                {/* Question Results */}
                {results.questions.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-muted/30 border-b">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {t("search.questions")} ({results.questions.length})
                      </span>
                    </div>
                    {results.questions.map((result) => (
                      <ResultItem 
                        key={result.id} 
                        result={result} 
                        onClick={() => handleResultClick(result)}
                        icon={getTypeIcon(result.type)}
                      />
                    ))}
                  </div>
                )}

                {/* No Results */}
                {totalResults === 0 && !results.aiSummary && (
                  <div className="p-6 text-center">
                    <Search className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground mb-4">
                      {t("search.noResults")} "{query}"
                    </p>
                  </div>
                )}

                {/* Ask Angel AI Button */}
                <div className="p-3 border-t bg-muted/20">
                  <Button
                    onClick={handleAskAngel}
                    className="w-full bg-sapphire-gradient text-white hover:opacity-90 transition-opacity"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {t("search.askAngel")} "{query.length > 20 ? query.substring(0, 20) + "..." : query}"
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Result Item Component
function ResultItem({ 
  result, 
  onClick, 
  icon,
  showAvatar = false 
}: { 
  result: SearchResult; 
  onClick: () => void;
  icon: React.ReactNode;
  showAvatar?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left border-b border-border/30 last:border-b-0"
    >
      {showAvatar && result.avatar ? (
        <Avatar className="w-8 h-8">
          <AvatarImage src={result.avatar} />
          <AvatarFallback>{result.title.charAt(0)}</AvatarFallback>
        </Avatar>
      ) : (
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {result.title}
        </p>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
          {result.description}
        </p>
      </div>
    </button>
  );
}

export default GlobalSearch;
