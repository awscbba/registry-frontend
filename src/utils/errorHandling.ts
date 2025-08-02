/**
 * Consistent error handling utilities
 * Provides standardized error handling patterns across components
 */

import { ApiError } from '../types/api';

export interface ErrorState {
  message: string;
  type: 'api' | 'network' | 'validation' | 'unknown';
  code?: number;
}

/**
 * Convert various error types to a standardized ErrorState
 */
export const normalizeError = (error: unknown, context?: string): ErrorState => {
  if (error instanceof ApiError) {
    return {
      message: error.message,
      type: 'api',
      code: error.status,
    };
  }

  if (error instanceof Error) {
    // Check for network errors
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return {
        message: 'Error de conexión. Por favor, verifica tu conexión a internet.',
        type: 'network',
      };
    }

    return {
      message: error.message,
      type: 'unknown',
    };
  }

  // Fallback for unknown error types
  return {
    message: context 
      ? `Error desconocido en ${context}` 
      : 'Error desconocido',
    type: 'unknown',
  };
};

/**
 * Get user-friendly error message based on error type and context
 */
export const getErrorMessage = (error: unknown, context: string): string => {
  const normalizedError = normalizeError(error, context);

  // Context-specific error messages
  const contextMessages: Record<string, Record<string, string>> = {
    dashboard: {
      api: 'Error al cargar el dashboard. Por favor, intenta nuevamente.',
      network: 'No se pudo conectar al servidor. Verifica tu conexión.',
      unknown: 'Error inesperado al cargar el dashboard.',
    },
    people: {
      api: 'Error al cargar la lista de personas.',
      network: 'No se pudo conectar al servidor para cargar las personas.',
      unknown: 'Error inesperado al cargar las personas.',
    },
    projects: {
      api: 'Error al cargar los proyectos.',
      network: 'No se pudo conectar al servidor para cargar los proyectos.',
      unknown: 'Error inesperado al cargar los proyectos.',
    },
    subscription: {
      api: 'Error al procesar la suscripción.',
      network: 'No se pudo conectar al servidor para procesar la suscripción.',
      unknown: 'Error inesperado al procesar la suscripción.',
    },
  };

  const contextMessage = contextMessages[context]?.[normalizedError.type];
  
  if (contextMessage) {
    return contextMessage;
  }

  // Fallback to the normalized error message
  return normalizedError.message;
};

/**
 * Standard error messages for common scenarios
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Error de conexión. Por favor, verifica tu conexión a internet.',
  UNAUTHORIZED: 'No tienes autorización para realizar esta acción.',
  FORBIDDEN: 'Acceso denegado.',
  NOT_FOUND: 'El recurso solicitado no fue encontrado.',
  SERVER_ERROR: 'Error interno del servidor. Por favor, intenta más tarde.',
  VALIDATION_ERROR: 'Los datos proporcionados no son válidos.',
  UNKNOWN_ERROR: 'Error desconocido. Por favor, intenta nuevamente.',
} as const;

/**
 * Check if an error indicates an authentication issue
 */
export const isAuthError = (error: unknown): boolean => {
  if (error instanceof ApiError) {
    return error.status === 401 || error.status === 403;
  }
  return false;
};

/**
 * Check if an error is a network/connectivity issue
 */
export const isNetworkError = (error: unknown): boolean => {
  if (error instanceof Error) {
    return error.message.includes('fetch') || 
           error.message.includes('network') ||
           error.message.includes('Failed to fetch');
  }
  return false;
};