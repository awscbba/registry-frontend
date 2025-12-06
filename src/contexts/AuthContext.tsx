/**
 * AuthContext - Centralized Authentication State Management
 * 
 * This context provides a single source of truth for authentication state
 * across the application, eliminating the need for ad-hoc event listeners
 * and ensuring consistent auth state management.
 * 
 * @module contexts/AuthContext
 */

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { authService, type User, type LoginRequest, type LoginResponse } from '../services/authService';
import { getLogger, getErrorMessage, getErrorObject } from '../utils/logger';

const logger = getLogger('contexts.AuthContext');

/**
 * Authentication context type definition
 */
export interface AuthContextType {
  /** Current authenticated user, null if not authenticated */
  user: User | null;
  /** Whether the user is currently authenticated */
  isAuthenticated: boolean;
  /** Whether authentication state is being initialized */
  isLoading: boolean;
  /** Login function that wraps authService.login */
  login: (credentials: LoginRequest) => Promise<LoginResponse>;
  /** Logout function that clears authentication state */
  logout: () => void;
  /** Refresh user data from authService */
  refreshUser: () => void;
}

/**
 * Authentication context
 * @private
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Props for AuthProvider component
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider component
 * 
 * Wraps the application to provide authentication state to all child components.
 * Initializes auth state from authService on mount.
 * 
 * @example
 * ```tsx
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 * ```
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Track if component is mounted to prevent memory leaks
  const isMountedRef = useRef(true);

  /**
   * Refresh user data from authService
   * This function reads the current user from authService and updates local state
   */
  const refreshUser = () => {
    if (!isMountedRef.current) {
      return;
    }
    
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    
    logger.debug('User state refreshed', {
      isAuthenticated: !!currentUser,
      userId: currentUser?.id,
      timestamp: new Date().toISOString()
    });
  };

  /**
   * Initialize authentication state on mount
   */
  useEffect(() => {
    logger.debug('AuthContext initializing', {
      timestamp: new Date().toISOString()
    });
    
    refreshUser();
    setIsLoading(false);
    
    // Cleanup function to prevent memory leaks
    return () => {
      isMountedRef.current = false;
      logger.debug('AuthContext unmounting', {
        timestamp: new Date().toISOString()
      });
    };
  }, []);

  /**
   * Login function
   * Wraps authService.login and updates local state on success
   * 
   * @param credentials - User login credentials (email and password)
   * @returns Promise resolving to login response
   */
  const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
    const correlationId = `login-${Date.now()}`;
    
    logger.info('Login attempt started', {
      correlationId,
      email: credentials.email,
      timestamp: new Date().toISOString()
    });
    
    try {
      const result = await authService.login(credentials);
      
      if (result.success) {
        refreshUser();
        logger.info('Login successful', {
          correlationId,
          userId: result.user?.id,
          timestamp: new Date().toISOString()
        });
      } else {
        logger.warn('Login failed', {
          correlationId,
          reason: result.message || 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }
      
      return result;
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      const errorObject = getErrorObject(err);
      
      logger.error('Login error', {
        correlationId,
        error: errorMessage,
        timestamp: new Date().toISOString()
      }, errorObject);
      
      throw err;
    }
  };

  /**
   * Logout function
   * Clears authentication state both in authService and local state
   */
  const logout = () => {
    const userId = user?.id;
    
    logger.info('Logout initiated', {
      userId,
      timestamp: new Date().toISOString()
    });
    
    authService.logout();
    
    if (isMountedRef.current) {
      setUser(null);
    }
    
    logger.info('Logout completed', {
      userId,
      timestamp: new Date().toISOString()
    });
  };

  /**
   * Context value provided to consumers
   */
  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth hook
 * 
 * Custom hook to access authentication context.
 * Must be used within an AuthProvider.
 * 
 * @throws {Error} If used outside of AuthProvider
 * @returns Authentication context value
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, isAuthenticated, login, logout } = useAuth();
 *   
 *   if (!isAuthenticated) {
 *     return <LoginForm onSubmit={login} />;
 *   }
 *   
 *   return (
 *     <div>
 *       <p>Welcome, {user?.firstName}!</p>
 *       <button onClick={logout}>Logout</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
