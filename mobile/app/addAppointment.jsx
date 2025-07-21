import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
  SafeAreaView,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import { API_BASE_URL } from '../utils/apiConfig';

const AddAppointment = () => {
  const params = useLocalSearchParams();
  const isFromChat = params.fromChat === 'true';
  const preSelectedFarmerId = params.farmerId;
  const preSelectedFarmerName = params.farmerName;
  
  const [formData, setFormData] = useState({
    farmer: '',
    animalName: '',
    date: new Date(),
    time: new Date(),
    reason: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [farmers, setFarmers] = useState([]);
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [showFarmerModal, setShowFarmerModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [vetId, setVetId] = useState(null);

  useEffect(() => {
    initializeData();
  }, []);

  useEffect(() => {
    // If coming from chat, set the pre-selected farmer
    if (isFromChat && preSelectedFarmerId && preSelectedFarmerName) {
      setSelectedFarmer({
        _id: preSelectedFarmerId,
        name: preSelectedFarmerName
      });
    }
  }, [isFromChat, preSelectedFarmerId, preSelectedFarmerName]);

  const initializeData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        setVetId(user._id);
        if (!isFromChat) {
          loadFarmers();
        }
      }
    } catch (error) {
      console.error('Error initializing data:', error);
    }
  };

  const loadFarmers = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await axios.get(`${API_BASE_URL}/api/farmers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFarmers(response.data);
    } catch (error) {
      console.error('Error loading farmers:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!selectedFarmer) {
      newErrors.farmer = 'Please select a farmer';
    }

    if (!formData.animalName.trim()) {
      newErrors.animalName = 'Please enter the animal name';
    }

    if (!formData.reason.trim()) {
      newErrors.reason = 'Please provide a reason for the appointment';
    }

    // Check if date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const appointmentDate = new Date(formData.date);
    appointmentDate.setHours(0, 0, 0, 0);
    
    if (appointmentDate < today) {
      newErrors.date = 'Appointment date cannot be in the past';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors and try again.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('authToken');
      
      const appointmentData = {
        vet: vetId,
        farmer: selectedFarmer._id,
        animalName: formData.animalName.trim(),
        date: formData.date.toISOString().split('T')[0],
        time: formData.time.toTimeString().slice(0, 5),
        reason: formData.reason.trim(),
        notes: formData.notes.trim(),
        status: 'pending'
      };

      const response = await axios.post(
        `${API_BASE_URL}/api/appointments`,
        appointmentData,
        { headers: { Authorization: `Bearer ${token}` }}
      );

      // Automatically redirect to appointment management without alert
      router.replace('/appointmentManagement');

    } catch (error) {
      console.error('Error creating appointment:', error);
      Alert.alert('Error', 'Failed to create appointment. Please try again.');
    }
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData(prev => ({ ...prev, date: selectedDate }));
      if (errors.date) {
        setErrors(prev => ({ ...prev, date: null }));
      }
    }
  };

  const onTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setFormData(prev => ({ ...prev, time: selectedTime }));
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (time) => {
    return time.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const filteredFarmers = farmers.filter(farmer =>
    farmer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    farmer.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderFarmerItem = ({ item }) => (
    <TouchableOpacity
      style={styles.modalItem}
      onPress={() => {
        setSelectedFarmer(item);
        setShowFarmerModal(false);
        setSearchQuery('');
        if (errors.farmer) {
          setErrors(prev => ({ ...prev, farmer: null }));
        }
      }}
    >
      <View style={styles.modalItemInfo}>
        <Text style={styles.modalItemName}>{item.name}</Text>
        <Text style={styles.modalItemSubtext}>{item.email}</Text>
        <Text style={styles.modalItemSubtext}>Phone: {item.phone}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#7f8c8d" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2c3e50" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Appointment</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          
          {/* Farmer Selection - Hidden when coming from chat */}
          {!isFromChat && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Select Farmer *</Text>
              <TouchableOpacity
                style={[styles.selectButton, errors.farmer && styles.inputError]}
                onPress={() => setShowFarmerModal(true)}
              >
                <Text style={[
                  styles.selectButtonText,
                  !selectedFarmer && styles.placeholderText
                ]}>
                  {selectedFarmer ? selectedFarmer.name : 'Choose a farmer'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#7f8c8d" />
              </TouchableOpacity>
              {errors.farmer && <Text style={styles.errorText}>{errors.farmer}</Text>}
            </View>
          )}

          {/* Show selected farmer when coming from chat */}
          {isFromChat && selectedFarmer && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Farmer</Text>
              <View style={styles.selectedFarmerContainer}>
                <Ionicons name="person" size={20} color="#27ae60" />
                <Text style={styles.selectedFarmerText}>{selectedFarmer.name}</Text>
              </View>
            </View>
          )}

          {/* Animal Name Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Animal Name *</Text>
            <TextInput
              style={[styles.textInput, styles.singleLineInput, errors.animalName && styles.inputError]}
              value={formData.animalName}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, animalName: text }));
                if (errors.animalName) {
                  setErrors(prev => ({ ...prev, animalName: null }));
                }
              }}
              placeholder="Enter the animal's name (e.g., Bella, Max, Cow #123)"
            />
            {errors.animalName && <Text style={styles.errorText}>{errors.animalName}</Text>}
          </View>

          {/* Date Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Appointment Date *</Text>
            <TouchableOpacity
              style={[styles.selectButton, errors.date && styles.inputError]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.selectButtonText}>
                {formatDate(formData.date)}
              </Text>
              <Ionicons name="calendar" size={20} color="#7f8c8d" />
            </TouchableOpacity>
            {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}
          </View>

          {/* Time Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Appointment Time *</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={styles.selectButtonText}>
                {formatTime(formData.time)}
              </Text>
              <Ionicons name="time" size={20} color="#7f8c8d" />
            </TouchableOpacity>
          </View>

          {/* Reason */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Reason for Appointment *</Text>
            <TextInput
              style={[styles.textInput, errors.reason && styles.inputError]}
              value={formData.reason}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, reason: text }));
                if (errors.reason) {
                  setErrors(prev => ({ ...prev, reason: null }));
                }
              }}
              placeholder="e.g., Regular checkup, vaccination, illness..."
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            {errors.reason && <Text style={styles.errorText}>{errors.reason}</Text>}
          </View>

          {/* Notes */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Additional Notes</Text>
            <TextInput
              style={[styles.textInput, styles.notesInput]}
              value={formData.notes}
              onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
              placeholder="Any additional information or special instructions..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Ionicons name="calendar" size={20} color="white" style={styles.submitButtonIcon} />
            <Text style={styles.submitButtonText}>Create Appointment</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={formData.date}
          mode="date"
          display="default"
          onChange={onDateChange}
          minimumDate={new Date()}
        />
      )}

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={formData.time}
          mode="time"
          display="default"
          onChange={onTimeChange}
        />
      )}

      {/* Farmer Selection Modal - Only show when not coming from chat */}
      {!isFromChat && (
        <Modal
          visible={showFarmerModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => {
                  setShowFarmerModal(false);
                  setSearchQuery('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Select Farmer</Text>
              <View style={styles.placeholder} />
            </View>
            
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#7f8c8d" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search farmers..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <FlatList
              data={filteredFarmers}
              renderItem={renderFarmerItem}
              keyExtractor={(item) => item._id}
              style={styles.modalList}
            />
          </SafeAreaView>
        </Modal>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#2c3e50',
    paddingTop: 10,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  placeholder: {
    width: 34,
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  selectButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectButtonText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  placeholderText: {
    color: '#7f8c8d',
  },
  disabledButton: {
    backgroundColor: '#f8f9fa',
    borderColor: '#e9ecef',
  },
  disabledText: {
    color: '#adb5bd',
  },
  textInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#2c3e50',
    minHeight: 80,
  },
  notesInput: {
    minHeight: 100,
  },
  singleLineInput: {
    minHeight: 50,
    textAlignVertical: 'center',
  },
  selectedFarmerContainer: {
    backgroundColor: '#e8f5e8',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#27ae60',
  },
  selectedFarmerText: {
    fontSize: 16,
    color: '#27ae60',
    fontWeight: '600',
    marginLeft: 8,
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 14,
    marginTop: 5,
  },
  submitButton: {
    backgroundColor: '#3498db',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonIcon: {
    marginRight: 8,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    backgroundColor: 'white',
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalCancelText: {
    color: '#3498db',
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  searchContainer: {
    backgroundColor: 'white',
    margin: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2c3e50',
  },
  modalList: {
    flex: 1,
    paddingHorizontal: 10,
  },
  modalItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalItemInfo: {
    flex: 1,
  },
  modalItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  modalItemSubtext: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 2,
  },
});

export default AddAppointment;
