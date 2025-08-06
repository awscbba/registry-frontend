/**
 * User Authentication Service
 * Handles authentication for regular users (not admin)
 */

import { API_CONFIG } from '../config/api';

export interface UserLoginRequest {
  email: string;
  password: string;
}

export interface UserLoginResponse {
  success: boolean;
  token: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  message?: string;
}

export interface UserSubscription {
  id: string;
  projectId: string;
  projectName: string;
  status: 'pending' | 'active' | 'cancelled';
  subscribedAt: string;
  notes?: string;
}

export class UserAuthService {
  private static instance: UserAuthService;
  private token: string | null = null;
  private user: UserLoginResponse['user'] | null = null;

  private constructor() {
    // Load token from localStorage on initialization (only in browser)
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('userAuthToken');
      const userData = localStorage.getItem('userData');
      if (userData) {
        try {
          this.user = JSON.parse(userData);
        } catch (e) {
          console.warn('Failed to parse stored user data');
          localStorage.removeItem('userData');
        }
      }
    }
  }

  static getInstance(): UserAuthService {
    if (!UserAuthService.instance) {
      UserAuthService.instance = new UserAuthService();
    }
    return UserAuthService.instance;
  }

  /**
   * Login user with email and password
   */
  async login(credentials: UserLoginRequest): Promise<UserLoginResponse> {
    const response = await fetch(`${API_CONFIG.BASE_URL}/auth/user/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Login failed');
    }

    const data: UserLoginResponse = await response.json();
    
    if (data.success && data.token) {
      this.token = data.token;
      this.user = data.user;
      
      // Store in localStorage (only in browser)
      if (typeof window !== 'undefined') {
        localStorage.setItem('userAuthToken', data.token);
        localStorage.setItem('userData', JSON.stringify(data.user));
      }
    }

    return data;
  }

  /**
   * Logout user
   */
  logout(): void {
    this.token = null;
    this.user = null;
    
    // Remove from localStorage (only in browser)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userAuthToken');
      localStorage.removeItem('userData');
    }
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn(): boolean {
    return this.token !== null && this.user !== null;
  }

  /**
   * Get current user data
   */
  getCurrentUser(): UserLoginResponse['user'] | null {
    return this.user;
  }

  /**
   * Get authentication token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Get user's subscriptions
   */
  async getUserSubscriptions(): Promise<UserSubscription[]> {
    if (!this.token) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(`${API_CONFIG.BASE_URL}/user/subscriptions`, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user subscriptions');
    }

    const data = await response.json();
    return data.subscriptions || [];
  }

  /**
   * Subscribe to a project (authenticated user)
   */
  async subscribeToProject(projectId: string, notes?: string): Promise<any> {
    if (!this.token) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(`${API_CONFIG.BASE_URL}/user/subscribe`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectId,
        notes: notes || undefined,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Subscription failed');
    }

    return response.json();
  }

  /**
   * Check if user is already subscribed to a project
   */
  async checkProjectSubscription(projectId: string): Promise<UserSubscription | null> {
    if (!this.token) {
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
export const userAuthService = UserAuthService.getInstance();
