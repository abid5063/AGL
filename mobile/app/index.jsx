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
      <View style={styles.headerSection}>
        <Image 
          source={require('../assets/images/icon.png')}
          style={styles.logo}
        />
        <Text style={styles.title}>Welcome to AgroLink</Text>
        <Text style={styles.subtitle}>Connecting Farmers and Veterinarians</Text>
        <Text style={styles.description}>
          Your comprehensive platform for livestock management, health monitoring, and professional veterinary care.
        </Text>
      </View>

      <View style={styles.optionsSection}>
        <Text style={styles.questionText}>How would you like to continue?</Text>
        
        <TouchableOpacity
          style={[styles.optionCard, styles.farmerCard]}
          onPress={handleFarmerAuth}
          testID="farmer-option-button"
        >
          <View style={styles.optionIconContainer}>
            <Ionicons name="leaf" size={32} color="#fff" />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>I'm a Farmer</Text>
            <Text style={styles.optionSubtitle}>
              Manage your livestock, track health, schedule tasks, and connect with veterinarians
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionCard, styles.vetCard]}
          onPress={handleVetAuth}
          testID="vet-option-button"
        >
          <View style={styles.optionIconContainer}>
            <Ionicons name="medical" size={32} color="#fff" />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>I'm a Veterinarian</Text>
            <Text style={styles.optionSubtitle}>
              Connect with farmers, manage appointments, and provide professional care
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.footerSection}>
        <Text style={styles.footerText}>
          Join thousands of farmers and veterinarians already using AgroLink
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f6fa",
    padding: 20,
  },
  headerSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    color: "#7f8c8d",
    marginBottom: 20,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: "#95a5a6",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  optionsSection: {
    flex: 1,
    justifyContent: "center",
    gap: 20,
  },
  questionText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2c3e50",
    textAlign: "center",
    marginBottom: 30,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  farmerCard: {
    backgroundColor: "#4a89dc",
  },
  vetCard: {
    backgroundColor: "#27ae60",
  },
  optionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: 20,
  },
  footerSection: {
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 14,
    color: "#95a5a6",
    textAlign: "center",
    fontStyle: "italic",
  },
});