// Fallback manual translations for when auto-translation fails
export const fallbackTranslations = {
  en: {
    tagline: "Having trouble with livestock management?",
    subTagline1: "Ride with us",
    subTagline2: "Learn How to use this app.",
    farmer: "I'm a Farmer",
    vet: "I'm a Veterinarian",
    // Add more translations as needed
  },
  bn: {
    tagline: "গবাদি পশু ব্যবস্থাপনায় সমস্যা হচ্ছে?",
    subTagline1: "আমাদের সাথে থাকুন",
    subTagline2: "এই অ্যাপটি কীভাবে ব্যবহার করবেন শিখুন।",
    farmer: "আমি একজন কৃষক",
    vet: "আমি একজন পশু চিকিৎসক",
    // Add more translations as needed
  }
};

export const getFallbackTranslation = (text, language) => {
  if (language === 'en') {
    return text;
  }
  
  // Try to find the text in our fallback translations
  const englishTexts = fallbackTranslations.en;
  const banglaTexts = fallbackTranslations.bn;
  
  for (const [key, englishText] of Object.entries(englishTexts)) {
    if (englishText === text) {
      return banglaTexts[key] || text;
    }
  }
  
  return text; // Return original if not found
}; 