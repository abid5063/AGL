import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Pressable,
  Dimensions
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useState } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AntDesign, Feather, MaterialIcons, Ionicons } from '@expo/vector-icons';
import axios from "axios";
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

export default function Profile() {
  const params = useLocalSearchParams();
  const [farmer, setFarmer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [animals, setAnimals] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentAnimal, setCurrentAnimal] = useState(null);
  const [image, setImage] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    type: '',
    breed: '',
    age: '',
    gender: '',
    details: ''
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (!token) {
          router.replace('/');
          return;
        }

        let parsedFarmer = null;
        if (params.farmer) {
          parsedFarmer = JSON.parse(params.farmer);
        } else {
          const storedData = await AsyncStorage.getItem('userData');
          if (storedData) {
            parsedFarmer = JSON.parse(storedData);
          }
        }
        if (!parsedFarmer) {
          router.replace('/');
          return;
        }
        setFarmer(parsedFarmer);
        await fetchAnimals(token);
      } catch (error) {
        Alert.alert("Error", "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const fetchAnimals = async (token) => {
    try {
      const response = await axios.get('http://localhost:3000/api/animals', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setAnimals(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        Alert.alert("Session Expired", "Please login again");
        await AsyncStorage.multiRemove(['authToken', 'userData']);
        router.replace('/');
      } else {
        Alert.alert("Error", "Failed to fetch animals");
      }
    }
  };

  const pickImage = async () => {
    // Request permissions first
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'We need camera roll permissions to upload images');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled) {
      setImage(result.assets[0].base64);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(['authToken', 'userData']);
      router.replace('/');
    } catch (error) {
      Alert.alert("Error", "Failed to logout");
    }
  };

  const handleInputChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleAddAnimal = async () => {
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
      const token = await AsyncStorage.getItem('authToken');
      const response = await axios.post(
        'http://localhost:3000/api/animals',
        {
          ...formData,
          age: Number(formData.age),
          image: image ? `data:image/jpeg;base64,${image}` : null
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      setAnimals([...animals, response.data]);
      setModalVisible(false);
      setFormData({
        name: '',
        type: '',
        breed: '',
        age: '',
        gender: '',
        details: ''
      });
      setImage(null);
      Alert.alert("Success", "Animal added successfully");
    } catch (error) {
      Alert.alert("Error", error.response?.data?.message || "Failed to add animal");
    }
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
      const token = await AsyncStorage.getItem('authToken');
      const response = await axios.put(
        `http://localhost:3000/api/animals/${currentAnimal._id}`,
        {
          ...formData,
          age: Number(formData.age),
          image: image ? `data:image/jpeg;base64,${image}` : currentAnimal.photo_url
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      setAnimals(animals.map(animal => 
        animal._id === currentAnimal._id ? response.data : animal
      ));
      setEditModalVisible(false);
      setCurrentAnimal(null);
      setImage(null);
      Alert.alert("Success", "Animal updated successfully");
    } catch (error) {
      Alert.alert("Error", error.response?.data?.message || "Failed to update animal");
    }
  };



  const handleViewAnimal = (animal) => {
    router.push({
      pathname: '/animalDetails',
      params: { animal: JSON.stringify(animal) }
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a89dc" />
        <Text style={styles.loadingText}>Loading your profile...</Text>
      </View>
    );
  }

  if (!farmer) {
    return (
      <View style={styles.container}>
        <Text>No profile data found</Text>
        <TouchableOpacity onPress={() => router.replace('/')}>
          <Text style={styles.linkText}>Go to login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.headerContent}>
            <Text style={styles.welcomeText}>Welcome Back</Text>
            <Text style={styles.farmerName}>{farmer.name}</Text>
            <Text style={styles.farmerEmail}>{farmer.email}</Text>
          </View>
          <TouchableOpacity 
            style={styles.profileImageContainer}
            onPress={() => router.push({
              pathname: '/editProfile',
              params: { farmer: JSON.stringify(farmer) }
            })}
            testID="edit-profile-button"
          >
            <Image 
              source={farmer.profileImage ? { uri: farmer.profileImage } : require('../assets/images/icon.png')}
              style={styles.profileImage}
            />
            <View style={styles.editIndicator}>
              <Ionicons name="pencil" size={12} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="paw" size={24} color="#4a89dc" />
            </View>
            <Text style={styles.statNumber}>{animals.length}</Text>
            <Text style={styles.statLabel}>Animals</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="location" size={24} color="#27ae60" />
            </View>
            <Text style={styles.statNumber}>1</Text>
            <Text style={styles.statLabel}>Farm</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="shield-checkmark" size={24} color="#e67e22" />
            </View>
            <Text style={styles.statNumber}>Active</Text>
            <Text style={styles.statLabel}>Status</Text>
          </View>
        </View>

        {/* Main Features Grid */}
        <View style={styles.featuresContainer}>
          <Text style={styles.sectionTitle}>Farm Management</Text>
          
          <View style={styles.featuresGrid}>
            {/* AI Chatbot */}
            <TouchableOpacity
              style={[styles.featureCard, styles.primaryCard]}
              onPress={() => router.push('/aiChatbot')}
              testID="ai-chatbot-button"
            >
              <View style={styles.featureIconContainer}>
                <Ionicons name="chatbubble-ellipses" size={28} color="#fff" />
              </View>
              <Text style={styles.featureTitle}>AI Assistant</Text>
              <Text style={styles.featureSubtitle}>Get instant help</Text>
            </TouchableOpacity>

            {/* Disease Detection */}
            <TouchableOpacity
              style={[styles.featureCard, styles.secondaryCard]}
              onPress={() => router.push('/symptomChecker')}
              testID="disease-detection-button"
            >
              <View style={styles.featureIconContainer}>
                <Ionicons name="medical" size={28} color="#fff" />
              </View>
              <Text style={styles.featureTitle}>Health Check</Text>
              <Text style={styles.featureSubtitle}>Disease detection</Text>
            </TouchableOpacity>

            {/* Task Management */}
            <TouchableOpacity
              style={[styles.featureCard, styles.accentCard]}
              onPress={() => router.push('/taskManagement')}
              testID="task-management-button"
            >
              <View style={styles.featureIconContainer}>
                <Ionicons name="clipboard" size={28} color="#fff" />
              </View>
              <Text style={styles.featureTitle}>Tasks</Text>
              <Text style={styles.featureSubtitle}>Manage daily tasks</Text>
            </TouchableOpacity>

            {/* Add Task */}
            <TouchableOpacity
              style={[styles.featureCard, styles.warningCard]}
              onPress={() => router.push('/addTask')}
              testID="add-task-button"
            >
              <View style={styles.featureIconContainer}>
                <Ionicons name="add-circle" size={28} color="#fff" />
              </View>
              <Text style={styles.featureTitle}>New Task</Text>
              <Text style={styles.featureSubtitle}>Add new task</Text>
            </TouchableOpacity>

            {/* Vaccine Management */}
            <TouchableOpacity
              style={[styles.featureCard, styles.infoCard]}
              onPress={() => router.push('/vaccineManagement')}
              testID="vaccine-management-button"
            >
              <View style={styles.featureIconContainer}>
                <Ionicons name="shield-checkmark" size={28} color="#fff" />
              </View>
              <Text style={styles.featureTitle}>Vaccines</Text>
              <Text style={styles.featureSubtitle}>Manage vaccines</Text>
            </TouchableOpacity>

            {/* Add Vaccine */}
            <TouchableOpacity
              style={[styles.featureCard, styles.successCard]}
              onPress={() => router.push('/addVaccine')}
              testID="add-vaccine-button"
            >
              <View style={styles.featureIconContainer}>
                <Ionicons name="add-circle" size={28} color="#fff" />
              </View>
              <Text style={styles.featureTitle}>New Vaccine</Text>
              <Text style={styles.featureSubtitle}>Add vaccine record</Text>
            </TouchableOpacity>

            {/* Find Vet */}
            <TouchableOpacity
              style={[styles.featureCard, styles.warningCard]}
              onPress={() => router.push('/vetLocation')}
            >
              <View style={styles.featureIconContainer}>
                <Ionicons name="location" size={28} color="#fff" />
              </View>
              <Text style={styles.featureTitle}>Find Vet</Text>
              <Text style={styles.featureSubtitle}>Nearest veterinarian</Text>
            </TouchableOpacity>

            {/* Market Analysis */}
            <TouchableOpacity
              style={[styles.featureCard, styles.accentCard]}
              onPress={() => router.push('/marketAnalysis')}
            >
              <View style={styles.featureIconContainer}>
                <Ionicons name="trending-up" size={28} color="#fff" />
              </View>
              <Text style={styles.featureTitle}>Market</Text>
              <Text style={styles.featureSubtitle}>Price analysis</Text>
            </TouchableOpacity>

            {/* Food Suggestions */}
            <TouchableOpacity
              style={[styles.featureCard, styles.primaryCard]}
              onPress={() => router.push('/foodSuggestions')}
            >
              <View style={styles.featureIconContainer}>
                <Ionicons name="nutrition" size={28} color="#fff" />
              </View>
              <Text style={styles.featureTitle}>Nutrition</Text>
              <Text style={styles.featureSubtitle}>Feed suggestions</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Animals Section */}
        <View style={styles.animalsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Animals</Text>
            <TouchableOpacity 
              style={styles.addAnimalButton}
              onPress={() => setModalVisible(true)}
              testID="add-animal-button"
            >
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {animals.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="paw" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No animals added yet</Text>
              <Text style={styles.emptyStateSubtext}>Tap the + button to add your first animal</Text>
            </View>
          ) : (
            <View style={styles.animalsGrid}>
              {animals.map(animal => (
                <TouchableOpacity 
                  key={animal._id} 
                  style={styles.animalCard}
                  onPress={() => handleViewAnimal(animal)}
                  testID={`view-animal-${animal._id}`}
                >
                  <View style={styles.animalImageContainer}>
                    {animal.photo_url ? (
                      <Image 
                        source={{ uri: animal.photo_url }} 
                        style={styles.animalImage}
                      />
                    ) : (
                      <View style={styles.animalImagePlaceholder}>
                        <Ionicons name="paw" size={24} color="#aaa" />
                      </View>
                    )}
                  </View>
                  <View style={styles.animalInfo}>
                    <Text style={styles.animalName}>{animal.name}</Text>
                    <Text style={styles.animalType}>{animal.type}</Text>
                    <Text style={styles.animalBreed}>{animal.breed}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Farm Details */}
        <View style={styles.farmDetailsSection}>
          <Text style={styles.sectionTitle}>Farm Details</Text>
          <View style={styles.detailsCard}>
            <View style={styles.detailItem}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="location" size={20} color="#4a89dc" />
              </View>
              <Text style={styles.detailText}>
                {farmer.location || "Location not specified"}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="call" size={20} color="#4a89dc" />
              </View>
              <Text style={styles.detailText}>
                {farmer.phoneNo || "Phone not specified"}
              </Text>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
          testID="logout-button"
        >
          <Ionicons name="log-out" size={20} color="#fff" style={styles.logoutIcon} />
          <Text style={styles.logoutButtonText}>Sign Out</Text>
        </TouchableOpacity>

        {/* Add Animal Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add New Animal</Text>
              
              <TextInput
                style={styles.input}
                placeholder="Name"
                value={formData.name}
                onChangeText={(text) => handleInputChange('name', text)}
                testID="animal-name-input"
              />
              
              <TextInput
                style={styles.input}
                placeholder="Type (e.g., Cow, Chicken)"
                value={formData.type}
                onChangeText={(text) => handleInputChange('type', text)}
                testID="animal-type-input"
              />
              
              <TextInput
                style={styles.input}
                placeholder="Breed"
                value={formData.breed}
                onChangeText={(text) => handleInputChange('breed', text)}
                testID="animal-breed-input"
              />
              
              <TextInput
                style={styles.input}
                placeholder="Age"
                value={formData.age}
                onChangeText={(text) => handleInputChange('age', text)}
                keyboardType="numeric"
                testID="animal-age-input"
              />
              
              <TextInput
                style={styles.input}
                placeholder="Gender"
                value={formData.gender}
                onChangeText={(text) => handleInputChange('gender', text)}
                testID="animal-gender-input"
              />
              
              <TextInput
                style={[styles.input, { height: 80 }]}
                placeholder="Details (optional)"
                value={formData.details}
                onChangeText={(text) => handleInputChange('details', text)}
                multiline
                testID="animal-details-input"
              />

              <TouchableOpacity 
                style={styles.imagePickerButton}
                onPress={pickImage}
                testID="image-picker-button"
              >
                <Text style={styles.imagePickerText}>
                  {image ? "Image Selected" : "Select Image (Optional)"}
                </Text>
              </TouchableOpacity>

              {image && (
                <Image 
                  source={{ uri: `data:image/jpeg;base64,${image}` }}
                  style={styles.previewImage}
                />
              )}
              
              <View style={styles.modalButtons}>
                <Pressable
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setModalVisible(false);
                    setImage(null);
                  }}
                  testID="modal-cancel-button"
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleAddAnimal}
                  testID="modal-save-button"
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* Edit Animal Modal */}
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
                onChangeText={(text) => handleInputChange('name', text)}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Type"
                value={formData.type}
                onChangeText={(text) => handleInputChange('type', text)}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Breed"
                value={formData.breed}
                onChangeText={(text) => handleInputChange('breed', text)}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Age"
                value={formData.age}
                onChangeText={(text) => handleInputChange('age', text)}
                keyboardType="numeric"
              />
              
              <TextInput
                style={styles.input}
                placeholder="Gender"
                value={formData.gender}
                onChangeText={(text) => handleInputChange('gender', text)}
              />
              
              <TextInput
                style={[styles.input, { height: 80 }]}
                placeholder="Details"
                value={formData.details}
                onChangeText={(text) => handleInputChange('details', text)}
                multiline
              />

              <TouchableOpacity 
                style={styles.imagePickerButton}
                onPress={pickImage}
              >
                <Text style={styles.imagePickerText}>
                  {image ? "Change Image" : currentAnimal?.photo_url ? "Keep Current Image" : "Add Image (Optional)"}
                </Text>
              </TouchableOpacity>

              {(image || currentAnimal?.photo_url) && (
                <Image 
                  source={{ uri: image ? `data:image/jpeg;base64,${image}` : currentAnimal?.photo_url }}
                  style={styles.previewImage}
                />
              )}
              
              <View style={styles.modalButtons}>
                <Pressable
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setEditModalVisible(false);
                    setImage(null);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleEditAnimal}
                >
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </Pressable>
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
    paddingBottom: 40,
  },
  container: {
    flex: 1,
    backgroundColor: "#f5f6fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f6fa",
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: "#4a89dc",
  },
  headerSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 25,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  headerContent: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 14,
    color: "#7f8c8d",
    marginBottom: 4,
  },
  farmerName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 2,
  },
  farmerEmail: {
    fontSize: 14,
    color: "#95a5a6",
  },
  profileImageContainer: {
    position: "relative",
  },
  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#e0e0e0",
    borderWidth: 3,
    borderColor: "#fff",
  },
  editIndicator: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#4a89dc",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 10,
  },
  statCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    flex: 1,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#7f8c8d",
  },
  featuresContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 16,
  },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  featureCard: {
    width: (width - 60) / 2,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    minHeight: 110,
  },
  primaryCard: {
    backgroundColor: "#4a89dc",
  },
  secondaryCard: {
    backgroundColor: "#e67e22",
  },
  accentCard: {
    backgroundColor: "#9b59b6",
  },
  warningCard: {
    backgroundColor: "#f39c12",
  },
  infoCard: {
    backgroundColor: "#3498db",
  },
  successCard: {
    backgroundColor: "#27ae60",
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  featureTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
    textAlign: "center",
  },
  featureSubtitle: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
    textAlign: "center",
  },
  animalsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  addAnimalButton: {
    backgroundColor: "#4a89dc",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    backgroundColor: "#fff",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#7f8c8d",
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#95a5a6",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  animalsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  animalCard: {
    width: (width - 60) / 2,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 10,
  },
  animalImageContainer: {
    marginBottom: 12,
  },
  animalImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#e0e0e0",
  },
  animalImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
  },
  animalInfo: {
    alignItems: "center",
  },
  animalName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 2,
  },
  animalType: {
    fontSize: 14,
    color: "#7f8c8d",
    marginBottom: 1,
  },
  animalBreed: {
    fontSize: 12,
    color: "#95a5a6",
  },
  farmDetailsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  detailsCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  detailIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  detailText: {
    fontSize: 16,
    color: "#2c3e50",
  },
  logoutButton: {
    backgroundColor: "#e74c3c",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
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
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#2c3e50',
  },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: "#f8f9fa",
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  modalButton: {
    padding: 16,
    borderRadius: 12,
    flex: 1,
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
    fontSize: 16,
  },
  cancelButtonText: {
    color: '#2c3e50',
    fontWeight: 'bold',
    fontSize: 16,
  },
  linkText: {
    color: "#4a89dc",
    marginTop: 10,
    textAlign: "center",
  },
  imagePickerButton: {
    borderWidth: 1,
    borderColor: '#4a89dc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  imagePickerText: {
    color: '#4a89dc',
    fontWeight: 'bold',
    fontSize: 16,
  },
  previewImage: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    marginBottom: 16,
  },
});