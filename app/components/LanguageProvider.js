'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import { languages, translate } from '../../lib/languages';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    const saved = localStorage.getItem('hello-language');

    if (saved && languages[saved]) {
      setLanguage(saved);
      document.documentElement.lang = saved;
    }

    function handleLanguageChange() {
      const selected = localStorage.getItem('hello-language');

      if (selected && languages[selected]) {
        setLanguage(selected);
        document.documentElement.lang = selected;
      }
    }

    window.addEventListener(
      'hello-language-change',
      handleLanguageChange
    );

    return () => {
      window.removeEventListener(
        'hello-language-change',
        handleLanguageChange
      );
    };
  }, []);

  function changeLanguage(value) {
    if (!languages[value]) return;

    localStorage.setItem('hello-language', value);
    setLanguage(value);
    document.documentElement.lang = value;
    window.dispatchEvent(new Event('hello-language-change'));
  }

  function t(key) {
    return translate(key, language);
  }

  return (
    <LanguageContext.Provider
      value={{ language, changeLanguage, t }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error(
      'useLanguage must be used inside LanguageProvider'
    );
  }

  return context;
}
