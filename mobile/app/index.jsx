import { Text, View, TouchableOpacity, StyleSheet, Image } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';

export default function WelcomeScreen() {
  const router = useRouter();

  const handleFarmerAuth = () => {
    router.push('/farmerAuth');
  };

  const handleVetAuth = () => {
    router.push('/vetAuth');
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image 
          source={require('../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.tagline}>Having trouble with livestock management?</Text>
      <Text style={styles.subTagline}>Ride with us</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.optionButton}
          onPress={handleFarmerAuth}
          testID="farmer-option-button"
        >
          <Ionicons name="leaf" size={24} color="#fff" />
          <Text style={styles.buttonText}>I'm a Farmer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionButton}
          onPress={handleVetAuth}
          testID="vet-option-button"
        >
          <Ionicons name="medical" size={24} color="#fff" />
          <Text style={styles.buttonText}>I'm a Veterinarian</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 20,
    width: '100%',
    paddingHorizontal: 10, // Small margin on both sides
  },
  logo: {
    width: '100%',
    height: 220, // Increased height to make image more prominent
  },
  tagline: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 5,
    marginTop: 10,
  },
  subTagline: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 15,
    marginTop: 20,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0d3b16',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    gap: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});