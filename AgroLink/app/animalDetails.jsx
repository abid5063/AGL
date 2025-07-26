import React, { useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Modal, TextInput, Alert, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from "axios";
import { API_BASE_URL } from '../utils/apiConfig';
export default function AnimalDetails() {
  const params = useLocalSearchParams();
  const animal = params.animal ? JSON.parse(params.animal) : null;

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [foodSuggestionModalVisible, setFoodSuggestionModalVisible] = useState(false);
  const [foodSuggestionLoading, setFoodSuggestionLoading] = useState(false);
  const [foodSuggestion, setFoodSuggestion] = useState(null);
  const [showDietOptionsModal, setShowDietOptionsModal] = useState(false);
  const [formData, setFormData] = useState({
    name: animal?.name || "",
    type: animal?.type || "",
    breed: animal?.breed || "",
    age: animal?.age ? animal.age.toString() : "",
    gender: animal?.gender || "",
    details: animal?.details || "",
  });

  const handleInputChange = (key, value) => {
    setFormData({ ...formData, [key]: value });
  };

  const getFoodSuggestion = async (animal, dietType = 'comprehensive') => {
    setFoodSuggestionLoading(true);
    setFoodSuggestion(null);
    setFoodSuggestionModalVisible(true);

    try {
      const currentDate = new Date().toLocaleDateString();
      const currentTime = new Date().toLocaleTimeString();
      
      let prompt = '';
      
      switch(dietType) {
        case 'dietChart':
          prompt = `Create a detailed daily diet chart table for ${animal.name} (${animal.type}, ${animal.breed}, ${animal.age} years, ${animal.gender}):

Format as a clean table with these columns:
| Meal Time | Food Items | Portion Size | Calories | Protein (g) | Fat (g) | Carbs (g) |
|-----------|------------|--------------|----------|-------------|---------|-----------|

Include: Breakfast, Lunch, Dinner, 2 snacks. Add a TOTAL row at bottom. Use only table format, no other text.`;
          break;
          
        case 'weightGain':
          prompt = `Create a weight gain diet table for ${animal.name} (${animal.type}, ${animal.breed}, ${animal.age} years, ${animal.gender}):

Format as tables only:

**DAILY MEAL PLAN:**
| Meal | Food Items | Portion | Calories | Protein | Fat | Carbs |
|------|------------|---------|----------|---------|-----|-------|

**SUPPLEMENTS TABLE:**
| Supplement | Dosage | Frequency | Purpose |
|------------|--------|-----------|---------|

**WEEKLY TARGETS:**
| Week | Target Weight Gain | Calorie Increase | Notes |
|------|-------------------|------------------|-------|

Use only table format, no other text.`;
          break;
          
        case 'weightLoss':
          prompt = `Create a weight loss diet table for ${animal.name} (${animal.type}, ${animal.breed}, ${animal.age} years, ${animal.gender}):

Format as tables only:

**DAILY MEAL PLAN:**
| Meal | Food Items | Portion | Calories | Protein | Fat | Carbs |
|------|------------|---------|----------|---------|-----|-------|

**LOW-CALORIE ALTERNATIVES:**
| Regular Food | Alternative | Calories Saved | Notes |
|--------------|-------------|----------------|-------|

**WEEKLY TARGETS:**
| Week | Target Weight Loss | Calorie Deficit | Notes |
|------|-------------------|-----------------|-------|

Use only table format, no other text.`;
          break;
          
        case 'pregnancy':
          prompt = `Create a pregnancy diet table for ${animal.name} (${animal.type}, ${animal.breed}, ${animal.age} years, ${animal.gender}):

Format as tables only:

**DAILY PREGNANCY MEAL PLAN:**
| Meal | Food Items | Portion | Calories | Protein | Fat | Carbs |
|------|------------|---------|----------|---------|-----|-------|

**ESSENTIAL NUTRIENTS:**
| Nutrient | Food Sources | Daily Requirement | Importance |
|----------|--------------|-------------------|------------|

**SUPPLEMENTS:**
| Supplement | Dosage | Frequency | Purpose |
|------------|--------|-----------|---------|

**FOODS TO AVOID:**
| Food Item | Reason | Alternative |
|-----------|--------|-------------|

Use only table format, no other text.`;
          break;
          
        case 'senior':
          prompt = `Create a senior diet table for ${animal.name} (${animal.type}, ${animal.breed}, ${animal.age} years, ${animal.gender}):

Format as tables only:

**DAILY SENIOR MEAL PLAN:**
| Meal | Food Items | Portion | Calories | Protein | Fat | Carbs |
|------|------------|---------|----------|---------|-----|-------|

**JOINT HEALTH SUPPLEMENTS:**
| Supplement | Dosage | Frequency | Benefits |
|------------|--------|-----------|----------|

**EASY-TO-DIGEST FOODS:**
| Food Category | Examples | Benefits | Avoid |
|---------------|----------|----------|-------|

**FEEDING SCHEDULE:**
| Time | Meal Type | Special Instructions |
|------|-----------|---------------------|

Use only table format, no other text.`;
          break;
          
        default: // comprehensive
          prompt = `Create a comprehensive diet plan for ${animal.name} (${animal.type}, ${animal.breed}, ${animal.age} years, ${animal.gender}):

Format as tables only:

**DAILY DIET CHART:**
| Meal Time | Food Items | Portion Size | Calories | Protein (g) | Fat (g) | Carbs (g) |
|-----------|------------|--------------|----------|-------------|---------|-----------|

**BREED-SPECIFIC FOODS:**
| Food Category | Recommended | Avoid | Reason |
|---------------|--------------|-------|--------|

**AGE-APPROPRIATE NUTRITION:**
| Nutrient | Requirement | Food Sources | Notes |
|----------|-------------|--------------|-------|

**SEASONAL ADJUSTMENTS:**
| Season | Food Changes | Portion Adjustments | Special Notes |
|--------|--------------|---------------------|---------------|

**WATER REQUIREMENTS:**
| Time | Amount | Temperature | Notes |
|------|--------|-------------|-------|

Use only table format, no other text.`;
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
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (aiText) {
        setFoodSuggestion(aiText);
      } else {
        setFoodSuggestion('Failed to get food suggestions. Please try again.');
      }
    } catch (err) {
      setFoodSuggestion('An error occurred while getting food suggestions. Please check your connection and try again.');
    } finally {
      setFoodSuggestionLoading(false);
    }
  };

  const showDietOptions = () => {
    setShowDietOptionsModal(true);
  };

  const handleEditAnimal = async () => {
    if (
      !formData.name.trim() ||
      !formData.type.trim() ||
      !formData.breed.trim() ||
      !formData.age.trim() ||
      !formData.gender.trim()
    ) {
      Alert.alert("Validation", "Please fill all required fields.");
      return;
    }
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');      
      const response = await axios.put(
        `${API_BASE_URL}/api/animals/${animal._id}`,
        {
          ...formData,
          age: Number(formData.age),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      Alert.alert("Success", "Animal updated successfully");
      setEditModalVisible(false);
      router.replace({
        pathname: '/profile'
      });
    } catch (error) {
      Alert.alert("Error", error.response?.data?.message || "Failed to update animal");
    } finally {
      setLoading(false);
    }
  };

 const handleDeleteAnimal = () => {
  Alert.alert(
    "Delete Animal",
    "Are you sure you want to delete this animal?",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          actuallyDeleteAnimal();
        }
      }
    ]
  );
};

const actuallyDeleteAnimal = async () => {
  try {
    setLoading(true);
    const token = await AsyncStorage.getItem('authToken');    
    await axios.delete(
      `${API_BASE_URL}/api/animals/${animal._id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    Alert.alert("Deleted", "Animal removed successfully");
    router.replace('/profile');
  } catch (error) {
    Alert.alert("Error", error.response?.data?.message || "Failed to delete animal");
  } finally {
    setLoading(false);
  }
};

  if (!animal) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No animal data found.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText} testID="error-back-button">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText} testID="back-button">← Back</Text>
        </TouchableOpacity>
        <View style={styles.imageContainer}>
          {animal.photo_url ? (
            <Image source={{ uri: animal.photo_url }} style={styles.animalImage} />
          ) : (
            <View style={[styles.animalImage, { backgroundColor: "#e0e0e0", justifyContent: "center", alignItems: "center" }]}>
              <Text style={{ color: "#aaa" }}>No Image</Text>
            </View>
          )}
        </View>
        <Text style={styles.animalName}>{animal.name}</Text>
        <Text style={styles.detailText}>Type: {animal.type}</Text>
        <Text style={styles.detailText}>Breed: {animal.breed}</Text>
        <Text style={styles.detailText}>Age: {animal.age} years</Text>
        <Text style={styles.detailText}>Gender: {animal.gender}</Text>
        {animal.details ? (
          <Text style={styles.detailText}>Details: {animal.details}</Text>
        ) : null}

        <View style={{ flexDirection: "row", marginTop: 24, gap: 16 }}>
          <TouchableOpacity style={styles.editButton} onPress={() => setEditModalVisible(true)}>
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={actuallyDeleteAnimal} testID="animal-delete-button">
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
        <View>
          <TouchableOpacity style={styles.foodButton} onPress={() => router.push('/foodSuggestions')} >
            <Text style={styles.foodButtonText}>Get Food Suggession</Text>
          </TouchableOpacity>
        </View>


        {/* Edit Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={editModalVisible}
          onRequestClose={() => setEditModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Animal</Text>
              <TextInput
                style={styles.input}
                placeholder="Name"
                value={formData.name}
                onChangeText={text => handleInputChange('name', text)}
                testID="animal-name-input"
              />
              <TextInput
                style={styles.input}
                placeholder="Type"
                value={formData.type}
                onChangeText={text => handleInputChange('type', text)}
              />
              <TextInput
                style={styles.input}
                placeholder="Breed"
                value={formData.breed}
                onChangeText={text => handleInputChange('breed', text)}
              />
              <TextInput
                style={styles.input}
                placeholder="Age"
                value={formData.age}
                onChangeText={text => handleInputChange('age', text)}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                placeholder="Gender"
                value={formData.gender}
                onChangeText={text => handleInputChange('gender', text)}
              />
              <TextInput
                style={[styles.input, { height: 80 }]}
                placeholder="Details"
                value={formData.details}
                onChangeText={text => handleInputChange('details', text)}
                multiline
              />
              {loading ? (
                <ActivityIndicator size="large" color="#4a89dc" style={{ marginVertical: 20 }} testID="animal-loading-indicator" />
              ) : (
                <View style={styles.modalButtons}>
                  <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setEditModalVisible(false)} testID="animal-cancel-button">
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleEditAnimal} testID="animal-save-button">
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </Modal>

        {/* Food Suggestion Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={foodSuggestionModalVisible}
          onRequestClose={() => setFoodSuggestionModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  Food Suggestions for {animal?.name}
                </Text>
                <TouchableOpacity 
                  onPress={() => setFoodSuggestionModalVisible(false)}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.suggestionContainer}>
                {foodSuggestionLoading ? (
                  <View style={styles.loadingSuggestion}>
                    <ActivityIndicator size="large" color="#4a89dc" />
                    <Text style={styles.loadingSuggestionText}>
                      Getting personalized food suggestions...
                    </Text>
                  </View>
                ) : foodSuggestion ? (
                  <Text style={styles.suggestionText}>{foodSuggestion}</Text>
                ) : null}
              </ScrollView>
            </View>
          </View>
                 </Modal>

         {/* Diet Options Modal */}
         <Modal
           animationType="slide"
           transparent={true}
           visible={showDietOptionsModal}
           onRequestClose={() => setShowDietOptionsModal(false)}
         >
           <View style={styles.modalContainer}>
             <View style={styles.modalContent}>
               <View style={styles.modalHeader}>
                 <Text style={styles.modalTitle}>
                   Diet Options for {animal?.name}
                 </Text>
                 <TouchableOpacity 
                   onPress={() => setShowDietOptionsModal(false)}
                   style={styles.closeButton}
                 >
                   <Text style={styles.closeButtonText}>✕</Text>
                 </TouchableOpacity>
               </View>

               <View style={styles.optionsContainer}>
                 <TouchableOpacity 
                   style={styles.optionButton}
                   onPress={() => {
                     setShowDietOptionsModal(false);
                     getFoodSuggestion(animal, 'comprehensive');
                   }}
                 >
                   <Text style={styles.optionButtonText}>🍽️ Comprehensive Diet Plan</Text>
                   <Text style={styles.optionButtonSubtext}>Complete nutrition guide with diet chart</Text>
                 </TouchableOpacity>

                 <TouchableOpacity 
                   style={styles.optionButton}
                   onPress={() => {
                     setShowDietOptionsModal(false);
                     getFoodSuggestion(animal, 'dietChart');
                   }}
                 >
                   <Text style={styles.optionButtonText}>📊 Daily Diet Chart</Text>
                   <Text style={styles.optionButtonSubtext}>Detailed meal table with calories</Text>
                 </TouchableOpacity>

                 <TouchableOpacity 
                   style={styles.optionButton}
                   onPress={() => {
                     setShowDietOptionsModal(false);
                     getFoodSuggestion(animal, 'weightGain');
                   }}
                 >
                   <Text style={styles.optionButtonText}>📈 Weight Gain Diet</Text>
                   <Text style={styles.optionButtonSubtext}>High-calorie meal plan</Text>
                 </TouchableOpacity>

                 <TouchableOpacity 
                   style={styles.optionButton}
                   onPress={() => {
                     setShowDietOptionsModal(false);
                     getFoodSuggestion(animal, 'weightLoss');
                   }}
                 >
                   <Text style={styles.optionButtonText}>📉 Weight Loss Diet</Text>
                   <Text style={styles.optionButtonSubtext}>Calorie-controlled meal plan</Text>
                 </TouchableOpacity>

                 <TouchableOpacity 
                   style={styles.optionButton}
                   onPress={() => {
                     setShowDietOptionsModal(false);
                     getFoodSuggestion(animal, 'pregnancy');
                   }}
                 >
                   <Text style={styles.optionButtonText}>❤️ Pregnancy Diet</Text>
                   <Text style={styles.optionButtonSubtext}>Special nutrition for pregnant animals</Text>
                 </TouchableOpacity>

                 <TouchableOpacity 
                   style={styles.optionButton}
                   onPress={() => {
                     setShowDietOptionsModal(false);
                     getFoodSuggestion(animal, 'senior');
                   }}
                 >
                   <Text style={styles.optionButtonText}>⏰ Senior Diet</Text>
                   <Text style={styles.optionButtonSubtext}>Age-appropriate nutrition</Text>
                 </TouchableOpacity>
               </View>
             </View>
           </View>
         </Modal>
       </View>
     </ScrollView>
   );
 }

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 30,
    backgroundColor: "#f7f9fa",
  },
  container: {
    width: "90%",
    alignSelf: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    elevation: 2,
  },
  imageContainer: {
    marginBottom: 20,
    alignItems: "center",
  },
  animalImage: {
    width: 160,
    height: 160,
    borderRadius: 16,
    marginBottom: 10,
    backgroundColor: "#e0e0e0",
  },
  animalName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
    textAlign: "center",
  },
  detailText: {
    fontSize: 16,
    color: "#555",
    marginBottom: 6,
    textAlign: "center",
  },
  errorText: {
    color: "#e74c3c",
    fontSize: 18,
    marginBottom: 20,
    textAlign: "center",
  },
  backText: {
    color: "#4a89dc",
    fontSize: 16,
    marginBottom: 20,
    textAlign: "left",
  },
  foodButton: {
    backgroundColor: "#27ae60",
     marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  foodButtonText: {
   
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  marketButton: {
    backgroundColor: "#f39c12",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  marketButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  editButton: {
    backgroundColor: "#4a89dc",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  editButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  deleteButton: {
    backgroundColor: "#e74c3c",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    fontSize: 15,
    backgroundColor: "#fafbfc",
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    width: '48%',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#e0e0e0',
  },
  saveButton: {
    backgroundColor: '#4a89dc',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
    fontWeight: 'bold',
  },
  suggestionContainer: {
    maxHeight: 400,
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
    gap: 12,
  },
  optionButton: {
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
    marginBottom: 4,
  },
  optionButtonSubtext: {
    fontSize: 12,
    color: '#666',
  },
});