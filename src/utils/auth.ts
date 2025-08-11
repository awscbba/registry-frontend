/**
 * Authentication utilities and patterns
 * Provides consistent authentication handling across components
 */

import { authService } from '../services/authService';

export interface AuthState {
  isAuthenticated: boolean;
  user: any | null;
  isLoading: boolean;
  error: string | null;
}

export interface AuthConfig {
  required: boolean; // Whether authentication is required
  redirectOnFail?: boolean; // Whether to redirect on auth failure
  showLoginForm?: boolean; // Whether to show inline login form
}

/**
 * Check authentication status with consistent error handling
 */
export const checkAuthStatus = (): AuthState => {
  try {
    const isAuthenticated = authService.isAuthenticated();
    const user = isAuthenticated ? authService.getCurrentUser() : null;
    
    return {
      isAuthenticated,
      user,
      isLoading: false,
      error: null,
    };
  } catch {
    return {
      isAuthenticated: false,
      user: null,
      isLoading: false,
      error: 'Error checking authentication status',
    };
  }
};

/**
 * Handle authentication requirements based on component config
 */
export const handleAuthRequirement = (
  authState: AuthState,
  config: AuthConfig
): { shouldBlock: boolean; errorMessage: string | null } => {
  if (!config.required) {
    return { shouldBlock: false, errorMessage: null };
  }

  if (!authState.isAuthenticated) {
    const errorMessage = config.showLoginForm
      ? 'Por favor, inicia sesión para continuar.'
      : 'Acceso denegado. Por favor, inicia sesión.';
    
    return { shouldBlock: true, errorMessage };
  }

  return { shouldBlock: false, errorMessage: null };
};

/**
 * Standard authentication error messages
 */
export const AUTH_MESSAGES = {
  ACCESS_DENIED: 'Acceso denegado. Por favor, inicia sesión.',
  LOGIN_REQUIRED: 'Por favor, inicia sesión para continuar.',
  SESSION_EXPIRED: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
  INSUFFICIENT_PERMISSIONS: 'No tienes permisos suficientes para realizar esta acción.',
} as const;