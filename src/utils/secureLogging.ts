/**
 * Secure Logging Utilities
 * 
 * Provides utilities to sanitize sensitive data from logs to prevent
 * passwords, tokens, and other sensitive information from appearing
 * in browser console logs.
 */

// List of sensitive field names that should never be logged
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'access_token',
  'refresh_token',
  'authorization',
  'auth',
  'secret',
  'key',
  'credential',
  'credentials',
  'session',
  'cookie',
  'jwt',
  'bearer'
];

// List of sensitive patterns in field names (case-insensitive)
const SENSITIVE_PATTERNS = [
  /password/i,
  /token/i,
  /secret/i,
  /key/i,
  /auth/i,
  /credential/i,
  /session/i,
  /cookie/i,
  /jwt/i,
  /bearer/i
];

/**
 * Check if a field name is sensitive
 */
function isSensitiveField(fieldName: string): boolean {
  const lowerFieldName = fieldName.toLowerCase();
  
  // Check exact matches
  if (SENSITIVE_FIELDS.includes(lowerFieldName)) {
    return true;
  }
  
  // Check pattern matches
  return SENSITIVE_PATTERNS.some(pattern => pattern.test(fieldName));
}

/**
 * Sanitize an object by replacing sensitive field values with [REDACTED]
 */
export function sanitizeObject(obj: unknown, maxDepth: number = 3): unknown {
  if (maxDepth <= 0) {
    return '[MAX_DEPTH_REACHED]';
  }
  
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, maxDepth - 1));
  }
  
  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (isSensitiveField(key)) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value, maxDepth - 1);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Secure console.log that automatically sanitizes sensitive data
 */
export function secureLog(message: string, data?: unknown): void {
  if (data) {
    // eslint-disable-next-line no-console
    console.log(message, sanitizeObject(data));
  } else {
    // eslint-disable-next-line no-console
    console.log(message);
  }
}

/**
 * Secure console.error that automatically sanitizes sensitive data
 */
export function secureError(message: string, data?: unknown): void {
  if (data) {
    // eslint-disable-next-line no-console
    console.error(message, sanitizeObject(data));
  } else {
    // eslint-disable-next-line no-console
    console.error(message);
  }
}

/**
 * Secure console.warn that automatically sanitizes sensitive data
 */
export function secureWarn(message: string, data?: unknown): void {
  if (data) {
    // eslint-disable-next-line no-console
    console.warn(message, sanitizeObject(data));
  } else {
    // eslint-disable-next-line no-console
    console.warn(message);
  }
}

/**
 * Create a sanitized summary of login response for safe logging
 */
export function createLoginSummary(loginResponse: unknown): Record<string, unknown> {
  const response = loginResponse as Record<string, unknown>;
  const user = response?.user as Record<string, unknown>;
  
  return {
    success: response?.success,
    hasToken: !!(response?.token || response?.access_token),
    hasUser: !!response?.user,
    userEmail: user?.email,
    isAdmin: user?.isAdmin,
    message: response?.message,
    errorCode: response?.error_code
  };
}

/**
 * Create a sanitized summary of API response for safe logging
 */
export function createApiResponseSummary(response: unknown): Record<string, unknown> {
  const resp = response as Record<string, unknown>;
  
  return {
    success: resp?.success,
    hasData: !!resp?.data,
    dataLength: Array.isArray(resp?.data) ? resp.data.length : (resp?.data ? 1 : 0),
    version: resp?.version,
    message: resp?.message,
    error: resp?.error
  };
}

/**
 * Override console methods in development to automatically sanitize
 * (Only in development mode to avoid performance impact in production)
 */
export function enableSecureLogging(): void {
  if (import.meta.env.DEV) {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    
    // eslint-disable-next-line no-console
    console.log = (message: unknown, ...args: unknown[]) => {
      if (args.length > 0) {
        originalLog(message, ...args.map(arg => sanitizeObject(arg)));
      } else {
        originalLog(message);
      }
    };
    
    // eslint-disable-next-line no-console
    console.error = (message: unknown, ...args: unknown[]) => {
      if (args.length > 0) {
        originalError(message, ...args.map(arg => sanitizeObject(arg)));
      } else {
        originalError(message);
      }
    };
    
    // eslint-disable-next-line no-console
    console.warn = (message: unknown, ...args: unknown[]) => {
      if (args.length > 0) {
        originalWarn(message, ...args.map(arg => sanitizeObject(arg)));
      } else {
        originalWarn(message);
      }
    };
    
    // eslint-disable-next-line no-console
    console.log('🔒 Secure logging enabled - sensitive data will be automatically redacted');
  }
}