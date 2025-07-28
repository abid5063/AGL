import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_KEY = "AIzaSyCrYK2JHpleJxGT3TtneVT6hZHZY8KC1Vc";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

// Component for displaying veterinary locations in a table format
const VeterinaryTable = ({ data }) => {
  if (!data || !Array.isArray(data)) return null;

  return (
    <View style={styles.tableContainer}>
      <Text style={styles.tableTitle}>নিকটস্থ পশু চিকিৎসা কেন্দ্রসমূহ</Text>
      <Text style={styles.tableSubtitle}>দূরত্ব অনুযায়ী সাজানো (নিকটবর্তী প্রথমে)</Text>
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderCell, { flex: 2 }]}>নাম</Text>
        <Text style={[styles.tableHeaderCell, { flex: 1 }]}>দূরত্ব</Text>
        <Text style={[styles.tableHeaderCell, { flex: 1 }]}>রেটিং</Text>
      </View>
      {data.map((clinic, index) => {
        const distance = parseFloat(clinic.distance.replace(/[^\d.]/g, ''));
        const isNearest = index === 0;
        const isNearby = distance <= 5;
        
        return (
          <View key={index} style={[
            styles.tableRow,
            isNearest && styles.nearestRow,
            isNearby && styles.nearbyRow
          ]}>
            <View style={[styles.tableCell, { flex: 2 }]}>
              <View style={styles.clinicInfo}>
                <Text style={styles.clinicName}>{clinic.name}</Text>
                {isNearest && (
                  <View style={styles.nearestBadge}>
                    <Text style={styles.nearestBadgeText}>নিকটতম</Text>
                  </View>
                )}
              </View>
              <Text style={styles.clinicAddress}>{clinic.address}</Text>
              <Text style={styles.clinicPhone}>{clinic.phone}</Text>
            </View>
            <View style={[styles.tableCell, { flex: 1, alignItems: 'center' }]}>
              <Text style={[
                styles.distanceText,
                isNearest && styles.nearestDistance,
                isNearby && styles.nearbyDistance
              ]}>
                {clinic.distance}
              </Text>
              {isNearby && (
                <Text style={styles.nearbyText}>কাছাকাছি</Text>
              )}
            </View>
            <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>
              {clinic.rating} ⭐
            </Text>
          </View>
        );
      })}
    </View>
  );
};

