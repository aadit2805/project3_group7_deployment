'use client';

import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';

export interface Language {
  language: string;
  name?: string;
}

interface TranslationCache {
  [key: string]: string; // key format: "text|targetLanguage"
}

interface TranslationContextType {
  currentLanguage: string;
  setCurrentLanguage: (language: string) => void;
  translate: (text: string, targetLanguage?: string) => Promise<string>;
  translateBatch: (texts: string[], targetLanguage?: string) => Promise<string[]>;
  supportedLanguages: Language[];
  isLoading: boolean;
}

export const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

// Language name mappings for common languages
const LANGUAGE_NAMES: { [key: string]: string } = {
  en: 'English',
  es: 'Spanish',
  zh: 'Chinese (Simplified)',
  'zh-CN': 'Chinese (Simplified)',
  'zh-TW': 'Chinese (Traditional)',
  hi: 'Hindi',
  ar: 'Arabic',
  fr: 'French',
  de: 'German',
  ja: 'Japanese',
  ko: 'Korean',
  pt: 'Portuguese',
  ru: 'Russian',
  it: 'Italian',
  vi: 'Vietnamese',
  th: 'Thai',
  tr: 'Turkish',
  pl: 'Polish',
  nl: 'Dutch',
  id: 'Indonesian',
  uk: 'Ukrainian',
  ro: 'Romanian',
  el: 'Greek',
  cs: 'Czech',
  sv: 'Swedish',
  hu: 'Hungarian',
  da: 'Danish',
  fi: 'Finnish',
  no: 'Norwegian',
  he: 'Hebrew',
  fa: 'Persian',
  bn: 'Bengali',
  ta: 'Tamil',
  te: 'Telugu',
  mr: 'Marathi',
  ur: 'Urdu',
  gu: 'Gujarati',
  kn: 'Kannada',
  ml: 'Malayalam',
  pa: 'Punjabi',
};

