import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type LanguageCode = 
  | "vi" // Vietnamese
  | "en" // English
  | "zh" // Chinese (Simplified)
  | "es" // Spanish
  | "ar" // Arabic
  | "hi" // Hindi
  | "pt" // Portuguese
  | "ru" // Russian
  | "ja" // Japanese
  | "de" // German
  | "fr" // French
  | "ko"; // Korean

export interface Language {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
}

export const languages: Language[] = [
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", flag: "🇻🇳" },
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸" },
  { code: "zh", name: "Chinese", nativeName: "中文", flag: "🇨🇳" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇧🇷" },
  { code: "ru", name: "Russian", nativeName: "Русский", flag: "🇷🇺" },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
  { code: "ko", name: "Korean", nativeName: "한국어", flag: "🇰🇷" },
];

interface LanguageContextType {
  currentLanguage: LanguageCode;
  setLanguage: (code: LanguageCode) => void;
  t: (key: string) => string;
  languages: Language[];
}

// Provide a safe default to avoid hard-crashing the app if a component renders
// before the provider is mounted (e.g. during HMR / partial reloads).
const defaultContext: LanguageContextType = {
  currentLanguage: "vi",
  setLanguage: () => {},
  t: (key: string) => key,
  languages,
};

const LanguageContext = createContext<LanguageContextType>(defaultContext);

export const useLanguage = () => useContext(LanguageContext);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem("preferred_language");
    if (saved && languages.some(l => l.code === saved)) {
      return saved as LanguageCode;
    }
    // Try to detect browser language
    const browserLang = navigator.language.split("-")[0];
    if (languages.some(l => l.code === browserLang)) {
      return browserLang as LanguageCode;
    }
    return "vi"; // Default to Vietnamese
  });

  const [translations, setTranslations] = useState<Record<string, string>>({});

  useEffect(() => {
    localStorage.setItem("preferred_language", currentLanguage);
    
    // Set the lang attribute on the html element for CSS targeting
    document.documentElement.lang = currentLanguage;
    
    // Load translations for current language
    import(`@/translations/${currentLanguage}.ts`)
      .then((module) => {
        setTranslations(module.default);
      })
      .catch(() => {
        // Fallback to Vietnamese if translation file not found
        import("@/translations/vi.ts").then((module) => {
          setTranslations(module.default);
        });
      });
  }, [currentLanguage]);

  const setLanguage = (code: LanguageCode) => {
    setCurrentLanguage(code);
  };

  const t = (key: string): string => {
    return translations[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguage, t, languages }}>
      {children}
    </LanguageContext.Provider>
  );
};
