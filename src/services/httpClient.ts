/**
 * HTTP Client with automatic token refresh
 * 
 * This service provides a fetch wrapper that automatically handles
 * token expiration and refresh for authenticated requests.
 */

import { authService } from './authService';
import { API_CONFIG } from '../config/api';

export interface HttpClientOptions extends RequestInit {
  skipAuth?: boolean;
  skipRefresh?: boolean;
}

export class HttpClient {
  private static instance: HttpClient;

  static getInstance(): HttpClient {
    if (!HttpClient.instance) {
      HttpClient.instance = new HttpClient();
    }
    return HttpClient.instance;
  }

  /**
   * Make an HTTP request with automatic token refresh
   */
  async request(url: string, options: HttpClientOptions = {}): Promise<Response> {
    const { skipAuth = false, skipRefresh = false, ...fetchOptions } = options;

    // Prepare headers
    const headers = new Headers(fetchOptions.headers);
    
    // Add default headers
    if (!headers.has('Content-Type') && fetchOptions.method !== 'GET') {
      headers.set('Content-Type', 'application/json');
    }

    // Add authentication if not skipped
    if (!skipAuth) {
      const token = skipRefresh ? authService.getToken() : await authService.getValidToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }

    // Make the request
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    // Handle 401 responses with token refresh (if not already refreshed)
    if (response.status === 401 && !skipAuth && !skipRefresh) {
      console.log('Received 401, attempting token refresh...');
      
      const newToken = await authService.refreshAccessToken();
      if (newToken) {
        // Retry the request with the new token
        headers.set('Authorization', `Bearer ${newToken}`);
        return fetch(url, {
          ...fetchOptions,
          headers,
        });
      } else {
        // Refresh failed, redirect to login
        console.log('Token refresh failed, redirecting to login');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }

    return response;
  }

  /**
   * GET request with automatic token refresh
   */
  async get(url: string, options: HttpClientOptions = {}): Promise<Response> {
    return this.request(url, { ...options, method: 'GET' });
  }

  /**
   * POST request with automatic token refresh
   */
  async post(url: string, data?: any, options: HttpClientOptions = {}): Promise<Response> {
    return this.request(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request with automatic token refresh
   */
  async put(url: string, data?: any, options: HttpClientOptions = {}): Promise<Response> {
    return this.request(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request with automatic token refresh
   */
  async delete(url: string, options: HttpClientOptions = {}): Promise<Response> {
    return this.request(url, { ...options, method: 'DELETE' });
  }

  /**
   * Make a request and parse JSON response
   */
  async requestJson<T = any>(url: string, options: HttpClientOptions = {}): Promise<T> {
    const response = await this.request(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch {
        // Error response is not JSON, use the text
        if (errorText) {
          errorMessage = errorText;
        }
      }
      
      throw new Error(errorMessage);
    }

    return response.json();
  }

  /**
   * GET request that returns parsed JSON
   */
  async getJson<T = any>(url: string, options: HttpClientOptions = {}): Promise<T> {
    return this.requestJson<T>(url, { ...options, method: 'GET' });
  }

  /**
   * POST request that returns parsed JSON
   */
  async postJson<T = any>(url: string, data?: any, options: HttpClientOptions = {}): Promise<T> {
    return this.requestJson<T>(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request that returns parsed JSON
   */
  async putJson<T = any>(url: string, data?: any, options: HttpClientOptions = {}): Promise<T> {
    return this.requestJson<T>(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

// Export singleton instance
export const httpClient = HttpClient.getInstance();

// Helper function to get full API URL
export function getApiUrl(endpoint: string): string {
  const baseUrl = API_CONFIG.BASE_URL;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
}