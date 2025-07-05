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
  Pressable
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useState } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AntDesign, Feather, MaterialIcons } from '@expo/vector-icons';
import axios from "axios";
import * as ImagePicker from 'expo-image-picker';

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
        {/* Profile Header */}
        {/* <View style={styles.header}>
          <Image 
            source={farmer.profileImage ? { uri: farmer.profileImage } : null}
            style={styles.profileImage}
          />
          <Text style={styles.name}>{farmer.name}</Text>
          <Text style={styles.email}>{farmer.email}</Text>
        </View> */}


{/* // Edit Profile Button */}
        <View style={styles.header}>
  <Image 
    source={farmer.profileImage ? { uri: farmer.profileImage } : null}
    style={styles.profileImage}
  />
  <Text style={styles.name}>{farmer.name}</Text>
  <Text style={styles.email}>{farmer.email}</Text>
</View>

<TouchableOpacity
  style={styles.editProfileButton}
  onPress={() => router.push({
    pathname: '/editProfile',
    params: { farmer: JSON.stringify(farmer) }
  })}
  testID="edit-profile-button"
>
  <Text style={styles.editProfileButtonText}>Edit Profile</Text>
</TouchableOpacity>

<TouchableOpacity
  style={[styles.editProfileButton, { backgroundColor: '#27ae60', marginBottom: 10 }]}
  onPress={() => router.push('/aiChatbot')}
  testID="ai-chatbot-button"
>
  <Text style={styles.editProfileButtonText}>AI Chatbot</Text>
</TouchableOpacity>

<TouchableOpacity
  style={[styles.editProfileButton, { backgroundColor: '#e67e22', marginBottom: 25 }]}
  onPress={() => router.push('/symptomChecker')}
  testID="disease-detection-button"
>
  <Text style={styles.editProfileButtonText}>Disease Detection</Text>
</TouchableOpacity>
<TouchableOpacity
  style={[styles.editProfileButton, { backgroundColor: '#8e44ad', marginBottom: 25 }]}
  onPress={() => router.push('/vetLocation')}
>
  <Text style={styles.editProfileButtonText}>Find Nearest Vet</Text>
</TouchableOpacity>
        {/* Farm Details */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailItem}>
            <AntDesign name="enviromento" size={20} color="#4a89dc" />
            <Text style={styles.detailText}>
              {farmer.location || "Location not specified"}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <AntDesign name="phone" size={20} color="#4a89dc" />
            <Text style={styles.detailText}>
              {farmer.phoneNo || "Phone not specified"}
            </Text>
          </View>
        </View>

        {/* Animals Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Animals</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
            testID="add-animal-button"
          >
            <Feather name="plus" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {animals.length === 0 ? (
          <Text style={styles.noAnimalsText}>No animals added yet</Text>
        ) : (
          animals.map(animal => (
            <View key={animal._id} style={styles.animalCard}>
              {animal.photo_url ? (
                <Image 
                  source={{ uri: animal.photo_url }} 
                  style={styles.animalImage}
                />
              ) : (
                <View style={[styles.animalImage, { backgroundColor: "#e0e0e0", justifyContent: "center", alignItems: "center" }]}>
                  <Feather name="image" size={28} color="#aaa" />
                </View>
              )}
              <View style={styles.animalInfo}>
                <Text style={styles.animalName}>{animal.name}</Text>
              </View>
              <View style={styles.animalActions}>
                <TouchableOpacity 
                  onPress={() => handleViewAnimal(animal)}
                  testID={`view-animal-${animal._id}`}
                >
                  <Text style={styles.viewButtonText}>View</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
          testID="logout-button"
        >
          <Text style={styles.logoutButtonText}>Log Out</Text>
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
    padding: 20,
    backgroundColor: "#f7f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f7f9fa",
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: "#4a89dc",
  },
  header: {
    alignItems: "center",
    marginBottom: 25,
    marginTop: 10,
  },
editProfileButton: {
  backgroundColor: '#4a89dc',
  paddingVertical: 10,
  paddingHorizontal: 20,
  borderRadius: 8,
  alignItems: 'center',
  alignSelf: 'center',
  marginBottom: 18,
},
editProfileButtonText: {
  color: 'white',
  fontWeight: 'bold',
  fontSize: 16,
},
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 10,
    backgroundColor: "#e0e0e0",
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  email: {
    fontSize: 15,
    color: "#666",
    marginTop: 2,
  },
  detailsContainer: {
    marginBottom: 20,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 15,
    color: "#555",
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#4a89dc',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noAnimalsText: {
    textAlign: 'center',
    marginVertical: 20,
    color: '#666',
  },
  animalCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },
  animalImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
    backgroundColor: "#e0e0e0",
  },
  animalInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  animalName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  animalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  viewButtonText: {
    color: "#4a89dc",
    fontWeight: "bold",
    fontSize: 15,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#4a89dc",
    borderRadius: 6,
    overflow: "hidden",
  },
  logoutButton: {
    marginTop: 30,
    backgroundColor: "#e74c3c",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  logoutButtonText: {
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
  linkText: {
    color: "#4a89dc",
    marginTop: 10,
    textAlign: "center",
  },
  imagePickerButton: {
    borderWidth: 1,
    borderColor: '#4a89dc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  imagePickerText: {
    color: '#4a89dc',
    fontWeight: 'bold',
  },
  previewImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 12,
  },
});