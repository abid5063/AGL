import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from "axios";

export default function VetEditProfile() {
  const params = useLocalSearchParams();
  const vet = params.vet ? JSON.parse(params.vet) : null;

  const [formData, setFormData] = useState({
    name: vet?.name || "",
    email: vet?.email || "",
    phoneNo: vet?.phoneNo || "",
    location: vet?.location || "",
    specialty: vet?.specialty || "",
    experience: vet?.experience || "",
    profileImage: vet?.profileImage || "",
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (key, value) => {
    setFormData({ ...formData, [key]: value });
  };

  const handleEditProfile = async () => {
    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.specialty.trim()
    ) {
      Alert.alert("Validation", "Please fill all required fields (Name, Email, Specialty).");
      return;
    }
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      console.log(token);
      await axios.put(
        `http://localhost:3000/api/vets/edit/${vet._id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Update the stored user data
      const updatedVetData = { ...vet, ...formData };
      await AsyncStorage.setItem('userData', JSON.stringify(updatedVetData));
      
      Alert.alert("Success", "Profile updated successfully");
      router.replace({
        pathname: '/vetProfile',
        params: { vet: JSON.stringify(updatedVetData) }
      });
    } catch (error) {
      Alert.alert("Error", error.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProfile = async () => {
    Alert.alert(
      "Delete Profile",
      "Are you sure you want to delete your profile? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              const token = await AsyncStorage.getItem('authToken');
              console.log(token);
              await axios.delete(
                `http://localhost:3000/api/vets/delete/${vet._id}`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`
                  }
                }
              );
              await AsyncStorage.multiRemove(['authToken', 'userData']);
              Alert.alert("Deleted", "Your profile has been deleted.");
              router.replace('/');
            } catch (error) {
              Alert.alert("Error", error.response?.data?.message || "Failed to delete profile");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  if (!vet) {
    return (
      <View style={styles.container}>
        <Text>No vet data found.</Text>
        <TouchableOpacity onPress={() => router.replace('/')} testID="go-to-login">
          <Text style={styles.linkText}>Go to login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Vet Profile</Text>
      <TextInput
        style={styles.input}
        placeholder="Name *"
        value={formData.name}
        onChangeText={text => handleInputChange('name', text)}
        testID="vet-name-input"
      />
      <TextInput
        style={styles.input}
        placeholder="Email *"
        value={formData.email}
        onChangeText={text => handleInputChange('email', text)}
        keyboardType="email-address"
        autoCapitalize="none"
        testID="vet-email-input"
      />
      <TextInput
        style={styles.input}
        placeholder="Phone Number"
        value={formData.phoneNo}
        onChangeText={text => handleInputChange('phoneNo', text)}
        keyboardType="phone-pad"
        testID="vet-phone-input"
      />
      <TextInput
        style={styles.input}
        placeholder="Location"
        value={formData.location}
        onChangeText={text => handleInputChange('location', text)}
        testID="vet-location-input"
      />
      <TextInput
        style={styles.input}
        placeholder="Specialty *"
        value={formData.specialty}
        onChangeText={text => handleInputChange('specialty', text)}
        testID="vet-specialty-input"
      />
      <TextInput
        style={styles.input}
        placeholder="Years of Experience"
        value={formData.experience}
        onChangeText={text => handleInputChange('experience', text)}
        keyboardType="numeric"
        testID="vet-experience-input"
      />
      <TextInput
        style={styles.input}
        placeholder="Profile Image URL"
        value={formData.profileImage}
        onChangeText={text => handleInputChange('profileImage', text)}
        testID="vet-image-input"
      />

      {loading ? (
        <ActivityIndicator size="large" color="#4a89dc" style={{ marginVertical: 20 }} testID="vet-loading-indicator" />
      ) : (
        <>
          <TouchableOpacity style={styles.saveButton} onPress={handleEditProfile} testID="vet-save-button">
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteProfile} testID="vet-delete-button">
            <Text style={styles.deleteButtonText}>Delete Profile</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#f7f9fa",
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
    fontSize: 16,
    backgroundColor: "#fafbfc",
  },
  saveButton: {
    backgroundColor: "#4a89dc",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 14,
  },
  saveButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  deleteButton: {
    backgroundColor: "#e74c3c",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  linkText: {
    color: "#4a89dc",
    marginTop: 20,
    textAlign: "center",
  },
});
