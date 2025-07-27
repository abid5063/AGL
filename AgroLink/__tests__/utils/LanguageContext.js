import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LanguageContext = createContext();

export const translations = {
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
   
    // Add more translations as needed
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');
  const [isLoading, setIsLoading] = useState(true);

  // Load saved language on app start
  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('userLanguage');
      if (savedLanguage) {
        setLanguage(savedLanguage);
      }
    } catch (error) {
      console.log('Error loading language:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const changeLanguage = async (newLanguage) => {
    try {
      await AsyncStorage.setItem('userLanguage', newLanguage);
      setLanguage(newLanguage);
    } catch (error) {
      console.log('Error saving language:', error);
    }
  };

  const clearLanguage = async () => {
    try {
      await AsyncStorage.removeItem('userLanguage');
      setLanguage('en'); // Reset to default
    } catch (error) {
      console.log('Error clearing language:', error);
    }
  };

  const t = translations[language] || translations.en;

  return (
    <LanguageContext.Provider value={{ 
      language, 
      changeLanguage, 
      clearLanguage, 
      t, 
      isLoading 
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};