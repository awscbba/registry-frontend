// Mock auth service for Jest tests
export const authService = {
  getToken: jest.fn(() => 'mock-token'),
  isAuthenticated: jest.fn(() => true),
  getCurrentUser: jest.fn(() => ({ id: '1', email: 'test@example.com', isAdmin: true })),
  login: jest.fn(),
  logout: jest.fn(),
};

export const isAuthenticated = jest.fn(() => true);
export const getCurrentUser = jest.fn(() => ({ id: '1', email: 'test@example.com', isAdmin: true }));
export const addAuthHeaders = jest.fn((headers = {}) => ({ ...headers, 'Authorization': 'Bearer mock-token' }));
export const addRequiredAuthHeaders = jest.fn(() => ({ 'Authorization': 'Bearer mock-token' }));
