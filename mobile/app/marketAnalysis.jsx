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
  Image,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_KEY = "AIzaSyCrmZacTK1h8DaMculKalsaPY57LWWUsbw";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

export default function MarketAnalysis() {
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [showMainOptions, setShowMainOptions] = useState(false);
  const [showSellOptions, setShowSellOptions] = useState(false);
  const [showBuyOptions, setShowBuyOptions] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [buyFormData, setBuyFormData] = useState({
    breed: '',
    animalType: '',
    gender: '',
    weight: '',
    age: '',
    location: ''
  });
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

  const getSellAnalysis = async (animal) => {
    setSelectedAnimal(animal);
    setAnalysisLoading(true);
    setAnalysis(null);
    setShowAnalysisModal(true);

    try {
      const currentDate = new Date().toLocaleDateString();
      const currentTime = new Date().toLocaleTimeString();
      
      const prompt = `Create a market analysis for selling ${animal.name} (${animal.type}, ${animal.breed}, ${animal.age} years, ${animal.gender}):

Format as tables only. All prices must be in Bangladeshi Taka (BDT):

**CURRENT MARKET PRICE:**
| Factor | Value | Price Impact (BDT) |
|--------|-------|-------------------|

**SELLING LOCATIONS:**
| Market Name | Distance | Best Price (BDT) | Peak Time |
|-------------|----------|------------------|-----------|

**MARKET TRENDS:**
| Trend | Current Status | Price Direction | Duration |
|-------|---------------|----------------|----------|

**1-YEAR PREDICTION:**
| Metric | Current (BDT) | Predicted (BDT) | Growth |
|--------|---------------|-----------------|--------|

**SELLING RECOMMENDATIONS:**
| Factor | Recommendation | Reason |
|--------|----------------|--------|

Use only table format, no other text. All prices in BDT.`;

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
        setAnalysis(aiText);
      } else {
        setAnalysis('Failed to get market analysis. Please try again.');
      }
    } catch (err) {
      setAnalysis('An error occurred while getting market analysis. Please check your connection and try again.');
    } finally {
      setAnalysisLoading(false);
    }
  };

  const getBuyAnalysis = async () => {
    if (!buyFormData.breed || !buyFormData.animalType || !buyFormData.gender || !buyFormData.weight || !buyFormData.age) {
      Alert.alert("Validation", "Please fill all required fields.");
      return;
    }

    setAnalysisLoading(true);
    setAnalysis(null);
    setShowAnalysisModal(true);

    try {
      const prompt = `Create a market analysis for buying ${buyFormData.animalType} (${buyFormData.breed}, ${buyFormData.age} years, ${buyFormData.gender}, ${buyFormData.weight}kg):

Format as tables only. All prices must be in Bangladeshi Taka (BDT):

**MARKET PRICE RANGE:**
| Quality | Price Range (BDT) | Availability | Best Time |
|---------|-------------------|--------------|-----------|

**TOP 3 BUYING OPTIONS:**
| Rank | Breed | Age | Weight | Price (BDT) | Location | Rating |
|------|-------|-----|--------|-------------|----------|--------|

**PRICE COMPARISON:**
| Market | Average Price (BDT) | Quality | Distance | Recommendation |
|--------|---------------------|---------|----------|----------------|

**BUYING TIPS:**
| Factor | Tip | Impact |
|--------|-----|--------|

**MARKET FORECAST:**
| Time Period | Price Trend | Supply | Demand | Recommendation |
|-------------|-------------|--------|--------|----------------|

Use only table format, no other text. All prices in BDT.`;

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
        setAnalysis(aiText);
      } else {
        setAnalysis('Failed to get market analysis. Please try again.');
      }
    } catch (err) {
      setAnalysis('An error occurred while getting market analysis. Please check your connection and try again.');
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleInputChange = (key, value) => {
    setBuyFormData({ ...buyFormData, [key]: value });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a89dc" />
        <Text style={styles.loadingText}>Loading market analysis...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#4a89dc" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Market Analysis</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.description}>
          Analyze market prices, trends, and predictions for buying or selling animals.
        </Text>

        <View style={styles.mainButtons}>
          <TouchableOpacity 
            style={styles.mainButton}
            onPress={() => setShowMainOptions(true)}
          >
            <Ionicons name="trending-up" size={32} color="#27ae60" />
            <Text style={styles.mainButtonText}>Market Analysis</Text>
            <Text style={styles.mainButtonSubtext}>Get market insights and predictions</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Main Options Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showMainOptions}
        onRequestClose={() => setShowMainOptions(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Market Analysis Options</Text>
              <TouchableOpacity 
                onPress={() => setShowMainOptions(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.optionsContainer}>
              <TouchableOpacity 
                style={styles.optionButton}
                onPress={() => {
                  setShowMainOptions(false);
                  setShowSellOptions(true);
                }}
              >
                <Ionicons name="cash" size={24} color="#27ae60" />
                <Text style={styles.optionButtonText}>Sell Analysis</Text>
                <Text style={styles.optionButtonSubtext}>Analyze your animals for selling</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.optionButton}
                onPress={() => {
                  setShowMainOptions(false);
                  setShowBuyOptions(true);
                }}
              >
                <Ionicons name="cart" size={24} color="#e74c3c" />
                <Text style={styles.optionButtonText}>Buy Analysis</Text>
                <Text style={styles.optionButtonSubtext}>Find best buying options</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Sell Options Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showSellOptions}
        onRequestClose={() => setShowSellOptions(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Animal to Sell</Text>
              <TouchableOpacity 
                onPress={() => setShowSellOptions(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.animalsList}>
              {animals.length === 0 ? (
                <Text style={styles.noAnimalsText}>No animals found to sell</Text>
              ) : (
                animals.map((animal) => (
                  <TouchableOpacity
                    key={animal._id}
                    style={styles.animalCard}
                    onPress={() => {
                      setShowSellOptions(false);
                      getSellAnalysis(animal);
                    }}
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
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Buy Options Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showBuyOptions}
        onRequestClose={() => setShowBuyOptions(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Buy Analysis</Text>
              <TouchableOpacity 
                onPress={() => setShowBuyOptions(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContainer}>
              <TextInput
                style={styles.input}
                placeholder="Animal Type (e.g., Cow, Chicken)"
                value={buyFormData.animalType}
                onChangeText={(text) => handleInputChange('animalType', text)}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Breed"
                value={buyFormData.breed}
                onChangeText={(text) => handleInputChange('breed', text)}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Gender"
                value={buyFormData.gender}
                onChangeText={(text) => handleInputChange('gender', text)}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Weight (kg)"
                value={buyFormData.weight}
                onChangeText={(text) => handleInputChange('weight', text)}
                keyboardType="numeric"
              />
              
              <TextInput
                style={styles.input}
                placeholder="Age (years)"
                value={buyFormData.age}
                onChangeText={(text) => handleInputChange('age', text)}
                keyboardType="numeric"
              />
              
              <TextInput
                style={styles.input}
                placeholder="Location (optional)"
                value={buyFormData.location}
                onChangeText={(text) => handleInputChange('location', text)}
              />

              <TouchableOpacity 
                style={styles.analyzeButton}
                onPress={() => {
                  setShowBuyOptions(false);
                  getBuyAnalysis();
                }}
              >
                <Text style={styles.analyzeButtonText}>Analyze Market</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Analysis Results Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showAnalysisModal}
        onRequestClose={() => setShowAnalysisModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Market Analysis {selectedAnimal ? `for ${selectedAnimal.name}` : ''}
              </Text>
              <TouchableOpacity 
                onPress={() => setShowAnalysisModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.analysisContainer}>
              {analysisLoading ? (
                <View style={styles.loadingAnalysis}>
                  <ActivityIndicator size="large" color="#4a89dc" />
                  <Text style={styles.loadingAnalysisText}>
                    Analyzing market data...
                  </Text>
                </View>
              ) : analysis ? (
                <Text style={styles.analysisText}>{analysis}</Text>
              ) : null}
            </ScrollView>
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
  mainButtons: {
    gap: 16,
  },
  mainButton: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mainButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
  },
  mainButtonSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
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
  animalsList: {
    padding: 20,
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
  noAnimalsText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
  formContainer: {
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  analyzeButton: {
    backgroundColor: '#4a89dc',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  analysisContainer: {
    padding: 20,
  },
  loadingAnalysis: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingAnalysisText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  analysisText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
}); 