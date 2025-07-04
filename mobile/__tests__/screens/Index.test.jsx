/* eslint-disable no-undef */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AuthScreen from '../../app/index';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ExpoRouter from 'expo-router';

// Mock dependencies
jest.mock('axios');
jest.mock('@react-native-async-storage/async-storage', () => ({
  multiSet: jest.fn(),
}));
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
  useFocusEffect: jest.fn((callback) => {
    // Don't execute the callback to avoid infinite re-renders in tests
    // Just mock the behavior
    return;
  }),
}));

describe('AuthScreen Component', () => {
  let mockRouter;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup router mock
    mockRouter = { push: jest.fn() };
    ExpoRouter.useRouter.mockReturnValue(mockRouter);
    
    // Setup axios success response
    axios.post.mockResolvedValue({
      data: {
        token: 'mock-token',
        farmer: {
          _id: '123',
          name: 'Test Farmer',
          email: 'test@example.com'
        }
      }
    });
  });

  it('renders login form by default', () => {
    const { getByText, getByTestId, queryByTestId } = render(<AuthScreen />);
    
    // Should show login title
    expect(getByText('Login')).toBeTruthy();
    
    // Should not show name input in login mode
    expect(queryByTestId('auth-name-input')).toBeNull();
    
    // Should show email and password inputs
    expect(getByTestId('auth-email-input')).toBeTruthy();
    expect(getByTestId('auth-password-input')).toBeTruthy();
    
    // Should show login button
    expect(getByText('Sign In')).toBeTruthy();
    
    // Should show the toggle to signup
    expect(getByText('Need an account? Sign up')).toBeTruthy();
  });
  
  it('switches to signup mode when toggle button is pressed', () => {
    const { getByText, getByTestId } = render(<AuthScreen />);
    
    // Press the toggle button
    fireEvent.press(getByTestId('auth-toggle-mode-button'));
    
    // Should now show signup title
    expect(getByText('Create Account')).toBeTruthy();
    
    // Should now show name input
    expect(getByTestId('auth-name-input')).toBeTruthy();
    
    // Should show signup button
    expect(getByText('Sign Up')).toBeTruthy();
    
    // Should show the toggle to login
    expect(getByText('Already have an account? Sign in')).toBeTruthy();
  });
  
  it('updates form data when input changes', () => {
    const { getByTestId } = render(<AuthScreen />);
    
    // Input test data
    fireEvent.changeText(getByTestId('auth-email-input'), 'test@example.com');
    fireEvent.changeText(getByTestId('auth-password-input'), 'password123');
    
    // Check that inputs reflect the changes
    expect(getByTestId('auth-email-input').props.value).toBe('test@example.com');
    expect(getByTestId('auth-password-input').props.value).toBe('password123');
  });
  
  it('validates required fields for login', async () => {
    const { getByTestId } = render(<AuthScreen />);
    
    // Try to submit without filling fields
    fireEvent.press(getByTestId('auth-submit-button'));
    
    // Axios should not be called if validation fails
    expect(axios.post).not.toHaveBeenCalled();
  });
  
  it('validates required fields for signup', async () => {
    const { getByTestId } = render(<AuthScreen />);
    
    // Switch to signup mode
    fireEvent.press(getByTestId('auth-toggle-mode-button'));
    
    // Try to submit without filling fields
    fireEvent.press(getByTestId('auth-submit-button'));
    
    // Axios should not be called if validation fails
    expect(axios.post).not.toHaveBeenCalled();
  });
  
  it('shows loading state during login submission', async () => {
    // Mock a delayed response
    axios.post.mockImplementationOnce(() => new Promise(resolve => setTimeout(() => {
      resolve({
        data: {
          token: 'mock-token',
          farmer: { _id: '123', name: 'Test Farmer', email: 'test@example.com' }
        }
      });
    }, 100)));
    
    const { getByTestId, getByText } = render(<AuthScreen />);
    
    // Fill login form
    fireEvent.changeText(getByTestId('auth-email-input'), 'test@example.com');
    fireEvent.changeText(getByTestId('auth-password-input'), 'password123');
    
    // Submit the form
    fireEvent.press(getByTestId('auth-submit-button'));
    
    // Should show loading state
    expect(getByText('Please wait...')).toBeTruthy();
  });
  
  it('successfully logs in and navigates to profile', async () => {
    const { getByTestId } = render(<AuthScreen />);
    
    // Fill login form
    fireEvent.changeText(getByTestId('auth-email-input'), 'test@example.com');
    fireEvent.changeText(getByTestId('auth-password-input'), 'password123');
    
    // Submit the form
    fireEvent.press(getByTestId('auth-submit-button'));
    
    // Wait for the async operations to complete
    await waitFor(() => {
      // Should call the login endpoint
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:3000/api/auth/login',
        expect.objectContaining({
          email: 'test@example.com',
          password: 'password123'
        })
      );
      
      // Should store auth data
      expect(AsyncStorage.multiSet).toHaveBeenCalledWith([
        ['authToken', 'mock-token'],
        ['userData', JSON.stringify({ _id: '123', name: 'Test Farmer', email: 'test@example.com' })]
      ]);
      
      // Should navigate to profile
      expect(mockRouter.push).toHaveBeenCalledWith({
        pathname: '/profile',
        params: expect.any(Object)
      });
    });
  });
  
  it('successfully signs up and navigates to profile', async () => {
    const { getByTestId } = render(<AuthScreen />);
    
    // Switch to signup mode
    fireEvent.press(getByTestId('auth-toggle-mode-button'));
    
    // Fill signup form
    fireEvent.changeText(getByTestId('auth-name-input'), 'New Farmer');
    fireEvent.changeText(getByTestId('auth-email-input'), 'new@example.com');
    fireEvent.changeText(getByTestId('auth-password-input'), 'password123');
    
    // Submit the form
    fireEvent.press(getByTestId('auth-submit-button'));
    
    // Wait for the async operations to complete
    await waitFor(() => {
      // Should call the register endpoint
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:3000/api/auth/register',
        expect.objectContaining({
          name: 'New Farmer',
          email: 'new@example.com',
          password: 'password123'
        })
      );
      
      // Should navigate to profile
      expect(mockRouter.push).toHaveBeenCalled();
    });
  });
  
  it('handles login error', async () => {
    // Mock error response
    axios.post.mockRejectedValueOnce({
      response: {
        data: {
          message: 'Invalid credentials'
        }
      }
    });
    
    const { getByTestId } = render(<AuthScreen />);
    
    // Fill login form
    fireEvent.changeText(getByTestId('auth-email-input'), 'test@example.com');
    fireEvent.changeText(getByTestId('auth-password-input'), 'wrong-password');
    
    // Submit the form
    fireEvent.press(getByTestId('auth-submit-button'));
    
    // Wait for the async operations to complete
    await waitFor(() => {
      // Should not navigate to profile
      expect(mockRouter.push).not.toHaveBeenCalled();
      
      // Should not store auth data
      expect(AsyncStorage.multiSet).not.toHaveBeenCalled();
    });
  });
  
  it('validates password length for signup', async () => {
    const { getByTestId } = render(<AuthScreen />);
    
    // Switch to signup mode
    fireEvent.press(getByTestId('auth-toggle-mode-button'));
    
    // Fill signup form with short password
    fireEvent.changeText(getByTestId('auth-name-input'), 'New Farmer');
    fireEvent.changeText(getByTestId('auth-email-input'), 'new@example.com');
    fireEvent.changeText(getByTestId('auth-password-input'), '12345'); // Too short
    
    // Submit the form
    fireEvent.press(getByTestId('auth-submit-button'));
    
    // Axios should not be called if validation fails
    expect(axios.post).not.toHaveBeenCalled();
  });
  
  it('validates name length for signup', async () => {
    const { getByTestId } = render(<AuthScreen />);
    
    // Switch to signup mode
    fireEvent.press(getByTestId('auth-toggle-mode-button'));
    
    // Fill signup form with short name
    fireEvent.changeText(getByTestId('auth-name-input'), 'Jo'); // Too short
    fireEvent.changeText(getByTestId('auth-email-input'), 'new@example.com');
    fireEvent.changeText(getByTestId('auth-password-input'), 'password123');
    
    // Submit the form
    fireEvent.press(getByTestId('auth-submit-button'));
    
    // Axios should not be called if validation fails
    expect(axios.post).not.toHaveBeenCalled();
  });
});
