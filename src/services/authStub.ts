/**
 * Authentication Stub
 * 
 * This is a temporary stub for authentication functionality.
 * Replace this with a proper authentication implementation.
 */

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

// Temporary mock authentication - REMOVE IN PRODUCTION
let mockAuthToken: string | null = null;
let mockUser: User | null = null;

export const authService = {
  // Mock login - replace with real implementation
  async login(email: string, password: string): Promise<LoginResponse> {
    console.warn('Using mock authentication - implement real auth system');
    
    // Mock successful login
    mockAuthToken = 'mock-jwt-token-' + Date.now();
    mockUser = {
      id: 'mock-user-id',
      email: email,
      firstName: 'Mock',
      lastName: 'User'
    };
    
    return {
      accessToken: mockAuthToken,
      refreshToken: 'mock-refresh-token',
      tokenType: 'bearer',
      expiresIn: 3600,
      user: mockUser
    };
  },

  async logout(): Promise<void> {
    mockAuthToken = null;
    mockUser = null;
  },

  getCurrentUser(): User | null {
    return mockUser;
  },

  getAuthToken(): string | null {
    return mockAuthToken;
  },

  isAuthenticated(): boolean {
    return mockAuthToken !== null;
  }
};

// Helper function to add auth headers to requests
export function addAuthHeaders(headers: Record<string, string> = {}): Record<string, string> {
  const token = authService.getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}