// Component for location input form
const LocationForm = ({ locationData, setLocationData, onSearch, loading }) => {
  return (
    <View style={styles.formContainer}>
      <Text style={styles.formTitle}>Enter Your Location Details</Text>
      <Text style={styles.formSubtitle}>Please provide your specific location to find nearby veterinary clinics</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Village/Area Name"
        value={locationData.village}
        onChangeText={(text) => setLocationData(prev => ({ ...prev, village: text }))}
        editable={!loading}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Thana/Upazila"
        value={locationData.thana}
        onChangeText={(text) => setLocationData(prev => ({ ...prev, thana: text }))}
        editable={!loading}
      />
      
      <TextInput
        style={styles.input}
        placeholder="District"
        value={locationData.district}
        onChangeText={(text) => setLocationData(prev => ({ ...prev, district: text }))}
        editable={!loading}
      />
      
      <TouchableOpacity
        style={[styles.searchButton, loading && styles.searchButtonDisabled]}
        onPress={onSearch}
        disabled={loading || !locationData.village || !locationData.thana || !locationData.district}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Ionicons name="search" size={20} color="#fff" />
        )}
        <Text style={styles.searchButtonText}>
          {loading ? 'Searching...' : 'Search Veterinary Clinics'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default function VetLocation() {
  const [veterinaryData, setVeterinaryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [locationData, setLocationData] = useState({
    village: '',
    thana: '',
    district: ''
  });
  const router = useRouter();

  // Load user's default location if available
  useEffect(() => {
    const loadDefaultLocation = async () => {
      try {
        const storedData = await AsyncStorage.getItem('userData');
        if (storedData) {
          const userData = JSON.parse(storedData);
          if (userData.location) {
            // Try to parse location if it contains multiple parts
            const locationParts = userData.location.split(',').map(part => part.trim());
            if (locationParts.length >= 3) {
              setLocationData({
                village: locationParts[0] || '',
                thana: locationParts[1] || '',
                district: locationParts[2] || ''
              });
            } else if (locationParts.length === 1) {
              // If only one part, assume it's district
              setLocationData({
                village: '',
                thana: '',
                district: locationParts[0] || ''
              });
            }
          }
        }
      } catch (error) {
        console.error('Error loading default location:', error);
      }
    };

    loadDefaultLocation();
  }, []);

  // Function to sort veterinary clinics by distance
  const sortByDistance = (clinics) => {
    return clinics.sort((a, b) => {
      // Extract numeric distance values
      const distanceA = parseFloat(a.distance.replace(/[^\d.]/g, ''));
      const distanceB = parseFloat(b.distance.replace(/[^\d.]/g, ''));
      
      // Handle cases where distance might be in different units or formats
      if (isNaN(distanceA) && isNaN(distanceB)) return 0;
      if (isNaN(distanceA)) return 1;
      if (isNaN(distanceB)) return -1;
      
      return distanceA - distanceB;
    });
  };

  const fetchVeterinaryLocations = async () => {
    if (!locationData.village || !locationData.thana || !locationData.district) {
      Alert.alert("Missing Information", "Please fill in all location fields.");
      return;
    }

    setLoading(true);
    setHasSearched(true);
    
    try {
      const fullLocation = `${locationData.village}, ${locationData.thana}, ${locationData.district}`;
      
      const prompt = `
You are a veterinary assistant AI. Generate a list of nearby veterinary clinics and hospitals.

The user is located at: ${fullLocation}

IMPORTANT: Respond ONLY in Bangla (Bengali) language. All table headers and values must be in Bangla.

IMPORTANT: Respond ONLY with a valid JSON object in the following format:
{
  "type": "veterinary_locations",
  "message": "Here are the nearest veterinary clinics near ${fullLocation}:",
  "data": [
    {
      "name": "Clinic Name",
      "address": "Full address in or near ${locationData.district} district",
      "phone": "Phone number",
      "distance": "Distance from ${locationData.village} (e.g., '2.5 km')",
      "rating": "Rating out of 5 (e.g., '4.2')"
    }
  ]
}

Generate 5-7 realistic veterinary clinics that would be accessible from ${fullLocation}. Include a mix of:
- Large animal veterinary clinics (for livestock, cattle, horses)
- Small animal veterinary clinics
- Emergency veterinary hospitals
- Specialized livestock veterinary services
- Government veterinary hospitals
- Private veterinary clinics

IMPORTANT: Sort the clinics by distance from nearest to farthest. Start with clinics within 1-5 km, then 5-15 km, then 15-30 km.
Make sure the addresses are realistic for ${locationData.district} district and surrounding areas.
The distances should be realistic for the rural/urban setting of ${locationData.thana}.
Make sure the JSON is properly formatted and valid. Include realistic addresses and phone numbers.
`;

      const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        }),
      });
      
      const data = await response.json();
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not get a response.';
      
      try {
        // Handle the case where response is wrapped in markdown code blocks
        let jsonString = aiText.trim();
        
        // Remove markdown code blocks if present
        if (jsonString.startsWith('```json')) {
          jsonString = jsonString.replace(/^```json\n/, '').replace(/\n```$/, '');
        } else if (jsonString.startsWith('```')) {
          jsonString = jsonString.replace(/^```\n/, '').replace(/\n```$/, '');
        }
        
        const jsonResponse = JSON.parse(jsonString);
        if (jsonResponse.type === 'veterinary_locations') {
          // Sort the data by distance
          const sortedData = sortByDistance(jsonResponse.data);
          setVeterinaryData({
            ...jsonResponse,
            data: sortedData
          });
        } else {
          throw new Error('Invalid response format');
        }
      } catch (parseError) {
        console.error('Parse error:', parseError);
        console.error('Response text:', aiText);
        throw new Error('Failed to parse response');
      }
    } catch (err) {
      Alert.alert("Error", "Failed to fetch veterinary locations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleNewSearch = () => {
    setVeterinaryData(null);
    setHasSearched(false);
  };

  const handleBackPress = () => {
    // Try to go back, if that fails, navigate to profile
    try {
      router.back();
    } catch (error) {
      // If back navigation fails, go to profile
      router.push('/profile');
    }
  };

  const handleCallClinic = (phone) => {
    Alert.alert(
      "Call Clinic",
      `Would you like to call ${phone}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Call", onPress: () => {
          // In a real app, you would use Linking to make the call
          Alert.alert("Call", `Calling ${phone}...`);
        }}
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={28} color="#4a89dc" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Veterinary Locations</Text>
        {hasSearched && (
          <TouchableOpacity onPress={handleNewSearch}>
            <Ionicons name="refresh" size={24} color="#4a89dc" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {!hasSearched ? (
          <LocationForm
            locationData={locationData}
            setLocationData={setLocationData}
            onSearch={fetchVeterinaryLocations}
            loading={loading}
          />
        ) : (
          <View>
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4a89dc" />
                <Text style={styles.loadingText}>Finding veterinary clinics...</Text>
                <Text style={styles.locationText}>
                  Searching near: {locationData.village}, {locationData.thana}, {locationData.district}
                </Text>
              </View>
            )}

            {veterinaryData && !loading && (
              <View>
                <View style={styles.locationContainer}>
                  <Ionicons name="location" size={20} color="#4a89dc" />
                  <Text style={styles.locationText}>
                    Results for: {locationData.village}, {locationData.thana}, {locationData.district}
                  </Text>
                </View>

                <Text style={styles.welcomeText}>{veterinaryData.message}</Text>
                <VeterinaryTable data={veterinaryData.data} />
                
                <View style={styles.infoContainer}>
                  <Text style={styles.infoTitle}>Quick Actions</Text>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => router.push('/aiChatbot')}
                  >
                    <Ionicons name="chatbubble" size={20} color="#4a89dc" />
                    <Text style={styles.actionButtonText}>Ask AI Assistant</Text>
                  </TouchableOpacity>
                  
                 
                </View>
              </View>
            )}

            {!veterinaryData && !loading && (
              <View style={styles.errorContainer}>
                <Ionicons name="location-outline" size={64} color="#ccc" />
                <Text style={styles.errorText}>Unable to load veterinary locations</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchVeterinaryLocations}>
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fa',
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
    color: '#4a89dc',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  // Form styles
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#fafbfc',
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4a89dc',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 8,
  },
  searchButtonDisabled: {
    backgroundColor: '#ccc',
  },
  searchButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#4a89dc',
  },
  locationText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  welcomeText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 24,
  },
  // Table styles for veterinary locations
  tableContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tableTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4a89dc',
    marginBottom: 4,
    textAlign: 'center',
  },
  tableSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
    textAlign: 'center',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  tableHeaderCell: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#495057',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  nearestRow: {
    backgroundColor: '#e8f5e8',
    borderLeftWidth: 4,
    borderLeftColor: '#27ae60',
  },
  nearbyRow: {
    backgroundColor: '#f8f9fa',
  },
  tableCell: {
    fontSize: 13,
    color: '#333',
  },
  clinicInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clinicName: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#2c3e50',
    flex: 1,
  },
  nearestBadge: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  nearestBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  clinicAddress: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  clinicPhone: {
    fontSize: 12,
    color: '#4a89dc',
    marginTop: 2,
  },
  distanceText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
  },
  nearestDistance: {
    color: '#27ae60',
    fontWeight: 'bold',
  },
  nearbyDistance: {
    color: '#4a89dc',
    fontWeight: '500',
  },
  nearbyText: {
    fontSize: 10,
    color: '#4a89dc',
    marginTop: 2,
  },
  infoContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  actionButtonText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#4a89dc',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});