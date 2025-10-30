
'use client';

import { useState, useEffect, useCallback } from 'react';
import { translations } from '@/lib/translations';

type Language = 'en' | 'es';
type TranslationKey = keyof typeof translations.en;

export function useTranslation() {
  const [language, setLanguage] = useState<Language>('en');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    let preferredLanguage: Language = 'en';
    // navigator.languages can be an array of preferred languages
    if (navigator.languages && navigator.languages.length) {
      for (const lang of navigator.languages) {
        const langCode = lang.split('-')[0];
        if (langCode === 'es') {
          preferredLanguage = 'es';
          break;
        }
        if (langCode === 'en') {
          preferredLanguage = 'en';
          break;
        }
      }
    } else if (navigator.language) { // Fallback for older browsers
        const browserLang = navigator.language.split('-')[0];
        if (browserLang === 'es') {
          preferredLanguage = 'es';
        }
    }
    
    setLanguage(preferredLanguage);
    setIsMounted(true);
  }, []);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string>): string => {
      if (!isMounted) {
        return '';
      }
      
      let translation = translations[language]?.[key] || translations.en[key];

      if (params) {
        translation = Object.entries(params).reduce((acc, [paramKey, value]) => {
            return acc.replace(`{${paramKey}}`, value);
        }, translation);
      }

      return translation;
    },
    [language, isMounted]
  );

  return { t, setLanguage, language, isMounted };
}