import { useState, useRef, useEffect } from "react";
import { Globe, Check, ChevronDown } from "lucide-react";
import { useLanguage, Language } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

export const LanguageSelector = () => {
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
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 xl:gap-2 px-2 xl:px-3 py-1.5 xl:py-2 rounded-full bg-primary-pale/50 hover:bg-primary-pale transition-colors text-xs xl:text-sm font-medium"
        aria-label="Select language"
      >
        <Globe className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-primary" />
        <span className="text-foreground">{currentLang?.flag}</span>
        <span className="hidden xl:inline text-foreground">{currentLang?.nativeName}</span>
        <ChevronDown className={cn(
          "w-3 h-3 xl:w-4 xl:h-4 text-foreground-muted transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 max-h-80 overflow-y-auto rounded-xl bg-background-pure shadow-lg border border-primary-pale/30 py-2 z-50 animate-in fade-in-0 zoom-in-95 duration-200">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelectLanguage(lang)}
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
