import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from "axios";

export default function EditProfile() {
  const params = useLocalSearchParams();
  const farmer = params.farmer ? JSON.parse(params.farmer) : null;

  const [formData, setFormData] = useState({
    name: farmer?.name || "",
    email: farmer?.email || "",
    phoneNo: farmer?.phoneNo || "",
    location: farmer?.location || "",
    profileImage: farmer?.profileImage || "",
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (key, value) => {
    setFormData({ ...formData, [key]: value });
  };

  const handleEditProfile = async () => {
    if (
      !formData.name.trim() ||
      !formData.email.trim()
    ) {
      Alert.alert("Validation", "Please fill all required fields.");
      return;
    }
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');      console.log(token)
      const response = await axios.put(
        `http://localhost:3000/api/auth/edit/${farmer._id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      Alert.alert("Success", "Profile updated successfully");
      router.replace({
        pathname: '/profile',
        params: { farmer: JSON.stringify({ ...farmer, ...formData }) }
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
              setLoading(true);              const token = await AsyncStorage.getItem('authToken');              console.log(token);
              await axios.delete(
                `http://localhost:3000/api/auth/delete/${farmer._id}`,
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

  if (!farmer) {
    return (
      <View style={styles.container}>
        <Text>No farmer data found.</Text>
        <TouchableOpacity onPress={() => router.replace('/')}>
          <Text style={styles.linkText}>Go to login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Profile</Text>
      <TextInput
        style={styles.input}
        placeholder="Name"
        value={formData.name}
        onChangeText={text => handleInputChange('name', text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={formData.email}
        onChangeText={text => handleInputChange('email', text)}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Phone Number"
        value={formData.phoneNo}
        onChangeText={text => handleInputChange('phoneNo', text)}
        keyboardType="phone-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="Location"
        value={formData.location}
        onChangeText={text => handleInputChange('location', text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Profile Image URL"
        value={formData.profileImage}
        onChangeText={text => handleInputChange('profileImage', text)}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#4a89dc" style={{ marginVertical: 20 }} />
      ) : (
        <>
          <TouchableOpacity style={styles.saveButton} onPress={handleEditProfile}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteProfile}>
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