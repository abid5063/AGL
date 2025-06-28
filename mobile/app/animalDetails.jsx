import React, { useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Modal, TextInput, Alert, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from "axios";

export default function AnimalDetails() {
  const params = useLocalSearchParams();
  const animal = params.animal ? JSON.parse(params.animal) : null;

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
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
      const token = await AsyncStorage.getItem('authToken');      const response = await axios.put(
        `http://localhost:3000/api/animals/${animal._id}`,
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
    const token = await AsyncStorage.getItem('authToken');    await axios.delete(
      `http://localhost:3000/api/animals/${animal._id}`,
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
          <Text style={styles.backText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
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
          <TouchableOpacity style={styles.deleteButton} onPress={actuallyDeleteAnimal}>
            <Text style={styles.deleteButtonText}>Delete</Text>
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
                <ActivityIndicator size="large" color="#4a89dc" style={{ marginVertical: 20 }} />
              ) : (
                <View style={styles.modalButtons}>
                  <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setEditModalVisible(false)}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleEditAnimal}>
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              )}
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
});