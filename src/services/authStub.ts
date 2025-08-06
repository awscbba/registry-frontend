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
const TOKEN_EXPIRY_KEY = 'token_expiry';

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

function getTokenExpiry(): number | null {
  if (typeof window !== 'undefined') {
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    return expiry ? parseInt(expiry, 10) : null;
  }
  return null;
}

function setTokenExpiry(expiresIn: number): void {
  if (typeof window !== 'undefined') {
    const expiryTime = Date.now() + (expiresIn * 1000); // Convert seconds to milliseconds
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
  }
}

function clearTokenExpiry(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
  }
}

function isTokenExpired(): boolean {
  const expiry = getTokenExpiry();
  if (!expiry) return true; // No expiry time means expired
  return Date.now() > expiry;
}

import { API_CONFIG, getApiUrl } from '../config/api';

export const authService = {
  // Real login implementation
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.AUTH_LOGIN), {
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
      setTokenExpiry(data.expires_in || 3600); // Default to 1 hour if not provided

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
    clearTokenExpiry();
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
    
    // Check if token and user exist
    if (!token || token.length === 0 || !user) {
      return false;
    }
    
    // Check if token is expired
    if (isTokenExpired()) {
      console.log('Token expired, logging out automatically');
      this.logout(); // Automatically logout if token is expired
      return false;
    }
    
    return true;
  },

  // Check if user has admin privileges
  isAdmin(): boolean {
    const user = getStoredUser();
    return user !== null && this.isAuthenticated();
  },

  // Check token expiration and automatically logout if expired
  checkTokenExpiration(): boolean {
    if (isTokenExpired()) {
      console.log('Token expired, logging out automatically');
      this.logout();
      return true; // Token was expired
    }
    return false; // Token is still valid
  },

  // Get remaining time until token expires (in seconds)
  getTokenTimeRemaining(): number {
    const expiry = getTokenExpiry();
    if (!expiry) return 0;
    const remaining = Math.max(0, expiry - Date.now());
    return Math.floor(remaining / 1000); // Convert to seconds
  },

  // Force logout and redirect to login
  forceLogout(): void {
    this.logout();
    if (typeof window !== 'undefined') {
      // Redirect to login page or reload to show login form
      window.location.href = '/admin';
    }
  },

  // Temporary method for testing - simulate authentication
  simulateAuth(): void {
    console.log('authStub: Simulating authentication for testing');
    const testUser = {
      id: 'test-admin',
      email: 'admin@test.com',
      firstName: 'Test',
      lastName: 'Admin'
    };
    const testToken = 'test-token-123';
    
    setStoredToken(testToken);
    setStoredUser(testUser);
    console.log('authStub: Test authentication set up');
  }
};

// Helper function to add auth headers to requests
export function addAuthHeaders(headers: Record<string, string> = {}): Record<string, string> {
  // Check if token is expired before making the request
  if (authService.checkTokenExpiration()) {
    // Token was expired and user was logged out
    throw new Error('Session expired. Please login again.');
  }
  
  const token = authService.getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}
