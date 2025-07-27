// Google Translate API (more reliable but requires payment)
// Get API key from: https://console.cloud.google.com/apis/credentials

const GOOGLE_TRANSLATE_API_KEY = 'YOUR_GOOGLE_TRANSLATE_API_KEY'; // Replace with your API key

export const translateWithGoogle = async (text, targetLanguage) => {
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
          source: 'en',
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.data && data.data.translations && data.data.translations[0]) {
      return data.data.translations[0].translatedText;
    } else {
      console.error('Google Translate failed:', data);
      throw new Error('No translation received');
    }
  } catch (error) {
    console.error('Google Translate error:', error);
    throw error;
  }
};

// Cache for Google Translate
const googleCache = new Map();

export const getCachedGoogleTranslation = async (text, targetLanguage) => {
  const cacheKey = `${text}_${targetLanguage}`;
  
  if (googleCache.has(cacheKey)) {
    return googleCache.get(cacheKey);
  }
  
  const translatedText = await translateWithGoogle(text, targetLanguage);
  googleCache.set(cacheKey, translatedText);
  
  return translatedText;
}; 