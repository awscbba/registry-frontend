/**
 * Unified Authentication Service
 * 
 * This service handles both user and admin authentication with consistent
 * localStorage keys and proper role-based access control.
 */

import { API_CONFIG } from '../config/api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isAdmin?: boolean;
  role?: string;
  requirePasswordChange?: boolean;
  isActive?: boolean;
  lastLoginAt?: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
  error_code?: string;
}

export interface UserSubscription {
  id: string;
  projectId: string;
  projectName: string;
  status: 'pending' | 'active' | 'cancelled';
  subscribedAt: string;
  notes?: string;
}

// Consistent localStorage keys
const AUTH_TOKEN_KEY = 'userAuthToken';
const USER_DATA_KEY = 'userData';

class AuthService {
  private static instance: AuthService;
  private token: string | null = null;
  private user: User | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadFromStorage();
    }
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private loadFromStorage(): void {
    this.token = localStorage.getItem(AUTH_TOKEN_KEY);
    const userDataStr = localStorage.getItem(USER_DATA_KEY);
    
    if (userDataStr) {
      try {
        this.user = JSON.parse(userDataStr);
      } catch (error) {
        console.warn('Failed to parse stored user data:', error);
        this.clearStorage();
      }
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    if (this.token) {
      localStorage.setItem(AUTH_TOKEN_KEY, this.token);
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }

    if (this.user) {
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(this.user));
    } else {
      localStorage.removeItem(USER_DATA_KEY);
    }
  }

  private clearStorage(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
    
    // Also clear any legacy keys for cleanup
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
  }

  /**
   * Login user with email and password
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/user/login`, {
        method: 'POST',
        headers: API_CONFIG.DEFAULT_HEADERS,
        body: JSON.stringify(credentials)
      });

      const data: LoginResponse = await response.json();

      if (response.ok && data.success && data.token && data.user) {
        this.token = data.token;
        this.user = data.user;
        this.saveToStorage();
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Error de conexión. Por favor, intenta nuevamente.',
        error_code: 'NETWORK_ERROR'
      };
    }
  }

  /**
   * Login admin user (uses same endpoint but checks for admin role)
   */
  async adminLogin(credentials: LoginRequest): Promise<LoginResponse> {
    const result = await this.login(credentials);
    
    if (result.success && result.user && !result.user.isAdmin) {
      // User logged in successfully but is not an admin
      this.logout();
      return {
        success: false,
        message: 'Acceso denegado. Se requieren privilegios de administrador.',
        error_code: 'INSUFFICIENT_PRIVILEGES'
      };
    }

    return result;
  }

  /**
   * Logout user and clear all stored data
   */
  logout(): void {
    this.token = null;
    this.user = null;
    this.clearStorage();
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.token !== null && this.user !== null;
  }

  /**
   * Check if user has admin privileges
   * Optionally refresh user data from backend to ensure accuracy
   */
  isAdmin(useCache: boolean = true): boolean {
    if (!this.isAuthenticated() || !this.user) {
      return false;
    }

    // Check for admin role from backend
    return !!(
      this.user.isAdmin || 
      this.user.role === 'admin' || 
      this.user.role === 'administrator'
    );
  }

  /**
   * Refresh user data from backend to ensure we have latest admin status
   */
  async refreshUserData(): Promise<boolean> {
    if (!this.token) {
      return false;
    }

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          ...API_CONFIG.DEFAULT_HEADERS
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          this.user = data.user;
          this.saveToStorage();
          return true;
        }
      } else {
        // Token is invalid, clear storage
        this.logout();
        return false;
      }
    } catch (error) {
      console.warn('Failed to refresh user data:', error);
      return false;
    }
    
    return false;
  }

  /**
   * Get current user data
   */
  getCurrentUser(): User | null {
    return this.user;
  }

  /**
   * Get current authentication token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Validate token with backend and refresh user data
   */
  async validateToken(): Promise<boolean> {
    if (!this.token) {
      return false;
    }

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          ...API_CONFIG.DEFAULT_HEADERS
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          this.user = data.user;
          this.saveToStorage();
        }
        return true;
      } else {
        // Token is invalid, clear storage
        this.logout();
        return false;
      }
    } catch (error) {
      console.warn('Token validation failed:', error);
      // On network error, don't logout but return false
      return false;
    }
  }

  /**
   * Get user subscriptions
   */
  async getUserSubscriptions(): Promise<UserSubscription[]> {
    if (!this.isAuthenticated() || !this.token) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/user/subscriptions`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          ...API_CONFIG.DEFAULT_HEADERS
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user subscriptions');
      }

      const data = await response.json();
      return data.subscriptions || [];
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      throw error;
    }
  }

  /**
   * Subscribe to a project
   */
  async subscribeToProject(projectId: string, notes?: string): Promise<any> {
    if (!this.isAuthenticated() || !this.token) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/user/subscribe`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          ...API_CONFIG.DEFAULT_HEADERS
        },
        body: JSON.stringify({
          projectId,
          notes: notes || undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Subscription failed');
      }

      return response.json();
    } catch (error) {
      console.error('Error subscribing to project:', error);
      throw error;
    }
  }

  /**
   * Check if user is subscribed to a specific project
   */
  async checkProjectSubscription(projectId: string): Promise<UserSubscription | null> {
    if (!this.isAuthenticated()) {
      return null;
    }

    try {
      const subscriptions = await this.getUserSubscriptions();
      return subscriptions.find(sub => sub.projectId === projectId) || null;
    } catch (error) {
      console.warn('Failed to check project subscription:', error);
      return null;
    }
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();

// Export types
export type { User, LoginRequest, LoginResponse, UserSubscription };
