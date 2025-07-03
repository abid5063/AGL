export const mockExpoRouter = {
  useRouter: jest.fn(() => ({
    back: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
    navigate: jest.fn()
  })),
  useLocalSearchParams: jest.fn(() => ({})),
  Link: ({ children }) => children
};
