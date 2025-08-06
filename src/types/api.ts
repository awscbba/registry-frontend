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
      console.warn('Authentication failed - token expired or invalid');
      errorMessage = 'Session expired. Please login again.';
      
      // Automatically logout user and redirect to login
      if (typeof window !== 'undefined') {
        // Clear localStorage directly to avoid circular dependencies
        localStorage.removeItem('auth_token');
        localStorage.removeItem('current_user');
        localStorage.removeItem('token_expiry');
        
        // Redirect to admin page to show login form
        window.location.href = '/admin';
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
