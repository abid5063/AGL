// Auto-translation service using Google Translate API
// Note: You'll need to set up Google Cloud credentials

const GOOGLE_TRANSLATE_API_KEY = 'YOUR_GOOGLE_TRANSLATE_API_KEY'; // Replace with your API key

export const translateText = async (text, targetLanguage) => {
  try {
    const response = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_TRANSLATE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          target: targetLanguage,
          source: 'en', // Assuming source is always English
        }),
      }
    );

    const data = await response.json();
    
    if (data.data && data.data.translations && data.data.translations[0]) {
      return data.data.translations[0].translatedText;
    } else {
      console.error('Translation failed:', data);
      return text; // Return original text if translation fails
    }
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Return original text on error
  }
};

// Cache translations to avoid repeated API calls
const translationCache = new Map();

export const getCachedTranslation = async (text, targetLanguage) => {
  const cacheKey = `${text}_${targetLanguage}`;
  
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }
  
  const translatedText = await translateText(text, targetLanguage);
  translationCache.set(cacheKey, translatedText);
  
  return translatedText;
};

// Batch translate multiple texts
export const translateMultiple = async (texts, targetLanguage) => {
  const results = await Promise.all(
    texts.map(text => getCachedTranslation(text, targetLanguage))
  );
  return results;
}; 