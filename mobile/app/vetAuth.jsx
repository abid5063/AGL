import { useState, useEffect, useCallback } from "react";
import { Text, View, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useFocusEffect } from "expo-router";

export default function VetAuthScreen() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    specialty: "",
    licenseNumber: "",
    phoneNo: "",
    location: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const API_BASE_URL = "http://localhost:3000/api/vets";

  // Reset form when screen is focused (e.g., after logout)
  useFocusEffect(
    useCallback(() => {
      setIsLogin(true);
      setFormData({
        name: "",
        email: "",
        password: "",
        specialty: "",
        licenseNumber: "",
        phoneNo: "",
        location: "",
      });
      setIsLoading(false);
    }, [])
  );

  const handleChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const storeAuthData = async (token, vet) => {
    try {
      await AsyncStorage.multiSet([
        ['authToken', token],
        ['userData', JSON.stringify(vet)],
        ['userType', 'vet']
      ]);
    } catch (error) {
      console.error("Error storing auth data:", error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      const { name, email, password, specialty, licenseNumber, phoneNo, location } = formData;

      // Validation
      if (!email || !password) {
        Alert.alert("Error", "Email and password are required");
        return;
      }

      if (!isLogin) {
        if (!name) {
          Alert.alert("Error", "Name is required");
          return;
        }
        if (!specialty) {
          Alert.alert("Error", "Specialty is required");
          return;
        }
        if (!licenseNumber) {
          Alert.alert("Error", "License number is required");
          return;
        }
        if (!phoneNo) {
          Alert.alert("Error", "Phone number is required");
          return;
        }
        if (!location) {
          Alert.alert("Error", "Location is required");
          return;
        }
        if (password.length < 6) {
          Alert.alert("Error", "Password should be at least 6 characters");
          return;
        }
        if (name.length < 3) {
          Alert.alert("Error", "Name should be at least 3 characters");
          return;
        }
      }

      const endpoint = isLogin ? "/login" : "/register";
      const response = await axios.post(`${API_BASE_URL}${endpoint}`, formData);

      const { token, vet } = response.data;
      await storeAuthData(token, vet);
      
      // Navigate to vet profile
      router.push({
        pathname: "/vetProfile",
        params: { vet: JSON.stringify(vet) }
      });

    } catch (error) {
      console.error("Auth error:", error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || 
                         error.message || 
                         "Something went wrong";
      Alert.alert("Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Veterinarian {isLogin ? "Login" : "Registration"}</Text>
      
      {!isLogin && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={formData.name}
            onChangeText={(text) => handleChange("name", text)}
            autoCapitalize="words"
            testID="vet-name-input"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Specialty (e.g., Large Animal, Small Animal)"
            value={formData.specialty}
            onChangeText={(text) => handleChange("specialty", text)}
            testID="vet-specialty-input"
          />
          
          <TextInput
            style={styles.input}
            placeholder="License Number"
            value={formData.licenseNumber}
            onChangeText={(text) => handleChange("licenseNumber", text)}
            testID="vet-license-input"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            value={formData.phoneNo}
            onChangeText={(text) => handleChange("phoneNo", text)}
            keyboardType="phone-pad"
            testID="vet-phone-input"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Location/Clinic Address"
            value={formData.location}
            onChangeText={(text) => handleChange("location", text)}
            testID="vet-location-input"
          />
        </>
      )}
      
      <TextInput
        style={styles.input}
        placeholder="Email Address"
        keyboardType="email-address"
        autoCapitalize="none"
        value={formData.email}
        onChangeText={(text) => handleChange("email", text)}
        testID="vet-email-input"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={formData.password}
        onChangeText={(text) => handleChange("password", text)}
        testID="vet-password-input"
      />
      
      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={isLoading}
        testID="vet-submit-button"
      >
        <Text style={styles.buttonText}>
          {isLoading ? "Please wait..." : isLogin ? "Sign In" : "Sign Up"}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.switchButton}
        onPress={() => setIsLogin(!isLogin)}
        testID="vet-toggle-mode-button"
      >
        <Text style={styles.switchText}>
          {isLogin
            ? "Need an account? Sign up"
            : "Already have an account? Sign in"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
        testID="back-to-welcome-button"
      >
        <Text style={styles.backText}>Back to Welcome</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
    color: "#333",
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  button: {
    height: 50,
    borderRadius: 8,
    backgroundColor: "#27ae60",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: "#cccccc",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  switchButton: {
    marginTop: 20,
    padding: 10,
  },
  switchText: {
    color: "#27ae60",
    textAlign: "center",
    fontSize: 16,
  },
  backButton: {
    marginTop: 15,
    padding: 10,
  },
  backText: {
    color: "#666",
    textAlign: "center",
    fontSize: 14,
  },
});
