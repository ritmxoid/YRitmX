import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { trackEvent } from '../utils/analytics';
import {
  getInitialLanguage,
  getTranslations,
  setActiveLanguage,
  SupportedLang,
  Translations,
} from './translations';

interface I18nContextValue {
  lang: SupportedLang;
  t: Translations;
  setLang: (lang: SupportedLang) => void;
}

const initialLang = getInitialLanguage();
const I18nContext = createContext<I18nContextValue>({
  lang: initialLang,
  t: getTranslations(initialLang),
  setLang: () => {},
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<SupportedLang>(() => getInitialLanguage());

  const setLang = useCallback((nextLang: SupportedLang) => {
    setActiveLanguage(nextLang);
    setLangState(nextLang);
    trackEvent('app_language_switch', { lang: nextLang });
  }, []);

  const value = useMemo(
    () => ({ lang, t: getTranslations(lang), setLang }),
    [lang, setLang]
  );

  useEffect(() => {
    document.documentElement.lang = value.lang;
    document.documentElement.dir = value.lang === 'ar' ? 'rtl' : 'ltr';
    trackEvent('app_language', { lang: value.lang });
  }, [value.lang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
