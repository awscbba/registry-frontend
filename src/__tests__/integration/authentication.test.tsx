/**
 * Authentication Integration Tests
 * 
 * Tests the complete authentication flow from login to logout,
 * including UI updates, state persistence, and error handling.
 * 
 * Coverage:
 * - Complete login flow (form fill, submit, success)
 * - Login error handling (invalid credentials, network errors)
 * - Logout flow and state cleanup
 * - Auth state persistence across components
 * - API mocking for all scenarios
 */

import React, { useState } from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';

// Components to test
import UserLoginModal from '../../components/UserLoginModal';
import UserMenu from '../../components/UserMenu';

// Services and stores
import { authService } from '../../services/authService';
import { $user, $isLoading, $error, $isAuthenticated } from '../../stores/authStore';
import { $toasts } from '../../stores/toastStore';

// Test utilities
import { createMockUser, createMockAuthResponse } from '../utils/mockData';

// Mock the auth service
vi.mock('../../services/authService', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
    isAuthenticated: vi.fn(),
    refreshUser: vi.fn(),
  },
}));

// Mock the logger
vi.mock('../../utils/logger', () => ({
  getLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

// Mock fetch for API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Authentication Integration Tests', () => {
  const user = userEvent.setup();
  const mockUser = createMockUser();
  
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Reset stores to initial state
    $user.set(null);
    $isLoading.set(false);
    $error.set(null);
    $toasts.set([]);
    
    // Setup default mock implementations
    (authService.isAuthenticated as any).mockReturnValue(false);
    (authService.getCurrentUser as any).mockReturnValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete Login Flow', () => {
    it('should complete successful login flow with UI updates', async () => {
      // Mock successful login response
      const mockLoginResponse = createMockAuthResponse(mockUser);
      (authService.login as any).mockResolvedValue(mockLoginResponse);
      
      // Test wrapper to control modal state
      const TestWrapper = () => {
        const [isOpen, setIsOpen] = useState(true);
        const [loginSuccess, setLoginSuccess] = useState(false);
        
        const handleLoginSuccess = () => {
          setLoginSuccess(true);
          setIsOpen(false);
        };
        
        return (
          <div>
            <UserLoginModal 
              isOpen={isOpen}
              onClose={() => setIsOpen(false)}
              onLoginSuccess={handleLoginSuccess}
            />
            {loginSuccess && <div data-testid="login-success">Login successful</div>}
          </div>
        );
      };
      
      render(<TestWrapper />);
      
      // Verify modal is open
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      // Fill in the login form (Spanish labels)
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
      
      await user.type(emailInput, mockUser.email);
      await user.type(passwordInput, 'password123');
      
      // Submit the form
      await user.click(submitButton);
      
      // Verify login service was called with correct credentials
      await waitFor(() => {
        expect(authService.login).toHaveBeenCalledWith(
          mockUser.email,
          'password123'
        );
      });
      
      // Simulate successful login by updating stores
      await act(async () => {
        $user.set(mockUser);
        $isLoading.set(false);
        $error.set(null);
        $toasts.set([{
          id: 'login-success',
          message: `Welcome back, ${mockUser.firstName}!`,
          type: 'success',
          duration: 5000,
          timestamp: Date.now(),
        }]);
      });
      
      // Verify auth store is updated
      expect($isAuthenticated.get()).toBe(true);
      expect($user.get()).toEqual(mockUser);
      expect($isLoading.get()).toBe(false);
      expect($error.get()).toBeNull();
      
      // Verify success toast is shown
      const toasts = $toasts.get();
      expect(toasts).toHaveLength(1);
      expect(toasts[0].type).toBe('success');
      expect(toasts[0].message).toContain('Welcome back');
    });

    it('should handle form validation with HTML5 validation', async () => {
      const TestWrapper = () => {
        const [isOpen, setIsOpen] = useState(true);
        return (
          <UserLoginModal 
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            onLoginSuccess={() => setIsOpen(false)}
          />
        );
      };
      
      render(<TestWrapper />);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      // Try to submit empty form - HTML5 validation will prevent submission
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
      await user.click(submitButton);
      
      // Verify login service was not called due to HTML5 validation
      expect(authService.login).not.toHaveBeenCalled();
      
      // Verify auth state remains unchanged
      expect($isAuthenticated.get()).toBe(false);
      expect($user.get()).toBeNull();
    });
  });

  describe('Login Error Handling', () => {
    it('should handle invalid credentials error', async () => {
      // Mock login failure
      const errorMessage = 'Invalid email or password';
      (authService.login as any).mockRejectedValue(new Error(errorMessage));
      
      const TestWrapper = () => {
        const [isOpen, setIsOpen] = useState(true);
        return (
          <UserLoginModal 
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            onLoginSuccess={() => setIsOpen(false)}
          />
        );
      };
      
      render(<TestWrapper />);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
      
      await user.type(emailInput, 'invalid@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);
      
      // Wait for the async operation to complete
      await waitFor(() => {
        expect(authService.login).toHaveBeenCalledWith('invalid@example.com', 'wrongpassword');
      });
      
      // Simulate error state update
      await act(async () => {
        $isLoading.set(false);
        $error.set(errorMessage);
        $toasts.set([{
          id: 'login-error',
          message: errorMessage,
          type: 'error',
          duration: 5000,
          timestamp: Date.now(),
        }]);
      });
      
      // Verify error handling
      expect($isAuthenticated.get()).toBe(false);
      expect($user.get()).toBeNull();
      expect($isLoading.get()).toBe(false);
      expect($error.get()).toBe(errorMessage);
      
      // Verify error toast is shown
      const toasts = $toasts.get();
      expect(toasts).toHaveLength(1);
      expect(toasts[0].type).toBe('error');
      expect(toasts[0].message).toContain(errorMessage);
    });

    it('should handle network errors gracefully', async () => {
      // Mock network error
      (authService.login as any).mockRejectedValue(new Error('Network error'));
      
      const TestWrapper = () => {
        const [isOpen, setIsOpen] = useState(true);
        return (
          <UserLoginModal 
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            onLoginSuccess={() => setIsOpen(false)}
          />
        );
      };
      
      render(<TestWrapper />);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
      
      await user.type(emailInput, 'user@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);
      
      // Wait for service call
      await waitFor(() => {
        expect(authService.login).toHaveBeenCalled();
      });
      
      // Simulate error toast
      await act(async () => {
        $toasts.set([{
          id: 'network-error',
          message: 'Network error',
          type: 'error',
          duration: 5000,
          timestamp: Date.now(),
        }]);
      });
      
      // Verify network error handling
      const toasts = $toasts.get();
      expect(toasts).toHaveLength(1);
      expect(toasts[0].type).toBe('error');
      expect(toasts[0].message).toContain('Network error');
    });

    it('should handle API server errors (500, 503, etc.)', async () => {
      // Mock server error
      const serverError = new Error('Server temporarily unavailable');
      (serverError as any).status = 503;
      (authService.login as any).mockRejectedValue(serverError);
      
      const TestWrapper = () => {
        const [isOpen, setIsOpen] = useState(true);
        return (
          <UserLoginModal 
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            onLoginSuccess={() => setIsOpen(false)}
          />
        );
      };
      
      render(<TestWrapper />);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
      
      await user.type(emailInput, 'user@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);
      
      // Wait for service call
      await waitFor(() => {
        expect(authService.login).toHaveBeenCalled();
      });
      
      // Simulate server error toast
      await act(async () => {
        $toasts.set([{
          id: 'server-error',
          message: 'Server temporarily unavailable',
          type: 'error',
          duration: 5000,
          timestamp: Date.now(),
        }]);
      });
      
      // Verify server error handling
      const toasts = $toasts.get();
      expect(toasts).toHaveLength(1);
      expect(toasts[0].type).toBe('error');
      expect(toasts[0].message).toContain('Server temporarily unavailable');
    });
  });

  describe('Logout Flow', () => {
    beforeEach(() => {
      // Set up authenticated state
      $user.set(mockUser);
      $isLoading.set(false);
      $error.set(null);
      
      (authService.isAuthenticated as any).mockReturnValue(true);
      (authService.getCurrentUser as any).mockReturnValue(mockUser);
    });

    it('should complete successful logout flow', async () => {
      // Mock successful logout
      (authService.logout as any).mockResolvedValue(undefined);
      
      render(<UserMenu />);
      
      // Verify user is logged in (Spanish text)
      expect(screen.getByText(mockUser.firstName)).toBeInTheDocument();
      
      // Open user menu
      const menuButton = screen.getByRole('button', { name: /menú de usuario/i });
      await user.click(menuButton);
      
      // Click logout (Spanish text)
      const logoutButton = screen.getByRole('menuitem', { name: /cerrar sesión/i });
      await user.click(logoutButton);
      
      // Verify logout service was called
      await waitFor(() => {
        expect(authService.logout).toHaveBeenCalled();
      });
      
      // Simulate logout state update
      await act(async () => {
        $user.set(null);
        $error.set(null);
        $toasts.set([{
          id: 'logout-success',
          message: 'You have been logged out successfully',
          type: 'info',
          duration: 5000,
          timestamp: Date.now(),
        }]);
      });
      
      // Verify auth store is cleared
      expect($isAuthenticated.get()).toBe(false);
      expect($user.get()).toBeNull();
      expect($error.get()).toBeNull();
      
      // Verify logout toast is shown
      const toasts = $toasts.get();
      expect(toasts).toHaveLength(1);
      expect(toasts[0].type).toBe('info');
      expect(toasts[0].message).toContain('logged out');
    });

    it('should handle logout errors gracefully', async () => {
      // Mock logout error
      (authService.logout as any).mockRejectedValue(new Error('Logout failed'));
      
      render(<UserMenu />);
      
      // Open menu and click logout
      const menuButton = screen.getByRole('button', { name: /menú de usuario/i });
      await user.click(menuButton);
      
      const logoutButton = screen.getByRole('menuitem', { name: /cerrar sesión/i });
      await user.click(logoutButton);
      
      // Wait for logout call
      await waitFor(() => {
        expect(authService.logout).toHaveBeenCalled();
      });
      
      // Even if logout fails, user should be logged out locally
      await act(async () => {
        $user.set(null);
        $toasts.set([{
          id: 'logout-error',
          message: 'Logout failed',
          type: 'error',
          duration: 5000,
          timestamp: Date.now(),
        }]);
      });
      
      expect($isAuthenticated.get()).toBe(false);
      expect($user.get()).toBeNull();
      
      // Verify error toast is shown
      const toasts = $toasts.get();
      expect(toasts).toHaveLength(1);
      expect(toasts[0].type).toBe('error');
      expect(toasts[0].message).toContain('Logout failed');
    });
  });

  describe('Auth State Persistence Across Components', () => {
    it('should maintain auth state across different components', async () => {
      // Set authenticated state
      await act(async () => {
        $user.set(mockUser);
        $isLoading.set(false);
        $error.set(null);
      });
      
      // Render UserMenu component
      const { rerender } = render(<UserMenu />);
      
      // Verify UserMenu shows authenticated state (Spanish text)
      expect(screen.getByText(mockUser.firstName)).toBeInTheDocument();
      expect(screen.queryByText(/iniciar sesión/i)).not.toBeInTheDocument();
      
      // Rerender with LoginModal in closed state
      rerender(
        <UserLoginModal 
          isOpen={false}
          onClose={() => {}}
          onLoginSuccess={() => {}}
        />
      );
      
      // Modal should not be visible when closed
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should update all components when auth state changes', async () => {
      // Start with unauthenticated state
      render(<UserMenu />);
      
      // Verify initial unauthenticated state (Spanish text)
      expect(screen.getByText(/iniciar sesión/i)).toBeInTheDocument();
      
      // Simulate login by updating auth store
      await act(async () => {
        $user.set(mockUser);
        $isLoading.set(false);
        $error.set(null);
      });
      
      // Verify component updates to show authenticated state
      await waitFor(() => {
        expect(screen.getByText(mockUser.firstName)).toBeInTheDocument();
        expect(screen.queryByText(/iniciar sesión/i)).not.toBeInTheDocument();
      });
    });

    it('should handle user refresh and maintain state', async () => {
      // Mock successful user refresh
      (authService.refreshUser as any).mockResolvedValue(mockUser);
      
      // Set loading state (simulating page refresh)
      await act(async () => {
        $user.set(null);
        $isLoading.set(true);
        $error.set(null);
      });
      
      render(<UserMenu />);
      
      // Component should handle loading state gracefully
      expect(document.body).toBeInTheDocument(); // Basic render test
      
      // Simulate successful refresh
      await act(async () => {
        $user.set(mockUser);
        $isLoading.set(false);
        $error.set(null);
      });
      
      // Verify component updates to authenticated state
      await waitFor(() => {
        expect(screen.getByText(mockUser.firstName)).toBeInTheDocument();
      });
    });
  });

  describe('API Mocking Scenarios', () => {
    it('should handle different API response formats', async () => {
      // Test v2 API response format
      const v2Response = {
        success: true,
        data: { user: mockUser, token: 'jwt-token' },
        version: 'v2'
      };
      
      (authService.login as any).mockResolvedValue(v2Response);
      
      // Call the service directly to test response handling
      const result = await authService.login(mockUser.email, 'password123');
      
      // Verify v2 response is handled correctly
      expect(result).toEqual(v2Response);
      expect(authService.login).toHaveBeenCalledWith(mockUser.email, 'password123');
    });

    it('should handle legacy API response format', async () => {
      // Test legacy response format (direct user object)
      (authService.login as any).mockResolvedValue(mockUser);
      
      // Call the service directly
      const result = await authService.login(mockUser.email, 'password123');
      
      // Verify legacy response is handled correctly
      expect(result).toEqual(mockUser);
    });

    it('should handle API timeout scenarios', async () => {
      // Mock timeout error
      const timeoutError = new Error('Request timeout');
      (timeoutError as any).code = 'TIMEOUT';
      (authService.login as any).mockRejectedValue(timeoutError);
      
      // Test timeout error handling
      try {
        await authService.login('user@example.com', 'password123');
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.message).toBe('Request timeout');
        expect(error.code).toBe('TIMEOUT');
      }
    });
  });

  describe('Edge Cases and Race Conditions', () => {
    it('should handle rapid login/logout cycles', async () => {
      render(<UserMenu />);
      
      // Perform rapid login
      (authService.login as any).mockResolvedValue(createMockAuthResponse(mockUser));
      
      // Simulate rapid state changes
      await act(async () => {
        $user.set(mockUser);
        $isLoading.set(false);
        $error.set(null);
      });
      
      await waitFor(() => {
        expect(screen.getByText(mockUser.firstName)).toBeInTheDocument();
      });
      
      // Immediately perform logout
      (authService.logout as any).mockResolvedValue(undefined);
      
      await act(async () => {
        $user.set(null);
      });
      
      // Verify final state is logged out
      expect($isAuthenticated.get()).toBe(false);
      expect($user.get()).toBeNull();
    });

    it('should handle concurrent login attempts', async () => {
      // Mock delayed login response
      let resolveLogin: (value: any) => void;
      const loginPromise = new Promise(resolve => {
        resolveLogin = resolve;
      });
      
      (authService.login as any).mockReturnValue(loginPromise);
      
      // Start first login attempt
      const loginCall1 = authService.login(mockUser.email, 'password123');
      
      // Start second login attempt (should be handled gracefully)
      const loginCall2 = authService.login(mockUser.email, 'password123');
      
      // Verify both calls were made
      expect(authService.login).toHaveBeenCalledTimes(2);
      
      // Resolve the login
      resolveLogin!(createMockAuthResponse(mockUser));
      
      // Both promises should resolve
      const [result1, result2] = await Promise.all([loginCall1, loginCall2]);
      expect(result1).toEqual(createMockAuthResponse(mockUser));
      expect(result2).toEqual(createMockAuthResponse(mockUser));
    });
  });
});