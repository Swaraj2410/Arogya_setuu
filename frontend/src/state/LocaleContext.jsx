import React, { createContext, useContext, useMemo, useState } from 'react';
import { copy, languages } from '../i18n/copy';

const LocaleContext = createContext();

export function LocaleProvider({ children }) {
  const [language, setLanguage] = useState(() => localStorage.getItem('arogya-language') || 'en');

  const updateLanguage = (code) => {
    setLanguage(code);
    localStorage.setItem('arogya-language', code);
  };

  const value = useMemo(
    () => ({
      language,
      languages,
      setLanguage: updateLanguage,
      t: copy[language] || copy.en
    }),
    [language]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}
