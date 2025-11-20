'use client';

import { useContext, useEffect, useState } from 'react';
import { TranslationContext } from '../context/TranslationContext';

/**
 * Custom hook to use translation functionality
 * Returns the translation context and additional helper functions
 */
export const useTranslation = () => {
  const context = useContext(TranslationContext);

  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }

  return context;
};

/**
 * Custom hook to translate a single text string
 * @param text - The text to translate
 * @param dependencies - Optional dependencies to retrigger translation
 * @returns The translated text
 */
export const useTranslatedText = (text: string, dependencies: any[] = []) => {
  const { translate, currentLanguage } = useTranslation();
  const [translatedText, setTranslatedText] = useState(text);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const performTranslation = async () => {
      if (currentLanguage === 'en') {
        setTranslatedText(text);
        return;
      }

      setIsTranslating(true);
      try {
        const result = await translate(text);
        if (isMounted) {
          setTranslatedText(result);
        }
      } catch (error) {
        console.error('Translation error:', error);
        if (isMounted) {
          setTranslatedText(text);
        }
      } finally {
        if (isMounted) {
          setIsTranslating(false);
        }
      }
    };

    performTranslation();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, currentLanguage, translate, ...dependencies]);

  return { translatedText, isTranslating };
};

/**
 * Custom hook to translate multiple text strings at once
 * @param texts - Array of texts to translate
 * @param dependencies - Optional dependencies to retrigger translation
 * @returns Array of translated texts
 */
export const useTranslatedTexts = (texts: string[], dependencies: any[] = []) => {
  const { translateBatch, currentLanguage } = useTranslation();
  const [translatedTexts, setTranslatedTexts] = useState<string[]>(texts);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const performTranslation = async () => {
      console.log('[useTranslatedTexts] Current language:', currentLanguage, 'Texts count:', texts.length);
      
      if (currentLanguage === 'en') {
        setTranslatedTexts(texts);
        return;
      }

      setIsTranslating(true);
      try {
        console.log('[useTranslatedTexts] Starting batch translation...');
        const results = await translateBatch(texts);
        if (isMounted) {
          console.log('[useTranslatedTexts] Translation complete:', results);
          setTranslatedTexts(results);
        }
      } catch (error) {
        console.error('[useTranslatedTexts] Batch translation error:', error);
        if (isMounted) {
          setTranslatedTexts(texts);
        }
      } finally {
        if (isMounted) {
          setIsTranslating(false);
        }
      }
    };

    performTranslation();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(texts), currentLanguage, translateBatch, ...dependencies]);

  return { translatedTexts, isTranslating };
};

