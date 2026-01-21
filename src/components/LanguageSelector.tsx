import { useState, useRef, useEffect } from "react";
import { Globe, Check, ChevronDown } from "lucide-react";
import { useLanguage, Language } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface LanguageSelectorProps {
  compact?: boolean;
}

export const LanguageSelector = ({ compact = false }: LanguageSelectorProps) => {
  const { currentLanguage, setLanguage, languages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = languages.find(l => l.code === currentLanguage);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectLanguage = (lang: Language) => {
    setLanguage(lang.code);
    setIsOpen(false);
  };

  return (
    <div className="relative z-[200]" ref={dropdownRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={cn(
          "flex items-center gap-0.5 lg:gap-1 xl:gap-1.5 rounded-full bg-primary-pale/50 hover:bg-primary-pale transition-colors font-medium",
          compact 
            ? "px-1.5 lg:px-2 xl:px-2.5 py-1 lg:py-1.5 text-[10px] lg:text-xs xl:text-sm" 
            : "px-2 xl:px-3 py-1.5 xl:py-2 text-xs xl:text-sm"
        )}
        aria-label="Select language"
        type="button"
      >
        <Globe className={cn(
          "text-primary shrink-0",
          compact ? "w-3 h-3 lg:w-3.5 lg:h-3.5" : "w-3.5 h-3.5 xl:w-4 xl:h-4"
        )} />
        <span className="text-foreground">{currentLang?.flag}</span>
        {/* Hide text completely on lg when compact, show on xl+ */}
        {!compact && (
          <span className="hidden xl:inline text-foreground">{currentLang?.nativeName}</span>
        )}
        <ChevronDown className={cn(
          "text-foreground-muted transition-transform duration-200 shrink-0",
          compact ? "w-2.5 h-2.5 lg:w-3 lg:h-3" : "w-3 h-3 xl:w-4 xl:h-4",
          isOpen && "rotate-180"
        )} />
      </button>

      {isOpen && (
        <div 
          className="fixed w-56 max-h-80 overflow-y-auto rounded-xl bg-background-pure shadow-lg border border-primary-pale/30 py-2 z-[9999] animate-in fade-in-0 zoom-in-95 duration-200"
          style={{
            top: (dropdownRef.current?.getBoundingClientRect().bottom ?? 0) + 8,
            right: window.innerWidth - (dropdownRef.current?.getBoundingClientRect().right ?? 0),
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={(e) => {
                e.stopPropagation();
                handleSelectLanguage(lang);
              }}
              type="button"
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-primary-pale/30 transition-colors",
                currentLanguage === lang.code && "bg-primary-pale/50"
              )}
            >
              <span className="text-lg">{lang.flag}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{lang.nativeName}</p>
                <p className="text-xs text-foreground-muted">{lang.name}</p>
              </div>
              {currentLanguage === lang.code && (
                <Check className="w-4 h-4 text-primary" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
