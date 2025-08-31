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
export function sanitizeObject(obj: any, maxDepth: number = 3): any {
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
  
  const sanitized: any = {};
  
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
export function secureLog(message: string, data?: any): void {
  if (data) {
    console.log(message, sanitizeObject(data));
  } else {
    console.log(message);
  }
}

/**
 * Secure console.error that automatically sanitizes sensitive data
 */
export function secureError(message: string, data?: any): void {
  if (data) {
    console.error(message, sanitizeObject(data));
  } else {
    console.error(message);
  }
}

/**
 * Secure console.warn that automatically sanitizes sensitive data
 */
export function secureWarn(message: string, data?: any): void {
  if (data) {
    console.warn(message, sanitizeObject(data));
  } else {
    console.warn(message);
  }
}

/**
 * Create a sanitized summary of login response for safe logging
 */
export function createLoginSummary(loginResponse: any): any {
  return {
    success: loginResponse?.success,
    hasToken: !!loginResponse?.token || !!loginResponse?.access_token,
    hasUser: !!loginResponse?.user,
    userEmail: loginResponse?.user?.email,
    isAdmin: loginResponse?.user?.isAdmin,
    message: loginResponse?.message,
    errorCode: loginResponse?.error_code
  };
}

/**
 * Create a sanitized summary of API response for safe logging
 */
export function createApiResponseSummary(response: any): any {
  return {
    success: response?.success,
    hasData: !!response?.data,
    dataLength: Array.isArray(response?.data) ? response.data.length : (response?.data ? 1 : 0),
    version: response?.version,
    message: response?.message,
    error: response?.error
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
    
    console.log = (message: any, ...args: any[]) => {
      if (args.length > 0) {
        originalLog(message, ...args.map(arg => sanitizeObject(arg)));
      } else {
        originalLog(message);
      }
    };
    
    console.error = (message: any, ...args: any[]) => {
      if (args.length > 0) {
        originalError(message, ...args.map(arg => sanitizeObject(arg)));
      } else {
        originalError(message);
      }
    };
    
    console.warn = (message: any, ...args: any[]) => {
      if (args.length > 0) {
        originalWarn(message, ...args.map(arg => sanitizeObject(arg)));
      } else {
        originalWarn(message);
      }
    };
    
    console.log('🔒 Secure logging enabled - sensitive data will be automatically redacted');
  }
}