import React, { createContext, useContext, useEffect, useState } from 'react';

export type Language = 'en' | 'th';

const LANG_STORAGE_KEY = 'empeo_perform_lang_v1';

interface LanguageContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  /** Helper: returns Thai when lang === 'th', English when lang === 'en' */
  bi: (th: string, en: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(LANG_STORAGE_KEY);
      return saved === 'th' || saved === 'en' ? saved : 'en';
    } catch {
      return 'en';
    }
  });

  useEffect(() => {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (next: Language) => setLangState(next);
  const bi = (th: string, en: string) => (lang === 'th' ? th : en);

  return (
    <LanguageContext.Provider value={{ lang, setLang, bi }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}

