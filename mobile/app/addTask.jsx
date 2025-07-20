import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Alert,
  Platform 
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../utils/apiConfig';
import { Ionicons } from '@expo/vector-icons';

const AddTask = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
    dueTime: '09:00',
    estimatedCost: '',
    priority: 'medium',
    category: 'other',
    animal: '',
    notes: ''
  });

  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(false);

  const priorities = [
    { key: 'low', label: 'Low', color: '#44ff44' },
    { key: 'medium', label: 'Medium', color: '#ffaa00' },
    { key: 'high', label: 'High', color: '#ff4444' }
  ];

  const categories = [
    { key: 'feeding', label: 'Feeding', icon: 'restaurant' },
    { key: 'vaccination', label: 'Vaccination', icon: 'medical' },
    { key: 'health-check', label: 'Health Check', icon: 'heart' },
    { key: 'breeding', label: 'Breeding', icon: 'heart-circle' },
    { key: 'maintenance', label: 'Maintenance', icon: 'construct' },
    { key: 'other', label: 'Other', icon: 'clipboard' }
  ];

  // Fetch animals when component mounts
  useEffect(() => {
    fetchAnimals();
  }, []);

  const fetchAnimals = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        router.replace('/');
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/api/animals`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setAnimals(response.data);
    } catch (error) {
      console.error('Error fetching animals:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // Show user-friendly error message
      if (error.response?.status === 401) {
        Alert.alert('Authentication Error', 'Please log in again');
        router.replace('/');
      } else if (error.response?.status === 500) {
        Alert.alert('Server Error', 'Unable to fetch animals. Please try again later.');
      } else {
        Alert.alert('Error', 'Failed to fetch animals. Please check your connection.');
      }
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      Alert.alert('Validation Error', 'Please enter a task title');
      return false;
    }
    
    // Validate date format (YYYY-MM-DD)
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(formData.dueDate)) {
      Alert.alert('Validation Error', 'Please enter a valid date (YYYY-MM-DD)');
      return false;
    }
    
    // Validate time format (HH:MM)
    if (!formData.dueTime.match(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
      Alert.alert('Validation Error', 'Please enter a valid time (HH:MM)');
      return false;
    }

    if (formData.estimatedCost && isNaN(parseFloat(formData.estimatedCost))) {
      Alert.alert('Validation Error', 'Please enter a valid cost amount');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        router.replace('/');
        return;
      }

      const taskData = {
        ...formData,
        estimatedCost: formData.estimatedCost ? parseFloat(formData.estimatedCost) : 0,
        animal: formData.animal || null
      };

      await axios.post(`${API_BASE_URL}/api/tasks`, taskData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      router.replace('/taskManagement');
    } catch (error) {
      console.error('Error creating task:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const renderPrioritySelector = () => (
    <View style={styles.selectorContainer}>
      <Text style={styles.label}>Priority</Text>
      <View style={styles.priorityContainer}>
        {priorities.map(priority => (
          <TouchableOpacity
            key={priority.key}
            style={[
              styles.priorityButton,
              { borderColor: priority.color },
              formData.priority === priority.key && { backgroundColor: priority.color }
            ]}
            onPress={() => handleInputChange('priority', priority.key)}
          >
            <Text style={[
              styles.priorityText,
              formData.priority === priority.key && { color: '#fff' }
            ]}>
              {priority.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderCategorySelector = () => (
    <View style={styles.selectorContainer}>
      <Text style={styles.label}>Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.categoryContainer}>
          {categories.map(category => (
            <TouchableOpacity
              key={category.key}
              style={[
                styles.categoryButton,
                formData.category === category.key && styles.selectedCategory
              ]}
              onPress={() => handleInputChange('category', category.key)}
            >
              <Ionicons 
                name={category.icon} 
                size={20} 
                color={formData.category === category.key ? '#fff' : '#666'} 
              />
              <Text style={[
                styles.categoryText,
                formData.category === category.key && styles.selectedCategoryText
              ]}>
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderAnimalSelector = () => (
    <View style={styles.selectorContainer}>
      <Text style={styles.label}>Animal (Optional)</Text>
      <View style={styles.animalContainer}>
        <TouchableOpacity
          style={[
            styles.animalButton,
            !formData.animal && styles.selectedAnimal
          ]}
          onPress={() => handleInputChange('animal', '')}
        >
          <Text style={[
            styles.animalText,
            !formData.animal && styles.selectedAnimalText
          ]}>
            No specific animal
          </Text>
        </TouchableOpacity>
        
        {animals.map(animal => (
          <TouchableOpacity
            key={animal._id}
            style={[
              styles.animalButton,
              formData.animal === animal._id && styles.selectedAnimal
            ]}
            onPress={() => handleInputChange('animal', animal._id)}
          >
            <Text style={[
              styles.animalText,
              formData.animal === animal._id && styles.selectedAnimalText
            ]}>
              {animal.name} ({animal.type})
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Add New Task</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Task Title *</Text>
          <TextInput
            style={styles.input}
            value={formData.title}
            onChangeText={(value) => handleInputChange('title', value)}
            placeholder="Enter task title"
            maxLength={100}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(value) => handleInputChange('description', value)}
            placeholder="Enter task description"
            multiline
            numberOfLines={3}
            maxLength={500}
          />
        </View>

        <View style={styles.dateTimeContainer}>
          <View style={styles.dateContainer}>
            <Text style={styles.label}>Due Date *</Text>
            <TextInput
              style={styles.dateInput}
              placeholder="YYYY-MM-DD"
              value={formData.dueDate}
              onChangeText={(text) => handleInputChange('dueDate', text)}
              placeholderTextColor="#999"
              {...(Platform.OS === 'web' ? { type: 'date' } : {})}
            />
          </View>

          <View style={styles.timeContainer}>
            <Text style={styles.label}>Due Time *</Text>
            <TextInput
              style={styles.timeInput}
              placeholder="HH:MM"
              value={formData.dueTime}
              onChangeText={(text) => handleInputChange('dueTime', text)}
              placeholderTextColor="#999"
              {...(Platform.OS === 'web' ? { type: 'time' } : {})}
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Estimated Cost ($)</Text>
          <TextInput
            style={styles.input}
            value={formData.estimatedCost}
            onChangeText={(value) => handleInputChange('estimatedCost', value)}
            placeholder="0.00"
            keyboardType="decimal-pad"
          />
        </View>

        {renderPrioritySelector()}
        {renderCategorySelector()}
        {renderAnimalSelector()}

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.notes}
            onChangeText={(value) => handleInputChange('notes', value)}
            placeholder="Additional notes..."
            multiline
            numberOfLines={3}
            maxLength={300}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitText}>
            {loading ? 'Creating Task...' : 'Create Task'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  form: {
    padding: 20,
  },
  inputContainer: {
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
    height: 80,
    textAlignVertical: 'top',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dateContainer: {
    flex: 1,
    marginRight: 10,
  },
  timeContainer: {
    flex: 1,
    marginLeft: 10,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  selectorContainer: {
    marginBottom: 20,
  },
  priorityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryContainer: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  selectedCategory: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  selectedCategoryText: {
    color: '#fff',
  },
  animalContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  animalButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  selectedAnimal: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  animalText: {
    fontSize: 12,
    color: '#666',
  },
  selectedAnimalText: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddTask;
