import { createContext, ReactNode, useContext, useEffect, useMemo } from 'react';
import {
  detectBrowserLanguage,
  getTranslations,
  SupportedLang,
  Translations,
} from './translations';

interface I18nContextValue {
  lang: SupportedLang;
  t: Translations;
}

const initialLang = detectBrowserLanguage();
const I18nContext = createContext<I18nContextValue>({
  lang: initialLang,
  t: getTranslations(initialLang),
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const value = useMemo(() => {
    const lang = detectBrowserLanguage();
    return { lang, t: getTranslations(lang) };
  }, []);

  useEffect(() => {
    document.documentElement.lang = value.lang;
    document.documentElement.dir = value.lang === 'ar' ? 'rtl' : 'ltr';
  }, [value.lang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
