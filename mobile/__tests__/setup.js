// Import testing-library extensions for react-native
import '@testing-library/react-native/extend-expect';
import { mockExpoRouter } from './mocks/expoRouterMock';

// Mock the fetch API
global.fetch = jest.fn();

// Mock Ionicons from expo vector icons
jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native');
  return {
    Ionicons: ({ name, size, color }) => {
      return <View testID={`icon-${name}`} style={{ width: size, height: size, backgroundColor: color }} />;
    }
  };
});

// Mock expo-router
jest.mock('expo-router', () => mockExpoRouter);
