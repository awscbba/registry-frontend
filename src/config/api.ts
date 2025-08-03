/**
 * Centralized API configuration
 * This file contains all API-related constants and configuration
 * 
 * POLICY: Always use v2 endpoints when available for better reliability and features.
 * Legacy v1 endpoints should only be used when no v2 equivalent exists.
 */

export const API_CONFIG = {
  BASE_URL: import.meta.env.PUBLIC_API_URL || 'https://2t9blvt2c1.execute-api.us-east-1.amazonaws.com/prod',
  ENDPOINTS: {
    // Authentication
    AUTH_LOGIN: '/auth/login',
    AUTH_LOGOUT: '/auth/logout',
    AUTH_ME: '/auth/me',
    
    // Projects (v2)
    PROJECTS: '/v2/projects',
    ADMIN_PROJECTS: '/v2/admin/projects',
    
    // People (v2)
    ADMIN_PEOPLE: '/v2/admin/people',
    PEOPLE_CHECK_EMAIL: '/v2/people/check-email',
    PERSON_BY_ID: (personId: string) => `/v2/people/${personId}`,
    
    // Subscriptions (v2)
    SUBSCRIPTIONS: '/v2/subscriptions',
    SUBSCRIPTIONS_CHECK: '/v2/subscriptions/check',
    PUBLIC_SUBSCRIBE: '/v2/public/subscribe',
    ADMIN_SUBSCRIPTIONS: '/v2/admin/subscriptions',
    
    // Dashboard (v2)
    ADMIN_DASHBOARD: '/v2/admin/dashboard',
    
    // Legacy endpoints (DEAD CODE - these endpoints don't exist in the current API)
    // TODO: Remove these and implement proper v2 subscription management endpoints
    // See: registry-documentation/api/V2_SUBSCRIPTION_ENDPOINTS_PROPOSAL.md
    PROJECT_SUBSCRIBERS: (projectId: string) => `/projects/${projectId}/subscribers`,
    PROJECT_SUBSCRIBE: (projectId: string, personId: string) => `/projects/${projectId}/subscribe/${personId}`,
    PROJECT_UNSUBSCRIBE: (projectId: string, personId: string) => `/projects/${projectId}/unsubscribe/${personId}`,
  },
  
  // Default headers
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
  },
  
  // Timeout configuration
  TIMEOUT: 30000, // 30 seconds
} as const;

/**
 * Get the full URL for an endpoint
 */
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

/**
 * Get headers with authentication if available
 */
export const getApiHeaders = (additionalHeaders: Record<string, string> = {}): Record<string, string> => {
  return {
    ...API_CONFIG.DEFAULT_HEADERS,
    ...additionalHeaders,
  };
};