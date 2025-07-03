import { useState } from "react";
import { Text, View, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";

export default function AuthScreen() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  //  const API_BASE_URL = "http://localhost:3000/api/auth";
 const API_BASE_URL = "http://localhost:3000/api/auth";

  const handleChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const storeAuthData = async (token, farmer) => {
    try {
      await AsyncStorage.multiSet([
        ['authToken', token],
        ['userData', JSON.stringify(farmer)]
      ]);
    } catch (error) {
      console.error("Error storing auth data:", error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      const { name, email, password } = formData;

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

      const { token, farmer } = response.data;
      await storeAuthData(token, farmer);
      
      // Navigate to profile page with farmer data
      router.push({
        pathname: "/profile",
        params: { farmer: JSON.stringify(farmer) }
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
      <Text style={styles.title}>{isLogin ? "Login" : "Create Account"}</Text>
      
      {!isLogin && (
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={formData.name}
          onChangeText={(text) => handleChange("name", text)}
          autoCapitalize="words"
          testID="name-input"
        />
      )}
      
      <TextInput
        style={styles.input}
        placeholder="Email Address"
        keyboardType="email-address"
        autoCapitalize="none"
        value={formData.email}
        onChangeText={(text) => handleChange("email", text)}
        testID="email-input"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={formData.password}
        onChangeText={(text) => handleChange("password", text)}
        testID="password-input"
      />
      
      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={isLoading}
        testID="submit-button"
      >
        <Text style={styles.buttonText}>
          {isLoading ? "Please wait..." : isLogin ? "Sign In" : "Sign Up"}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.switchButton}
        onPress={() => setIsLogin(!isLogin)}
        testID="toggle-auth-mode-button"
      >
        <Text style={styles.switchText}>
          {isLogin
            ? "Need an account? Sign up"
            : "Already have an account? Sign in"}
        </Text>
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
    fontSize: 28,
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
    backgroundColor: "#4a89dc",
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
    color: "#4a89dc",
    textAlign: "center",
    fontSize: 16,
  },
});