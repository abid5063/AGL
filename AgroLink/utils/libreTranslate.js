// LibreTranslate with API key for better reliability
// Get your free API key from: https://libretranslate.com/

const LIBRE_TRANSLATE_API_KEY = 'YOUR_LIBRE_TRANSLATE_API_KEY'; // Replace with your API key
const LIBRE_TRANSLATE_URL = 'https://libretranslate.com/translate'; // Official API endpoint

export const translateWithLibre = async (text, targetLanguage) => {
  try {
    const response = await fetch(LIBRE_TRANSLATE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LIBRE_TRANSLATE_API_KEY}`,
      },
      body: JSON.stringify({
        q: text,
        source: 'en',
        target: targetLanguage,
        format: 'text',
        api_key: LIBRE_TRANSLATE_API_KEY,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.translatedText) {
      return data.translatedText;
    } else {
      console.error('LibreTranslate API failed:', data);
      throw new Error('No translation received');
    }
  } catch (error) {
    console.error('LibreTranslate API error:', error);
    throw error; // Re-throw to trigger fallback
  }
};

// Cache for LibreTranslate
const libreCache = new Map();

export const getCachedLibreTranslation = async (text, targetLanguage) => {
  const cacheKey = `${text}_${targetLanguage}`;
  
  if (libreCache.has(cacheKey)) {
    return libreCache.get(cacheKey);
  }
  
  const translatedText = await translateWithLibre(text, targetLanguage);
  libreCache.set(cacheKey, translatedText);
  
  return translatedText;
}; 