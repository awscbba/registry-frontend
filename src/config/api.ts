/**
 * Centralized API configuration
 * This file contains all API-related constants and configuration
 * 
 * POLICY: Always use v2 endpoints when available for better reliability and features.
 * Legacy v1 endpoints should only be used when no v2 equivalent exists.
 */

export const API_CONFIG = {
  BASE_URL: import.meta.env.PUBLIC_API_URL || 'https://2t9blvt2c1.execute-api.us-east-1.amazonaws.com/prod',
  SITE_URL: import.meta.env.PUBLIC_SITE_URL || 'https://registry.cloud.org.bo',
  ENDPOINTS: {
    // Authentication - Unified login endpoint for all users
    AUTH_LOGIN: '/auth/login',           // Unified login endpoint (admin and regular users)
    AUTH_LOGOUT: '/auth/logout',
    AUTH_ME: '/auth/me',
    
    // Projects (v2)
    PROJECTS: '/v2/projects',
    ADMIN_PROJECTS: '/v2/admin/projects',
    
    // People (v2)
    PEOPLE: '/v2/people',
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
    
    // Project Subscription Management (v2) - Updated to match actual backend endpoints
    PROJECT_SUBSCRIBERS: (projectId: string) => `/v2/projects/${projectId}/subscriptions`,
    PROJECT_SUBSCRIBE: (projectId: string) => `/v2/projects/${projectId}/subscriptions`,
    PROJECT_SUBSCRIPTION_UPDATE: (projectId: string, subscriptionId: string) => `/v2/subscriptions/${subscriptionId}`,
    PROJECT_UNSUBSCRIBE: (projectId: string, subscriptionId: string) => `/v2/subscriptions/${subscriptionId}`,
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

/**
 * Get the full URL for a site page
 * Uses relative path if on the same domain, otherwise uses configured SITE_URL
 */
export const getSiteUrl = (path: string): string => {
  // If we're in the browser and on the same domain, use relative path
  if (typeof window !== 'undefined') {
    return path;
  }
  // Otherwise use the configured site URL (for SSR or external links)
  return `${API_CONFIG.SITE_URL}${path}`;
};