import { getServiceLogger } from '../utils/logger';

const logger = getServiceLogger('ApiError');

/**
 * Shared API Error class for consistent error handling across services
 */
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Common API response handler that throws ApiError for non-ok responses
 */
export async function handleApiResponse(response: Response): Promise<any> {
  if (!response.ok) {
    let errorMessage: string;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || response.statusText;
    } catch {
      errorMessage = response.statusText;
    }
    
    // Handle authentication errors specifically
    if (response.status === 401) {
      logger.warn('Authentication failed - token expired or invalid', { 
        status: response.status, 
        event_type: 'auth_failed' 
      });
      errorMessage = 'Session expired. Please login again.';
      
      // Only clear localStorage if we actually have a token that's expired
      // Don't clear on first 401 after login (race condition)
      if (typeof window !== 'undefined') {
        const currentToken = localStorage.getItem('auth_token');
        if (currentToken) {
          try {
            const payload = JSON.parse(atob(currentToken.split('.')[1]));
            const now = Math.floor(Date.now() / 1000);
            
            // Only clear if token is actually expired
            if (payload.exp < now) {
              localStorage.removeItem('auth_token');
              localStorage.removeItem('current_user');
              localStorage.removeItem('token_expiry');
              
              // Redirect to admin page to show login form
              window.location.href = '/admin';
            }
          } catch {
            // If token is malformed, clear it
            localStorage.removeItem('auth_token');
            localStorage.removeItem('current_user');
            localStorage.removeItem('token_expiry');
            window.location.href = '/admin';
          }
        }
      }
    }
    
    throw new ApiError(response.status, errorMessage);
  }

  try {
    return await response.json();
  } catch {
    throw new ApiError(500, 'Invalid JSON response');
  }
}
