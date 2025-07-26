import React, { useState, useEffect } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../utils/apiConfig';

export default function AddVaccine() {
  const router = useRouter();
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    vaccine_name: '',
    animal_id: '',
    vaccine_date: new Date(),
    next_due_date: '',
    notes: ''
  });
  const [showVaccineDatePicker, setShowVaccineDatePicker] = useState(false);
  const [showNextDueDatePicker, setShowNextDueDatePicker] = useState(false);
  const formatDate = (date) => {
    if (!date) return '';
    if (typeof date === 'string') date = new Date(date);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  useEffect(() => {
    fetchAnimals();
  }, []);

  const fetchAnimals = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await axios.get(`${API_BASE_URL}/api/animals`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setAnimals(response.data);
    } catch (error) {
      console.error('Error fetching animals:', error);
      Alert.alert('Error', 'Failed to fetch animals');
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

  const validateForm = () => {
    if (!formData.vaccine_name.trim()) {
      Alert.alert('Validation Error', 'Please enter vaccine name');
      return false;
    }
    if (!formData.animal_id) {
      Alert.alert('Validation Error', 'Please select an animal');
      return false;
    }
    // Validate vaccine_date
    if (!(formData.vaccine_date instanceof Date) || isNaN(formData.vaccine_date)) {
      Alert.alert('Validation Error', 'Please select a valid vaccine date');
      return false;
    }
    // Validate next_due_date if provided
    if (formData.next_due_date && (!(formData.next_due_date instanceof Date) || isNaN(formData.next_due_date))) {
      Alert.alert('Validation Error', 'Please select a valid next due date');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      const token = await AsyncStorage.getItem('authToken');
      
      const requestData = {
        vaccine_name: formData.vaccine_name.trim(),
        animal_id: formData.animal_id,
        vaccine_date: formData.vaccine_date instanceof Date ? formData.vaccine_date.toISOString().split('T')[0] : formData.vaccine_date,
        notes: formData.notes.trim()
      };
      if (formData.next_due_date) {
        requestData.next_due_date = formData.next_due_date instanceof Date ? formData.next_due_date.toISOString().split('T')[0] : formData.next_due_date;
      }

      await axios.post(`${API_BASE_URL}/api/vaccines`, requestData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Navigate directly to vaccine management without alert
      router.replace('/vaccineManagement');
    } catch (error) {
      console.error('Error saving vaccine:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to save vaccine record');
    } finally {
      setSaving(false);
    }
  };

  const getSelectedAnimalName = () => {
    const selectedAnimal = animals.find(animal => animal._id === formData.animal_id);
    return selectedAnimal ? selectedAnimal.name : 'Select Animal';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a89dc" />
        <Text style={styles.loadingText}>Loading animals...</Text>
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
        <Text style={styles.headerTitle}>Add Vaccine</Text>
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
            onPress={() => setShowVaccineDatePicker(true)}
          >
            <Text style={styles.dateText}>{formatDate(formData.vaccine_date)}</Text>
            <Ionicons name="calendar" size={20} color="#4a89dc" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>

        {/* Next Due Date */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Next Due Date (Optional)</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowNextDueDatePicker(true)}
          >
            <Text style={styles.dateText}>{formData.next_due_date ? formatDate(formData.next_due_date) : 'Select next due date'}</Text>
            <Ionicons name="calendar" size={20} color="#4a89dc" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
          {formData.next_due_date && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => handleInputChange('next_due_date', '')}
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
          <Ionicons name="medkit" size={20} color="#fff" style={styles.submitButtonIcon} />
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Add Vaccine Record</Text>
          )}
        </TouchableOpacity>
      {/* Vaccine Date Picker */}
      {showVaccineDatePicker && (
        <DateTimePicker
          value={formData.vaccine_date instanceof Date ? formData.vaccine_date : new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowVaccineDatePicker(false);
            if (selectedDate) handleInputChange('vaccine_date', selectedDate);
          }}
          minimumDate={new Date('2000-01-01')}
        />
      )}
      {/* Next Due Date Picker */}
      {showNextDueDatePicker && (
        <DateTimePicker
          value={formData.next_due_date instanceof Date ? formData.next_due_date : new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowNextDueDatePicker(false);
            if (selectedDate) handleInputChange('next_due_date', selectedDate);
          }}
          minimumDate={new Date('2000-01-01')}
        />
      )}
      </ScrollView>
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
  dateInput: {
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
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  submitButtonIcon: {
    marginRight: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
