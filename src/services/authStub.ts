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

// Authentication state
let authToken: string | null = null;
let currentUser: User | null = null;

const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'https://2t9blvt2c1.execute-api.us-east-1.amazonaws.com/prod';

export const authService = {
  // Real login implementation
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.message || 'Login failed';
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Store authentication data
      authToken = data.access_token || data.accessToken;
      currentUser = {
        id: data.user?.id || 'unknown',
        email: data.user?.email || email,
        firstName: data.user?.firstName || data.user?.first_name || 'User',
        lastName: data.user?.lastName || data.user?.last_name || ''
      };

      return {
        accessToken: authToken,
        refreshToken: data.refresh_token || data.refreshToken || '',
        tokenType: data.token_type || 'Bearer',
        expiresIn: data.expires_in || 3600,
        user: currentUser
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  async logout(): Promise<void> {
    authToken = null;
    currentUser = null;
  },

  getCurrentUser(): User | null {
    return currentUser;
  },

  getAuthToken(): string | null {
    return authToken;
  },

  isAuthenticated(): boolean {
    return authToken !== null;
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
