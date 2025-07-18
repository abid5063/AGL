import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import DateTimePicker from '@react-native-community/datetimepicker';

const API_BASE_URL = "http://localhost:3000/api";

export default function EditVaccine() {
  const router = useRouter();
  const { vaccineId } = useLocalSearchParams();
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showNextDuePicker, setShowNextDuePicker] = useState(false);

  const [formData, setFormData] = useState({
    vaccine_name: '',
    animal_id: '',
    vaccine_date: new Date(),
    next_due_date: null,
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, [vaccineId]);

  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      // Fetch both animals and vaccine details
      const [animalsResponse, vaccineResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/animals`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE_URL}/vaccines/${vaccineId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setAnimals(animalsResponse.data);
      
      const vaccine = vaccineResponse.data;
      setFormData({
        vaccine_name: vaccine.vaccine_name,
        animal_id: vaccine.animal._id,
        vaccine_date: new Date(vaccine.vaccine_date),
        next_due_date: vaccine.next_due_date ? new Date(vaccine.next_due_date) : null,
        notes: vaccine.notes || ''
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load vaccine details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || formData.vaccine_date;
    setShowDatePicker(Platform.OS === 'ios');
    handleInputChange('vaccine_date', currentDate);
  };

  const handleNextDueDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || formData.next_due_date;
    setShowNextDuePicker(Platform.OS === 'ios');
    handleInputChange('next_due_date', currentDate);
  };

  const handleSubmit = async () => {
    if (!formData.vaccine_name.trim()) {
      Alert.alert('Validation Error', 'Please enter vaccine name');
      return;
    }

    if (!formData.animal_id) {
      Alert.alert('Validation Error', 'Please select an animal');
      return;
    }

    if (!formData.vaccine_date) {
      Alert.alert('Validation Error', 'Please select vaccine date');
      return;
    }

    try {
      setSaving(true);
      const token = await AsyncStorage.getItem('authToken');
      
      const requestData = {
        vaccine_name: formData.vaccine_name.trim(),
        animal_id: formData.animal_id,
        vaccine_date: formData.vaccine_date.toISOString(),
        notes: formData.notes.trim()
      };

      if (formData.next_due_date) {
        requestData.next_due_date = formData.next_due_date.toISOString();
      }

      await axios.put(`${API_BASE_URL}/vaccines/${vaccineId}`, requestData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Navigate directly to vaccine management without alert
      router.replace('/vaccineManagement');
    } catch (error) {
      console.error('Error updating vaccine:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update vaccine record');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Select Date';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a89dc" />
        <Text style={styles.loadingText}>Loading vaccine details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.push('/vaccineManagement')}>
          <Ionicons name="arrow-back" size={28} color="#4a89dc" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Vaccine</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Vaccine Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Vaccine Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter vaccine name"
            value={formData.vaccine_name}
            onChangeText={(value) => handleInputChange('vaccine_name', value)}
          />
        </View>

        {/* Animal Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Select Animal *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.animalSelector}>
            {animals.map((animal) => (
              <TouchableOpacity
                key={animal._id}
                style={[
                  styles.animalCard,
                  formData.animal_id === animal._id && styles.selectedAnimalCard
                ]}
                onPress={() => handleInputChange('animal_id', animal._id)}
              >
                <Text style={[
                  styles.animalName,
                  formData.animal_id === animal._id && styles.selectedAnimalName
                ]}>
                  {animal.name}
                </Text>
                <Text style={[
                  styles.animalType,
                  formData.animal_id === animal._id && styles.selectedAnimalType
                ]}>
                  {animal.type}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Vaccine Date */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Vaccine Date *</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar" size={20} color="#4a89dc" />
            <Text style={styles.dateText}>{formatDate(formData.vaccine_date)}</Text>
          </TouchableOpacity>
        </View>

        {/* Next Due Date */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Next Due Date (Optional)</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowNextDuePicker(true)}
          >
            <Ionicons name="alarm" size={20} color="#4a89dc" />
            <Text style={styles.dateText}>
              {formData.next_due_date ? formatDate(formData.next_due_date) : 'Select Date'}
            </Text>
          </TouchableOpacity>
          {formData.next_due_date && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => handleInputChange('next_due_date', null)}
            >
              <Text style={styles.clearButtonText}>Clear Date</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Notes */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Notes (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter any additional notes..."
            value={formData.notes}
            onChangeText={(value) => handleInputChange('notes', value)}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, saving && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Update Vaccine Record</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Date Pickers */}
      {showDatePicker && (
        <DateTimePicker
          value={formData.vaccine_date}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      {showNextDuePicker && (
        <DateTimePicker
          value={formData.next_due_date || new Date()}
          mode="date"
          display="default"
          onChange={handleNextDueDateChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  animalSelector: {
    flexDirection: 'row',
  },
  animalCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
    minWidth: 100,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedAnimalCard: {
    backgroundColor: '#4a89dc',
    borderColor: '#4a89dc',
  },
  animalName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  selectedAnimalName: {
    color: '#fff',
  },
  animalType: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  selectedAnimalType: {
    color: '#fff',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  clearButtonText: {
    color: '#e74c3c',
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: '#4a89dc',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
