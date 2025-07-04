/* eslint-disable no-undef */
import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import Profile from '../../app/profile';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

// Mock dependencies
jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
    push: jest.fn(),
    back: jest.fn(),
  },
  useLocalSearchParams: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  multiRemove: jest.fn(),
  multiSet: jest.fn(),
}));

jest.mock('axios');

jest.mock('expo-image-picker', () => ({
  MediaTypeOptions: {
    Images: 'Images',
  },
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native');
  return {
    AntDesign: ({ name, size, color }) => (
      <View testID={`antdesign-icon-${name}`} style={{ width: size, height: size, backgroundColor: color }} />
    ),
    Feather: ({ name, size, color }) => (
      <View testID={`feather-icon-${name}`} style={{ width: size, height: size, backgroundColor: color }} />
    ),
    MaterialIcons: ({ name, size, color }) => (
      <View testID={`material-icon-${name}`} style={{ width: size, height: size, backgroundColor: color }} />
    ),
  };
});

// Sample farmer data for testing
const mockFarmer = {
  _id: '456',
  name: 'John Doe',
  email: 'john@example.com',
  location: 'Rural Farm',
  phoneNo: '123-456-7890',
  profileImage: 'https://example.com/profile.jpg'
};

// Sample animal data for testing
const mockAnimals = [
  {
    _id: '123',
    name: 'Daisy',
    type: 'Cow',
    breed: 'Holstein',
    age: 4,
    gender: 'Female',
    details: 'Dairy cow',
    photo_url: 'https://example.com/cow.jpg'
  },
  {
    _id: '124',
    name: 'Babe',
    type: 'Pig',
    breed: 'Yorkshire',
    age: 2,
    gender: 'Male',
    details: 'Farm pig',
    photo_url: null
  }
];

describe('Profile Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    require('expo-router').useLocalSearchParams.mockReturnValue({
      farmer: JSON.stringify(mockFarmer)
    });
    
    AsyncStorage.getItem.mockImplementation((key) => {
      if (key === 'authToken') return Promise.resolve('mock-token');
      if (key === 'userData') return Promise.resolve(JSON.stringify(mockFarmer));
      return Promise.resolve(null);
    });
    
    AsyncStorage.multiRemove.mockResolvedValue(undefined);
    
    axios.get.mockResolvedValue({ data: mockAnimals });
    axios.post.mockResolvedValue({ data: mockAnimals[0] });
    axios.put.mockResolvedValue({ data: { ...mockAnimals[0], name: 'Updated Daisy' } });
    
    ImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({ status: 'granted' });
    ImagePicker.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ base64: 'mock-base64-image' }]
    });
    
    // Mock Alert
    Alert.alert = jest.fn();
  });

  // Clean up after all tests
  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('renders loading state initially', async () => {
    const { getByText, queryByText } = render(<Profile />);
    
    // Check if loading indicator is shown
    expect(getByText('Loading your profile...')).toBeTruthy();
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(queryByText('Loading your profile...')).toBeNull();
    });
  });

  it('redirects to login if no auth token', async () => {
    AsyncStorage.getItem.mockImplementation((key) => {
      if (key === 'authToken') return Promise.resolve(null);
      return Promise.resolve(null);
    });
    
    render(<Profile />);
    
    // Wait for navigation to occur
    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/');
    });
  });

  it('loads farmer data from params', async () => {
    const { getByText } = render(<Profile />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(getByText('John Doe')).toBeTruthy();
      expect(getByText('john@example.com')).toBeTruthy();
    });
    
    // Check if AsyncStorage was used to get auth token
    expect(AsyncStorage.getItem).toHaveBeenCalledWith('authToken');
  });

  it('loads farmer data from AsyncStorage if not in params', async () => {
    // Remove farmer from params
    require('expo-router').useLocalSearchParams.mockReturnValue({});
    
    const { getByText } = render(<Profile />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(getByText('John Doe')).toBeTruthy();
    });
    
    // Check if AsyncStorage was used to get userData
    expect(AsyncStorage.getItem).toHaveBeenCalledWith('userData');
  });

  it('fetches and displays animals', async () => {
    const { getByText, getAllByText } = render(<Profile />);
    
    // Wait for animals to load
    await waitFor(() => {
      expect(getByText('Daisy')).toBeTruthy();
      expect(getByText('Babe')).toBeTruthy();
    });
    
    // Check if axios was called with the correct URL and token
    expect(axios.get).toHaveBeenCalledWith(
      'http://localhost:3000/api/animals',
      { headers: { Authorization: 'Bearer mock-token' } }
    );
    
    // Check if view buttons are present
    const viewButtons = getAllByText('View');
    expect(viewButtons.length).toBe(2);
  });

  it('displays profile information correctly', async () => {
    const { getByText } = render(<Profile />);
    
    // Wait for profile to load
    await waitFor(() => {
      expect(getByText('John Doe')).toBeTruthy();
      expect(getByText('john@example.com')).toBeTruthy();
      expect(getByText('Rural Farm')).toBeTruthy();
      expect(getByText('123-456-7890')).toBeTruthy();
    });
  });

  it('navigates to edit profile when edit button is pressed', async () => {
    const { getByTestId } = render(<Profile />);
    
    // Wait for profile to load
    await waitFor(() => {
      const editButton = getByTestId('edit-profile-button');
      expect(editButton).toBeTruthy();
      
      // Press edit profile button
      fireEvent.press(editButton);
    });
    
    // Check if router.push was called with correct params
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/editProfile',
      params: { farmer: JSON.stringify(mockFarmer) }
    });
  });

  it('navigates to AI Chatbot when button is pressed', async () => {
    const { getByTestId } = render(<Profile />);
    
    // Wait for profile to load
    await waitFor(() => {
      const chatbotButton = getByTestId('ai-chatbot-button');
      expect(chatbotButton).toBeTruthy();
      
      // Press AI Chatbot button
      fireEvent.press(chatbotButton);
    });
    
    // Check if router.push was called with correct path
    expect(router.push).toHaveBeenCalledWith('/aiChatbot');
  });

  it('navigates to Disease Detection when button is pressed', async () => {
    const { getByTestId } = render(<Profile />);
    
    // Wait for profile to load
    await waitFor(() => {
      const diseaseButton = getByTestId('disease-detection-button');
      expect(diseaseButton).toBeTruthy();
      
      // Press Disease Detection button
      fireEvent.press(diseaseButton);
    });
    
    // Check if router.push was called with correct path
    expect(router.push).toHaveBeenCalledWith('/symptomChecker');
  });

  it('shows add animal modal when add button is pressed', async () => {
    const { getByTestId, getByText } = render(<Profile />);
    
    // Wait for profile to load
    await waitFor(() => {
      expect(getByText('My Animals')).toBeTruthy();
    });
    
    // Find and press the add button using testID
    fireEvent.press(getByTestId('add-animal-button'));
    
    // Check if modal is shown
    await waitFor(() => {
      expect(getByText('Add New Animal')).toBeTruthy();
    });
  });

  it('handles animal view navigation', async () => {
    const { getByTestId } = render(<Profile />);
    
    // Wait for animals to load
    await waitFor(() => {
      const viewButton = getByTestId(`view-animal-${mockAnimals[0]._id}`);
      expect(viewButton).toBeTruthy();
      
      // Press the view button for the first animal
      fireEvent.press(viewButton);
    });
    
    // Check if router.push was called with correct params
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/animalDetails',
      params: { animal: JSON.stringify(mockAnimals[0]) }
    });
  });

  it('logs out user when logout button is pressed', async () => {
    const { getByTestId } = render(<Profile />);
    
    // Wait for profile to load
    await waitFor(() => {
      const logoutButton = getByTestId('logout-button');
      expect(logoutButton).toBeTruthy();
      
      // Press logout button
      fireEvent.press(logoutButton);
    });
    
    // Check if AsyncStorage.multiRemove was called with correct keys
    expect(AsyncStorage.multiRemove).toHaveBeenCalledWith(['authToken', 'userData']);
    
    // Check if router.replace was called to navigate to login
    expect(router.replace).toHaveBeenCalledWith('/');
  });

  it('shows error alert if animal fetch fails with 401', async () => {
    // Mock axios.get to simulate 401 error
    axios.get.mockRejectedValueOnce({ response: { status: 401 } });
    
    render(<Profile />);
    
    // Wait for error handling
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith("Session Expired", "Please login again");
      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith(['authToken', 'userData']);
      expect(router.replace).toHaveBeenCalledWith('/');
    });
  });

  it('handles adding a new animal', async () => {
    const { getByTestId, getByText } = render(<Profile />);
    
    // Wait for profile to load
    await waitFor(() => {
      expect(getByText('My Animals')).toBeTruthy();
    });
    
    // Press the add button
    fireEvent.press(getByTestId('add-animal-button'));
    
    // Wait for modal to appear
    await waitFor(() => {
      expect(getByText('Add New Animal')).toBeTruthy();
    });
    
    // Fill the form using testIDs
    fireEvent.changeText(getByTestId('animal-name-input'), 'New Animal');
    fireEvent.changeText(getByTestId('animal-type-input'), 'Goat');
    fireEvent.changeText(getByTestId('animal-breed-input'), 'Alpine');
    fireEvent.changeText(getByTestId('animal-age-input'), '2');
    fireEvent.changeText(getByTestId('animal-gender-input'), 'Female');
    fireEvent.changeText(getByTestId('animal-details-input'), 'Dairy goat');
    
    // Press save button
    fireEvent.press(getByTestId('modal-save-button'));
    
    // Wait for API call to complete
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:3000/api/animals',
        {
          name: 'New Animal',
          type: 'Goat',
          breed: 'Alpine',
          age: 2,
          gender: 'Female',
          details: 'Dairy goat',
          image: null
        },
        {
          headers: {
            Authorization: 'Bearer mock-token',
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Check if success alert was shown
      expect(Alert.alert).toHaveBeenCalledWith("Success", "Animal added successfully");
    });
  });

  it('validates required fields when adding an animal', async () => {
    const { getByTestId, getByText } = render(<Profile />);
    
    // Wait for profile to load
    await waitFor(() => {
      expect(getByText('My Animals')).toBeTruthy();
    });
    
    // Press the add button
    fireEvent.press(getByTestId('add-animal-button'));
    
    // Wait for modal to appear
    await waitFor(() => {
      expect(getByText('Add New Animal')).toBeTruthy();
    });
    
    // Fill only some fields, leaving required fields empty
    fireEvent.changeText(getByTestId('animal-name-input'), 'New Animal');
    // Skip type, breed, etc.
    
    // Press save button
    fireEvent.press(getByTestId('modal-save-button'));
    
    // Check if validation alert was shown
    expect(Alert.alert).toHaveBeenCalledWith("Validation", "Please fill all required fields.");
    
    // Axios post should not have been called
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('handles image selection for adding an animal', async () => {
    const { getByTestId, getByText } = render(<Profile />);
    
    // Wait for profile to load
    await waitFor(() => {
      expect(getByText('My Animals')).toBeTruthy();
    });
    
    // Press the add button
    fireEvent.press(getByTestId('add-animal-button'));
    
    // Wait for modal to appear
    await waitFor(() => {
      expect(getByText('Select Image (Optional)')).toBeTruthy();
    });
    
    // Mock the image picker response before pressing the button
    ImagePicker.launchImageLibraryAsync.mockImplementationOnce(() => 
      Promise.resolve({
        canceled: false,
        assets: [{ base64: 'mock-base64-image' }]
      })
    );
    
    // Press image picker button within act()
    await act(async () => {
      fireEvent.press(getByTestId('image-picker-button'));
    });
    
    // Check if permission request was made
    expect(ImagePicker.requestMediaLibraryPermissionsAsync).toHaveBeenCalled();
    
    // Check if image picker was launched
    expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith({
      mediaTypes: 'Images',
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true,
    });
    
    // Wait for image to be set
    await waitFor(() => {
      expect(getByText('Image Selected')).toBeTruthy();
    });
  });
  
  it('handles image permission denial', async () => {
    // Mock permission denied
    ImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });
    
    const { getByTestId, getByText } = render(<Profile />);
    
    // Wait for profile to load
    await waitFor(() => {
      expect(getByText('My Animals')).toBeTruthy();
    });
    
    // Press the add button
    fireEvent.press(getByTestId('add-animal-button'));
    
    // Wait for modal to appear
    await waitFor(() => {
      expect(getByText('Select Image (Optional)')).toBeTruthy();
    });
    
    // Press image picker button
    fireEvent.press(getByTestId('image-picker-button'));
    
    // Check if alert was shown for permission denial
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Permission required', 
        'We need camera roll permissions to upload images'
      );
    });
    
    // Image picker should not have been launched
    expect(ImagePicker.launchImageLibraryAsync).not.toHaveBeenCalled();
  });

  it('displays "No profile data found" if farmer data cannot be loaded', async () => {
    // Mock both params and AsyncStorage to not provide farmer data
    require('expo-router').useLocalSearchParams.mockReturnValue({});
    AsyncStorage.getItem.mockImplementation((key) => {
      if (key === 'authToken') return Promise.resolve('mock-token');
      if (key === 'userData') return Promise.resolve(null);
      return Promise.resolve(null);
    });
    
    const { getByText } = render(<Profile />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(getByText('No profile data found')).toBeTruthy();
      expect(getByText('Go to login')).toBeTruthy();
    });
  });

  it('navigates to login when "Go to login" is pressed', async () => {
    // Mock both params and AsyncStorage to not provide farmer data
    require('expo-router').useLocalSearchParams.mockReturnValue({});
    AsyncStorage.getItem.mockImplementation((key) => {
      if (key === 'authToken') return Promise.resolve('mock-token');
      if (key === 'userData') return Promise.resolve(null);
      return Promise.resolve(null);
    });
    
    const { getByText } = render(<Profile />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(getByText('Go to login')).toBeTruthy();
    });
    
    // Press "Go to login" button
    fireEvent.press(getByText('Go to login'));
    
    // Check if router.replace was called
    expect(router.replace).toHaveBeenCalledWith('/');
  });
});
