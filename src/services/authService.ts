/**
 * Unified Authentication Service
 * 
 * This service handles both user and admin authentication with consistent
 * localStorage keys and proper role-based access control.
 */

import { API_CONFIG } from '../config/api';
import { authLogger, getErrorMessage, getErrorObject } from '../utils/logger';
import { transformSubscriptions } from '../utils/fieldMapping';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isAdmin?: boolean;
  role?: string;
  roles?: string[]; // For RBAC system
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
const REFRESH_TOKEN_KEY = 'userRefreshToken';
const USER_DATA_KEY = 'userData';

class AuthService {
  private static instance: AuthService;
  private token: string | null = null;
  private refreshToken: string | null = null;
  private user: User | null = null;
  private refreshPromise: Promise<string | null> | null = null;

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
    this.refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    const userDataStr = localStorage.getItem(USER_DATA_KEY);
    
    if (userDataStr) {
      try {
        this.user = JSON.parse(userDataStr);
      } catch (error) {
        authLogger.warn('Failed to parse stored user data', { error: getErrorMessage(error) });
        this.clearStorage();
      }
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      if (this.token) {
        localStorage.setItem(AUTH_TOKEN_KEY, this.token);
        // eslint-disable-next-line no-console
        console.log('✅ Token saved to localStorage:', this.token.substring(0, 50) + '...');
      } else {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        // eslint-disable-next-line no-console
        console.log('❌ No token to save, removed from localStorage');
      }

      if (this.refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, this.refreshToken);
      } else {
        localStorage.removeItem(REFRESH_TOKEN_KEY);
      }

