/**
 * Authentication Integration Tests
 * 
 * End-to-end integration tests for the authentication flow including:
 * - Complete login flow (form fill, submit, success)
 * - Login error handling
 * - Logout flow
 * - Auth state persistence across components
 * 
 * These tests verify that the AuthContext, UserLoginModal, and UserMenu
 * components work together correctly to provide a complete authentication
 * experience.
 */

import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { AuthProvider } from '../../contexts/AuthContext';
import { ToastProvider } from '../../contexts/ToastContext';
import UserLoginModal from '../../components/UserLoginModal';
import UserMenu from '../../components/UserMenu';
import { authService } from '../../services/authService';

// Mock the logger
jest.mock('../../utils/logger', () => ({
  getLogger: () => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
  getErrorMessage: (err: unknown) => (err instanceof Error ? err.message : 'Unknown error'),
  getErrorObject: (err: unknown) => (err instanceof Error ? err : undefined),
  authLogger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock the API config
jest.mock('../../config/api', () => ({
  API_CONFIG: {
    BASE_URL: 'http://localhost:3000',
    DEFAULT_HEADERS: {
      'Content-Type': 'application/json',
    },
  },
}));

// Mock field mapping
jest.mock('../../utils/fieldMapping', () => ({
  transformSubscriptions: jest.fn((subs) => subs),
}));

// Mock focus management hook
jest.mock('../../hooks/useFocusManagement', () => ({
  useFocusManagement: () => ({
    modalRef: { current: null },
  }),
}));

describe('Authentication Integration Tests', () => {
  const mockUser = {
    id: '1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    isAdmin: false,
  };

  beforeAll(() => {
    // Clear everything before all tests
    localStorage.clear();
    sessionStorage.clear();
  });

  beforeEach(() => {
    // Clear storage before each test
    localStorage.clear();
    sessionStorage.clear();
    
    // Ensure authService is in a clean state
    authService.logout();
    
    // Mock fetch globally - must be done before any component renders
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ detail: 'Not mocked' }),
      } as Response)
    );
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    sessionStorage.clear();
    jest.clearAllMocks();
  });

  describe('Complete Login Flow', () => {
    it('should complete full login flow: form fill, submit, success', async () => {
      const onLoginSuccess = jest.fn();
      const onClose = jest.fn();

      // Mock successful login response
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            success: true,
            data: {
              accessToken: 'mock-access-token',
              refreshToken: 'mock-refresh-token',
              user: {
                id: mockUser.id,
                email: mockUser.email,
                firstName: mockUser.firstName,
                lastName: mockUser.lastName,
                isAdmin: mockUser.isAdmin,
              },
            },
          }),
        } as Response)
      );

      render(
        <ToastProvider>
          <AuthProvider>
            <UserLoginModal
              isOpen={true}
              onClose={onClose}
              onLoginSuccess={onLoginSuccess}
            />
          </AuthProvider>
        </ToastProvider>
      );

      // Verify modal is displayed
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Iniciar Sesión' })).toBeInTheDocument();

      // Fill in the email field
      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      expect(emailInput).toHaveValue('test@example.com');

      // Fill in the password field
      const passwordInput = screen.getByLabelText(/contraseña/i);
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      expect(passwordInput).toHaveValue('password123');

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
      fireEvent.click(submitButton);

      // Wait for the login to complete
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:3000/auth/login',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
            }),
            body: JSON.stringify({
              email: 'test@example.com',
              password: 'password123',
            }),
          })
        );
      }, { timeout: 3000 });

      // Verify success callback was called
      await waitFor(() => {
        expect(onLoginSuccess).toHaveBeenCalled();
      }, { timeout: 3000 });

      // Verify toast notification is shown
      await waitFor(() => {
        expect(screen.getByText(/inicio de sesión exitoso/i)).toBeInTheDocument();
      }, { timeout: 3000 });

      // Verify user data is stored in localStorage
      expect(localStorage.getItem('userAuthToken')).toBe('mock-access-token');
      expect(localStorage.getItem('userData')).toBeTruthy();
      const storedUser = JSON.parse(localStorage.getItem('userData')!);
      expect(storedUser.email).toBe('test@example.com');
    });

    it('should display loading state during login', async () => {
      const onLoginSuccess = jest.fn();
      const onClose = jest.fn();

      // Mock slow login response
      (global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({
                    success: true,
                    data: {
                      accessToken: 'mock-access-token',
                      refreshToken: 'mock-refresh-token',
                      user: {
                        id: mockUser.id,
                        email: mockUser.email,
                        firstName: mockUser.firstName,
                        lastName: mockUser.lastName,
                        isAdmin: mockUser.isAdmin,
                      },
                    },
                  }),
                }),
              100
            )
          )
      );

      render(
        <ToastProvider>
          <AuthProvider>
            <UserLoginModal
              isOpen={true}
              onClose={onClose}
              onLoginSuccess={onLoginSuccess}
            />
          </AuthProvider>
        </ToastProvider>
      );

      // Fill in form
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'password123' } });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
      fireEvent.click(submitButton);

      // Verify loading state is shown
      await waitFor(() => {
        expect(screen.getByText(/iniciando sesión\.\.\./i)).toBeInTheDocument();
      });

      // Wait for login to complete
      await waitFor(() => {
        expect(onLoginSuccess).toHaveBeenCalled();
      });
    });
  });

  describe('Login Error Handling', () => {
    it('should display error message on invalid credentials', async () => {
      const onLoginSuccess = jest.fn();
      const onClose = jest.fn();

      // Mock authService.login directly to return error response
      const mockLogin = jest.spyOn(authService, 'login').mockResolvedValueOnce({
        success: false,
        message: 'Credenciales incorrectas',
        error_code: 'AUTHENTICATION_FAILED'
      });

      render(
        <ToastProvider>
          <AuthProvider>
            <UserLoginModal
              isOpen={true}
              onClose={onClose}
              onLoginSuccess={onLoginSuccess}
            />
          </AuthProvider>
        </ToastProvider>
      );

      // Fill in form with invalid credentials
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      
      fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
      fireEvent.click(submitButton);

      // Wait for login to be called
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          email: 'wrong@example.com',
          password: 'wrongpassword'
        });
      });

      // Wait for error message to appear in the form
      await waitFor(() => {
        expect(screen.getByText(/credenciales incorrectas/i)).toBeInTheDocument();
      });

      // Verify error toast is shown
      await waitFor(() => {
        const alerts = screen.getAllByRole('alert');
        expect(alerts.length).toBeGreaterThan(0);
      });

      // Verify onLoginSuccess was not called
      expect(onLoginSuccess).not.toHaveBeenCalled();

      // Verify no data is stored in localStorage
      expect(localStorage.getItem('userAuthToken')).toBeNull();
      expect(localStorage.getItem('userData')).toBeNull();

      // Cleanup
      mockLogin.mockRestore();
    });

    it('should handle network errors gracefully', async () => {
      const onLoginSuccess = jest.fn();
      const onClose = jest.fn();

      // Mock authService.login to return network error response
      const mockLogin = jest.spyOn(authService, 'login').mockResolvedValueOnce({
        success: false,
        message: 'Error de conexión. Por favor, intenta nuevamente.',
        error_code: 'NETWORK_ERROR'
      });

      render(
        <ToastProvider>
          <AuthProvider>
            <UserLoginModal
              isOpen={true}
              onClose={onClose}
              onLoginSuccess={onLoginSuccess}
            />
          </AuthProvider>
        </ToastProvider>
      );

      // Fill in form
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
      fireEvent.click(submitButton);

      // Wait for login to be called
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123'
        });
      });

      // Wait for error message - authService returns a generic connection error message
      await waitFor(() => {
        expect(screen.getByText(/error de conexión/i)).toBeInTheDocument();
      });

      // Verify error toast is shown
      await waitFor(() => {
        const alerts = screen.getAllByRole('alert');
        expect(alerts.length).toBeGreaterThan(0);
      });

      // Verify onLoginSuccess was not called
      expect(onLoginSuccess).not.toHaveBeenCalled();

      // Verify no data is stored in localStorage
      expect(localStorage.getItem('userAuthToken')).toBeNull();
      expect(localStorage.getItem('userData')).toBeNull();

      // Cleanup
      mockLogin.mockRestore();
    });
  });

  describe('Logout Flow', () => {
    it('should complete full logout flow and clear state', async () => {
      // Set up initial logged-in state
      localStorage.setItem('userAuthToken', 'mock-token');
      localStorage.setItem('userData', JSON.stringify(mockUser));

      // Force authService to reload from storage
      // This simulates a logged-in user
      (authService as any).loadFromStorage();

      // Mock window.location.href
      delete (window as any).location;
      window.location = { href: '' } as any;

      render(
        <ToastProvider>
          <AuthProvider>
            <UserMenu />
          </AuthProvider>
        </ToastProvider>
      );

      // Wait for component to load - UserMenu button should be visible
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /menú de usuario/i })).toBeInTheDocument();
      });

      // Verify user menu shows user info (either firstName or email)
      // The component shows firstName if available, otherwise email
      const userMenuButton = screen.getByRole('button', { name: /menú de usuario/i });
      expect(userMenuButton).toBeInTheDocument();

      // Open user menu
      fireEvent.click(userMenuButton);

      // Wait for dropdown menu to appear
      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });

      // Click logout button (it has role="menuitem" not "button")
      const logoutButton = screen.getByRole('menuitem', { name: /cerrar sesión/i });
      fireEvent.click(logoutButton);

      // Verify toast notification appears
      await waitFor(() => {
        expect(screen.getByText(/sesión cerrada exitosamente/i)).toBeInTheDocument();
      });

      // Verify UI shows logged out state (Register and Login buttons appear)
      await waitFor(() => {
        expect(screen.getByText(/registrarse/i)).toBeInTheDocument();
        expect(screen.getByText(/iniciar sesión/i)).toBeInTheDocument();
      });

      // Verify user menu button is no longer visible (replaced by auth buttons)
      expect(screen.queryByRole('button', { name: /menú de usuario/i })).not.toBeInTheDocument();

      // Verify localStorage is cleared by authService.logout()
      expect(localStorage.getItem('userAuthToken')).toBeNull();
      expect(localStorage.getItem('userData')).toBeNull();

      // Verify redirect to home page
      expect(window.location.href).toBe('/');
    });
  });

  describe('Auth State Persistence Across Components', () => {
    it('should share auth state between UserLoginModal and UserMenu', async () => {
      const onLoginSuccess = jest.fn();
      const onClose = jest.fn();

      // Mock successful login with proper Response object
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            success: true,
            data: {
              accessToken: 'mock-access-token',
              refreshToken: 'mock-refresh-token',
              user: {
                id: mockUser.id,
                email: mockUser.email,
                firstName: mockUser.firstName,
                lastName: mockUser.lastName,
                isAdmin: mockUser.isAdmin,
              },
            },
          }),
        } as Response)
      );

      const { rerender } = render(
        <ToastProvider>
          <AuthProvider>
            <UserLoginModal
              isOpen={true}
              onClose={onClose}
              onLoginSuccess={onLoginSuccess}
            />
            <UserMenu />
          </AuthProvider>
        </ToastProvider>
      );

      // Wait for initial render to complete
      await waitFor(() => {
        // UserMenu should be rendered (either authenticated or not)
        expect(screen.getByLabelText(/menú de usuario/i)).toBeInTheDocument();
      });

      // Capture initial auth state from UserMenu
      const initialUserMenuButton = screen.getByLabelText(/menú de usuario/i);
      const initialUserName = initialUserMenuButton.textContent;

      // Login through modal
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'password123' } });
      fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));

      // Wait for login to complete
      await waitFor(() => {
        expect(onLoginSuccess).toHaveBeenCalled();
      }, { timeout: 3000 });

      // UserMenu should now show authenticated state with user's first name
      // This verifies that auth state is shared between UserLoginModal and UserMenu
      await waitFor(() => {
        const userMenuButton = screen.getByLabelText(/menú de usuario/i);
        expect(userMenuButton.textContent).toContain(mockUser.firstName);
      }, { timeout: 3000 });

      // Verify that the user name changed from initial state
      const finalUserMenuButton = screen.getByLabelText(/menú de usuario/i);
      expect(finalUserMenuButton.textContent).not.toBe(initialUserName);
      expect(finalUserMenuButton.textContent).toContain(mockUser.firstName);
    });

    it('should maintain auth state across multiple components', async () => {
      // Set up initial logged-in state
      localStorage.setItem('userAuthToken', 'mock-token');
      localStorage.setItem('userData', JSON.stringify(mockUser));

      function ComponentA() {
        const { user: currentUser, isAuthenticated } = require('../../contexts/AuthContext').useAuth();
        return (
          <div data-testid="component-a">
            <span data-testid="a-auth">{isAuthenticated ? 'yes' : 'no'}</span>
            <span data-testid="a-email">{currentUser?.email || 'none'}</span>
          </div>
        );
      }

      function ComponentB() {
        const { user: currentUser, isAuthenticated } = require('../../contexts/AuthContext').useAuth();
        return (
          <div data-testid="component-b">
            <span data-testid="b-auth">{isAuthenticated ? 'yes' : 'no'}</span>
            <span data-testid="b-email">{currentUser?.email || 'none'}</span>
          </div>
        );
      }

      render(
        <ToastProvider>
          <AuthProvider>
            <ComponentA />
            <ComponentB />
          </AuthProvider>
        </ToastProvider>
      );

      // Both components should show the same auth state
      await waitFor(() => {
        expect(screen.getByTestId('a-auth')).toHaveTextContent('yes');
        expect(screen.getByTestId('a-email')).toHaveTextContent('test@example.com');
        expect(screen.getByTestId('b-auth')).toHaveTextContent('yes');
        expect(screen.getByTestId('b-email')).toHaveTextContent('test@example.com');
      });
    });
  });

  describe('Form Validation and UX', () => {
    it('should require email and password fields', async () => {
      const onLoginSuccess = jest.fn();
      const onClose = jest.fn();

      render(
        <ToastProvider>
          <AuthProvider>
            <UserLoginModal
              isOpen={true}
              onClose={onClose}
              onLoginSuccess={onLoginSuccess}
            />
          </AuthProvider>
        </ToastProvider>
      );

      // Try to submit without filling fields
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
      fireEvent.click(submitButton);

      // Form should not submit (HTML5 validation)
      expect(global.fetch).not.toHaveBeenCalled();
      expect(onLoginSuccess).not.toHaveBeenCalled();
    });

    it('should clear form after successful login', async () => {
      const onLoginSuccess = jest.fn();
      const onClose = jest.fn();

      // Mock successful login
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
            user: {
              id: mockUser.id,
              email: mockUser.email,
              firstName: mockUser.firstName,
              lastName: mockUser.lastName,
              isAdmin: mockUser.isAdmin,
            },
          },
        }),
      });

      render(
        <ToastProvider>
          <AuthProvider>
            <UserLoginModal
              isOpen={true}
              onClose={onClose}
              onLoginSuccess={onLoginSuccess}
            />
          </AuthProvider>
        </ToastProvider>
      );

      // Fill and submit form
      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
      const passwordInput = screen.getByLabelText(/contraseña/i) as HTMLInputElement;

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));

      // Wait for success
      await waitFor(() => {
        expect(onLoginSuccess).toHaveBeenCalled();
      });

      // Form fields should be cleared
      await waitFor(() => {
        expect(emailInput.value).toBe('');
        expect(passwordInput.value).toBe('');
      });
    });

    it('should close modal when cancel button is clicked', async () => {
      const onLoginSuccess = jest.fn();
      const onClose = jest.fn();

      render(
        <ToastProvider>
          <AuthProvider>
            <UserLoginModal
              isOpen={true}
              onClose={onClose}
              onLoginSuccess={onLoginSuccess}
            />
          </AuthProvider>
        </ToastProvider>
      );

      // Click cancel button
      const cancelButton = screen.getByRole('button', { name: /cancelar/i });
      fireEvent.click(cancelButton);

      // Verify onClose was called
      expect(onClose).toHaveBeenCalled();
    });

    it('should close modal when close button (×) is clicked', async () => {
      const onLoginSuccess = jest.fn();
      const onClose = jest.fn();

      render(
        <ToastProvider>
          <AuthProvider>
            <UserLoginModal
              isOpen={true}
              onClose={onClose}
              onLoginSuccess={onLoginSuccess}
            />
          </AuthProvider>
        </ToastProvider>
      );

      // Click close button
      const closeButton = screen.getByLabelText(/cerrar modal/i);
      fireEvent.click(closeButton);

      // Verify onClose was called
      expect(onClose).toHaveBeenCalled();
    });
  });
});
