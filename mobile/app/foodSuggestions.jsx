import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  Modal,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_KEY = "AIzaSyCrmZacTK1h8DaMculKalsaPY57LWWUsbw";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

function DietTable({ tableData }) {
  if (!tableData || !tableData.headers || !tableData.rows) return null;
  return (
    <View style={{ marginBottom: 20 }}>
      <View style={{ flexDirection: 'row', backgroundColor: '#eaf1fb', borderRadius: 8 }}>
        {tableData.headers.map((header, idx) => (
          <Text key={idx} style={{ flex: 1, fontWeight: 'bold', padding: 8, color: '#2d3a4a', textAlign: 'center' }}>{header}</Text>
        ))}
      </View>
      {tableData.rows.map((row, rIdx) => (
        <View key={rIdx} style={{ flexDirection: 'row', backgroundColor: rIdx % 2 === 0 ? '#fff' : '#f7f9fa' }}>
          {row.map((cell, cIdx) => (
            <Text key={cIdx} style={{ flex: 1, padding: 8, color: '#333', textAlign: 'center' }}>{cell}</Text>
          ))}
        </View>
      ))}
    </View>
  );
}

export default function FoodSuggestions() {
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showFoodVarietyModal, setShowFoodVarietyModal] = useState(false);
  const [selectedDietType, setSelectedDietType] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetchAnimals();
  }, []);

  const fetchAnimals = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        router.replace('/');
        return;
      }

      const response = await axios.get('http://localhost:3000/api/animals', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setAnimals(response.data);
    } catch (error) {
      Alert.alert("Error", "Failed to fetch animals");
    } finally {
      setLoading(false);
    }
  };

  const getFoodSuggestion = async (animal, dietType = 'comprehensive') => {
    setSelectedAnimal(animal);
    setSuggestionLoading(true);
    setSuggestion(null);
    setShowSuggestionModal(true);

    try {
      let prompt = '';
      switch(dietType) {
        case 'dietChart':
          prompt = `Create a daily diet chart for ${animal.name} (${animal.type}, ${animal.breed}, ${animal.age} years, ${animal.gender}).\n\nRespond ONLY in Bangla (Bengali) language. All table headers and values must be in Bangla.\n\nReturn a JSON object with:\n- 'table': { 'headers': [...], 'rows': [[...], ...] }\n- 'rating': number (1-5, 5 is best)\n- 'summary': short summary string.\nNo extra text.`;
          break;
        case 'weightGain':
          prompt = `Create a weight gain diet table for ${animal.name} (${animal.type}, ${animal.breed}, ${animal.age} years, ${animal.gender}):\n\nRespond ONLY in Bangla (Bengali) language. All table headers and values must be in Bangla.\n\nFormat as tables only:\n\n**DAILY MEAL PLAN:**\n| Meal | Food Items | Portion | Calories | Protein | Fat | Carbs |\n|------|------------|---------|----------|---------|-----|-------|\n\n**SUPPLEMENTS TABLE:**\n| Supplement | Dosage | Frequency | Purpose |\n|------------|--------|-----------|---------|\n\n**WEEKLY TARGETS:**\n| Week | Target Weight Gain | Calorie Increase | Notes |\n|------|-------------------|------------------|-------|\n\nUse only table format, no other text.`;
          break;
        case 'weightLoss':
          prompt = `Create a weight loss diet table for ${animal.name} (${animal.type}, ${animal.breed}, ${animal.age} years, ${animal.gender}):\n\nRespond ONLY in Bangla (Bengali) language. All table headers and values must be in Bangla.\n\nFormat as tables only:\n\n**DAILY MEAL PLAN:**\n| Meal | Food Items | Portion | Calories | Protein | Fat | Carbs |\n|------|------------|---------|----------|---------|-----|-------|\n\n**LOW-CALORIE ALTERNATIVES:**\n| Regular Food | Alternative | Calories Saved | Notes |\n|--------------|-------------|----------------|-------|\n\n**WEEKLY TARGETS:**\n| Week | Target Weight Loss | Calorie Deficit | Notes |\n|------|-------------------|-----------------|-------|\n\nUse only table format, no other text.`;
          break;
        case 'pregnancy':
          prompt = `Create a pregnancy diet table for ${animal.name} (${animal.type}, ${animal.breed}, ${animal.age} years, ${animal.gender}):\n\nRespond ONLY in Bangla (Bengali) language. All table headers and values must be in Bangla.\n\nFormat as tables only:\n\n**DAILY PREGNANCY MEAL PLAN:**\n| Meal | Food Items | Portion | Calories | Protein | Fat | Carbs |\n|------|------------|---------|----------|---------|-----|-------|\n\n**ESSENTIAL NUTRIENTS:**\n| Nutrient | Food Sources | Daily Requirement | Importance |\n|----------|--------------|-------------------|------------|\n\n**SUPPLEMENTS:**\n| Supplement | Dosage | Frequency | Purpose |\n|------------|--------|-----------|---------|\n\n**FOODS TO AVOID:**\n| Food Item | Reason | Alternative |\n|-----------|--------|-------------|\n\nUse only table format, no other text.`;
          break;
        case 'senior':
          prompt = `Create a senior diet table for ${animal.name} (${animal.type}, ${animal.breed}, ${animal.age} years, ${animal.gender}):\n\nRespond ONLY in Bangla (Bengali) language. All table headers and values must be in Bangla.\n\nFormat as tables only:\n\n**DAILY SENIOR MEAL PLAN:**\n| Meal | Food Items | Portion | Calories | Protein | Fat | Carbs |\n|------|------------|---------|----------|---------|-----|-------|\n\n**JOINT HEALTH SUPPLEMENTS:**\n| Supplement | Dosage | Frequency | Benefits |\n|------------|--------|-----------|----------|\n\n**EASY-TO-DIGEST FOODS:**\n| Food Category | Examples | Benefits | Avoid |\n|---------------|----------|----------|-------|\n\n**FEEDING SCHEDULE:**\n| Time | Meal Type | Special Instructions |\n|------|-----------|---------------------|\n\nUse only table format, no other text.`;
          break;
        default:
          prompt = `Create a comprehensive diet plan for ${animal.name} (${animal.type}, ${animal.breed}, ${animal.age} years, ${animal.gender}).\n\nRespond ONLY in Bangla (Bengali) language. All table headers and values must be in Bangla.\n\nReturn a JSON object with:\n- 'table': { 'headers': [...], 'rows': [[...], ...] }\n- 'rating': number (1-5, 5 is best)\n- 'summary': short summary string.\nNo extra text.`;
      }
      const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contents: [{ 
            parts: [{ text: prompt }] 
          }] 
        }),
      });
      const data = await response.json();
      let aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not get a response.';
      try {
        let jsonString = aiText.trim();
        // Remove markdown code blocks if present
        if (jsonString.startsWith('```json')) {
          jsonString = jsonString.replace(/^```json\n/, '').replace(/\n```$/, '');
        } else if (jsonString.startsWith('```')) {
          jsonString = jsonString.replace(/^```\n/, '').replace(/\n```$/, '');
        }
        const aiJson = JSON.parse(jsonString);
        setSuggestion(aiJson);
      } catch (e) {
        setSuggestion('Failed to parse AI response. Try again.');
      } finally {
        setSuggestionLoading(false);
      }
    } catch (err) {
      setSuggestion('An error occurred while getting food suggestions. Please check your connection and try again.');
    }
  };

  const showDietOptions = (animal) => {
    setSelectedAnimal(animal);
    setShowOptionsModal(true);
  };

  const showFoodVarietyOptions = (dietType) => {
    setSelectedDietType(dietType);
    setShowFoodVarietyModal(true);
  };

  const getFoodVariety = async (varietyType) => {
    setShowFoodVarietyModal(false);
    setSuggestionLoading(true);
    setSuggestion(null);
    setShowSuggestionModal(true);

    try {
      let prompt = '';
      prompt = `Create a diet plan for ${selectedAnimal.name} (${selectedAnimal.type}, ${selectedAnimal.breed}, ${selectedAnimal.age} years, ${selectedAnimal.gender}) for ${selectedDietType} (${varietyType}).\n\nRespond ONLY in Bangla (Bengali) language. All table headers and values must be in Bangla.\n\nReturn a JSON object with:\n- 'table': { 'headers': [...], 'rows': [[...], ...] }\n- 'rating': number (1-5, 5 is best)\n- 'summary': short summary string.\nNo extra text.`;
      const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contents: [{ 
            parts: [{ text: prompt }] 
          }] 
        }),
      });
      const data = await response.json();
      let aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not get a response.';
      try {
        let jsonString = aiText.trim();
        // Remove markdown code blocks if present
        if (jsonString.startsWith('```json')) {
          jsonString = jsonString.replace(/^```json\n/, '').replace(/\n```$/, '');
        } else if (jsonString.startsWith('```')) {
          jsonString = jsonString.replace(/^```\n/, '').replace(/\n```$/, '');
        }
        const aiJson = JSON.parse(jsonString);
        setSuggestion(aiJson);
      } catch (e) {
        setSuggestion('Failed to parse AI response. Try again.');
      } finally {
        setSuggestionLoading(false);
      }
    } catch (err) {
      setSuggestion('An error occurred while getting food variety suggestions. Please check your connection and try again.');
    }
  };

  const handleBackPress = () => {
    try {
      router.back();
    } catch (error) {
      // If back navigation fails, go to a safe default page
      router.replace('/'); // or router.push('/profile') or your desired route
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a89dc" />
        <Text style={styles.loadingText}>Loading your animals...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={28} color="#4a89dc" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Food Suggestions</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.description}>
          Select an animal to get personalized food recommendations based on their breed, age, and health status.
        </Text>

        {animals.length === 0 ? (
          <View style={styles.noAnimalsContainer}>
            <Ionicons name="paw" size={64} color="#ccc" />
            <Text style={styles.noAnimalsText}>No animals found</Text>
            <Text style={styles.noAnimalsSubtext}>
              Add animals to your profile to get food suggestions
            </Text>
          </View>
        ) : (
          <View style={styles.animalsList}>
            {animals.map((animal) => (
                             <TouchableOpacity
                 key={animal._id}
                 style={styles.animalCard}
                 onPress={() => showDietOptions(animal)}
               >
                <View style={styles.animalImageContainer}>
                  {animal.photo_url ? (
                    <Image 
                      source={{ uri: animal.photo_url }} 
                      style={styles.animalImage}
                    />
                  ) : (
                    <View style={[styles.animalImage, styles.noImage]}>
                      <Ionicons name="paw" size={32} color="#ccc" />
                    </View>
                  )}
                </View>
                <View style={styles.animalInfo}>
                  <Text style={styles.animalName}>{animal.name}</Text>
                  <Text style={styles.animalDetails}>
                    {animal.type} • {animal.breed} • {animal.age} years
                  </Text>
                  <Text style={styles.animalGender}>{animal.gender}</Text>
                </View>
                <View style={styles.arrowContainer}>
                  <Ionicons name="chevron-forward" size={24} color="#4a89dc" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Food Suggestion Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showSuggestionModal}
        onRequestClose={() => setShowSuggestionModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Food Suggestions for {selectedAnimal?.name}
              </Text>
              <TouchableOpacity 
                onPress={() => setShowSuggestionModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.suggestionContainer}>
              {suggestionLoading ? (
                <View style={styles.loadingSuggestion}>
                  <ActivityIndicator size="large" color="#4a89dc" />
                  <Text style={styles.loadingSuggestionText}>
                    Getting personalized food suggestions...
                  </Text>
                </View>
              ) : suggestion && suggestion.table ? (
                <>
                  <DietTable tableData={suggestion.table} />
                  <Text style={{ fontWeight: 'bold', color: '#4a89dc', fontSize: 16, marginBottom: 8 }}>Rating: {suggestion.rating} / 5</Text>
                  <Text style={{ color: '#333', marginBottom: 8 }}>{suggestion.summary}</Text>
                </>
              ) : suggestion ? (
                <Text style={styles.suggestionText}>{typeof suggestion === 'string' ? suggestion : JSON.stringify(suggestion)}</Text>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Diet Options Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showOptionsModal}
        onRequestClose={() => setShowOptionsModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Diet Options for {selectedAnimal?.name}
              </Text>
              <TouchableOpacity 
                onPress={() => setShowOptionsModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

                           <View style={styles.optionsContainer}>
                 <TouchableOpacity 
                   style={styles.optionButton}
                   onPress={() => {
                     setShowOptionsModal(false);
                     getFoodSuggestion(selectedAnimal, 'comprehensive');
                   }}
                 >
                   <Ionicons name="restaurant" size={24} color="#4a89dc" />
                   <Text style={styles.optionButtonText}>Comprehensive Diet Plan</Text>
                   <Text style={styles.optionButtonSubtext}>Complete nutrition guide with diet chart</Text>
                 </TouchableOpacity>

                 <TouchableOpacity 
                   style={styles.optionButton}
                   onPress={() => {
                     setShowOptionsModal(false);
                     showFoodVarietyOptions('dietChart');
                   }}
                 >
                   <Ionicons name="grid" size={24} color="#27ae60" />
                   <Text style={styles.optionButtonText}>Daily Diet Chart</Text>
                   <Text style={styles.optionButtonSubtext}>Detailed meal table with calories</Text>
                 </TouchableOpacity>

                 <TouchableOpacity 
                   style={styles.optionButton}
                   onPress={() => {
                     setShowOptionsModal(false);
                     showFoodVarietyOptions('weightGain');
                   }}
                 >
                   <Ionicons name="trending-up" size={24} color="#f39c12" />
                   <Text style={styles.optionButtonText}>Weight Gain Diet</Text>
                   <Text style={styles.optionButtonSubtext}>High-calorie meal plan</Text>
                 </TouchableOpacity>

                 <TouchableOpacity 
                   style={styles.optionButton}
                   onPress={() => {
                     setShowOptionsModal(false);
                     showFoodVarietyOptions('weightLoss');
                   }}
                 >
                   <Ionicons name="trending-down" size={24} color="#e74c3c" />
                   <Text style={styles.optionButtonText}>Weight Loss Diet</Text>
                   <Text style={styles.optionButtonSubtext}>Calorie-controlled meal plan</Text>
                 </TouchableOpacity>

                 <TouchableOpacity 
                   style={styles.optionButton}
                   onPress={() => {
                     setShowOptionsModal(false);
                     getFoodSuggestion(selectedAnimal, 'pregnancy');
                   }}
                 >
                   <Ionicons name="heart" size={24} color="#e91e63" />
                   <Text style={styles.optionButtonText}>Pregnancy Diet</Text>
                   <Text style={styles.optionButtonSubtext}>Special nutrition for pregnant animals</Text>
                 </TouchableOpacity>

                 <TouchableOpacity 
                   style={styles.optionButton}
                   onPress={() => {
                     setShowOptionsModal(false);
                     getFoodSuggestion(selectedAnimal, 'senior');
                   }}
                 >
                   <Ionicons name="time" size={24} color="#9b59b6" />
                   <Text style={styles.optionButtonText}>Senior Diet</Text>
                   <Text style={styles.optionButtonSubtext}>Age-appropriate nutrition</Text>
                 </TouchableOpacity>
               </View>
          </View>
        </View>
      </Modal>

      {/* Food Variety Options Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showFoodVarietyModal}
        onRequestClose={() => setShowFoodVarietyModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Food Options for {selectedAnimal?.name}
              </Text>
              <TouchableOpacity 
                onPress={() => setShowFoodVarietyModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.optionsContainer}>
              {selectedDietType === 'dietChart' && (
                <>
                  <TouchableOpacity 
                    style={styles.optionButton}
                    onPress={() => getFoodVariety('vegetarian')}
                  >
                    <Ionicons name="leaf" size={24} color="#27ae60" />
                    <Text style={styles.optionButtonText}>Vegetarian Diet</Text>
                    <Text style={styles.optionButtonSubtext}>Plant-based nutrition plan</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.optionButton}
                    onPress={() => getFoodVariety('highProtein')}
                  >
                    <Ionicons name="fitness" size={24} color="#e74c3c" />
                    <Text style={styles.optionButtonText}>High Protein Diet</Text>
                    <Text style={styles.optionButtonSubtext}>Protein-rich meal plan</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.optionButton}
                    onPress={() => getFoodVariety('grainFree')}
                  >
                    <Ionicons name="close-circle" size={24} color="#f39c12" />
                    <Text style={styles.optionButtonText}>Grain-Free Diet</Text>
                    <Text style={styles.optionButtonSubtext}>No grains, natural foods</Text>
                  </TouchableOpacity>
                </>
              )}

              {selectedDietType === 'weightGain' && (
                <>
                  <TouchableOpacity 
                    style={styles.optionButton}
                    onPress={() => getFoodVariety('highCalorie')}
                  >
                    <Ionicons name="flame" size={24} color="#e67e22" />
                    <Text style={styles.optionButtonText}>High Calorie Plan</Text>
                    <Text style={styles.optionButtonSubtext}>Maximum calorie intake</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.optionButton}
                    onPress={() => getFoodVariety('muscleBuilding')}
                  >
                    <Ionicons name="barbell" size={24} color="#8e44ad" />
                    <Text style={styles.optionButtonText}>Muscle Building</Text>
                    <Text style={styles.optionButtonSubtext}>Protein-focused growth</Text>
                  </TouchableOpacity>
                </>
              )}

              {selectedDietType === 'weightLoss' && (
                <>
                  <TouchableOpacity 
                    style={styles.optionButton}
                    onPress={() => getFoodVariety('lowCarb')}
                  >
                    <Ionicons name="remove-circle" size={24} color="#e74c3c" />
                    <Text style={styles.optionButtonText}>Low Carb Diet</Text>
                    <Text style={styles.optionButtonSubtext}>Reduced carbohydrate intake</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.optionButton}
                    onPress={() => getFoodVariety('intermittent')}
                  >
                    <Ionicons name="time" size={24} color="#3498db" />
                    <Text style={styles.optionButtonText}>Intermittent Fasting</Text>
                    <Text style={styles.optionButtonSubtext}>Time-restricted eating</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7f9fa',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#4a89dc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollContainer: {
    padding: 20,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    lineHeight: 22,
  },
  noAnimalsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  noAnimalsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  noAnimalsSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  animalsList: {
    gap: 12,
  },
  animalCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  animalImageContainer: {
    marginRight: 16,
  },
  animalImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  noImage: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  animalInfo: {
    flex: 1,
  },
  animalName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  animalDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  animalGender: {
    fontSize: 14,
    color: '#4a89dc',
    fontWeight: '500',
  },
  arrowContainer: {
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    padding: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  suggestionContainer: {
    padding: 20,
  },
  loadingSuggestion: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingSuggestionText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  suggestionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  optionsContainer: {
    padding: 20,
    gap: 16,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  optionButtonSubtext: {
    fontSize: 12,
    color: '#666',
    marginLeft: 12,
    marginTop: 2,
  },
}); 