      if (this.user) {
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(this.user));
        // eslint-disable-next-line no-console
        console.log('✅ User saved to localStorage:', this.user.email);
      } else {
        localStorage.removeItem(USER_DATA_KEY);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ Error saving to localStorage:', error);
    }
  }

  private clearStorage(): void {
    if (typeof window === 'undefined') {
      return;
    }
    
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
    
    // Also clear any legacy keys for cleanup
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
  }

  /**
   * Login user with email and password
   * Uses the admin login endpoint which returns admin status for all users
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/login`, {
        method: 'POST',
        headers: API_CONFIG.DEFAULT_HEADERS,
        body: JSON.stringify(credentials)
      });

      if (response.ok) {
        const responseData = await response.json();
        
        // Handle new API response format with nested data
        const data = responseData.success ? responseData.data : responseData;
        
        // Convert admin login response format to match LoginResponse interface
        const loginResponse: LoginResponse = {
          success: true,
          token: data.accessToken || data.access_token,
          user: {
            id: data.user.id,
            email: data.user.email,
            firstName: data.user.firstName,
            lastName: data.user.lastName,
            isAdmin: data.user.isAdmin,
            requirePasswordChange: data.user.requirePasswordChange || data.require_password_change
          },
          message: 'Inicio de sesión exitoso'
        };

        // Store token, refresh token, and user data
        this.token = data.accessToken || data.access_token;
        this.refreshToken = data.refreshToken || data.refresh_token;
        this.user = loginResponse.user!;
        this.saveToStorage();

        return loginResponse;
      } else {
        const errorData = await response.json();
        return {
          success: false,
          message: errorData.detail || 'Credenciales incorrectas',
          error_code: 'AUTHENTICATION_FAILED'
        };
      }
    } catch (error) {
      authLogger.error('Login error', { error: getErrorMessage(error) }, getErrorObject(error));
      return {
        success: false,
        message: 'Error de conexión. Por favor, intenta nuevamente.',
        error_code: 'NETWORK_ERROR'
      };
    }
  }

  /**
   * Login admin user (uses same endpoint as regular login, but validates admin status)
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
    this.refreshToken = null;
    this.user = null;
    this.refreshPromise = null;
    this.clearStorage();
  }

  /**
   * Force logout (same as logout but with explicit naming for session expiry)
   */
  forceLogout(): void {
    this.logout();
  }

  /**
   * Get remaining time for current token in seconds
   * Returns 0 if no token or token is expired
   */
  getTokenTimeRemaining(): number {
    if (!this.token) {
      return 0;
    }

    try {
      // Decode JWT token to get expiration time
      const payload = JSON.parse(atob(this.token!.split('.')[1]));
      const exp = payload.exp;
      
      if (!exp) {
        return 0;
      }

      const now = Math.floor(Date.now() / 1000);
      const remaining = exp - now;
      
      return Math.max(0, remaining);
    } catch (error) {
      authLogger.warn('Failed to decode token for time remaining', { error: getErrorMessage(error) });
      return 0;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    if (!this.token || !this.user) {
      return false;
    }
    
    // Check if token is expired
    const timeRemaining = this.getTokenTimeRemaining();
    return timeRemaining > 0;
  }

  /**
   * Check if user has admin privileges
   * Optionally refresh user data from backend to ensure accuracy
   */
  isAdmin(_useCache: boolean = true): boolean {
    if (!this.isAuthenticated() || !this.user) {
      return false;
    }

    // Check for admin role from backend
    return !!(
      this.user.isAdmin || 
      this.user.role === 'admin' || 
      this.user.role === 'administrator' ||
      this.user.roles?.includes('admin') ||
      this.user.roles?.includes('super_admin')
    );
  }

  /**
   * Check if user has super admin privileges
   */
  isSuperAdmin(): boolean {
    if (!this.isAuthenticated() || !this.user) {
      return false;
    }

    // Debug current user data
    // console.log('Current user data for super admin check:', {
      // user: this.user,
      // roles: this.user.roles,
      role: this.user.role,
      isAdmin: this.user.isAdmin
    });

    // Check for super admin role from backend
    return !!(
      this.user.role === 'super_admin' ||
      this.user.roles?.includes('super_admin') ||
      this.user.roles?.includes('SUPER_ADMIN')
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
      authLogger.warn('Failed to refresh user data', { error: getErrorMessage(error) });
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
   * Get current refresh token
   */
  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  /**
   * Refresh the access token using the refresh token
   */
  async refreshAccessToken(): Promise<string | null> {
    // If there's already a refresh in progress, wait for it
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    if (!this.refreshToken) {
      authLogger.warn('No refresh token available', { event_type: 'refresh_token_missing' });
      this.logout();
      return null;
    }

    this.refreshPromise = this.performTokenRefresh();
    const result = await this.refreshPromise;
    this.refreshPromise = null;
    return result;
  }

  private async performTokenRefresh(): Promise<string | null> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: this.refreshToken,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        this.token = data.access_token;
        this.saveToStorage();
        authLogger.info('Token refreshed successfully', { event_type: 'token_refresh' });
        return this.token;
      } else {
        authLogger.warn('Token refresh failed', { 
          status: response.status, 
          event_type: 'token_refresh_failed' 
        });
        // Refresh token is invalid or expired, logout user
        this.logout();
        return null;
      }
    } catch (error) {
      authLogger.error('Token refresh error', { error: getErrorMessage(error) }, getErrorObject(error));
      // On network error, don't logout but return null
      return null;
    }
  }

  /**
   * Get a valid access token, refreshing if necessary
   */
  async getValidToken(): Promise<string | null> {
    if (!this.token) {
      return null;
    }

    // Check if token is expired or about to expire (within 5 minutes)
    const timeRemaining = this.getTokenTimeRemaining();
    if (timeRemaining > 300) { // More than 5 minutes remaining
      return this.token;
    }

    // Token is expired or about to expire, try to refresh
    authLogger.info('Token expired or expiring soon, refreshing...', { event_type: 'token_expiry_detected' });
    return await this.refreshAccessToken();
  }

  /**
   * Validate token with backend and refresh user data
   */
  async validateToken(): Promise<boolean> {
    if (!this.token) {
      return false;
    }

    try {
      // Import httpClient dynamically to avoid circular dependency
      const { httpClient } = await import('./httpClient');
      const data = await httpClient.getJson(`${API_CONFIG.BASE_URL}/auth/me`, { skipRefresh: true });
      
      if (data && typeof data === 'object' && 'user' in data) {
        this.user = (data as any).user;
        this.saveToStorage();
      }
      return true;
    } catch (error) {
      authLogger.warn('Token validation failed', { error: getErrorMessage(error) });
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
      // Import httpClient dynamically to avoid circular dependency
      const { httpClient } = await import('./httpClient');
      const data = await httpClient.getJson(`${API_CONFIG.BASE_URL}/user/subscriptions`);

      const subscriptions = (data && typeof data === 'object' && 'subscriptions' in data) ? (data as any).subscriptions : [];
      return transformSubscriptions(subscriptions);
    } catch (error) {
      authLogger.error('Error fetching subscriptions', { error: getErrorMessage(error) }, getErrorObject(error));
      throw error;
    }
  }

  /**
   * Subscribe to a project
   */
  async subscribeToProject(projectId: string, notes?: string): Promise<unknown> {
    if (!this.isAuthenticated() || !this.token) {
      throw new Error('User not authenticated');
    }

    try {
      // Import httpClient dynamically to avoid circular dependency
      const { httpClient } = await import('./httpClient');
      return await httpClient.postJson(`${API_CONFIG.BASE_URL}/user/subscribe`, {
        projectId,
        notes: notes || undefined
      });
    } catch (error) {
      authLogger.error('Error subscribing to project', { error: getErrorMessage(error) }, getErrorObject(error));
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
      authLogger.warn('Failed to check project subscription', { error: getErrorMessage(error) });
      return null;
    }
  }

  /**
   * Request password reset email
   */
  async forgotPassword(email: string): Promise<{ success: boolean; message?: string }> {
    try {
      // Import httpClient dynamically to avoid circular dependency
      const { httpClient } = await import('./httpClient');
      const data = await httpClient.postJson(`${API_CONFIG.BASE_URL}/auth/forgot-password`, 
        { email }, 
        { skipAuth: true }
      );
      return {
        success: (data && typeof data === 'object' && 'success' in data) ? (data as any).success || false : false,
        message: (data && typeof data === 'object' && 'message' in data) ? (data as any).message : 'Unknown response',
      };
    } catch (error) {
      authLogger.error('Error requesting password reset', { error: getErrorMessage(error) }, getErrorObject(error));
      return {
        success: false,
        message: 'Error al procesar la solicitud. Inténtalo de nuevo.',
      };
    }
  }

  /**
   * Validate password reset token
   */
  async validateResetToken(token: string): Promise<{ valid: boolean; expires_at?: string }> {
    try {
      // Import httpClient dynamically to avoid circular dependency
      const { httpClient } = await import('./httpClient');
      const data = await httpClient.getJson(`${API_CONFIG.BASE_URL}/auth/validate-reset-token/${token}`, 
        { skipAuth: true }
      );
      return {
        valid: (data && typeof data === 'object' && 'valid' in data) ? (data as any).valid || false : false,
        expires_at: (data && typeof data === 'object' && 'expires_at' in data) ? (data as any).expires_at : undefined,
      };
    } catch (error) {
      authLogger.error('Error validating reset token', { error: getErrorMessage(error) }, getErrorObject(error));
      return { valid: false };
    }
  }

  /**
   * Reset password using token
   */
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message?: string }> {
    try {
      // Import httpClient dynamically to avoid circular dependency
      const { httpClient } = await import('./httpClient');
      const data = await httpClient.postJson(`${API_CONFIG.BASE_URL}/auth/reset-password`, 
        {
          reset_token: token,
          new_password: newPassword,
        }, 
        { skipAuth: true }
      );
      
      return {
        success: (data && typeof data === 'object' && 'success' in data) ? (data as any).success || false : false,
        message: (data && typeof data === 'object' && 'message' in data) ? (data as any).message : 'Unknown response',
      };
    } catch (error) {
      authLogger.error('Error resetting password', { error: getErrorMessage(error) }, getErrorObject(error));
      return {
        success: false,
        message: 'Error al procesar la solicitud. Inténtalo de nuevo.',
      };
    }
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();

// Helper functions for adding auth headers
export function addAuthHeaders(): Record<string, string> {
  const token = authService.getToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export function addRequiredAuthHeaders(): Record<string, string> {
  const token = authService.getToken();
  if (!token) {
    throw new Error('Authentication required');
  }
  return { 'Authorization': `Bearer ${token}` };
}

// Helper function for adding auth headers with automatic refresh
export async function addAuthHeadersWithRefresh(): Promise<Record<string, string>> {
  const token = await authService.getValidToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export async function addRequiredAuthHeadersWithRefresh(): Promise<Record<string, string>> {
  const token = await authService.getValidToken();
  if (!token) {
    throw new Error('Authentication required');
  }
  return { 'Authorization': `Bearer ${token}` };
}

// Make authService available globally for debugging and direct access
if (typeof window !== 'undefined') {
  (window as unknown as { authService: typeof authService }).authService = authService;
}
