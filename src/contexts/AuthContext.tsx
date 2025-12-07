import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authService } from '../services/authService';
import { getLogger } from '../utils/logger';

const logger = getLogger('contexts.AuthContext');

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      logger.info('User refreshed successfully');
    } catch (error) {
      setUser(null);
      logger.debug('No authenticated user');
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await authService.login(email, password);
      setUser(response.user);
      logger.info('User logged in successfully');
    } catch (error) {
      logger.error('Login failed', { error });
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    logger.info('User logged out');
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false));
  }, [refreshUser]);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