export const TranslationProvider = ({ children }: { children: ReactNode }) => {
  const [currentLanguage, setCurrentLanguageState] = useState<string>('en');
  const [supportedLanguages, setSupportedLanguages] = useState<Language[]>([]);
  const [translationCache, setTranslationCache] = useState<TranslationCache>({});
  const [isLoading, setIsLoading] = useState(false);

  // Load current language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('appLanguage');
    if (savedLanguage) {
      setCurrentLanguageState(savedLanguage);
    }
  }, []);

  // Fetch supported languages on mount
  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        console.log('[Translation] Fetching supported languages from:', `${API_BASE_URL}/api/translation/languages`);
        const response = await fetch(`${API_BASE_URL}/api/translation/languages`);
        const data = await response.json();
        
        console.log('[Translation] Languages response:', data);
        
        if (data.success && data.languages) {
          // Add language names to the languages array
          const languagesWithNames = data.languages.map((lang: Language) => ({
            ...lang,
            name: LANGUAGE_NAMES[lang.language] || lang.language.toUpperCase(),
          }));
          
          // Sort by name
          languagesWithNames.sort((a: Language, b: Language) => 
            (a.name || '').localeCompare(b.name || '')
          );
          
          setSupportedLanguages(languagesWithNames);
          console.log('[Translation] Loaded', languagesWithNames.length, 'languages');
        }
      } catch (error) {
        console.error('[Translation] Failed to fetch supported languages:', error);
        // Fallback to common languages
        setSupportedLanguages([
          { language: 'en', name: 'English' },
          { language: 'es', name: 'Spanish' },
          { language: 'zh', name: 'Chinese (Simplified)' },
          { language: 'hi', name: 'Hindi' },
          { language: 'ar', name: 'Arabic' },
          { language: 'fr', name: 'French' },
          { language: 'de', name: 'German' },
          { language: 'ja', name: 'Japanese' },
          { language: 'ko', name: 'Korean' },
        ]);
      }
    };

    fetchLanguages();
  }, []);

  const setCurrentLanguage = useCallback((language: string) => {
    console.log('[Translation] Changing language to:', language);
    setCurrentLanguageState(language);
    localStorage.setItem('appLanguage', language);
  }, []);

  const translate = useCallback(
    async (text: string, targetLanguage?: string): Promise<string> => {
      const target = targetLanguage || currentLanguage;
      
      // If target language is English or same as source, return original text
      if (target === 'en') {
        return text;
      }

      // Check cache first
      const cacheKey = `${text}|${target}`;
      if (translationCache[cacheKey]) {
        console.log('[Translation] Cache hit for:', text.substring(0, 30));
        return translationCache[cacheKey];
      }

      try {
        setIsLoading(true);
        console.log('[Translation] Translating:', text.substring(0, 30), 'to', target);
        const response = await fetch(`${API_BASE_URL}/api/translation/translate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text,
            targetLanguage: target,
            sourceLanguage: 'en',
          }),
        });

        const data = await response.json();
        console.log('[Translation] Response:', data);

        if (data.success && data.translatedText) {
          // Update cache
          setTranslationCache((prev) => ({
            ...prev,
            [cacheKey]: data.translatedText,
          }));
          console.log('[Translation] Success:', text.substring(0, 30), '->', data.translatedText.substring(0, 30));
          return data.translatedText;
        } else {
          console.error('[Translation] Translation failed:', data.error);
          return text; // Return original text on failure
        }
      } catch (error) {
        console.error('[Translation] Translation error:', error);
        return text; // Return original text on error
      } finally {
        setIsLoading(false);
      }
    },
    [currentLanguage, translationCache]
  );

  const translateBatch = useCallback(
    async (texts: string[], targetLanguage?: string): Promise<string[]> => {
      const target = targetLanguage || currentLanguage;
      
      console.log('[Translation] translateBatch called with', texts.length, 'texts, target:', target);
      
      // If target language is English, return original texts
      if (target === 'en') {
        console.log('[Translation] Target is English, returning original texts');
        return texts;
      }

      // Check which texts need translation
      const textsToTranslate: string[] = [];
      const cachedResults: { [index: number]: string } = {};

      texts.forEach((text, index) => {
        const cacheKey = `${text}|${target}`;
        if (translationCache[cacheKey]) {
          cachedResults[index] = translationCache[cacheKey];
        } else {
          textsToTranslate.push(text);
        }
      });

      console.log('[Translation] Cache hits:', Object.keys(cachedResults).length, 'Need to translate:', textsToTranslate.length);

      // If all texts are cached, return them
      if (textsToTranslate.length === 0) {
        console.log('[Translation] All texts cached, returning from cache');
        return texts.map((text, index) => cachedResults[index]);
      }

      try {
        setIsLoading(true);
        console.log('[Translation] Sending batch request to:', `${API_BASE_URL}/api/translation/batch`);
        const response = await fetch(`${API_BASE_URL}/api/translation/batch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            texts: textsToTranslate,
            targetLanguage: target,
            sourceLanguage: 'en',
          }),
        });

        const data = await response.json();
        console.log('[Translation] Batch response:', data);

        if (data.success && data.translations) {
          // Update cache with new translations
          const newCache: TranslationCache = {};
          textsToTranslate.forEach((text, index) => {
            const cacheKey = `${text}|${target}`;
            newCache[cacheKey] = data.translations[index].translatedText;
          });
          
          setTranslationCache((prev) => ({ ...prev, ...newCache }));

          // Merge cached and new translations
          let translationIndex = 0;
          const results = texts.map((text, index) => {
            if (cachedResults[index]) {
              return cachedResults[index];
            } else {
              return data.translations[translationIndex++].translatedText;
            }
          });
          
          console.log('[Translation] Batch translation complete, returning', results.length, 'results');
          return results;
        } else {
          console.error('[Translation] Batch translation failed:', data.error);
          return texts; // Return original texts on failure
        }
      } catch (error) {
        console.error('[Translation] Batch translation error:', error);
        return texts; // Return original texts on error
      } finally {
        setIsLoading(false);
      }
    },
    [currentLanguage, translationCache]
  );

  return (
    <TranslationContext.Provider
      value={{
        currentLanguage,
        setCurrentLanguage,
        translate,
        translateBatch,
        supportedLanguages,
        isLoading,
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
};

