import axios from 'axios';

const GOOGLE_TRANSLATE_API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY || '';
const GOOGLE_TRANSLATE_URL = 'https://translation.googleapis.com/language/translate/v2';

export const translateText = async (
  text: string,
  targetLanguage: string,
  sourceLanguage?: string
) => {
  try {
    const response = await axios.post(
      GOOGLE_TRANSLATE_URL,
      {},
      {
        params: {
          q: text,
          target: targetLanguage,
          ...(sourceLanguage && { source: sourceLanguage }),
          key: GOOGLE_TRANSLATE_API_KEY,
        },
      }
    );

    return {
      success: true,
      translatedText: response.data.data.translations[0].translatedText,
      detectedSourceLanguage: response.data.data.translations[0].detectedSourceLanguage,
    };
  } catch (error: unknown) {
    const err = error as {
      response?: { data?: { error?: { message?: string } } };
      message?: string;
    };
    console.error('Translation API Error:', err.response?.data || err.message);
    return {
      success: false,
      error: err.response?.data?.error?.message || 'Translation failed',
    };
  }
};

export const detectLanguage = async (text: string) => {
  try {
    const response = await axios.post(
      `${GOOGLE_TRANSLATE_URL}/detect`,
      {},
      {
        params: {
          q: text,
          key: GOOGLE_TRANSLATE_API_KEY,
        },
      }
    );

    return {
      success: true,
      language: response.data.data.detections[0][0].language,
      confidence: response.data.data.detections[0][0].confidence,
    };
  } catch (error: unknown) {
    const err = error as {
      response?: { data?: { error?: { message?: string } } };
      message?: string;
    };
    console.error('Language Detection Error:', err.response?.data || err.message);
    return {
      success: false,
      error: err.response?.data?.error?.message || 'Language detection failed',
    };
  }
};
