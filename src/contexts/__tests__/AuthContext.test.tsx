import { render, screen, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AuthProvider, useAuth } from '../AuthContext';
import { authService } from '../../services/authService';

// Mock the authService
vi.mock('../../services/authService', () => ({
  authService: {
    getCurrentUser: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
  },
}));

// Mock the logger
vi.mock('../../utils/logger', () => ({
  getLogger: () => ({
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  }),
}));

// Test component that uses the AuthContext
function TestComponent() {
  const { user, isAuthenticated, isLoading, login, logout, refreshUser } = useAuth();
  
  return (
    <div>
      <div data-testid="user-info">
        {isLoading ? 'Loading...' : user ? `User: ${user.email}` : 'No user'}
      </div>
      <div data-testid="auth-status">
        {isAuthenticated ? 'Authenticated' : 'Not authenticated'}
      </div>
      <button 
        data-testid="login-btn" 
        onClick={() => login('test@example.com', 'password')}
      >
        Login
      </button>
      <button data-testid="logout-btn" onClick={logout}>
        Logout
      </button>
      <button data-testid="refresh-btn" onClick={refreshUser}>
        Refresh
      </button>
    </div>
  );
}

// Test component that should throw error when used outside provider
function TestComponentWithoutProvider() {
  const auth = useAuth();
  return <div>{auth.user?.email}</div>;
}

describe('AuthContext', () => {
  const mockUser = {
    id: '1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'user',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('AuthProvider', () => {
    it('should provide initial loading state', async () => {
      // Mock getCurrentUser to return null (no user)
      vi.mocked(authService.getCurrentUser).mockResolvedValue(null);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Initially should be loading
      expect(screen.getByTestId('user-info')).toHaveTextContent('Loading...');
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not authenticated');

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByTestId('user-info')).toHaveTextContent('No user');
      });
    });

    it('should load authenticated user on mount', async () => {
      // Mock getCurrentUser to return a user
      vi.mocked(authService.getCurrentUser).mockResolvedValue(mockUser);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for user to load
      await waitFor(() => {
        expect(screen.getByTestId('user-info')).toHaveTextContent('User: test@example.com');
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      });

      expect(authService.getCurrentUser).toHaveBeenCalledTimes(1);
    });

    it('should handle successful login', async () => {
      // Mock initial state (no user)
      vi.mocked(authService.getCurrentUser).mockResolvedValue(null);
      // Mock successful login
      vi.mocked(authService.login).mockResolvedValue({ 
        success: true, 
        user: mockUser,
        message: 'Login successful' 
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('user-info')).toHaveTextContent('No user');
      });

      // Perform login
      await act(async () => {
        screen.getByTestId('login-btn').click();
      });

      // Verify login was called and user is set
      expect(authService.login).toHaveBeenCalledWith('test@example.com', 'password');
      await waitFor(() => {
        expect(screen.getByTestId('user-info')).toHaveTextContent('User: test@example.com');
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      });
    });

    it('should handle logout', async () => {
      // Mock initial authenticated state
      vi.mocked(authService.getCurrentUser).mockResolvedValue(mockUser);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for user to load
      await waitFor(() => {
        expect(screen.getByTestId('user-info')).toHaveTextContent('User: test@example.com');
      });

      // Perform logout
      await act(async () => {
        screen.getByTestId('logout-btn').click();
      });

      // Verify logout was called and user is cleared
      expect(authService.logout).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('user-info')).toHaveTextContent('No user');
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not authenticated');
    });
  });

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponentWithoutProvider />);
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });

    it('should return context value when used within AuthProvider', async () => {
      vi.mocked(authService.getCurrentUser).mockResolvedValue(mockUser);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-info')).toHaveTextContent('User: test@example.com');
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      });

      // Verify all expected functions are available
      expect(screen.getByTestId('login-btn')).toBeInTheDocument();
      expect(screen.getByTestId('logout-btn')).toBeInTheDocument();
      expect(screen.getByTestId('refresh-btn')).toBeInTheDocument();
    });
  });
});