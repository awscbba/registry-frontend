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

// Authentication state with localStorage persistence
const AUTH_TOKEN_KEY = 'auth_token';
const CURRENT_USER_KEY = 'current_user';

// Helper functions for localStorage
function getStoredToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }
  return null;
}

function setStoredToken(token: string | null): void {
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  }
}

function getStoredUser(): User | null {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem(CURRENT_USER_KEY);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        console.warn('Failed to parse stored user data');
        localStorage.removeItem(CURRENT_USER_KEY);
      }
    }
  }
  return null;
}

function setStoredUser(user: User | null): void {
  if (typeof window !== 'undefined') {
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  }
}

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
      
      // Store authentication data in localStorage
      const token = data.access_token || data.accessToken;
      const user = {
        id: data.user?.id || 'unknown',
        email: data.user?.email || email,
        firstName: data.user?.firstName || data.user?.first_name || 'User',
        lastName: data.user?.lastName || data.user?.last_name || ''
      };

      setStoredToken(token);
      setStoredUser(user);

      return {
        accessToken: token,
        refreshToken: data.refresh_token || data.refreshToken || '',
        tokenType: data.token_type || 'Bearer',
        expiresIn: data.expires_in || 3600,
        user: user
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  async logout(): Promise<void> {
    setStoredToken(null);
    setStoredUser(null);
  },

  getCurrentUser(): User | null {
    return getStoredUser();
  },

  getAuthToken(): string | null {
    return getStoredToken();
  },

  isAuthenticated(): boolean {
    const token = getStoredToken();
    const user = getStoredUser();
    return token !== null && token.length > 0 && user !== null;
  },

  // Check if user has admin privileges
  isAdmin(): boolean {
    const user = getStoredUser();
    return user !== null && this.isAuthenticated();
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
